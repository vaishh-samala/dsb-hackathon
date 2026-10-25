import React from 'react';
import { Check, Circle, Clock3, LoaderCircle, OctagonX } from 'lucide-react';
import type { AuditLogEvent, SetupRequest, WorkflowStageKey, WorkflowStageStatus } from '../types/sandbox.js';

export type ArchitectureNodeId =
  | 'dashboard'
  | 'backend'
  | 'input_validation'
  | 'ai_setup_planner'
  | 'repository_sandbox_adapters'
  | 'policy_approval_gate'
  | 'provisioning_adapter'
  | 'record_decision'
  | 'sandbox_registry'
  | 'smoke_login_verification'
  | 'audit_evidence_store'
  | 'setup_manifest_test_lab';

type Tone = 'green' | 'violet' | 'amber' | 'red' | 'gray';
type State = { label: string; tone: Tone; icon: typeof Check };

export interface ArchitectureNode {
  id: ArchitectureNodeId;
  name: string;
  description: string;
  stage: WorkflowStageKey;
  inputs: string;
  outputs: string;
  upstream: ArchitectureNodeId[];
  downstream: ArchitectureNodeId[];
  implementation: string;
}

export const architectureNodes: ArchitectureNode[] = [
  {
    id: 'dashboard',
    name: 'Next.js Dashboard',
    description: 'Developer interface for submitting a sandbox request and inspecting its execution graph.',
    stage: 'collect_requirements',
    inputs: 'Environment, repository URL, branch, target tier, permissions.',
    outputs: 'A submitted setup request.',
    upstream: [],
    downstream: ['backend'],
    implementation: 'Dashboard is implemented in React 19 + Vite, not Next.js.',
  },
  {
    id: 'backend',
    name: 'FastAPI Backend',
    description: 'Receives requests and coordinates the setup simulator, policy review, and result endpoints.',
    stage: 'collect_requirements',
    inputs: 'Authenticated demo session and submitted request.',
    outputs: 'An in-memory setup record and workflow state.',
    upstream: ['dashboard'],
    downstream: ['input_validation'],
    implementation: 'Backend is Express 4, not FastAPI. Data is in memory.',
  },
  {
    id: 'input_validation',
    name: 'Input Validation',
    description: 'Checks required request fields and supported configuration values.',
    stage: 'collect_requirements',
    inputs: 'Request fields and selected environment template.',
    outputs: 'Accepted request details, or validation errors.',
    upstream: ['backend'],
    downstream: ['ai_setup_planner'],
    implementation: 'Implemented by the Express request handlers.',
  },
  {
    id: 'ai_setup_planner',
    name: 'AI Setup Planner',
    description: 'Builds proposed setup actions with Gemini when configured, otherwise uses the deterministic planner.',
    stage: 'plan_setup',
    inputs: 'Validated environment and requested permissions.',
    outputs: 'A plan and optional planner metadata.',
    upstream: ['input_validation'],
    downstream: ['repository_sandbox_adapters'],
    implementation: 'Gemini planning is optional; deterministic fallback is available.',
  },
  {
    id: 'repository_sandbox_adapters',
    name: 'Repository and Sandbox Adapters',
    description: 'Represents repository and sandbox discovery in the submitted workflow.',
    stage: 'discover_resources',
    inputs: 'Repository URL, branch, and planned actions.',
    outputs: 'Simulator discovery result only.',
    upstream: ['ai_setup_planner'],
    downstream: ['policy_approval_gate'],
    implementation: 'Simulated. No repository is cloned or remotely validated; no sandbox adapter is connected.',
  },
  {
    id: 'policy_approval_gate',
    name: 'Policy and Approval Gate',
    description: 'Applies deterministic policy checks and pauses for an authorized administrator decision.',
    stage: 'human_approval',
    inputs: 'Requested scopes, policy evaluation, and proposed plan.',
    outputs: 'Approved, blocked, rejected, or pending review state.',
    upstream: ['repository_sandbox_adapters'],
    downstream: ['provisioning_adapter', 'record_decision'],
    implementation: 'Policy and approval state are simulator records; admin decisions are enforced by the API.',
  },
  {
    id: 'provisioning_adapter',
    name: 'Provisioning Adapter',
    description: 'Records the simulated setup execution after approval; it does not start a runtime.',
    stage: 'execute_setup',
    inputs: 'Approved request and plan.',
    outputs: 'Synthetic allocation metadata when execution is recorded.',
    upstream: ['policy_approval_gate'],
    downstream: ['sandbox_registry', 'smoke_login_verification'],
    implementation: 'Simulated. No container, VM, or external environment is provisioned.',
  },
  {
    id: 'record_decision',
    name: 'Record Decision',
    description: 'Shows pending, blocked, rejected, or recorded review outcomes on the non-provisioning path.',
    stage: 'human_approval',
    inputs: 'Policy outcome or administrator review decision.',
    outputs: 'Decision details and corresponding audit event when one is recorded.',
    upstream: ['policy_approval_gate'],
    downstream: ['audit_evidence_store'],
    implementation: 'Uses the request approval state and review history; no decision is fabricated while pending.',
  },
  {
    id: 'sandbox_registry',
    name: 'Sandbox Registry',
    description: 'Displays allocation metadata recorded by the simulator after an approved execution.',
    stage: 'execute_setup',
    inputs: 'Simulated provisioning result.',
    outputs: 'Sandbox ID, endpoint, and resource metadata when present.',
    upstream: ['provisioning_adapter'],
    downstream: ['audit_evidence_store'],
    implementation: 'In-memory simulator record, not a live sandbox registry.',
  },
  {
    id: 'smoke_login_verification',
    name: 'Smoke Login Verification',
    description: 'Shows the configured synthetic smoke-test result for this setup.',
    stage: 'verify_setup',
    inputs: 'Recorded execution and synthetic test configuration.',
    outputs: 'Verification status, response code, checks, and evidence when present.',
    upstream: ['provisioning_adapter'],
    downstream: ['audit_evidence_store'],
    implementation: 'Simulated verification; it does not authenticate against a real service.',
  },
  {
    id: 'audit_evidence_store',
    name: 'Audit and Evidence Store',
    description: 'Collects the actual audit events and evidence attached to this setup record.',
    stage: 'generate_manifest',
    inputs: 'Recorded approval/denial, execution, verification, and report events.',
    outputs: 'In-memory audit events and evidence available to the report.',
    upstream: ['record_decision', 'sandbox_registry', 'smoke_login_verification'],
    downstream: ['setup_manifest_test_lab'],
    implementation: 'In-memory audit log; records reset when the server restarts.',
  },
  {
    id: 'setup_manifest_test_lab',
    name: 'Setup Manifest and Test Lab',
    description: 'Shows the generated report and the available verification or scripted test results.',
    stage: 'generate_manifest',
    inputs: 'Audit history, setup details, and verification result.',
    outputs: 'A redacted simulator report and its content digest when generated.',
    upstream: ['audit_evidence_store'],
    downstream: [],
    implementation: 'Manifest generation and test scenarios are simulator features, not immutable production evidence.',
  },
];

