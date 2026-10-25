import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Boxes,
  Terminal,
  RefreshCw,
  Layers,
  Info,
} from 'lucide-react';
import type { SetupRequest, WorkflowStageKey, StageDetail } from '../types/sandbox.js';

interface AgentWorkflowViewProps {
  setup: SetupRequest | null;
  allSetups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
  onExecuteSetup: (setupId: string) => Promise<void>;
  onRunSmokeTest: (setupId: string) => Promise<void>;
  onGenerateManifest: (setupId: string) => Promise<void>;
  currentRole: 'developer' | 'admin';
}

export const AgentWorkflowView: React.FC<AgentWorkflowViewProps> = ({
  setup,
  allSetups,
  onSelectSetup,
  onNavigate,
  onExecuteSetup,
  onRunSmokeTest,
  onGenerateManifest,
  currentRole,
}) => {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);

  if (!setup) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3 font-sans shadow-xs">
        <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
        <h2 className="text-sm font-semibold text-slate-900">No Environment Selected</h2>
        <p className="text-xs text-slate-500">
          Select an environment to view its setup run timeline and verification results.
        </p>
        <button
          onClick={() => onNavigate('new_setup')}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Create Environment
        </button>
      </div>
    );
  }

  const toggleExpand = (key: string) => {
    setExpandedStages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stagesList: { key: WorkflowStageKey; orderStr: string; name: string; desc: string }[] = [
    { key: 'collect_requirements', orderStr: '01', name: 'Configuration Validation', desc: 'Validates template, repository reference, and target account.' },
    { key: 'discover_resources', orderStr: '02', name: 'Environment Inspection', desc: 'Checks repository and detects any active existing sandbox.' },
    { key: 'plan_setup', orderStr: '03', name: 'Setup Plan', desc: 'Prepares ordered operational steps and boundary restrictions.' },
    { key: 'security_validation', orderStr: '04', name: 'Security Validation', desc: 'Applies deterministic policy checks after planning; AI output cannot override these rules.' },
    { key: 'human_approval', orderStr: '05', name: 'Authorization Review', desc: 'Requires explicit administrator sign-off before applying changes.' },
    { key: 'execute_setup', orderStr: '06', name: 'Record Approved Setup', desc: 'Records the approved sandbox allocation in simulator state; no container is started.' },
    { key: 'verify_setup', orderStr: '07', name: 'Environment Verification', desc: 'Runs automated smoke login probe and checks endpoint health.' },
    { key: 'generate_manifest', orderStr: '08', name: 'Setup Report', desc: 'Builds a downloadable report with redacted values and a content digest.' },
  ];

  const handleExecute = async () => {
    try {
      setActionLoading(true);
      await onExecuteSetup(setup.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSmokeTest = async () => {
    try {
      setActionLoading(true);
      await onRunSmokeTest(setup.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManifest = async () => {
    try {
      setActionLoading(true);
      await onGenerateManifest(setup.id);
    } finally {
      setActionLoading(false);
    }
  };

  const getStageStatus = (stage: StageDetail | undefined) => {
    if (!stage) return { label: 'Waiting', dot: 'bg-slate-300', text: 'text-slate-400' };
    switch (stage.status) {
      case 'passed':
        return { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700' };
      case 'in_progress':
        return { label: 'In Progress', dot: 'bg-blue-500', text: 'text-blue-700' };
      case 'warning':
        return { label: 'Warning', dot: 'bg-amber-500', text: 'text-amber-800' };
      case 'failed':
        return { label: 'Failed', dot: 'bg-red-500', text: 'text-red-700' };
      case 'skipped':
        return { label: 'Skipped', dot: 'bg-slate-300', text: 'text-slate-400' };
      case 'pending':
      default:
        return { label: 'Waiting', dot: 'bg-slate-300', text: 'text-slate-400' };
    }
  };

  const isAwaitingApproval = setup.status === 'awaiting_approval';
  const isApproved = setup.status === 'approved';
  const isCompleted = setup.status === 'completed';
  const isBlocked = setup.status === 'blocked';
  const isChangesRequested = setup.status === 'changes_requested';
  const isRejected = setup.status === 'rejected';

  // Calculate completed stages count
  const completedStagesCount = stagesList.filter(
    (st) => setup.stages[st.key]?.status === 'passed'
  ).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Setup Run: {setup.projectName}
            </h1>
            <span className="text-xs font-mono text-slate-500">({setup.id})</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {setup.repoDetails.url.replace(/^https?:\/\//, '')} · branch {setup.repoDetails.branch} · tier {setup.accountType}
          </p>
        </div>

        {/* Environment Selector Dropdown */}
        {allSetups.length > 1 && (
          <div className="flex w-full min-w-0 flex-col items-start gap-1 lg:w-auto lg:flex-row lg:items-center lg:gap-2">
            <label className="text-xs text-slate-400 font-medium">Switch Run:</label>
            <select
              value={setup.id}
              onChange={(e) => {
                const target = allSetups.find((s) => s.id === e.target.value);
                if (target) onSelectSetup(target);
              }}
              className="w-full min-w-0 max-w-[28rem] px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-slate-400 font-mono shadow-xs"
            >
              {allSetups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.projectName} ({s.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-3 text-xs text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="leading-relaxed">
          Simulator mode: workflow actions update in-memory demo state only. No repository is cloned, container is started, or external environment is changed.
        </p>
      </div>

      {/* Responsive 8/4 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Alerts, Ready State, and 8-Stage Timeline */}
        <div className="lg:col-span-8 space-y-5">
          {/* Operational State Alerts */}
          {isBlocked && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>Setup Blocked by Security Policy</span>
              </div>
              <p className="text-xs text-red-700 leading-normal">
                {setup.blockedReason || 'Policy check halted execution. No development environment was provisioned.'}
              </p>
            </div>
          )}

          {isAwaitingApproval && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-900">
                    Awaiting Administrator Authorization
                  </div>
                  <p className="text-xs text-amber-800 leading-normal">
                    Proposed actions and permissions require sign-off before changes can be applied.
                  </p>
                </div>
              </div>

              {currentRole === 'admin' ? (
                <button
                  onClick={() => onNavigate('approval_queue')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Review in Approvals</span>
                </button>
              ) : (
                <div className="text-xs text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded border border-amber-200 shrink-0">
                  Pending Admin Review
                </div>
              )}
            </div>
          )}

          {(isChangesRequested || isRejected) && (
            <div className={`p-4 rounded-xl border space-y-1 ${
              isChangesRequested ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-red-200 bg-red-50 text-red-950'
            }`}>
              <div className="text-xs font-semibold">
                {isChangesRequested ? 'Administrator requested changes' : 'Request rejected'}
              </div>
              <p className="text-xs leading-relaxed">
                {setup.approval?.comment || setup.approval?.rejectionReason || setup.blockedReason || 'No review note was recorded.'}
              </p>
              {setup.approval?.reviewedBy && (
                <p className="text-[11px] opacity-80">Reviewed by {setup.approval.reviewedBy}</p>
              )}
            </div>
          )}

          {/* Environment Ready State */}
          {isCompleted && setup.executionResult && (
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-slate-900 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Simulated Run Complete</h2>
                    <p className="text-xs text-slate-500">The configured verification result returned HTTP 200 OK in simulator state.</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(currentRole === 'admin' ? 'all_manifests' : 'my_manifests')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>View Setup Report</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-emerald-100 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Endpoint</div>
                  <div className="font-mono text-slate-800 font-medium mt-0.5">
                    {setup.executionResult.endpointUrl}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Recorded Port</div>
                  <div className="font-mono text-slate-800 font-medium mt-0.5">
                    {setup.executionResult.containerPort}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Sandbox Record ID</div>
                  <div className="font-mono text-slate-800 font-medium mt-0.5">
                    {setup.executionResult.sandboxId}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Simulator Strategy</div>
                  <div className="font-medium text-emerald-700 mt-0.5">
                    {setup.executionResult.reusedExisting ? 'Reused Record' : 'New Allocation Record'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Operational Timeline (8 Stages) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Operational Run Stages
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {completedStagesCount} / 8 Completed
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
              {stagesList.map((st, idx) => {
                const stageData = setup.stages[st.key];
                const statusInfo = getStageStatus(stageData);
                const isExpanded = !!expandedStages[st.key];

                return (
                  <div key={st.key} className="relative p-4 space-y-2 hover:bg-slate-50/40 transition-colors">
                    {idx < stagesList.length - 1 && (
                      <span aria-hidden="true" className="absolute left-[27px] top-10 bottom-0 w-px bg-slate-200" />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white font-mono text-[9px] text-slate-500">
                          [{st.orderStr}]
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {st.name}
                            </span>
                            <span className="text-slate-300">·</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              <span className={`text-[11px] font-medium ${statusInfo.text}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{st.desc}</p>
                        </div>
                      </div>

                      {stageData && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(st.key)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1 shrink-0"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Stage 5 Admin Sign-Off Inline Callout */}
                    {st.key === 'human_approval' && isAwaitingApproval && (
                      <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="text-amber-900">
                          <span className="font-semibold">Review Gate:</span> Administrator must review proposed scope and sign off.
                        </div>
                        {currentRole === 'admin' ? (
                          <button
                            onClick={() => onNavigate('approval_queue')}
                            className="px-3 py-1 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Open Approvals</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Waiting for Elena Vance
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expanded Technical Details */}
                    {isExpanded && stageData && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                        {stageData.summary && (
                          <div className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200/60 font-mono text-[11px]">
                            {stageData.summary}
                          </div>
                        )}

                        {stageData.logs && stageData.logs.length > 0 && (
                          <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto max-h-48 overflow-y-auto">
                            {stageData.logs.map((log, lIdx) => (
                              <div key={lIdx} className="leading-relaxed">
                                {log}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Sticky Environment Summary & Actions Panel */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Environment Specs Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900">
                Environment Specification
              </h3>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {setup.projectName}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Request ID</span>
                <span className="font-mono font-medium text-slate-800">{setup.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Template</span>
                <span className="font-medium text-slate-800">{setup.template}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Target Tier</span>
                <span className="font-mono font-medium text-slate-800">{setup.accountType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Branch</span>
                <span className="font-mono text-slate-800">{setup.repoDetails.branch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Submitted By</span>
                <span className="font-medium text-slate-800">{setup.submittedBy.name}</span>
              </div>
            </div>

            {/* Run Operations Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Run Operations
              </div>

              {isApproved && (
                <button
                  disabled={actionLoading}
                  onClick={handleExecute}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Environment Setup</span>
                </button>
              )}

              {setup.executionResult && (
                <div className="space-y-2">
                  <button
                    disabled={actionLoading}
                    onClick={handleSmokeTest}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Verification Smoke Test</span>
                  </button>

                  {setup.smokeTest && !setup.manifest && (
                    <button
                      disabled={actionLoading}
                      onClick={handleManifest}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate Setup Report</span>
                    </button>
                  )}

                  {setup.manifest && (
                    <button
                      onClick={() => onNavigate(currentRole === 'admin' ? 'all_manifests' : 'my_manifests')}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Inspect Setup Report</span>
                    </button>
                  )}
                </div>
              )}

              {isAwaitingApproval && currentRole === 'admin' && (
                <button
                  onClick={() => onNavigate('approval_queue')}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Authorize in Approvals</span>
                </button>
              )}
            </div>
          </div>

          {/* Policy checks summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Policy Compliance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The simulator applies production isolation and least-privilege checks, then masks credential-like values in generated reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
