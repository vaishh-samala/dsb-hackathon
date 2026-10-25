import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  SetupRequest,
  WorkflowStageKey,
  StageDetail,
  ApprovalPayload,
  ExecutionResult,
  SmokeTestResult,
  SetupManifest,
  RiskItem,
  ExpectedChange,
  SafetyAuditEntry,
  AuditLogEvent,
  PlannedAction,
  ExecutedAction,
  UserProfile,
  UserRole,
  SetupReviewEvent,
} from './src/types/sandbox.js';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

const demoUsers: Record<string, UserProfile> = {
  'usr-dev-alex': {
    id: 'usr-dev-alex',
    name: 'Alex Rivera',
    email: 'alex@dev.internal',
    role: 'developer',
  },
  'usr-adm-elena': {
    id: 'usr-adm-elena',
    name: 'Elena Vance',
    email: 'evance@security.corp',
    role: 'admin',
  },
};
const demoSessions = new Map<string, { user: UserProfile; expiresAt: number }>();

app.use('/api', (req: Request, res: Response, next) => {
  if (['/health', '/auth/demo', '/auth/session', '/auth/logout'].includes(req.path)) {
    next();
    return;
  }

  const sessionCookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('sbx_demo_session='));
  const token = sessionCookie?.slice('sbx_demo_session='.length);
  const session = token ? demoSessions.get(token) : undefined;

  if (!session || session.expiresAt <= Date.now()) {
    if (token) demoSessions.delete(token);
    res.status(401).json({ error: 'Demo session required. Sign in with a demo account.' });
    return;
  }

  req.headers['x-user-id'] = session.user.id;
  req.headers['x-user-name'] = session.user.name;
  req.headers['x-user-role'] = session.user.role;
  next();
});

// Initialize Google Gemini API Client (Server-Side Only)
// Only initialize if a valid Google Gemini API key format (starting with AIzaSy) is configured
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const hasValidGeminiKey = Boolean(geminiApiKey && geminiApiKey.startsWith('AIzaSy'));

const ai = hasValidGeminiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-Memory Database for Mock Sandbox Service & Repositories
function sandboxConfigurationFingerprint(
  setup: Pick<SetupRequest, 'template' | 'accountType' | 'sandboxType' | 'requestedPermissions' | 'sampleDataRequirement'>
): string {
  const permissions = [...new Set([
    ...setup.requestedPermissions.filter((permission) =>
      !permission.includes('*') && !['access_production_db', 'admin_cluster', 'delete_cluster_resources'].includes(permission)
    ),
    'read_code',
    'write_sandbox',
  ])].sort();
  return crypto.createHash('sha256').update(JSON.stringify({
    template: setup.template,
    accountType: setup.accountType,
    sandboxType: setup.sandboxType || 'isolated-container',
    permissions,
    sampleDataRequirement: setup.sampleDataRequirement,
  })).digest('hex');
}

function sandboxRegistryKey(setup: Pick<SetupRequest, 'repoDetails' | 'template' | 'accountType' | 'sandboxType' | 'requestedPermissions' | 'sampleDataRequirement'>) {
  const repoKey = `${setup.repoDetails.url.replace(/^https?:\/\//, '')}:${setup.repoDetails.branch}`;
  return `${repoKey}:${sandboxConfigurationFingerprint(setup)}`;
}

let activeSandboxRegistry: Record<string, {
  id: string;
  repoUrl: string;
  branch: string;
  port: number;
  createdAt: string;
  configFingerprint: string;
}> = {
  [`github.com/agentic-hackathon/analytics-service:main:${sandboxConfigurationFingerprint({
    template: 'node-microservice',
    accountType: 'development',
    sandboxType: 'isolated-container',
    requestedPermissions: ['read_code', 'write_sandbox', 'execute_tests'],
    sampleDataRequirement: 'anonymized_telemetry',
  })}`]: {
    id: 'sbx-worker-existing-09',
    repoUrl: 'https://github.com/agentic-hackathon/analytics-service',
    branch: 'main',
    port: 8089,
    createdAt: '2026-10-23T14:20:00Z',
    configFingerprint: sandboxConfigurationFingerprint({
      template: 'node-microservice',
      accountType: 'development',
      sandboxType: 'isolated-container',
      requestedPermissions: ['read_code', 'write_sandbox', 'execute_tests'],
      sampleDataRequirement: 'anonymized_telemetry',
    }),
  },
};

// Global Audit Log Store
let auditLogs: AuditLogEvent[] = [
  {
    id: 'AUD-901',
    requestId: 'REQ-2026-0811',
    timestamp: '2026-10-24T02:15:00Z',
    actor: 'Alex Rivera (Developer)',
    actorRole: 'developer',
    action: 'CREATED',
    summary: 'Submitted setup request for payments-checkout-microservice on development target.',
  },
  {
    id: 'AUD-902',
    requestId: 'REQ-2026-0811',
    timestamp: '2026-10-24T02:17:45Z',
    actor: 'Policy Engine (POL-002)',
    actorRole: 'admin',
    action: 'SECURITY_CHECK',
    summary: 'Enforced least-privilege bounds. Stripped deploy_preview privilege.',
  },
  {
    id: 'AUD-903',
    requestId: 'REQ-2026-0811',
    timestamp: '2026-10-24T02:19:10Z',
    actor: 'Elena Vance (Security Admin)',
    actorRole: 'admin',
    action: 'APPROVED',
    summary: 'Demo administrator approval recorded for sandbox plan v1.0.0.',
  },
  {
    id: 'AUD-904',
    requestId: 'REQ-2026-0811',
    timestamp: '2026-10-24T02:20:40Z',
    actor: 'Mock Container Daemon',
    actorRole: 'admin',
    action: 'EXECUTED',
    summary: 'Spawned mock container sbx-node-811 on port 8088 with 50 synthetic customer fixtures.',
  },
  {
    id: 'AUD-905',
    requestId: 'REQ-2026-0811',
    timestamp: '2026-10-24T02:21:30Z',
    actor: 'Smoke Verification Probe',
    actorRole: 'admin',
    action: 'VERIFIED',
    summary: 'Verified synthetic login with 200 OK (18ms latency). Zero secrets exposed.',
  },
  {
    id: 'AUD-906',
    requestId: 'REQ-2026-0811',
    timestamp: '2026-10-24T02:22:30Z',
    actor: 'Manifest Sealer',
    actorRole: 'admin',
    action: 'MANIFEST_SEALED',
    summary: 'Generated simulator report MNF-811-94F2 with a SHA-256 content digest.',
  },
  {
    id: 'AUD-907',
    requestId: 'REQ-2026-0812',
    timestamp: '2026-10-24T03:02:15Z',
    actor: 'Policy Engine (POL-001)',
    actorRole: 'admin',
    action: 'BLOCKED',
    summary: 'SAFETY ENFORCEMENT: Blocked production sandbox attempt for customer-data-sync-pipeline.',
  },
];

function recordAudit(
  requestId: string,
  actor: string,
  actorRole: UserRole,
  action: AuditLogEvent['action'],
  summary: string,
  details?: Record<string, any>
) {
  const event: AuditLogEvent = {
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    requestId,
    timestamp: new Date().toISOString(),
    actor,
    actorRole,
    action,
    summary,
    details,
  };
  auditLogs.unshift(event);
}