const nodeById = Object.fromEntries(architectureNodes.map((node) => [node.id, node])) as Record<ArchitectureNodeId, ArchitectureNode>;

export const workflowStages: { key: WorkflowStageKey; name: string; description: string }[] = [
  { key: 'collect_requirements', name: 'Request received', description: 'Collect and validate the submitted environment settings.' },
  { key: 'discover_resources', name: 'Inspect repository', description: 'Check the repository reference and matching sandbox records.' },
  { key: 'plan_setup', name: 'Prepare setup plan', description: 'Generate a proposed plan with the AI planner or deterministic fallback.' },
  { key: 'security_validation', name: 'Validate security', description: 'Apply deterministic policy checks to the request and proposed permissions.' },
  { key: 'human_approval', name: 'Administrator approval', description: 'Pause here until an administrator approves, rejects, or requests changes.' },
  { key: 'execute_setup', name: 'Record setup execution', description: 'Record the simulated allocation after approval; no container is started.' },
  { key: 'verify_setup', name: 'Verify setup', description: 'Return the configured smoke-test result from the simulator.' },
  { key: 'generate_manifest', name: 'Generate report', description: 'Create a redacted report record with a SHA-256 content digest.' },
];

function stateForStage(status: WorkflowStageStatus): State {
  if (status === 'passed') return { label: 'Completed', tone: 'green', icon: Check };
  if (status === 'in_progress') return { label: 'Running', tone: 'violet', icon: LoaderCircle };
  if (status === 'warning') return { label: 'Completed with warning', tone: 'amber', icon: Clock3 };
  if (status === 'failed') return { label: 'Failed', tone: 'red', icon: OctagonX };
  if (status === 'skipped') return { label: 'Skipped', tone: 'gray', icon: Circle };
  return { label: 'Queued', tone: 'gray', icon: Circle };
}

