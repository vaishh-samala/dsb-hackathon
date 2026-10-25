/**
 * Sandbox Studio - Type Definitions
 */

export type AccountType = 'development' | 'staging' | 'qa' | 'production';

export type UserRole = 'developer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type SetupStatus =
  | 'draft'
  | 'planning'
  | 'validating'
  | 'awaiting_approval'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'completed'
  | 'blocked'
  | 'failed';

export type WorkflowStageKey =
  | 'collect_requirements'
  | 'plan_setup'
  | 'discover_resources'
  | 'security_validation'
  | 'human_approval'
  | 'execute_setup'
  | 'verify_setup'
  | 'generate_manifest';

export type WorkflowStageStatus = 'pending' | 'in_progress' | 'passed' | 'warning' | 'failed' | 'skipped';

export interface StageDetail {
  key: WorkflowStageKey;
  name: string;
  order: number;
  status: WorkflowStageStatus;
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  logs: string[];
}

export interface PlannedAction {
  order: number;
  action: string;
  category: 'runtime' | 'network' | 'filesystem' | 'database' | 'security';
  description: string;
  commandPreview?: string;
  expectedOutcome: string;
}

export interface ExecutedAction {
  order: number;
  action: string;
  executedAt: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  outputSnippet?: string;
}

export interface RiskItem {
  severity: 'low' | 'medium' | 'high' | 'critical';
  code: string;
  title: string;
  description: string;
}

export interface ExpectedChange {
  type: 'env' | 'container' | 'database' | 'network' | 'filesystem';
  title: string;
  description: string;
  preview: string;
}

export interface ApprovalPayload {
  required: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  planVersion: string;
  proposedAction: string;
  targetEnvironment: string;
  isProductionEnvironment: boolean;
  permissionsComparison: {
    requested: string[];
    granted: string[];
    stripped: string[];
  };
  risks: RiskItem[];
  expectedChanges: ExpectedChange[];
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  comment?: string;
  rejectionReason?: string;
  signature?: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface ExecutionResult {
  sandboxId: string;
  reusedExisting: boolean;
  reuseReason?: string;
  containerPort: number;
  endpointUrl: string;
  allocatedCpu: string;
  allocatedMemory: string;
  syntheticSeedRows: number;
  executedActions: ExecutedAction[];
  executionLogs: ExecutionLogEntry[];
  executionDurationMs: number;
}

export interface SmokeTestCheck {
  name: string;
  passed: boolean;
  latencyMs: number;
  details: string;
}

export interface SmokeTestResult {
  status: 'passed' | 'failed' | 'pending';
  testedAt?: string;
  loginEndpoint: string;
  syntheticUser: {
    email: string;
    role: string;
    tokenPreview: string; // strictly masked: sbx_jwt_***
  };
  healthCheckLatencyMs: number;
  responseStatusCode: number;
  checks: SmokeTestCheck[];
  evidenceSnippet: string;
}

export interface SafetyAuditEntry {
  ruleId: string;
  ruleName: string;
  outcome: 'ENFORCED' | 'ALERT' | 'BLOCKED' | 'COMPLIANT';
  note: string;
}

export interface AuditLogEvent {
  id: string;
  requestId: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: 'CREATED' | 'SECURITY_CHECK' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'EXECUTED' | 'VERIFIED' | 'MANIFEST_SEALED' | 'BLOCKED';
  summary: string;
  details?: Record<string, any>;
}

export interface SetupReviewEvent {
  decision: 'approved' | 'rejected' | 'changes_requested';
  reviewerName: string;
  comment: string;
  timestamp: string;
}

export interface SetupManifest {
  manifestId: string;
  requestId: string;
  sha256Hash: string;
  generatedAt: string;
  policyComplianceScore: string;
  immutableSignature: string;
  planVersion: string;
  projectDetails: {
    name: string;
    template: string;
    repoUrl: string;
    branch: string;
    accountType: AccountType;
    targetEnvironment: string;
  };
  plannedActions: PlannedAction[];
  executedActions: ExecutedAction[];
  sanitizedConfig: Record<string, string>;
  safetyAuditTrail: SafetyAuditEntry[];
  verificationResult: {
    passed: boolean;
    statusCode: number;
    latencyMs: number;
    endpoint: string;
  };
  unresolvedIssues: string[];
  summary: string;
  exportJson: string;
}

export interface SetupRequest {
  id: string;
  projectName: string;
  template: 'nextjs-saas' | 'node-microservice' | 'python-fastapi' | 'go-worker' | 'custom';
  repoDetails: {
    url: string;
    branch: string;
    visibility: 'private' | 'internal' | 'public';
    detectedCommitHash?: string;
  };
  accountType: AccountType;
  targetEnvironment: string;
  isProductionTarget: boolean;
  sandboxType?: 'isolated-container' | 'microservice-pod' | 'ephemeral-vm' | 'serverless-mock';
  developmentPurpose?: 'feature_development' | 'bugfix_repro' | 'integration_testing' | 'experimentation';
  requestedTools?: string[];
  requestedPermissions: string[];
  grantedPermissions: string[];
  sampleDataRequirement: 'synthetic_customers' | 'anonymized_telemetry' | 'seed_fixtures' | 'synthetic_financial' | 'real_production_dump';
  isRealDataBlocked: boolean;
  submittedBy: UserProfile;
  createdAt: string;
  updatedAt: string;
  status: SetupStatus;
  activeStage: WorkflowStageKey;
  stages: Record<WorkflowStageKey, StageDetail>;
  plannedActions: PlannedAction[];
  approval?: ApprovalPayload;
  reviewHistory?: SetupReviewEvent[];
  executionResult?: ExecutionResult;
  smokeTest?: SmokeTestResult;
  manifest?: SetupManifest;
  blockedReason?: string;
  aiPlanMetadata?: {
    model: string;
    isGeminiGenerated: boolean;
    reasoningSummary?: string;
    generatedAt: string;
    fallbackReason?: string;
  };
  n8nWorkflow?: {
    executionId: string;
    status: 'triggered' | 'running' | 'completed' | 'simulated';
    triggeredAt: string;
  };
}

export interface TestCaseScenario {
  id: 'TC1' | 'TC2' | 'TC3' | 'TC4';
  title: string;
  summary: string;
  inputDescription: string;
  expectedOutcome: string;
  actualOutcome?: string;
  passStatus?: 'PASS' | 'FAIL' | 'PENDING';
  safetyRule: string;
  evidenceSnippet?: string;
  presetData: Partial<SetupRequest>;
}