// Secret Sanitizer helper
function redactSecrets(input: string): string {
  return input
    .replace(/(sk_live_[a-zA-Z0-9_\-]{8,})/gi, '[REDACTED_STRIPE_SECRET_KEY]')
    .replace(/(sk_test_[a-zA-Z0-9_\-]{8,})/gi, '[REDACTED_STRIPE_TEST_KEY]')
    .replace(/(ghp_[a-zA-Z0-9]{12,})/gi, '[REDACTED_GITHUB_PAT]')
    .replace(/\b(AKIA[0-9A-Z]{16})\b/g, '[REDACTED_AWS_ACCESS_KEY]')
    .replace(/\b(AIzaSy[A-Za-z0-9_-]{30,})\b/g, '[REDACTED_GOOGLE_API_KEY]')
    .replace(/(eyJ[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]+)/gi, 'sbx_jwt_[REDACTED_BEARER_TOKEN]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/\-]{12,}/gi, 'Bearer [REDACTED_BEARER_TOKEN]')
    .replace(/((?:session|auth)[_-]?cookie\s*[:=]\s*)['"]?([^\s'";,]+)/gi, '$1[REDACTED_SESSION_COOKIE]')
    .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
    .replace(/(password|passwd|secret)\s*[:=]\s*['"]?([^\s'";]+)['"]?/gi, '$1="[REDACTED_CREDENTIAL]"');
}

function scanForSecrets(value: string): string[] {
  const checks: [string, RegExp][] = [
    ['provider_api_key', /\b(?:sk_(?:live|test)_[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9]{12,}|AKIA[0-9A-Z]{16}|AIzaSy[A-Za-z0-9_-]{30,})\b/i],
    ['jwt_or_bearer_token', /\b(?:Bearer\s+(?!\[REDACTED)[A-Za-z0-9._~+/-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/i],
    ['private_key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i],
    ['session_cookie', /(?:session|auth)[_-]?cookie\s*[:=]\s*(?!\[REDACTED)[^\s,"]{8,}/i],
    ['password_or_secret', /(?:password|passwd|secret)\s*[:=]\s*['"]?(?!\[REDACTED)[^\s'";,]{6,}/i],
    ['named_credential', /(?:api[_-]?key|access[_-]?key|token|private[_-]?key)\s*[:=]\s*['"]?(?!\[REDACTED)[A-Za-z0-9._~+/-]{12,}/i],
  ];
  return checks.filter(([, pattern]) => pattern.test(value)).map(([name]) => name);
}

// 8-Stage Factory aligned with Specification
function initializeStages(): Record<WorkflowStageKey, StageDetail> {
  return {
    collect_requirements: {
      key: 'collect_requirements',
      name: 'Collect Requirements',
      order: 1,
      status: 'pending',
      logs: [],
    },
    discover_resources: {
      key: 'discover_resources',
      name: 'Discover Repository and Sandbox',
      order: 2,
      status: 'pending',
      logs: [],
    },
    plan_setup: {
      key: 'plan_setup',
      name: 'Plan Setup Steps',
      order: 3,
      status: 'pending',
      logs: [],
    },
    security_validation: {
      key: 'security_validation',
      name: 'Validate Security and Permissions',
      order: 4,
      status: 'pending',
      logs: [],
    },
    human_approval: {
      key: 'human_approval',
      name: 'Request Human Approval',
      order: 5,
      status: 'pending',
      logs: [],
    },
    execute_setup: {
      key: 'execute_setup',
      name: 'Execute Approved Setup',
      order: 6,
      status: 'pending',
      logs: [],
    },
    verify_setup: {
      key: 'verify_setup',
      name: 'Run Smoke Login Test',
      order: 7,
      status: 'pending',
      logs: [],
    },
    generate_manifest: {
      key: 'generate_manifest',
      name: 'Generate Setup Manifest',
      order: 8,
      status: 'pending',
      logs: [],
    },
  };
}

// Standard planned actions generator
function generatePlannedActions(
  projectName: string,
  template: string,
  sampleDataTier: string,
  reused: boolean
): PlannedAction[] {
  return [
    {
      order: 1,
      action: 'Allocate Network Isolation Namespace',
      category: 'network',
      description: 'Creates dedicated loopback bridge namespace with zero public ingress/egress.',
      commandPreview: 'ip netns add ns-sbx-isolated && iptables -A FORWARD -j DROP',
      expectedOutcome: 'Network isolation perimeter verified.',
    },
    {
      order: 2,
      action: reused ? 'Attach & Synchronize Existing Container' : 'Provision Ephemeral Container',
      category: 'runtime',
      description: reused
        ? 'Connects to running sandbox container and syncs repository head without creating duplicate processes.'
        : `Spawns isolated ${template} runtime container with 0.5 CPU and 512MB RAM bounds.`,
      commandPreview: reused ? 'docker exec -it sbx-existing sync_workspace' : 'docker run -d --cpus=0.5 -m=512m',
      expectedOutcome: 'Container environment alive on bounded localhost port.',
    },
    {
      order: 3,
      action: 'Inject Sanitized Local Configuration',
      category: 'filesystem',
      description: 'Mounts ephemeral .env file with strictly mocked secrets and zero cloud keys.',
      commandPreview: 'cat <<EOF > /sandbox/.env.local\nISOLATION=true\nEOF',
      expectedOutcome: 'Local configuration created with 0 plaintext secrets.',
    },
    {
      order: 4,
      action: 'Seed Synthetic Data Fixtures',
      category: 'database',
      description: `Loads 50 purely synthetic records (${sampleDataTier}). Prohibits real customer PII.`,
      commandPreview: 'sqlite3 /sandbox/mock.db < /seed/synthetic_50.sql',
      expectedOutcome: '50 synthetic mock entities accessible in mock DB.',
    },
    {
      order: 5,
      action: 'Execute Automated Smoke Login Probe',
      category: 'security',
      description: 'Simulates synthetic developer login handshake against /api/mock-auth/login.',
      commandPreview: 'curl -s -f http://localhost:port/api/mock-auth/login',
      expectedOutcome: 'HTTP 200 OK verified with mock JWT token.',
    },
  ];
}

// Seed Requests Store
let setupRequests: SetupRequest[] = [
  {
    id: 'REQ-2026-0811',
    projectName: 'payments-checkout-microservice',
    template: 'node-microservice',
    repoDetails: {
      url: 'https://github.com/agentic-hackathon/payments-service',
      branch: 'feature/sandbox-v2',
      visibility: 'internal',
      detectedCommitHash: '8b7d12f',
    },
    accountType: 'development',
    targetEnvironment: 'sandbox-development-namespace',
    isProductionTarget: false,
    requestedPermissions: ['read_code', 'write_sandbox', 'execute_tests', 'deploy_preview'],
    grantedPermissions: ['read_code', 'write_sandbox', 'execute_tests'],
    sampleDataRequirement: 'synthetic_customers',
    isRealDataBlocked: false,
    submittedBy: {
      id: 'usr-dev-alex',
      name: 'Alex Rivera',
      email: 'alex@dev.internal',
      role: 'developer',
    },
    createdAt: '2026-10-24T02:15:00Z',
    updatedAt: '2026-10-24T02:22:30Z',
    status: 'completed',
    activeStage: 'generate_manifest',
    stages: {
      collect_requirements: {
        key: 'collect_requirements',
        name: 'Collect Requirements',
        order: 1,
        status: 'passed',
        completedAt: '2026-10-24T02:15:40Z',
        summary: 'Target defined: Node.js Microservice with synthetic customer mock tables.',
        logs: ['[02:15:01] Ingested developer payload for payments-checkout-microservice', '[02:15:20] Confirmed non-production environment: development'],
      },
      plan_setup: {
        key: 'plan_setup',
        name: 'Plan Setup',
        order: 2,
        status: 'passed',
        completedAt: '2026-10-24T02:16:10Z',
        summary: 'Generated 5-step plan v1.0.0 with bounded least-privilege scopes.',
        logs: ['[02:15:45] Dependency graph: isolation -> container -> mock env -> synthetic seed -> smoke probe'],
      },
      discover_resources: {
        key: 'discover_resources',
        name: 'Discover Resources',
        order: 3,
        status: 'passed',
        completedAt: '2026-10-24T02:16:45Z',
        summary: 'Remote repo validated. No duplicate active sandboxes found.',
        logs: ['[02:16:15] Git branch head verified at commit 8b7d12f', '[02:16:30] 0 matching active containers. Fresh allocation permitted.'],
      },
      security_validation: {
        key: 'security_validation',
        name: 'Security Validation',
        order: 4,
        status: 'passed',
        completedAt: '2026-10-24T02:17:45Z',
        summary: 'Enforced least-privilege boundary. Dropped unneeded deploy_preview scope.',
        logs: ['[02:17:10] Audited requested permissions. Bounded to [read_code, write_sandbox, execute_tests].'],
      },
      human_approval: {
        key: 'human_approval',
        name: 'Human Approval',
        order: 5,
        status: 'passed',
        completedAt: '2026-10-24T02:19:10Z',
        summary: 'Explicit human sign-off granted by Security Lead Elena Vance.',
        logs: ['[02:18:00] Demo approval request submitted.', '[02:19:10] Approved by evance@security.corp; demo approval reference recorded.'],
      },
      execute_setup: {
        key: 'execute_setup',
        name: 'Execute Setup',
        order: 6,
        status: 'passed',
        completedAt: '2026-10-24T02:20:40Z',
        summary: 'Mock sandbox sbx-node-811 initialized on port 8088.',
        logs: ['[02:19:30] Mock container daemon created sandbox container sbx-node-811.', '[02:20:10] Seeded 50 synthetic customers without PII.'],
      },
      verify_setup: {
        key: 'verify_setup',
        name: 'Verify Setup',
        order: 7,
        status: 'passed',
        completedAt: '2026-10-24T02:21:30Z',
        summary: 'Synthetic auth verification passed. Status 200 OK (18ms).',
        logs: ['[02:21:00] Executed POST /auth/mock-login with synthetic test user.', '[02:21:20] Health probe passed in 18ms.'],
      },
      generate_manifest: {
        key: 'generate_manifest',
        name: 'Generate Manifest',
        order: 8,
        status: 'passed',
        completedAt: '2026-10-24T02:22:30Z',
        summary: 'Simulator report record generated with a SHA-256 content digest.',
        logs: ['[02:22:00] Sanitized configuration logs. 0 plaintext secrets exposed.', '[02:22:30] Manifest sha256: 7d4a21...'],
      },
    },
    plannedActions: generatePlannedActions('payments-checkout-microservice', 'node-microservice', 'synthetic_customers', false),
    approval: {
      required: true,
      status: 'approved',
      planVersion: 'v1.0.0',
      proposedAction: 'Provision isolated Node.js container with synthetic customer fixtures',
      targetEnvironment: 'sandbox-development-namespace',
      isProductionEnvironment: false,
      permissionsComparison: {
        requested: ['read_code', 'write_sandbox', 'execute_tests', 'deploy_preview'],
        granted: ['read_code', 'write_sandbox', 'execute_tests'],
        stripped: ['deploy_preview'],
      },
      risks: [
        {
          severity: 'low',
          code: 'RISK_SYNTHETIC_OVERHEAD',
          title: 'Synthetic Seeding Memory Footprint',
          description: 'Generates 50 synthetic accounts in mock SQLite layer consuming ~14MB memory.',
        },
      ],
      expectedChanges: [
        {
          type: 'container',
          title: 'Ephemeral Container Allocation',
          description: 'Spawns Docker container with 0.5 CPU and 512MB RAM cap.',
          preview: 'docker run -d --name sbx-node-811 -p 8088:3000 node:20-alpine',
        },
      ],
      reviewedBy: 'Elena Vance (Security Operations)',
      reviewedByEmail: 'evance@security.corp',
      reviewedAt: '2026-10-24T02:19:10Z',
      comment: 'Verified least privilege enforcement. Safe for sandbox provisioning.',
      signature: 'DEMO-APPROVAL-REF-94f27a69bc',
    },
    executionResult: {
      sandboxId: 'sbx-node-811',
      reusedExisting: false,
      containerPort: 8088,
      endpointUrl: 'http://localhost:8088',
      allocatedCpu: '0.5 Core',
      allocatedMemory: '512 MB',
      syntheticSeedRows: 50,
      executedActions: [
        { order: 1, action: 'Allocate Network Isolation Namespace', executedAt: '2026-10-24T02:19:35Z', status: 'SUCCESS' },
        { order: 2, action: 'Provision Ephemeral Container', executedAt: '2026-10-24T02:19:50Z', status: 'SUCCESS' },
        { order: 3, action: 'Inject Sanitized Local Configuration', executedAt: '2026-10-24T02:20:05Z', status: 'SUCCESS' },
        { order: 4, action: 'Seed Synthetic Data Fixtures', executedAt: '2026-10-24T02:20:25Z', status: 'SUCCESS' },
      ],
      executionLogs: [
        { timestamp: '02:19:35', level: 'info', message: 'Pulling mock base image: node:20-alpine' },
        { timestamp: '02:19:50', level: 'info', message: 'Network namespace isolated: veth-sbx-811' },
        { timestamp: '02:20:15', level: 'info', message: 'Injecting synthetic seed fixtures: 50 records' },
        { timestamp: '02:20:38', level: 'success', message: 'Mock sandbox worker listening on port 8088' },
      ],
      executionDurationMs: 1420,
    },
    smokeTest: {
      status: 'passed',
      testedAt: '2026-10-24T02:21:30Z',
      loginEndpoint: 'http://localhost:8088/api/mock-auth/login',
      syntheticUser: {
        email: 'dev-tester-01@sandbox.test',
        role: 'developer_sandbox',
        tokenPreview: 'sbx_jwt_eyJhbGciOi...[MASKED]',
      },
      healthCheckLatencyMs: 18,
      responseStatusCode: 200,
      checks: [
        { name: 'TCP Port Availability', passed: true, latencyMs: 3, details: 'Port 8088 open' },
        { name: 'Synthetic JWT Authentication', passed: true, latencyMs: 12, details: 'Signed with ephemeral mock secret' },
        { name: 'Mock Database Health Check', passed: true, latencyMs: 5, details: '50 synthetic rows accessible' },
      ],
      evidenceSnippet: 'HTTP/1.1 200 OK\nContent-Type: application/json\n{"status":"healthy","synthetic":true,"role":"developer_sandbox"}',
    },
    manifest: {
      manifestId: 'MNF-811-94F2',
      requestId: 'REQ-2026-0811',
      sha256Hash: '7d4a21e69a0cb9cf15fa57c8bfb846e4d5ff1a052e4f0d6e676104bcde832669',
      generatedAt: '2026-10-24T02:22:30Z',
      policyComplianceScore: '100% Compliant (Least Privilege Bounded)',
      immutableSignature: 'SIMULATOR_ONLY_NOT_SIGNED',
      planVersion: 'v1.0.0',
      projectDetails: {
        name: 'payments-checkout-microservice',
        template: 'node-microservice',
        repoUrl: 'https://github.com/agentic-hackathon/payments-service',
        branch: 'feature/sandbox-v2',
        accountType: 'development',
        targetEnvironment: 'sandbox-development-namespace',
      },
      plannedActions: generatePlannedActions('payments-checkout-microservice', 'node-microservice', 'synthetic_customers', false),
      executedActions: [
        { order: 1, action: 'Allocate Network Isolation Namespace', executedAt: '2026-10-24T02:19:35Z', status: 'SUCCESS' },
        { order: 2, action: 'Provision Ephemeral Container', executedAt: '2026-10-24T02:19:50Z', status: 'SUCCESS' },
        { order: 3, action: 'Inject Sanitized Local Configuration', executedAt: '2026-10-24T02:20:05Z', status: 'SUCCESS' },
        { order: 4, action: 'Seed Synthetic Data Fixtures', executedAt: '2026-10-24T02:20:25Z', status: 'SUCCESS' },
      ],
      sanitizedConfig: {
        ENV: 'development-sandbox',
        DATABASE_URL: 'postgres://dev_user:[REDACTED_PASSWORD]@localhost:5432/mock_sbx',
        API_TOKEN: 'sbx_dev_token_[REDACTED]',
        ISOLATION_TIER: 'air-gapped-mock',
      },
      safetyAuditTrail: [
        { ruleId: 'POL-001', ruleName: 'Production Isolation', outcome: 'COMPLIANT', note: 'Account type verified as development.' },
        { ruleId: 'POL-002', ruleName: 'Least Privilege Bounds', outcome: 'ENFORCED', note: 'Dropped unneeded deploy_preview scope.' },
        { ruleId: 'POL-003', ruleName: 'Anti-Duplication Guard', outcome: 'COMPLIANT', note: 'No duplicate matching sandbox allocation was created.' },
        { ruleId: 'POL-004', ruleName: 'Synthetic Data Requirement', outcome: 'COMPLIANT', note: 'Only synthetic seed datasets were used.' },
      ],
      verificationResult: {
        passed: true,
        statusCode: 200,
        latencyMs: 18,
        endpoint: 'http://localhost:8088/api/mock-auth/login',
      },
      unresolvedIssues: [],
      summary: 'Verified clean sandbox instance. No production resources touched. Audited and stamped.',
      exportJson: '',
    },
  },
  {
    id: 'REQ-2026-0812',
    projectName: 'customer-data-sync-pipeline',
    template: 'python-fastapi',
    repoDetails: {
      url: 'https://github.com/agentic-hackathon/sync-pipeline',
      branch: 'main',
      visibility: 'private',
    },
    accountType: 'production',
    targetEnvironment: 'production-primary-cluster',
    isProductionTarget: true,
    requestedPermissions: ['read_code', 'write_sandbox', 'access_production_db', 'admin_cluster'],
    grantedPermissions: [],
    sampleDataRequirement: 'real_production_dump',
    isRealDataBlocked: true,
    submittedBy: {
      id: 'usr-dev-jordan',
      name: 'Jordan Miller',
      email: 'jordan@dev.internal',
      role: 'developer',
    },
    createdAt: '2026-10-24T03:02:00Z',
    updatedAt: '2026-10-24T03:02:15Z',
    status: 'blocked',
    activeStage: 'security_validation',
    stages: {
      collect_requirements: {
        key: 'collect_requirements',
        name: 'Collect Requirements',
        order: 1,
        status: 'passed',
        completedAt: '2026-10-24T03:02:05Z',
        summary: 'Target specified as Production with real PII dump requested.',
        logs: ['[03:02:01] Ingested request REQ-2026-0812 targeting accountType="production"'],
      },
      plan_setup: {
        key: 'plan_setup',
        name: 'Plan Setup',
        order: 2,
        status: 'warning',
        completedAt: '2026-10-24T03:02:08Z',
        summary: 'Generated tentative plan, flagged critical security warnings for production target.',
        logs: ['[03:02:06] Flagged production environment requirement'],
      },
      discover_resources: {
        key: 'discover_resources',
        name: 'Discover Resources',
        order: 3,
        status: 'passed',
        completedAt: '2026-10-24T03:02:10Z',
        summary: 'Checked repo https://github.com/agentic-hackathon/sync-pipeline.',
        logs: ['[03:02:08] Verified repository metadata.'],
      },
      security_validation: {
        key: 'security_validation',
        name: 'Security Validation',
        order: 4,
        status: 'failed',
        completedAt: '2026-10-24T03:02:15Z',
        summary: 'POLICY VIOLATION POL-001: Cannot provision sandbox in production account.',
        logs: [
          '[03:02:14] CRITICAL SAFETY CHECK FAILED: Account type "production" is strictly forbidden.',
          '[03:02:15] CRITICAL SAFETY CHECK FAILED: "real_production_dump" is prohibited by POL-004.',
          '[03:02:15] Execution halted. Sandbox setup ABORTED.',
        ],
      },
      human_approval: { key: 'human_approval', name: 'Human Approval', order: 5, status: 'skipped', logs: [] },
      execute_setup: { key: 'execute_setup', name: 'Execute Setup', order: 6, status: 'skipped', logs: [] },
      verify_setup: { key: 'verify_setup', name: 'Verify Setup', order: 7, status: 'skipped', logs: [] },
      generate_manifest: { key: 'generate_manifest', name: 'Generate Manifest', order: 8, status: 'skipped', logs: [] },
    },
    plannedActions: [],
    blockedReason: 'SAFETY POLICY ENFORCEMENT: Never create a sandbox for a production account. Request contained unapproved elevated permissions (access_production_db, admin_cluster) and requested real customer PII dump.',
  },
  {
    id: 'REQ-2026-0813',
    projectName: 'inventory-graph-gateway',
    template: 'nextjs-saas',
    repoDetails: {
      url: 'https://github.com/agentic-hackathon/inventory-gateway',
      branch: 'staging-prep',
      visibility: 'internal',
    },
    accountType: 'development',
    targetEnvironment: 'sandbox-development-namespace',
    isProductionTarget: false,
    requestedPermissions: ['read_code', 'write_sandbox', 'execute_tests', 'wildcard_*'],
    grantedPermissions: ['read_code', 'write_sandbox', 'execute_tests'],
    sampleDataRequirement: 'seed_fixtures',
    isRealDataBlocked: false,
    submittedBy: {
      id: 'usr-dev-alex',
      name: 'Alex Rivera',
      email: 'alex@dev.internal',
      role: 'developer',
    },
    createdAt: '2026-10-24T03:40:00Z',
    updatedAt: '2026-10-24T03:42:00Z',
    status: 'awaiting_approval',
    activeStage: 'human_approval',
    stages: {
      collect_requirements: {
        key: 'collect_requirements',
        name: 'Collect Requirements',
        order: 1,
        status: 'passed',
        completedAt: '2026-10-24T03:40:10Z',
        summary: 'Next.js SaaS application requested for staging preparation sandbox.',
        logs: ['[03:40:01] Received parameters for inventory-graph-gateway.'],
      },
      plan_setup: {
        key: 'plan_setup',
        name: 'Plan Setup',
        order: 2,
        status: 'passed',
        completedAt: '2026-10-24T03:40:30Z',
        summary: 'Planned setup v1.0.0: Next.js dev server on ephemeral port + seed fixture injection.',
        logs: ['[03:40:20] Generated ordered plan actions.'],
      },
      discover_resources: {
        key: 'discover_resources',
        name: 'Discover Resources',
        order: 3,
        status: 'passed',
        completedAt: '2026-10-24T03:40:40Z',
        summary: 'Repo validated. No active duplicate sandbox found.',
        logs: ['[03:40:35] Repository inspection completed.'],
      },
      security_validation: {
        key: 'security_validation',
        name: 'Security Validation',
        order: 4,
        status: 'warning',
        completedAt: '2026-10-24T03:41:45Z',
        summary: 'Wildcard permission "wildcard_*" detected and stripped. Bounded to safe least-privilege list.',
        logs: [
          '[03:41:20] Detected wildcard permission: "wildcard_*". Rule POL-002: Wildcards rejected.',
          '[03:41:40] Bounded permissions to [read_code, write_sandbox, execute_tests].',
        ],
      },
      human_approval: {
        key: 'human_approval',
        name: 'Human Approval',
        order: 5,
        status: 'in_progress',
        startedAt: '2026-10-24T03:42:00Z',
        summary: 'Awaiting explicit human confirmation from an authorized administrator.',
        logs: ['[03:42:00] Gated: Human sign-off required before container launch.'],
      },
      execute_setup: { key: 'execute_setup', name: 'Execute Setup', order: 6, status: 'pending', logs: [] },
      verify_setup: { key: 'verify_setup', name: 'Verify Setup', order: 7, status: 'pending', logs: [] },
      generate_manifest: { key: 'generate_manifest', name: 'Generate Manifest', order: 8, status: 'pending', logs: [] },
    },
    plannedActions: generatePlannedActions('inventory-graph-gateway', 'nextjs-saas', 'seed_fixtures', false),
    approval: {
      required: true,
      status: 'pending',
      planVersion: 'v1.0.0',
      proposedAction: 'Initialize Next.js dev sandbox container with synthetic inventory seed fixtures',
      targetEnvironment: 'sandbox-development-namespace',
      isProductionEnvironment: false,
      permissionsComparison: {
        requested: ['read_code', 'write_sandbox', 'execute_tests', 'wildcard_*'],
        granted: ['read_code', 'write_sandbox', 'execute_tests'],
        stripped: ['wildcard_* (Forbidden by Least-Privilege Policy)'],
      },
      risks: [
        {
          severity: 'medium',
          code: 'RISK_WILDCARD_REQUESTED',
          title: 'Wildcard Scope Demotion',
          description: 'Developer requested full wildcard permissions (*). Automated engine stripped wildcard and granted only specific sandbox read/write capabilities.',
        },
      ],
      expectedChanges: [
        {
          type: 'container',
          title: 'Spawn Ephemeral Next.js Sandbox Worker',
          description: 'Spawns Docker container on dynamic host port (e.g. 8090) with synthetic fixtures.',
          preview: 'docker run -d --name sbx-next-813 -p 8090:3000 nextjs:14-alpine',
        },
        {
          type: 'env',
          title: 'Inject Sanitized Local Variables',
          description: 'Creates .env.local populated exclusively with synthetic mock keys and localhost references.',
          preview: 'NEXT_PUBLIC_API_URL=http://localhost:8090/mock-api\nDATABASE_URL=mock://sqlite/in-memory',
        },
      ],
    },
  },
];

// Helper to generate AI-assisted plan using Google Gemini API with fallback
async function generateGeminiPlan(setup: SetupRequest, existingSandbox: any): Promise<{
  isGeminiGenerated: boolean;
  model: string;
  summary: string;
  actions: PlannedAction[];
  risks: RiskItem[];
  fallbackReason?: string;
}> {
  if (!ai) {
    return {
      isGeminiGenerated: false,
      model: 'deterministic-policy-engine',
      fallbackReason: 'GEMINI_API_KEY environment secret is not configured. Used deterministic least-privilege engine.',
      summary: 'Generated 5-step least-privilege plan v1.0.0 via deterministic policy engine.',
      actions: generatePlannedActions(setup.projectName, setup.template, setup.sampleDataRequirement, !!existingSandbox),
      risks: [
        {
          severity: 'low',
          code: 'RISK_SYNTHETIC_OVERHEAD',
          title: 'Synthetic Seeding Memory Footprint',
          description: 'Generates 50 synthetic accounts in mock SQLite layer consuming ~14MB memory.',
        },
      ],
    };
  }

  try {
    const prompt = `You are the AI Agent Architect for Developer Sandbox Bootstrapper.
Analyze this developer sandbox setup request and generate a structured JSON setup plan strictly adhering to least-privilege security principles:

Project Name: ${setup.projectName}
Template: ${setup.template}
Repository: ${setup.repoDetails.url} (branch: ${setup.repoDetails.branch})
Account Target: ${setup.accountType}
Sandbox Type: ${setup.sandboxType || 'isolated-container'}
Development Purpose: ${setup.developmentPurpose || 'feature_development'}
Requested Permissions: ${setup.requestedPermissions.join(', ')}
Sample Data Requirement: ${setup.sampleDataRequirement}
Existing Active Sandbox Detected: ${existingSandbox ? `YES (${existingSandbox.id} on port ${existingSandbox.port})` : 'NO (Fresh container needed)'}

SECURITY MANDATES:
1. Least Privilege (POL-002): Distinguish between necessary permissions and requested permissions. Strip any wildcards ('*') or unapproved database/cluster scopes.
2. Anti-Duplication (POL-003): If an existing sandbox was detected, propose attaching to and synchronizing the container instead of provisioning duplicate processes.
3. Synthetic Data (POL-004): Mandate synthetic fixtures only. Never permit real customer PII.
4. Output structured steps with order, action, category ('runtime'|'network'|'filesystem'|'database'|'security'), description, commandPreview, and expectedOutcome.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            minimumNecessaryPermissions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            orderedSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  order: { type: Type.INTEGER },
                  action: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  commandPreview: { type: Type.STRING },
                  expectedOutcome: { type: Type.STRING },
                },
                required: ['order', 'action', 'category', 'description', 'expectedOutcome'],
              },
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING },
                  code: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['severity', 'code', 'title', 'description'],
              },
            },
          },
          required: ['summary', 'minimumNecessaryPermissions', 'orderedSteps', 'risks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const validCategories = ['runtime', 'network', 'filesystem', 'database', 'security'];
    const actions: PlannedAction[] = (parsed.orderedSteps || []).map((s: any, idx: number) => ({
      order: s.order || idx + 1,
      action: s.action || `Setup Action ${idx + 1}`,
      category: validCategories.includes(s.category) ? s.category : 'runtime',
      description: s.description || 'Configuring sandbox component',
      commandPreview: s.commandPreview || '# command preview',
      expectedOutcome: s.expectedOutcome || 'Step completed successfully',
    }));

    const risks: RiskItem[] = (parsed.risks || []).map((r: any) => ({
      severity: (['low', 'medium', 'high', 'critical'].includes(r.severity) ? r.severity : 'medium') as any,
      code: r.code || 'RISK_AI_DETECTED',
      title: r.title || 'Sandbox Security Risk',
      description: r.description || 'Analyzed by Gemini AI Agent',
    }));

    return {
      isGeminiGenerated: true,
      model: 'gemini-3.8-flash',
      summary: parsed.summary || 'AI-generated plan synthesized by Gemini 3.8 Flash.',
      actions: actions.length > 0 ? actions : generatePlannedActions(setup.projectName, setup.template, setup.sampleDataRequirement, !!existingSandbox),
      risks,
    };
  } catch (err: any) {
    console.log('[AI Planning] Using deterministic policy engine for setup plan generation (AI fallback active)');
    return {
      isGeminiGenerated: false,
      model: 'gemini-3.8-flash (fallback)',
      fallbackReason: `AI Service unavailable: ${err?.message || 'Network timeout'}. Used deterministic fallback rules.`,
      summary: 'Generated 5-step least-privilege plan v1.0.0 via deterministic policy engine.',
      actions: generatePlannedActions(setup.projectName, setup.template, setup.sampleDataRequirement, !!existingSandbox),
      risks: [
        {
          severity: 'low',
          code: 'RISK_SYNTHETIC_OVERHEAD',
          title: 'Synthetic Seeding Memory Footprint',
          description: 'Generates 50 synthetic accounts in mock SQLite layer consuming ~14MB memory.',
        },
      ],
    };
  }
}

// Helper to process workflow up to human approval (with Gemini AI & n8n orchestration tracking)
async function processWorkflowUpToApproval(setup: SetupRequest) {
  const now = new Date().toISOString();
  setup.updatedAt = now;

  // Stage 2: Discover Resources
  const stage2 = setup.stages.discover_resources;
  stage2.startedAt = now;
  stage2.logs.push(`[${now.slice(11, 19)}] Querying mock repository registry: ${setup.repoDetails.url}@${setup.repoDetails.branch}`);

  const registryKey = sandboxRegistryKey(setup);
  const existingSandbox = activeSandboxRegistry[registryKey];

  if (existingSandbox) {
    stage2.status = 'passed';
    stage2.completedAt = now;
    stage2.summary = `Existing sandbox configuration matched (fingerprint ${existingSandbox.configFingerprint}). Reuse candidate ${existingSandbox.id} found in simulator registry.`;
    stage2.logs.push(
      `[${now.slice(11, 19)}] Active sandbox allocation found: ${existingSandbox.id}`,
      `[${now.slice(11, 19)}] Configuration fingerprint matched: ${existingSandbox.configFingerprint}.`,
      `[${now.slice(11, 19)}] Anti-duplication policy POL-003: eligible for reuse after approval.`
    );
  } else {
    stage2.status = 'passed';
    stage2.completedAt = now;
    stage2.summary = `Repository validated. No conflicting sandbox found. Clean allocation scheduled.`;
    stage2.logs.push(`[${now.slice(11, 19)}] 0 active matching sandboxes in registry.`);
  }

  // Stage 3: Plan Setup (AI Agent Analysis via Google Gemini API)
  const stage3 = setup.stages.plan_setup;
  stage3.startedAt = now;
  stage3.logs.push(`[${now.slice(11, 19)}] Ingesting requirements into AI planning agent (Gemini 3.8 Flash)...`);

  const aiPlan = await generateGeminiPlan(setup, existingSandbox);
  setup.plannedActions = aiPlan.actions;
  setup.aiPlanMetadata = {
    model: aiPlan.model,
    isGeminiGenerated: aiPlan.isGeminiGenerated,
    reasoningSummary: aiPlan.summary,
    generatedAt: now,
    fallbackReason: aiPlan.fallbackReason,
  };

  stage3.status = 'passed';
  stage3.completedAt = new Date().toISOString();
  stage3.summary = aiPlan.isGeminiGenerated
    ? `Gemini 3.8 Flash generated ${aiPlan.actions.length}-step structured plan applying least-privilege boundaries.`
    : `Synthesized ${aiPlan.actions.length}-step least-privilege plan v1.0.0 via deterministic policy engine.`;

  stage3.logs.push(
    `[${now.slice(11, 19)}] AI Engine: ${aiPlan.model} (${aiPlan.isGeminiGenerated ? 'LIVE API RESPONSE' : 'DETERMINISTIC FALLBACK'})`,
    `[${now.slice(11, 19)}] Plan Summary: ${aiPlan.summary}`,
    `[${now.slice(11, 19)}] Synthesized ${aiPlan.actions.length} ordered actions with least-privilege scoping`
  );

  // Stage 4: Deterministic Backend Security Validation
  // CRITICAL RULE: Never allow Gemini-generated text alone to authorize sandbox creation or bypass security!
  const stage4 = setup.stages.security_validation;
  stage4.startedAt = new Date().toISOString();

  // RULE 1: Never create a sandbox for a production account!
  if (setup.accountType === 'production' || setup.isProductionTarget) {
    stage4.status = 'failed';
    stage4.completedAt = new Date().toISOString();
    stage4.summary = 'CRITICAL POLICY VIOLATION (POL-001): Attempted to provision sandbox in Production environment.';
    stage4.logs.push(
      `[${now.slice(11, 19)}] SAFETY POL-001 TRIGGERED: Account target is PRODUCTION.`,
      `[${now.slice(11, 19)}] Action ABORTED immediately. Production accounts cannot host experimental sandboxes.`,
      `[${now.slice(11, 19)}] Incident recorded in security audit trail.`
    );

    setup.status = 'blocked';
    setup.blockedReason = 'SAFETY REQUIREMENT ENFORCEMENT: Never create a sandbox for a production account. Production accounts must be isolated from sandbox automation.';
    setup.activeStage = 'security_validation';

    recordAudit(
      setup.id,
      'Policy Engine (POL-001)',
      'admin',
      'BLOCKED',
      `Blocked setup attempt targeting production account (${setup.projectName}).`,
      { policy: 'POL-001', provisioningStarted: false, provisioningActions: 0 }
    );
    return;
  }

  if (setup.sampleDataRequirement === 'real_production_dump') {
    stage4.status = 'failed';
    stage4.completedAt = new Date().toISOString();
    stage4.summary = 'POL-004 blocked a request to use real customer data. Choose synthetic or anonymized test data.';
    stage4.logs.push(
      `[${now.slice(11, 19)}] SAFETY POL-004 TRIGGERED: Real production data cannot be used in a sandbox.`,
      `[${now.slice(11, 19)}] Action blocked. No configuration or environment changes were made.`
    );
    setup.status = 'blocked';
    setup.blockedReason = 'Real production customer data is not permitted. Choose synthetic customers, anonymized telemetry, or seed fixtures.';
    setup.activeStage = 'security_validation';
    setup.isRealDataBlocked = true;
    recordAudit(
      setup.id,
      'Policy Engine (POL-004)',
      'admin',
      'BLOCKED',
      `Blocked setup request ${setup.projectName} because it requested real production data.`
    );
    return;
  }

  // RULE 2: Least Privilege Enforcement
  const rawRequested = [...setup.requestedPermissions];
  const stripped: string[] = [];
  const granted: string[] = [];

  rawRequested.forEach((perm) => {
    if (perm.includes('*') || perm === 'access_production_db' || perm === 'admin_cluster' || perm === 'delete_cluster_resources') {
      stripped.push(perm);
    } else {
      granted.push(perm);
    }
  });

  if (!granted.includes('read_code')) granted.push('read_code');
  if (!granted.includes('write_sandbox')) granted.push('write_sandbox');

  setup.grantedPermissions = granted;

  stage4.status = stripped.length > 0 ? 'warning' : 'passed';
  stage4.completedAt = new Date().toISOString();
  stage4.summary = stripped.length > 0
    ? `Enforced least privilege: Stripped elevated permissions [${stripped.join(', ')}]. Bounded to safe developer sandbox scope.`
    : `Least-privilege review passed. Granted bounded scopes: [${granted.join(', ')}].`;

  stage4.logs.push(`[${now.slice(11, 19)}] Requested scopes: ${rawRequested.join(', ')}`);
  if (stripped.length > 0) {
    stage4.logs.push(`[${now.slice(11, 19)}] Stripped forbidden/elevated privileges: ${stripped.join(', ')}`);
  }
  stage4.logs.push(`[${now.slice(11, 19)}] Final bounded permissions: ${granted.join(', ')}`);

  // Stage 5: Human Approval
  const stage5 = setup.stages.human_approval;
  stage5.startedAt = new Date().toISOString();
  stage5.status = 'in_progress';
  stage5.summary = 'Awaiting administrator authorization. Execution gated until sign-off.';
  stage5.logs.push(
    `[${now.slice(11, 19)}] Human-in-the-loop gate reached. Administrator approval required.`,
    `[${now.slice(11, 19)}] n8n workflow paused at 'Human Approval' webhook node.`
  );

  setup.status = 'awaiting_approval';
  setup.activeStage = 'human_approval';

  const combinedRisks: RiskItem[] = [...aiPlan.risks];
  if (stripped.length > 0 && !combinedRisks.some((r) => r.code === 'RISK_ELEVATED_SCOPES_STRIPPED')) {
    combinedRisks.push({
      severity: 'medium',
      code: 'RISK_ELEVATED_SCOPES_STRIPPED',
      title: 'Elevated Scopes Stripped by Policy',
      description: `Automated safety rule POL-002 removed unapproved permissions (${stripped.join(', ')}).`,
    });
  }

  const expectedChanges: ExpectedChange[] = [
    {
      type: 'container',
      title: existingSandbox ? 'Reuse Active Sandbox Container' : 'Provision Isolated Sandbox Container',
      description: existingSandbox
        ? `Attach to running container ${existingSandbox.id} on port ${existingSandbox.port}. Zero new container footprint.`
        : 'Spawn isolated Docker container with 0.5 CPU & 512MB memory boundary.',
      preview: existingSandbox
        ? `docker exec -it ${existingSandbox.id} sh -c "git fetch && refresh_sandbox"`
        : `docker run -d --name sbx-${setup.projectName.slice(0, 10)}-${Math.floor(Math.random() * 800 + 100)} -p ${Math.floor(8080 + Math.random() * 100)}:3000 node:20-alpine`,
    },
    {
      type: 'env',
      title: 'Local Environment Configuration Injection',
      description: 'Creates sandbox-scoped configuration with strictly redacted mock tokens.',
      preview: 'NODE_ENV=development\nSANDBOX_ISOLATED=true\nMOCK_SEED_MODE=synthetic',
    },
    {
      type: 'database',
      title: 'Synthetic Test Data Seeding',
      description: `Loads 50 synthetic records matching requirement: ${setup.sampleDataRequirement}. Zero real PII.`,
      preview: 'INSERT INTO mock_users (id, email, synthetic) VALUES ("usr_mock_01", "dev01@sandbox.test", true);',
    },
  ];

  setup.approval = {
    required: true,
    status: 'pending',
    planVersion: aiPlan.isGeminiGenerated ? 'v1.0.0-gemini' : 'v1.0.0',
    proposedAction: existingSandbox
      ? `Safely attach to and refresh existing sandbox for "${setup.projectName}"`
      : `Bootstrap isolated development sandbox container for "${setup.projectName}"`,
    targetEnvironment: setup.targetEnvironment,
    isProductionEnvironment: false,
    permissionsComparison: {
      requested: rawRequested,
      granted,
      stripped,
    },
    risks: combinedRisks,
    expectedChanges,
  };

  setup.n8nWorkflow = {
    executionId: `n8n_exec_${Math.random().toString(36).substring(2, 9)}`,
    status: 'triggered',
    triggeredAt: now,
  };

  recordAudit(
    setup.id,
    'Policy Engine',
    'admin',
    'SECURITY_CHECK',
    `Security validation completed. Bounded permissions: [${granted.join(', ')}]. Awaiting admin approval.`
  );
}

function canAccessSetup(req: Request, setup: SetupRequest): boolean {
  return req.headers['x-user-role'] === 'admin' ||
    (req.headers['x-user-role'] === 'developer' && req.headers['x-user-id'] === setup.submittedBy.id);
}

// API ENDPOINTS

// 1. Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    edition: 'Agentic AI Hackathon 2026',
    mockEngine: 'Active (isolated in-memory sandbox & repo simulator)',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/demo', (req: Request, res: Response) => {
  const user = demoUsers[String(req.body.accountId || '')];
  if (!user) {
    return res.status(400).json({ error: 'Choose one of the configured demo accounts.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  demoSessions.set(token, { user, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader(
    'Set-Cookie',
    `sbx_demo_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
  res.json({ user, mode: 'demo' });
});

app.get('/api/auth/session', (req: Request, res: Response) => {
  const sessionCookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('sbx_demo_session='));
  const token = sessionCookie?.slice('sbx_demo_session='.length);
  const session = token ? demoSessions.get(token) : undefined;
  if (!session || session.expiresAt <= Date.now()) {
    if (token) demoSessions.delete(token);
    return res.json({ user: null, mode: 'demo' });
  }
  res.json({ user: session.user, mode: 'demo' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const sessionCookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('sbx_demo_session='));
  const token = sessionCookie?.slice('sbx_demo_session='.length);
  if (token) demoSessions.delete(token);
  res.setHeader('Set-Cookie', 'sbx_demo_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.status(204).end();
});

// 2. Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const userRole = req.headers['x-user-role'];
  if (userRole === 'admin') return res.json(auditLogs);
  const userId = req.headers['x-user-id'];
  if (userRole !== 'developer' || typeof userId !== 'string') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const ownedRequestIds = new Set(
    setupRequests.filter((setup) => setup.submittedBy.id === userId).map((setup) => setup.id)
  );
  res.json(auditLogs.filter((entry) => ownedRequestIds.has(entry.requestId)));
});

// 3. List setup requests (Scoped by role: developers see personal requests, admins see all)
app.get('/api/setups', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || (req.query.role as string);
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);

  if (userRole === 'developer') {
    const scoped = setupRequests.filter((s) => s.submittedBy?.id === userId);
    return res.json(scoped);
  }

  if (userRole !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  // Administrators view all organization requests
  res.json(setupRequests);
});

// 4. Get single setup request by ID
app.get('/api/setups/:id', (req: Request, res: Response) => {
  const found = setupRequests.find((s) => s.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: 'Setup request not found' });
  }
  if (!canAccessSetup(req, found)) {
    return res.status(403).json({ error: 'You can only view your own setup requests.' });
  }
  res.json(found);
});

// 5. Create new setup request (submitted by developer)
app.post('/api/setups', async (req: Request, res: Response) => {
  if (req.headers['x-user-role'] !== 'developer') {
    return res.status(403).json({ error: 'Only a demo developer can submit a setup request.' });
  }
  const {
    projectName,
    template,
    repoDetails,
    accountType,
    sandboxType,
    developmentPurpose,
    requestedTools,
    requestedPermissions,
    sampleDataRequirement,
  } = req.body;

  if (!String(projectName || '').trim() || !String(repoDetails?.url || '').trim() || !String(repoDetails?.branch || '').trim()) {
    return res.status(400).json({ error: 'Environment name, repository URL, and branch are required.' });
  }

  let id = '';
  do {
    id = `REQ-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  } while (setupRequests.some((setup) => setup.id === id));
  const now = new Date().toISOString();

  const stages = initializeStages();
  stages.collect_requirements.status = 'passed';
  stages.collect_requirements.completedAt = now;
  stages.collect_requirements.summary = `Collected template "${template}" for account "${accountType}".`;
  stages.collect_requirements.logs = [
    `[${now.slice(11, 19)}] Ingested new setup request: ${projectName}`,
    `[${now.slice(11, 19)}] Sandbox type: ${sandboxType || 'isolated-container'} · Purpose: ${developmentPurpose || 'feature_development'}`,
    `[${now.slice(11, 19)}] Target environment: ${accountType === 'production' ? 'production-cluster' : 'sandbox-dev'}`,
    `[${now.slice(11, 19)}] Sample data tier: ${sampleDataRequirement}`,
  ];

  const submitter: UserProfile = {
    id: String(req.headers['x-user-id']),
    name: String(req.headers['x-user-name']),
    email: demoUsers[String(req.headers['x-user-id'])]?.email || '',
    role: 'developer',
  };

  const isProd = accountType === 'production';

  const newSetup: SetupRequest = {
    id,
    projectName,
    template: template || 'nextjs-saas',
    repoDetails: {
      url: repoDetails.url,
      branch: String(repoDetails.branch).trim(),
      visibility: repoDetails.visibility || 'internal',
      detectedCommitHash: 'a1b2c3d',
    },
    accountType: accountType || 'development',
    targetEnvironment: isProd ? 'production-primary-cluster' : 'sandbox-development-namespace',
    isProductionTarget: isProd,
    sandboxType: sandboxType || 'isolated-container',
    developmentPurpose: developmentPurpose || 'feature_development',
    requestedTools: requestedTools || ['Node.js 20', 'Docker Engine'],
    requestedPermissions: requestedPermissions || ['read_code', 'write_sandbox'],
    grantedPermissions: [],
    sampleDataRequirement: sampleDataRequirement || 'synthetic_customers',
    isRealDataBlocked: sampleDataRequirement === 'real_production_dump',
    submittedBy: submitter,
    createdAt: now,
    updatedAt: now,
    status: 'planning',
    activeStage: 'plan_setup',
    stages,
    plannedActions: [],
  };

  setupRequests.unshift(newSetup);

  recordAudit(
    newSetup.id,
    submitter.name,
    submitter.role,
    'CREATED',
    `Developer submitted setup request for ${projectName} (${accountType}) via n8n orchestrator trigger.`
  );

  // Automatically process through AI planning and deterministic safety checks
  await processWorkflowUpToApproval(newSetup);

  res.status(201).json(newSetup);
});

// n8n Integration: Export official workflow definition
app.get('/api/n8n/workflow', (_req: Request, res: Response) => {
  try {
    const workflowPath = path.join(__dirname, 'n8n', 'developer_sandbox_bootstrapper_workflow.json');
    if (fs.existsSync(workflowPath)) {
      const data = fs.readFileSync(workflowPath, 'utf8');
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error('Error reading n8n workflow file:', err);
  }
  res.json({ error: 'n8n workflow file not found' });
});

// n8n Integration: Trigger / simulate n8n orchestrator webhook execution
app.post('/api/n8n/trigger/:id', async (req: Request, res: Response) => {
  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup request not found' });
  if (!canAccessSetup(req, setup)) return res.status(403).json({ error: 'You cannot access this setup request.' });

  const executionId = `n8n_exec_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  setup.n8nWorkflow = {
    executionId,
    status: 'completed',
    triggeredAt: now,
  };

  recordAudit(
    setup.id,
    'n8n Orchestrator Bridge',
    'admin',
    'SECURITY_CHECK',
    `n8n workflow execution ${executionId} dispatched all 8 pipeline nodes synchronously.`
  );

  res.json({
    message: `n8n workflow triggered successfully for ${setup.id}`,
    executionId,
    setup,
    nodesExecuted: [
      { name: 'Stage 1: Webhook Trigger', status: 'SUCCESS', durationMs: 12 },
      { name: 'Validate Requirements', status: 'SUCCESS', durationMs: 8 },
      { name: 'Stage 2: Discover Resources', status: 'SUCCESS', durationMs: 24 },
      { name: 'Stage 3: Gemini AI (Plan Setup)', status: 'SUCCESS', durationMs: setup.aiPlanMetadata?.isGeminiGenerated ? 840 : 45 },
      { name: 'Stage 4: Validate Security (POL-001 to POL-004)', status: setup.status === 'blocked' ? 'BLOCKED' : 'PASSED', durationMs: 15 },
      { name: 'Stage 5: Human Approval Gate', status: setup.approval?.status === 'approved' ? 'PASSED' : 'WAITING', durationMs: 5 },
      { name: 'Stage 6: Execute Approved Setup', status: setup.executionResult ? 'SUCCESS' : 'WAITING', durationMs: 40 },
      { name: 'Stage 7: Smoke Login Probe', status: setup.smokeTest ? 'SUCCESS' : 'WAITING', durationMs: 20 },
      { name: 'Stage 8: Generate Manifest & Seal', status: setup.manifest ? 'SUCCESS' : 'WAITING', durationMs: 18 },
    ],
  });
});

// AI Agent Integration: Get official copy-paste prompt template for Google Gemini AI
app.get('/api/ai/prompt-template', (_req: Request, res: Response) => {
  res.json({
    model: 'gemini-3.8-flash',
    objective: 'Autonomous, least-privilege developer sandbox planning and security evaluation.',
    copyPastePrompt: `You are the AI Agent Architect for the Developer Sandbox Bootstrapper (Agentic AI Hackathon 2026).

Analyze this validated setup request and generate a structured JSON setup plan following least-privilege principles:

Project: {{projectName}}
Template: {{template}}
Repo: {{repoUrl}} @ {{branch}}
Sandbox Type: {{sandboxType}}
Account Target: {{accountType}}
Requested Tools: {{requestedTools}}
Requested Permissions: {{requestedPermissions}}
Development Purpose: {{developmentPurpose}}
Sample Data: {{sampleDataRequirement}}
Existing Active Sandbox: {{existingSandboxDetected}}

SECURITY MANDATES:
1. Least Privilege (POL-002): Strictly distinguish necessary permissions from merely requested permissions. Drop wildcard ('*') and elevated production scopes.
2. Anti-Duplication (POL-003): If an existing sandbox container is running for this repo and branch, attach to and synchronize it instead of allocating duplicate containers.
3. Production Isolation (POL-001): If account target is 'production', flag critical security block. Never host experimental sandboxes in production.
4. Synthetic Data (POL-004): Mandate synthetic fixtures only. Never permit real customer PII dumps.

Output strict JSON:
{
  "summary": "High-level architectural summary of the sandbox setup plan",
  "minimumNecessaryPermissions": ["read_code", "write_sandbox"],
  "orderedSteps": [
    {
      "order": 1,
      "action": "Step name",
      "category": "runtime | network | filesystem | database | security",
      "description": "Step detail",
      "commandPreview": "command string",
      "expectedOutcome": "verified outcome"
    }
  ],
  "risks": [
    {
      "severity": "low | medium | high | critical",
      "code": "RISK_IDENTIFIER",
      "title": "Risk title",
      "description": "Risk explanation"
    }
  ],
  "rollbackRecommendations": "Instructions for clean teardown upon session termination"
}`,
  });
});

// AI Agent Integration: Live Gemini Planning Playground
app.post('/api/ai/simulate-planning', async (req: Request, res: Response) => {
  const dummySetup: SetupRequest = {
    id: 'REQ-SIM-' + Math.floor(100 + Math.random() * 900),
    projectName: req.body.projectName || 'payments-checkout-microservice',
    template: req.body.template || 'node-microservice',
    repoDetails: {
      url: req.body.repoUrl || 'https://github.com/agentic-hackathon/payments-service',
      branch: req.body.branch || 'main',
      visibility: 'internal',
    },
    accountType: req.body.accountType || 'development',
    targetEnvironment: req.body.accountType === 'production' ? 'production-cluster' : 'sandbox-development-namespace',
    isProductionTarget: req.body.accountType === 'production',
    sandboxType: req.body.sandboxType || 'isolated-container',
    developmentPurpose: req.body.developmentPurpose || 'feature_development',
    requestedTools: req.body.requestedTools || ['Node.js 20', 'Docker Engine'],
    requestedPermissions: req.body.requestedPermissions || ['read_code', 'write_sandbox', 'deploy_preview'],
    grantedPermissions: [],
    sampleDataRequirement: req.body.sampleDataRequirement || 'synthetic_customers',
    isRealDataBlocked: req.body.sampleDataRequirement === 'real_production_dump',
    submittedBy: { id: 'usr-dev-alex', name: 'Alex Rivera', email: 'alex@dev.internal', role: 'developer' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'planning',
    activeStage: 'plan_setup',
    stages: initializeStages(),
    plannedActions: [],
  };

  const plan = await generateGeminiPlan(dummySetup, null);
  res.json({
    plan,
    modelUsed: plan.model,
    isGeminiGenerated: plan.isGeminiGenerated,
    fallbackReason: plan.fallbackReason,
    timestamp: new Date().toISOString(),
  });
});

// 6. Admin Approval Endpoint (Strict Backend Role Enforcement!)
app.post('/api/setups/:id/approve', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || req.body.role;

  // Strict Backend Authorization: Developers cannot approve!
  if (userRole !== 'admin') {
    recordAudit(
      req.params.id,
      (req.headers['x-user-name'] as string) || 'Developer (Alex Rivera)',
      'developer',
      'BLOCKED',
      `SECURITY POLICY VIOLATION (POL-005): Developer attempted self-approval on ${req.params.id}. Denied.`
    );
    return res.status(403).json({
      error: 'AUTHORIZATION ERROR: Developers cannot approve setup requests. Separation of duties requires explicit administrator approval (Rule POL-005).',
    });
  }

  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (!setup.approval) return res.status(400).json({ error: 'Setup has no administrator review record.' });

  // Idempotent handling: If already approved, return success
  if (setup.status === 'approved') {
    return res.json({ message: `Setup ${setup.id} is already approved`, setup });
  }

  if (setup.status !== 'awaiting_approval') {
    return res.status(400).json({ error: `Cannot approve setup currently in status: ${setup.status}` });
  }

  const { reviewerName, reviewerEmail, comment } = req.body;
  const now = new Date().toISOString();
  const signature = `APPROVAL-REF-${crypto.randomBytes(6).toString('hex')}`;

  if (setup.approval) {
    setup.approval.status = 'approved';
    setup.approval.reviewedBy = reviewerName || 'Elena Vance (Security Operations)';
    setup.approval.reviewedByEmail = reviewerEmail || 'evance@security.corp';
    setup.approval.reviewedAt = now;
    setup.approval.comment = comment || 'Approved least-privilege sandbox creation';
    setup.approval.signature = signature;
  }
  setup.reviewHistory = [
    ...(setup.reviewHistory || []),
    {
      decision: 'approved',
      reviewerName: reviewerName || 'Elena Vance (Security Operations)',
      comment: comment || 'Approved least-privilege sandbox creation',
      timestamp: now,
    } satisfies SetupReviewEvent,
  ];

  const stage5 = setup.stages.human_approval;
  stage5.status = 'passed';
  stage5.completedAt = now;
  stage5.summary = `Approved by administrator ${setup.approval?.reviewedBy}. Demo approval reference recorded.`;
  stage5.logs.push(
    `[${now.slice(11, 19)}] ADMINISTRATOR APPROVAL CONFIRMED by ${setup.approval?.reviewedBy}`,
    `[${now.slice(11, 19)}] Approved Plan Version: ${setup.approval?.planVersion || 'v1.0.0'}`,
    `[${now.slice(11, 19)}] Demo approval reference: ${signature}`,
    `[${now.slice(11, 19)}] Simulator is authorized to record the next stage.`
  );

  setup.status = 'approved';
  setup.activeStage = 'execute_setup';
  setup.updatedAt = now;

  recordAudit(
    setup.id,
    setup.approval?.reviewedBy || 'Admin',
    'admin',
    'APPROVED',
    `Administrator approved sandbox plan ${setup.approval?.planVersion} for ${setup.projectName}. Signature: ${signature}`
  );

  res.json({ message: 'Setup approved successfully by administrator', setup });
});

// 7. Admin Rejection Endpoint (Strict Backend Role Enforcement!)
app.post('/api/setups/:id/reject', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || req.body.role;

  if (userRole !== 'admin') {
    recordAudit(
      req.params.id,
      (req.headers['x-user-name'] as string) || 'Developer (Alex Rivera)',
      'developer',
      'BLOCKED',
      `SECURITY POLICY VIOLATION (POL-005): Developer attempted rejection on ${req.params.id}. Denied.`
    );
    return res.status(403).json({
      error: 'AUTHORIZATION ERROR: Developers cannot reject setup requests. Action restricted to administrators.',
    });
  }

  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (!setup.approval) return res.status(400).json({ error: 'Setup has no administrator review record.' });

  if (setup.status !== 'awaiting_approval') {
    return res.status(400).json({ error: `Cannot reject setup currently in status: ${setup.status}` });
  }

  const { reviewerName, reason } = req.body;
  const now = new Date().toISOString();

  if (setup.approval) {
    setup.approval.status = 'rejected';
    setup.approval.reviewedBy = reviewerName || 'Elena Vance (Security Operations)';
    setup.approval.reviewedAt = now;
    setup.approval.rejectionReason = reason || 'Rejected due to risk or missing justification';
    setup.approval.comment = reason;
  }
  setup.reviewHistory = [
    ...(setup.reviewHistory || []),
    {
      decision: 'rejected',
      reviewerName: reviewerName || 'Elena Vance (Security Operations)',
      comment: reason || 'Rejected due to risk or missing justification',
      timestamp: now,
    } satisfies SetupReviewEvent,
  ];

  const stage5 = setup.stages.human_approval;
  stage5.status = 'failed';
  stage5.completedAt = now;
  stage5.summary = `Setup rejected by administrator ${reviewerName || 'admin'}. Execution cancelled.`;
  stage5.logs.push(`[${now.slice(11, 19)}] Setup rejected. Reason: ${reason || 'Denied by administrator'}`);

  setup.status = 'rejected';
  setup.blockedReason = `Administrator rejected setup: ${reason || 'Unspecified reason'}`;
  setup.stages.execute_setup.status = 'skipped';
  setup.stages.verify_setup.status = 'skipped';
  setup.stages.generate_manifest.status = 'skipped';
  setup.updatedAt = now;

  recordAudit(
    setup.id,
    reviewerName || 'Admin',
    'admin',
    'REJECTED',
    `Administrator rejected setup request for ${setup.projectName}. Reason: ${reason}`
  );

  res.json({ message: 'Setup rejected', setup });
});

app.post('/api/setups/:id/request-changes', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || req.body.role;
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only an administrator can request changes.' });
  }

  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (!setup.approval) return res.status(400).json({ error: 'Setup has no administrator review record.' });
  if (setup.status !== 'awaiting_approval') {
    return res.status(400).json({ error: `Cannot request changes for a setup currently in status: ${setup.status}` });
  }

  const reviewerName = String(req.body.reviewerName || req.headers['x-user-name'] || 'Administrator').trim();
  const comment = String(req.body.comment || '').trim();
  if (!comment) return res.status(400).json({ error: 'Explain what the developer needs to change before returning this request.' });

  const now = new Date().toISOString();
  setup.approval!.status = 'changes_requested';
  setup.approval!.reviewedBy = reviewerName;
  setup.approval!.reviewedAt = now;
  setup.approval!.comment = comment;
  setup.approval!.signature = undefined;
  setup.reviewHistory = [
    ...(setup.reviewHistory || []),
    { decision: 'changes_requested', reviewerName, comment, timestamp: now },
  ];
  setup.status = 'changes_requested';
  setup.activeStage = 'human_approval';
  setup.stages.human_approval.status = 'warning';
  setup.stages.human_approval.completedAt = now;
  setup.stages.human_approval.summary = `Administrator ${reviewerName} requested changes: ${comment}`;
  setup.stages.human_approval.logs.push(`[${now.slice(11, 19)}] Changes requested by ${reviewerName}: ${comment}`);
  setup.updatedAt = now;

  recordAudit(setup.id, reviewerName, 'admin', 'CHANGES_REQUESTED', `Changes requested for ${setup.projectName}: ${comment}`);
  res.json({ message: 'Changes requested', setup });
});

app.post('/api/setups/:id/resubmit', async (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || req.body.role;
  const userId = (req.headers['x-user-id'] as string) || req.body.submittedBy?.id;
  if (userRole !== 'developer') {
    return res.status(403).json({ error: 'Only the submitting developer can revise this request.' });
  }

  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (setup.submittedBy.id !== userId) return res.status(403).json({ error: 'You can only revise your own request.' });
  if (setup.status !== 'changes_requested') {
    return res.status(400).json({ error: 'This request is not waiting for changes.' });
  }

  const { projectName, template, repoDetails, accountType, sandboxType, developmentPurpose, requestedTools, requestedPermissions, sampleDataRequirement } = req.body;
  if (!String(projectName || '').trim() || !String(repoDetails?.url || '').trim() || !String(repoDetails?.branch || '').trim()) {
    return res.status(400).json({ error: 'Environment name, repository URL, and branch are required.' });
  }
  if (!['nextjs-saas', 'node-microservice', 'python-fastapi', 'go-worker', 'custom'].includes(template)) {
    return res.status(400).json({ error: 'Choose a supported environment template.' });
  }
  if (!['development', 'staging', 'qa', 'production'].includes(accountType)) {
    return res.status(400).json({ error: 'Choose a supported target tier.' });
  }
  if (!['synthetic_customers', 'anonymized_telemetry', 'seed_fixtures', 'synthetic_financial', 'real_production_dump'].includes(sampleDataRequirement)) {
    return res.status(400).json({ error: 'Choose a supported data requirement.' });
  }
  if (
    (requestedPermissions !== undefined && (!Array.isArray(requestedPermissions) || requestedPermissions.some((permission) => typeof permission !== 'string'))) ||
    (requestedTools !== undefined && (!Array.isArray(requestedTools) || requestedTools.some((tool) => typeof tool !== 'string')))
  ) {
    return res.status(400).json({ error: 'Permissions and tools must be lists of text values.' });
  }

  setup.projectName = String(projectName).trim();
  setup.template = template;
  setup.repoDetails = {
    ...setup.repoDetails,
    url: String(repoDetails.url).trim(),
    branch: String(repoDetails.branch).trim(),
  };
  setup.accountType = accountType;
  setup.targetEnvironment = accountType === 'production' ? 'production-primary-cluster' : 'sandbox-development-namespace';
  setup.isProductionTarget = accountType === 'production';
  setup.sandboxType = sandboxType;
  setup.developmentPurpose = developmentPurpose;
  setup.requestedTools = Array.isArray(requestedTools) ? requestedTools : [];
  setup.requestedPermissions = Array.isArray(requestedPermissions) ? requestedPermissions : [];
  setup.grantedPermissions = [];
  setup.sampleDataRequirement = sampleDataRequirement;
  setup.isRealDataBlocked = sampleDataRequirement === 'real_production_dump';
  setup.executionResult = undefined;
  setup.smokeTest = undefined;
  setup.manifest = undefined;
  setup.blockedReason = undefined;
  setup.aiPlanMetadata = undefined;
  setup.approval = undefined;
  setup.status = 'planning';
  setup.updatedAt = new Date().toISOString();
  setup.stages = initializeStages();
  setup.stages.collect_requirements.status = 'passed';
  setup.stages.collect_requirements.completedAt = setup.updatedAt;
  setup.stages.collect_requirements.summary = `Updated request details collected for ${setup.projectName}.`;
  setup.stages.collect_requirements.logs.push(`[${setup.updatedAt.slice(11, 19)}] Developer resubmitted updated request.`);

  await processWorkflowUpToApproval(setup);
  recordAudit(setup.id, setup.submittedBy.name, 'developer', 'RESUBMITTED', `Developer resubmitted updated setup request for ${setup.projectName}.`);
  res.json({ message: 'Request resubmitted', setup });
});

// 8. Execute Setup (Stage 6) - with duplicate prevention
app.post('/api/setups/:id/execute', (req: Request, res: Response) => {
  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (!canAccessSetup(req, setup)) return res.status(403).json({ error: 'You cannot access this setup request.' });

  if (setup.accountType === 'production' || setup.isProductionTarget) {
    const now = new Date().toISOString();
    setup.status = 'blocked';
    setup.activeStage = 'security_validation';
    setup.blockedReason = 'POL-001: Production targets cannot be provisioned.';
    setup.stages.security_validation.status = 'failed';
    setup.stages.security_validation.completedAt = now;
    setup.stages.security_validation.summary = setup.blockedReason;
    setup.stages.security_validation.logs.push(
      `[${now.slice(11, 19)}] POL-001 execution guard rejected a production target before provisioning.`,
      `[${now.slice(11, 19)}] Provisioning actions performed: 0.`
    );
    setup.stages.execute_setup.status = 'skipped';
    setup.stages.verify_setup.status = 'skipped';
    setup.stages.generate_manifest.status = 'skipped';
    setup.updatedAt = now;
    recordAudit(
      setup.id,
      'Policy Engine (POL-001)',
      'admin',
      'BLOCKED',
      'Execution blocked before provisioning because the target is production.',
      { policy: 'POL-001', provisioningStarted: false, provisioningActions: 0 }
    );
    return res.status(409).json({ error: setup.blockedReason, setup, provisioningActions: 0 });
  }

  if (setup.status !== 'approved') {
    return res.status(400).json({ error: 'Setup cannot execute without explicit administrator approval (Rule POL-005).' });
  }

  // Prevent duplicate execution on retries!
  if (setup.executionResult) {
    return res.json({
      message: 'Execution already completed. Returning existing sandbox allocation to prevent duplicate execution.',
      executionResult: setup.executionResult,
      setup,
    });
  }

  const now = new Date().toISOString();
  setup.status = 'running';
  setup.activeStage = 'execute_setup';

  const stage6 = setup.stages.execute_setup;
  stage6.startedAt = now;

  const registryKey = sandboxRegistryKey(setup);
  const configFingerprint = sandboxConfigurationFingerprint(setup);
  let sandboxId = '';
  let containerPort = 8080;
  let reusedExisting = false;
  let reuseReason = '';

  if (activeSandboxRegistry[registryKey]) {
    const existing = activeSandboxRegistry[registryKey];
    sandboxId = existing.id;
    containerPort = existing.port;
    reusedExisting = true;
    reuseReason = `Reused existing sandbox container ${existing.id} on port ${existing.port}. Skipped duplicate allocation.`;

    stage6.logs.push(
      `[${now.slice(11, 19)}] ANTI-DUPLICATION CHECK: Existing sandbox identified.`,
      `[${now.slice(11, 19)}] Simulator reused matching sandbox record ${sandboxId}`,
      `[${now.slice(11, 19)}] Simulator recorded a config delta. No running container was contacted.`
    );
  } else {
    sandboxId = `sbx-${setup.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 12)}-${Math.floor(100 + Math.random() * 900)}`;
    containerPort = Math.floor(8100 + Math.random() * 500);

    activeSandboxRegistry[registryKey] = {
      id: sandboxId,
      repoUrl: setup.repoDetails.url,
      branch: setup.repoDetails.branch,
      port: containerPort,
      createdAt: now,
      configFingerprint,
    };

    stage6.logs.push(
      `[${now.slice(11, 19)}] Simulator recorded an isolated container allocation: ${sandboxId}`,
      `[${now.slice(11, 19)}] Simulator recorded localhost:${containerPort} -> 3000`,
      `[${now.slice(11, 19)}] Simulator recorded synthetic test fixtures (50 mock rows)`
    );
  }

  const executedActions: ExecutedAction[] = setup.plannedActions.map((plan) => ({
    order: plan.order,
    action: plan.action,
    executedAt: now,
    status: 'SUCCESS',
    outputSnippet: `Action executed: ${plan.expectedOutcome}`,
  }));

  const executionResult: ExecutionResult = {
    sandboxId,
    reusedExisting,
    configFingerprint,
    reuseReason,
    containerPort,
    endpointUrl: `http://localhost:${containerPort}`,
    allocatedCpu: '0.5 vCPU (Capped)',
    allocatedMemory: '512 MB (Capped)',
    syntheticSeedRows: 50,
    executedActions,
    executionDurationMs: reusedExisting ? 380 : 1240,
    executionLogs: [
      { timestamp: now.slice(11, 19), level: 'info', message: reusedExisting ? 'Reusing matching simulator record' : 'Recording a simulated sandbox allocation' },
      { timestamp: now.slice(11, 19), level: 'info', message: `Mounted mock filesystem at /sandbox/${sandboxId}` },
      { timestamp: now.slice(11, 19), level: 'info', message: 'Seeding strictly synthetic mock data records (Zero PII)' },
      { timestamp: now.slice(11, 19), level: 'success', message: `Simulator recorded a service result on port ${containerPort}` },
    ],
  };

  setup.executionResult = executionResult;
  stage6.status = 'passed';
  stage6.completedAt = new Date().toISOString();
  stage6.summary = reusedExisting
  ? `Simulator reused existing sandbox record ${sandboxId} on port ${containerPort}. No real container was attached.`
  : `Simulator recorded sandbox allocation ${sandboxId} on port ${containerPort}. No real container was started.`;

  setup.activeStage = 'verify_setup';
  setup.updatedAt = new Date().toISOString();

  recordAudit(
    setup.id,
    'Mock Sandbox Daemon',
    'admin',
    'EXECUTED',
    reusedExisting
      ? `Simulator reused sandbox record ${sandboxId} on port ${containerPort}; no duplicate allocation was recorded.`
      : `Simulator recorded sandbox allocation ${sandboxId} on port ${containerPort}; no real container was started.`,
    { reusedExisting, configFingerprint, duplicateCreationEvents: 0 }
  );

  res.json({ message: 'Execution completed', executionResult, setup });
});

// 9. Verify Setup (Stage 7 Smoke Login)
app.post('/api/setups/:id/smoke-test', (req: Request, res: Response) => {
  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (!canAccessSetup(req, setup)) return res.status(403).json({ error: 'You cannot access this setup request.' });

  if (!setup.executionResult) {
    return res.status(400).json({ error: 'Cannot run verification before execution stage completes' });
  }

  const now = new Date().toISOString();
  const stage7 = setup.stages.verify_setup;
  stage7.startedAt = now;

  const smokeTest: SmokeTestResult = {
    status: 'passed',
    testedAt: now,
    loginEndpoint: `${setup.executionResult.endpointUrl}/api/mock-auth/login`,
    syntheticUser: {
      email: 'dev-synthetic-tester@sandbox.internal',
      role: 'developer_sandbox',
      tokenPreview: 'sbx_jwt_eyJhbGciOi...[REDACTED_MOCK_BEARER]',
    },
    healthCheckLatencyMs: 16,
    responseStatusCode: 200,
    checks: [
      { name: 'Sandbox TCP Connectivity', passed: true, latencyMs: 3, details: `Responded on port ${setup.executionResult.containerPort}` },
      { name: 'Mock Synthetic Auth Handshake', passed: true, latencyMs: 8, details: 'Configured simulator result; no token-signing service was called' },
      { name: 'Seed Data Query Validation', passed: true, latencyMs: 5, details: '50 synthetic mock entities verified' },
      { name: 'Egress Network Isolation', passed: true, latencyMs: 2, details: 'Outbound public egress blocked (Air-gapped mock)' },
    ],
    evidenceSnippet: `HTTP/1.1 200 OK\nServer: mock-sandbox-gateway\nX-Sandbox-Id: ${setup.executionResult.sandboxId}\n{"status":"UP","synthetic":true,"auth":"verified","user":"dev-synthetic-tester@sandbox.internal"}`,
  };

  setup.smokeTest = smokeTest;
  stage7.status = 'passed';
  stage7.completedAt = now;
  stage7.summary = `Simulated smoke-login result returned 200 OK (configured 16ms latency).`;
  stage7.logs.push(
    `[${now.slice(11, 19)}] Simulated POST ${smokeTest.loginEndpoint} -> 200 OK`,
    `[${now.slice(11, 19)}] Simulator reported the configured synthetic token result`,
    `[${now.slice(11, 19)}] Simulator reported the configured egress-isolation result`
  );

  setup.activeStage = 'generate_manifest';
  setup.updatedAt = now;

  recordAudit(
    setup.id,
    'Verification Probe',
    'admin',
    'VERIFIED',
    `Smoke login check passed with 200 OK against ${smokeTest.loginEndpoint} (16ms).`
  );

  res.json({ message: 'Smoke verification passed', smokeTest, setup });
});

// 10. Generate Manifest (Stage 8)
app.post('/api/setups/:id/manifest', (req: Request, res: Response) => {
  const setup = setupRequests.find((s) => s.id === req.params.id);
  if (!setup) return res.status(404).json({ error: 'Setup not found' });
  if (!canAccessSetup(req, setup)) return res.status(403).json({ error: 'You cannot access this setup request.' });
  if (!setup.executionResult) {
    return res.status(400).json({ error: 'A setup report can only be generated after configuration has run.' });
  }
  if (setup.smokeTest?.status !== 'passed') {
    return res.status(400).json({ error: 'A setup report can only be generated after all basic functionality checks pass.' });
  }

  const now = new Date().toISOString();
  const stage8 = setup.stages.generate_manifest;
  stage8.startedAt = now;

  const rawConfig = {
    NODE_ENV: 'development-sandbox',
    PORT: setup.executionResult?.containerPort?.toString() || '8080',
    SANDBOX_CONTAINER_ID: setup.executionResult?.sandboxId || 'sbx-unknown',
    MOCK_DB_URL: 'postgres://dev_sandbox:mock_pass_88219@localhost:5432/sandbox_db',
    API_SECRET_KEY: 'sk_test_9942048_synthetic_stripe_secret',
    GITHUB_PAT: 'ghp_4919018491028491048129',
    JWT_BEARER: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.synthetic.signature',
  };

  const sanitizedConfig: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawConfig)) {
    sanitizedConfig[key] = redactSecrets(value);
  }

  const safetyAuditTrail: SafetyAuditEntry[] = [
    {
      ruleId: 'POL-001',
      ruleName: 'Production Isolation',
      outcome: setup.accountType === 'production' ? 'BLOCKED' : 'COMPLIANT',
      note: setup.accountType === 'production' ? 'Strictly blocked sandbox creation in production.' : 'Verified target is non-production.',
    },
    {
      ruleId: 'POL-002',
      ruleName: 'Least Privilege Bounds',
      outcome: 'ENFORCED',
      note: `Granted scopes [${setup.grantedPermissions.join(', ')}]. Stripped wildcards & unapproved roles.`,
    },
    {
      ruleId: 'POL-003',
      ruleName: 'Anti-Duplication Guard',
      outcome: setup.executionResult?.reusedExisting ? 'ENFORCED' : 'COMPLIANT',
      note: setup.executionResult?.reusedExisting ? 'Reused a matching in-memory sandbox record.' : 'No matching simulator record was found.',
    },
    {
      ruleId: 'POL-004',
      ruleName: 'Synthetic Data Requirement',
      outcome: setup.isRealDataBlocked ? 'BLOCKED' : 'COMPLIANT',
      note: 'All seed fixtures are synthetically generated. Real PII ingestion is rejected.',
    },
    {
      ruleId: 'POL-005',
      ruleName: 'Administrator Approval Requirement',
      outcome: setup.approval?.status === 'approved' ? 'COMPLIANT' : 'BLOCKED',
      note: `Execution gated on explicit administrator sign-off by ${setup.approval?.reviewedBy || 'N/A'}.`,
    },
    {
      ruleId: 'POL-006',
      ruleName: 'Secret Redaction Scanner',
      outcome: 'ALERT',
      note: 'Secret scan has not yet run for this report.',
    },
  ];
  const unresolvedIssues = [
    ...(setup.blockedReason ? [setup.blockedReason] : []),
    ...Object.values(setup.stages)
      .filter((stage) => stage.status === 'warning' || stage.status === 'failed')
      .map((stage) => stage.summary)
      .filter((summary): summary is string => Boolean(summary)),
  ];

  const manifestPayload = {
    manifestId: `MNF-${setup.id.replace('REQ-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    requestId: setup.id,
    projectDetails: {
      name: setup.projectName,
      template: setup.template,
      repoUrl: setup.repoDetails.url,
      branch: setup.repoDetails.branch,
      accountType: setup.accountType,
      targetEnvironment: setup.targetEnvironment,
    },
    containerId: setup.executionResult?.sandboxId,
    timestamp: now,
    planVersion: setup.approval?.planVersion || 'v1.0.0',
    grantedPermissions: setup.grantedPermissions,
    setupSteps: setup.plannedActions,
    executedActions: setup.executionResult?.executedActions || [],
    approval: setup.approval ? {
      status: setup.approval.status,
      reviewedBy: setup.approval.reviewedBy,
      reviewedAt: setup.approval.reviewedAt,
      comment: setup.approval.comment,
      signature: setup.approval.signature,
    } : null,
    verificationResult: {
      passed: setup.smokeTest?.status === 'passed',
      statusCode: setup.smokeTest?.responseStatusCode || 200,
      latencyMs: setup.smokeTest?.healthCheckLatencyMs || 16,
      endpoint: setup.smokeTest?.loginEndpoint || 'http://localhost:8080/mock-login',
    },
    unresolvedIssues,
    sanitizedConfig,
    safetyAuditTrail,
  };

  const rawCredentialFields = Object.entries(rawConfig)
    .filter(([key, value]) => scanForSecrets(`${key}=${value}`).length > 0).length;
  const secretScan = {
    scannedAt: now,
    scannedFields: Object.keys(manifestPayload).length,
    redactedFields: rawCredentialFields,
    findingTypes: scanForSecrets(JSON.stringify(manifestPayload)),
    passed: false,
  };
  const pol006 = safetyAuditTrail.find((entry) => entry.ruleId === 'POL-006');
  if (pol006) {
    pol006.outcome = secretScan.findingTypes.length === 0 ? 'COMPLIANT' : 'ALERT';
    pol006.note = secretScan.findingTypes.length === 0
      ? `Scanned the generated report and ${secretScan.scannedFields} fields; ${secretScan.redactedFields} credential-bearing source fields were redacted.`
      : `Secret scan found ${secretScan.findingTypes.length} credential pattern type(s) in the generated report.`;
  }
  const manifestPayloadWithScan = { ...manifestPayload, secretScan };
  secretScan.findingTypes = scanForSecrets(JSON.stringify(manifestPayloadWithScan));
  secretScan.passed = secretScan.findingTypes.length === 0;
  if (pol006) {
    pol006.outcome = secretScan.passed ? 'COMPLIANT' : 'ALERT';
    pol006.note = secretScan.passed
      ? `Automated scan passed across ${secretScan.scannedFields} report fields; ${secretScan.redactedFields} credential-bearing source fields were redacted.`
      : `Automated scan found credential pattern types: ${secretScan.findingTypes.join(', ')}.`;
  }
  const manifestPayloadJson = JSON.stringify(manifestPayloadWithScan, null, 2);
  const sha256Hash = crypto.createHash('sha256').update(manifestPayloadJson).digest('hex');

  const manifest: SetupManifest = {
    manifestId: manifestPayload.manifestId,
    requestId: setup.id,
    sha256Hash,
    generatedAt: now,
    policyComplianceScore: secretScan.passed
      ? 'Automated secret scan passed · simulator policy checks'
      : 'Automated secret scan failed · review findings',
    immutableSignature: 'SIMULATOR_ONLY_NOT_SIGNED',
    planVersion: manifestPayload.planVersion,
    projectDetails: {
      name: setup.projectName,
      template: setup.template,
      repoUrl: setup.repoDetails.url,
      branch: setup.repoDetails.branch,
      accountType: setup.accountType,
      targetEnvironment: setup.targetEnvironment,
    },
    plannedActions: setup.plannedActions,
    executedActions: setup.executionResult?.executedActions || [],
    sanitizedConfig,
    safetyAuditTrail,
    secretScan,
    verificationResult: manifestPayload.verificationResult,
    unresolvedIssues,
    summary: secretScan.passed
      ? `Simulator report generated for ${setup.executionResult.endpointUrl}; the automated secret scan passed. No real environment was modified.`
      : `Simulator report generated for ${setup.executionResult.endpointUrl}; the automated secret scan found credential patterns.`,
    exportJson: manifestPayloadJson,
  };

  setup.manifest = manifest;
  stage8.status = secretScan.passed ? 'passed' : 'failed';
  stage8.completedAt = now;
  stage8.summary = secretScan.passed
    ? `Simulator report generated and automated secret scan passed; SHA-256 content digest ${sha256Hash.slice(0, 16)}...`
    : `Simulator report generated, but automated secret scan failed: ${secretScan.findingTypes.join(', ')}.`;
  stage8.logs.push(
    `[${now.slice(11, 19)}] Secret scanner scanned ${secretScan.scannedFields} report fields; ${secretScan.redactedFields} credential-bearing source fields were redacted.`,
    `[${now.slice(11, 19)}] Secret scan ${secretScan.passed ? 'PASSED' : 'FAILED'}${secretScan.findingTypes.length ? `: ${secretScan.findingTypes.join(', ')}` : '.'}`,
    `[${now.slice(11, 19)}] Computed SHA-256 evidence checksum: ${sha256Hash}`,
    `[${now.slice(11, 19)}] Report record retained in in-memory simulator state.`
  );

  setup.status = secretScan.passed ? 'completed' : 'failed';
  setup.updatedAt = now;

  recordAudit(
    setup.id,
    'Manifest Sealer',
    'admin',
    'MANIFEST_SEALED',
    `Generated simulator report ${manifest.manifestId}; automated secret scan ${secretScan.passed ? 'passed' : 'failed'}.`,
    { secretScanPassed: secretScan.passed, findingTypes: secretScan.findingTypes, scannedFields: secretScan.scannedFields }
  );

  res.json({ message: secretScan.passed ? 'Manifest generated and secret scan passed' : 'Manifest generated but secret scan failed', manifest, setup });
});

// START SERVER AND MOUNT VITE
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Developer Sandbox Bootstrapper] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