function gateState(setup: SetupRequest): State {
  if (setup.status === 'awaiting_approval') return { label: 'Pending approval', tone: 'amber', icon: Clock3 };
  if (setup.status === 'changes_requested') return { label: 'Changes requested', tone: 'amber', icon: Clock3 };
  if (setup.status === 'rejected') return { label: 'Rejected', tone: 'red', icon: OctagonX };
  if (setup.status === 'blocked') return { label: 'Blocked', tone: 'red', icon: OctagonX };
  if (setup.status === 'failed') return { label: 'Failed', tone: 'red', icon: OctagonX };
  if (setup.stages.human_approval.status === 'passed') return { label: 'Approved', tone: 'green', icon: Check };
  if (setup.stages.security_validation.status === 'failed') return { label: 'Blocked', tone: 'red', icon: OctagonX };
  return stateForStage(setup.stages.security_validation.status);
}

export function getArchitectureNodeState(
  setup: SetupRequest,
  id: ArchitectureNodeId,
  auditLogs: AuditLogEvent[],
): State {
  const stage = setup.stages[nodeById[id].stage];
  if (id === 'policy_approval_gate') return gateState(setup);
  if (id === 'record_decision') {
    if (setup.status === 'blocked') return { label: 'Blocked', tone: 'red', icon: OctagonX };
    if (setup.status === 'rejected') return { label: 'Rejected', tone: 'red', icon: OctagonX };
    if (setup.status === 'awaiting_approval' || setup.status === 'changes_requested') {
      return { label: 'Pending decision', tone: 'amber', icon: Clock3 };
    }
    return { label: 'Skipped', tone: 'gray', icon: Circle };
  }
  if (id === 'sandbox_registry') {
    if (!setup.executionResult) return setup.status === 'rejected' || setup.status === 'blocked'
      ? { label: 'Skipped', tone: 'gray', icon: Circle }
      : stateForStage(stage.status);
    return { label: 'Recorded (simulated)', tone: 'green', icon: Check };
  }
  if (id === 'smoke_login_verification' && setup.smokeTest) {
    return setup.smokeTest.status === 'passed'
      ? { label: 'Passed (simulated)', tone: 'green', icon: Check }
      : setup.smokeTest.status === 'failed'
        ? { label: 'Failed', tone: 'red', icon: OctagonX }
        : { label: 'Pending', tone: 'amber', icon: Clock3 };
  }
  if (id === 'audit_evidence_store') {
    return auditLogs.some((event) => event.requestId === setup.id)
      ? { label: 'Evidence recorded', tone: 'green', icon: Check }
      : { label: 'No audit events', tone: 'gray', icon: Circle };
  }
  if (id === 'setup_manifest_test_lab') {
    if (setup.manifest?.secretScan?.passed) return { label: 'Manifest · scan passed', tone: 'green', icon: Check };
    if (setup.manifest?.secretScan && !setup.manifest.secretScan.passed) return { label: 'Secret scan failed', tone: 'red', icon: OctagonX };
    if (setup.manifest) return { label: 'Manifest · unscanned', tone: 'amber', icon: Clock3 };
    if (setup.smokeTest) return { label: 'Verification available', tone: 'violet', icon: Clock3 };
    if (setup.status === 'blocked' || setup.status === 'rejected') return { label: 'Skipped', tone: 'gray', icon: Circle };
    return { label: 'Queued', tone: 'gray', icon: Circle };
  }
  if (id === 'backend' || id === 'input_validation') {
    return stateForStage(setup.stages.collect_requirements.status);
  }
  return stateForStage(stage.status);
}

const tones: Record<Tone, { node: string; icon: string; label: string; dot: string }> = {
  green: {
    node: 'border-emerald-300/25 bg-[#171522] text-slate-100',
    icon: 'border-emerald-300/30 bg-emerald-300/[0.07] text-emerald-200',
    label: 'text-emerald-200/85',
    dot: 'bg-emerald-300/80',
  },
  violet: {
    node: 'border-violet-300/50 bg-[#1d192d] text-white shadow-[0_0_22px_rgba(139,112,198,0.13)]',
    icon: 'border-violet-300/45 bg-violet-300/[0.09] text-violet-200',
    label: 'text-violet-200/90',
    dot: 'bg-violet-300/85',
  },
  amber: {
    node: 'border-amber-300/40 bg-[#1e1a2a] text-slate-100 shadow-[0_0_18px_rgba(216,181,99,0.07)]',
    icon: 'border-amber-300/35 bg-amber-300/[0.07] text-amber-200',
    label: 'text-amber-200/90',
    dot: 'bg-amber-300/85',
  },
  red: {
    node: 'border-red-300/35 bg-[#211822] text-slate-100',
    icon: 'border-red-300/35 bg-red-300/[0.07] text-red-200',
    label: 'text-red-200/90',
    dot: 'bg-red-300/85',
  },
  gray: {
    node: 'border-violet-200/10 bg-[#151321] text-slate-300',
    icon: 'border-violet-200/10 bg-violet-100/[0.035] text-slate-500',
    label: 'text-slate-500',
    dot: 'bg-slate-600',
  },
};

const positions: Record<ArchitectureNodeId, { x: number; y: number }> = {
  dashboard: { x: 277, y: 18 },
  backend: { x: 277, y: 123 },
  input_validation: { x: 277, y: 228 },
  ai_setup_planner: { x: 277, y: 333 },
  repository_sandbox_adapters: { x: 277, y: 438 },
  policy_approval_gate: { x: 277, y: 543 },
  provisioning_adapter: { x: 70, y: 690 },
  record_decision: { x: 485, y: 690 },
  sandbox_registry: { x: 70, y: 835 },
  smoke_login_verification: { x: 485, y: 835 },
  audit_evidence_store: { x: 277, y: 980 },
  setup_manifest_test_lab: { x: 277, y: 1085 },
};

interface WorkflowDiagramProps {
  setup: SetupRequest;
  auditLogs: AuditLogEvent[];
  selectedNode: ArchitectureNodeId;
  onSelectNode: (id: ArchitectureNodeId) => void;
}

const connections: { from: ArchitectureNodeId; to: ArchitectureNodeId; path: string; label?: string; labelX?: number; labelY?: number }[] = [
  { from: 'dashboard', to: 'backend', path: 'M380 96 L380 123' },
  { from: 'backend', to: 'input_validation', path: 'M380 201 L380 228' },
  { from: 'input_validation', to: 'ai_setup_planner', path: 'M380 306 L380 333' },
  { from: 'ai_setup_planner', to: 'repository_sandbox_adapters', path: 'M380 411 L380 438' },
  { from: 'repository_sandbox_adapters', to: 'policy_approval_gate', path: 'M380 516 L380 543' },
  { from: 'policy_approval_gate', to: 'provisioning_adapter', path: 'M380 621 C380 658 172 650 172 690', label: 'APPROVED', labelX: 267, labelY: 653 },
  { from: 'policy_approval_gate', to: 'record_decision', path: 'M380 621 C380 658 587 650 587 690', label: 'BLOCKED / PENDING', labelX: 487, labelY: 653 },
  { from: 'provisioning_adapter', to: 'sandbox_registry', path: 'M172 768 L172 835' },
  { from: 'provisioning_adapter', to: 'smoke_login_verification', path: 'M172 768 C172 807 587 794 587 835' },
  { from: 'record_decision', to: 'audit_evidence_store', path: 'M587 768 C587 894 380 886 380 980' },
  { from: 'sandbox_registry', to: 'audit_evidence_store', path: 'M172 913 C172 952 380 940 380 980' },
  { from: 'smoke_login_verification', to: 'audit_evidence_store', path: 'M587 913 C587 952 380 940 380 980' },
  { from: 'audit_evidence_store', to: 'setup_manifest_test_lab', path: 'M380 1058 L380 1085' },
];

function edgeTone(setup: SetupRequest, from: ArchitectureNodeId, to: ArchitectureNodeId, auditLogs: AuditLogEvent[]) {
  if (from === 'policy_approval_gate' && to === 'provisioning_adapter') {
    return setup.stages.human_approval.status === 'passed' ? 'complete' : 'pending';
  }
  if (from === 'policy_approval_gate' && to === 'record_decision') {
    return ['awaiting_approval', 'changes_requested'].includes(setup.status) ? 'approval'
      : setup.status === 'blocked' || setup.status === 'rejected' ? 'failed' : 'pending';
  }
  if (from === 'record_decision' && to === 'audit_evidence_store') {
    const recordedDecision = auditLogs.some((event) =>
      event.requestId === setup.id && ['BLOCKED', 'REJECTED', 'CHANGES_REQUESTED', 'APPROVED'].includes(event.action),
    );
    return recordedDecision ? 'complete' : 'pending';
  }
  const fromState = getArchitectureNodeState(setup, from, auditLogs);
  const toState = getArchitectureNodeState(setup, to, auditLogs);
  if (fromState.tone === 'red') return 'failed';
  if (toState.tone === 'violet') return 'active';
  if (fromState.tone === 'green' && ['sandbox_registry', 'smoke_login_verification', 'audit_evidence_store', 'setup_manifest_test_lab'].includes(to)) return 'complete';
  if (fromState.tone === 'green' && ['green', 'amber'].includes(toState.tone)) return 'complete';
  return 'pending';
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ setup, auditLogs, selectedNode, onSelectNode }) => (
  <div className="architecture-diagram relative mx-auto h-[1175px] w-[760px]" aria-label={`Sandbox Studio architecture for ${setup.projectName}`}>
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 1175" role="img" aria-label="Directional architecture connections">
      <defs>
        <marker id="architecture-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      {connections.map((connection) => {
        const tone = edgeTone(setup, connection.from, connection.to, auditLogs);
        const stroke = tone === 'complete' ? '#6ee7b7' : tone === 'approval' ? '#fcd34d' : tone === 'failed' ? '#f87171' : tone === 'active' ? '#c4b5fd' : '#716b89';
        return (
          <g key={`${connection.from}-${connection.to}`} className={tone === 'active' ? 'architecture-edge-running' : undefined}>
            <path d={connection.path} fill="none" stroke={stroke} strokeWidth="1.5" markerEnd="url(#architecture-arrow)" opacity={tone === 'pending' ? 0.55 : 0.9} />
            {connection.label && (
              <text x={connection.labelX} y={connection.labelY} textAnchor="middle" fill={tone === 'approval' || tone === 'failed' ? '#fde68a' : '#a7f3d0'} className="architecture-edge-label">
                {connection.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
    {architectureNodes.map((node, index) => {
      const state = getArchitectureNodeState(setup, node.id, auditLogs);
      const tone = tones[state.tone];
      const Icon = state.icon;
      const selected = selectedNode === node.id;
      const active = setup.stages[node.stage].status === 'in_progress'
        || (node.id === 'policy_approval_gate' && setup.status === 'awaiting_approval');
      return (
        <button
          key={node.id}
          type="button"
          aria-pressed={selected}
          aria-current={active ? 'step' : undefined}
          aria-label={`${node.name}: ${state.label}. ${node.implementation}`}
          title={node.description}
          data-tone={state.tone}
          onClick={() => onSelectNode(node.id)}
          style={{ left: positions[node.id].x, top: positions[node.id].y }}
          className={`architecture-node absolute z-[1] flex h-[78px] w-[206px] items-center gap-2.5 rounded-xl border px-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-violet-300 focus-visible:outline-offset-2 ${selected ? 'border-violet-300/55 bg-[#211c32] ring-1 ring-violet-300/40 shadow-[0_0_24px_rgba(139,112,198,0.14)]' : tone.node} ${active && state.tone === 'violet' ? 'workflow-node-running' : ''} ${active && state.tone === 'amber' ? 'architecture-node-awaiting' : ''}`}
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${tone.icon}`}>
            <Icon className={`h-3.5 w-3.5 ${state.label === 'Running' ? 'workflow-spin' : ''}`} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold leading-snug tracking-tight">{node.name}</span>
            <span className="mt-0.5 block truncate font-mono text-[7px] leading-tight text-violet-100/45">
              {node.id === 'dashboard' ? 'React/Vite · not Next.js'
                : node.id === 'backend' ? 'Express API · not FastAPI'
                  : node.implementation.startsWith('Simulated') || node.implementation.startsWith('In-memory')
                    ? 'SIMULATED / IN-MEMORY'
                    : 'SANDBOX STUDIO'}
            </span>
            <span className={`mt-1 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.08em] ${tone.label}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot} ${state.label === 'Running' ? 'workflow-pulse' : ''}`} />
              <span className="truncate">{state.label}</span>
            </span>
          </span>
          <span className="shrink-0 font-mono text-[9px] text-violet-200/35">{String(index + 1).padStart(2, '0')}</span>
        </button>
      );
    })}
  </div>
);
