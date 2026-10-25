import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Play,
  FileText,
  UserCheck,
  ShieldAlert,
  Boxes,
  RefreshCw,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { AuditLogEvent, SetupRequest, WorkflowStageKey } from '../types/sandbox.js';
import {
  architectureNodes,
  getArchitectureNodeState,
  WorkflowDiagram,
  workflowStages,
  type ArchitectureNodeId,
} from './WorkflowDiagram.js';

interface AgentWorkflowViewProps {
  setup: SetupRequest | null;
  requestedSetupId?: string | null;
  allSetups: SetupRequest[];
  auditLogs: AuditLogEvent[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
  onExecuteSetup: (setupId: string) => Promise<void>;
  onRunSmokeTest: (setupId: string) => Promise<void>;
  onGenerateManifest: (setupId: string) => Promise<void>;
  currentRole: 'developer' | 'admin';
}

export const AgentWorkflowView: React.FC<AgentWorkflowViewProps> = ({
  setup,
  requestedSetupId,
  allSetups,
  auditLogs,
  onSelectSetup,
  onNavigate,
  onExecuteSetup,
  onRunSmokeTest,
  onGenerateManifest,
  currentRole,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<ArchitectureNodeId>('dashboard');
  const [canvasZoom, setCanvasZoom] = useState(0.82);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!setup) return;
    const activeNode = architectureNodes.find((node) => node.stage === setup.activeStage);
    if (activeNode) setSelectedNodeId(activeNode.id);
  }, [setup?.id, setup?.activeStage]);

  useEffect(() => {
    const centerMainPath = () => {
      const canvas = canvasRef.current;
      const viewport = viewportRef.current;
      if (!canvas || !viewport) return;
      viewport.scrollLeft = canvas.clientWidth < 768
        ? Math.max(0, 380 * canvasZoom - viewport.clientWidth / 2)
        : 0;
    };
    centerMainPath();
    window.addEventListener('resize', centerMainPath);
    return () => window.removeEventListener('resize', centerMainPath);
  }, [canvasZoom, setup?.id]);

  if (!setup) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3 font-sans shadow-xs">
        <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
        <h2 className="text-sm font-semibold text-slate-900">
          {requestedSetupId ? 'Environment Not Found' : 'No Environment Selected'}
        </h2>
        <p className="text-xs text-slate-500">
          {requestedSetupId
            ? `No environment with ID ${requestedSetupId} is available in the current simulator session.`
            : 'Select an environment to view its setup workflow and verification results.'}
        </p>
        <button
          onClick={() => onNavigate(requestedSetupId ? 'all_setups' : 'new_setup')}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {requestedSetupId ? 'Back to environments' : 'Create Environment'}
        </button>
      </div>
    );
  }

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

  const isAwaitingApproval = setup.status === 'awaiting_approval';
  const isCompleted = setup.status === 'completed';
  const isBlocked = setup.status === 'blocked';
  const isChangesRequested = setup.status === 'changes_requested';
  const isRejected = setup.status === 'rejected';

  const selectedArchitectureNode = architectureNodes.find((node) => node.id === selectedNodeId) || architectureNodes[0];
  const selectedStage = workflowStages.find((stage) => stage.key === selectedArchitectureNode.stage) || workflowStages[0];
  const selectedStageData = setup.stages[selectedStage.key];
  const selectedNodeStatus = getArchitectureNodeState(setup, selectedArchitectureNode.id, auditLogs);
  const upstreamNames = selectedArchitectureNode.upstream.map((id) => architectureNodes.find((node) => node.id === id)?.name).filter(Boolean);
  const downstreamNames = selectedArchitectureNode.downstream.map((id) => architectureNodes.find((node) => node.id === id)?.name).filter(Boolean);
  const selectedStageTone = {
    green: 'border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200',
    violet: 'border-violet-300/35 bg-violet-300/[0.08] text-violet-100',
    amber: 'border-amber-300/35 bg-amber-300/[0.08] text-amber-100',
    red: 'border-red-300/35 bg-red-300/[0.08] text-red-200',
    gray: 'border-violet-200/15 bg-violet-100/[0.04] text-slate-400',
  }[selectedNodeStatus.tone];
  const fitWorkflow = () => {
    const canvas = canvasRef.current;
    const graph = graphRef.current;
    if (!canvas || !graph) return;

    const widthScale = (canvas.clientWidth - 48) / graph.offsetWidth;
    const heightScale = canvas.clientWidth >= 768
      ? (canvas.clientHeight - 88) / graph.offsetHeight
      : canvasZoom;
    setCanvasZoom(canvas.clientWidth >= 768
      ? Math.max(0.55, Math.min(1.05, widthScale, heightScale))
      : canvasZoom);
    setCanvasOffset({ x: 0, y: 0 });
    if (canvas.clientWidth < 768 && viewportRef.current) {
      viewportRef.current.scrollLeft = Math.max(0, 380 * canvasZoom - viewportRef.current.clientWidth / 2);
    }
  };

  return (
    <div className="workflow-experience -mx-4 -my-6 min-h-[calc(100vh-3.5rem)] px-4 py-5 font-sans sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Page Header */}
      <div className="mx-auto mb-5 flex w-full max-w-[1500px] flex-col justify-between gap-4 border-b border-violet-200/10 pb-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {setup.projectName}
            </h1>
            <span className="shrink-0 rounded border border-violet-200/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-violet-200/60">{setup.id}</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-violet-100/45 sm:text-[11px]">
            {setup.repoDetails.url.replace(/^https?:\/\//, '')} <span className="text-violet-200/20">/</span> {setup.repoDetails.branch} <span className="text-violet-200/20">/</span> {setup.accountType}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${isAwaitingApproval ? 'border-amber-300/30 bg-amber-300/[0.07] text-amber-200' : isRejected || isBlocked ? 'border-red-300/30 bg-red-300/[0.07] text-red-200' : isCompleted ? 'border-emerald-300/25 bg-emerald-300/[0.06] text-emerald-200' : 'border-violet-300/25 bg-violet-300/[0.06] text-violet-100'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {setup.status.replaceAll('_', ' ')}
          </span>
          {allSetups.length > 1 && (
            <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-violet-100/45">
              Environment
              <select
                value={setup.id}
                onChange={(e) => {
                  const target = allSetups.find((s) => s.id === e.target.value);
                  if (target) onSelectSetup(target);
                }}
                className="max-w-[15rem] rounded-lg border border-violet-200/15 bg-[#17142a] px-3 py-2 text-[11px] normal-case tracking-normal text-violet-50 focus:border-violet-300/50 focus:outline-none"
              >
                {allSetups.map((s) => (
                  <option key={s.id} value={s.id}>{s.projectName} ({s.status.replaceAll('_', ' ')})</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="mx-auto mb-4 flex max-w-[1500px] items-start gap-2 rounded-lg border border-violet-300/10 bg-violet-300/[0.035] px-3 py-2.5 text-[10px] leading-relaxed text-violet-100/50 sm:text-[11px]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300/60" />
        <p>
          Simulator mode: state is held in memory while the server runs. No repository is cloned, container is started, or external environment is changed.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <section className="min-w-0 xl:col-span-8" aria-labelledby="workflow-diagram-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="workflow-diagram-heading" className="text-sm font-semibold text-violet-50">Execution graph</h2>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-violet-100/35">Select a node to inspect stage evidence</p>
            </div>
            <span className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-violet-100/35 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Complete
              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-amber-300" /> Approval
              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-violet-300" /> Running
            </span>
          </div>

          <div ref={canvasRef} className="workflow-canvas relative h-[min(76vh,900px)] min-h-[570px] overflow-hidden rounded-2xl border border-violet-300/15">
            <div className="workflow-canvas-grid pointer-events-none absolute inset-0" />
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-violet-100/35">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.9)]" />
              Live workflow state
            </div>
            <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center justify-end gap-1.5">
              <div className="flex items-center rounded-lg border border-violet-200/10 bg-[#17142a]/90 p-1 backdrop-blur">
                <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setCanvasZoom((value) => Math.max(0.55, Number((value - 0.1).toFixed(2))))} className="rounded-md p-1.5 text-violet-100/55 transition-colors hover:bg-violet-200/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300"><ZoomOut className="h-3.5 w-3.5" /></button>
                <span className="min-w-10 text-center font-mono text-[9px] text-violet-100/45">{Math.round(canvasZoom * 100)}%</span>
                <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setCanvasZoom((value) => Math.min(1.2, Number((value + 0.1).toFixed(2))))} className="rounded-md p-1.5 text-violet-100/55 transition-colors hover:bg-violet-200/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300"><ZoomIn className="h-3.5 w-3.5" /></button>
              </div>
              <div className="hidden items-center rounded-lg border border-violet-200/10 bg-[#17142a]/90 p-1 backdrop-blur sm:flex">
                <button type="button" aria-label="Pan workflow up" title="Pan up" onClick={() => setCanvasOffset((value) => ({ ...value, y: value.y - 56 }))} className="rounded-md p-1.5 text-violet-100/55 hover:bg-violet-200/10 hover:text-white"><ArrowUp className="h-3 w-3" /></button>
                <button type="button" aria-label="Pan workflow left" title="Pan left" onClick={() => setCanvasOffset((value) => ({ ...value, x: value.x - 56 }))} className="rounded-md p-1.5 text-violet-100/55 hover:bg-violet-200/10 hover:text-white"><ArrowLeft className="h-3 w-3" /></button>
                <button type="button" aria-label="Fit workflow to view" title="Fit workflow to view" onClick={fitWorkflow} className="rounded-md p-1.5 text-violet-100/55 hover:bg-violet-200/10 hover:text-white"><Maximize2 className="h-3 w-3" /></button>
                <button type="button" aria-label="Pan workflow right" title="Pan right" onClick={() => setCanvasOffset((value) => ({ ...value, x: value.x + 56 }))} className="rounded-md p-1.5 text-violet-100/55 hover:bg-violet-200/10 hover:text-white"><ArrowRight className="h-3 w-3" /></button>
                <button type="button" aria-label="Pan workflow down" title="Pan down" onClick={() => setCanvasOffset((value) => ({ ...value, y: value.y + 56 }))} className="rounded-md p-1.5 text-violet-100/55 hover:bg-violet-200/10 hover:text-white"><ArrowDown className="h-3 w-3" /></button>
              </div>
              <button type="button" aria-label="Fit workflow to view" title="Fit workflow to view" onClick={fitWorkflow} className="rounded-lg border border-violet-200/10 bg-[#17142a]/90 p-2 text-violet-100/55 hover:text-white sm:hidden"><Maximize2 className="h-3.5 w-3.5" /></button>
            </div>
            <div ref={viewportRef} className="workflow-canvas-viewport absolute inset-x-0 bottom-0 top-14 overflow-auto px-4 pb-4 pt-2 sm:px-6">
              <div
                ref={graphRef}
                className="mx-auto w-full max-w-[760px] origin-top transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})` }}
              >
                <WorkflowDiagram
                  setup={setup}
                  auditLogs={auditLogs}
                  selectedNode={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#11101e]/70 to-transparent" />
          </div>

          {/* Environment Ready State */}
          {isCompleted && setup.executionResult && (
            <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-4 text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <div>
                    <h2 className="text-xs font-semibold text-emerald-100">Simulated run complete</h2>
                    <p className="text-[10px] text-slate-400">HTTP {setup.smokeTest?.responseStatusCode ?? '—'} reported by simulator state.</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(currentRole === 'admin' ? 'all_manifests' : 'my_manifests')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200/15 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-violet-100 hover:bg-white/[0.08]"
                >
                  <FileText className="h-3.5 w-3.5" /> View setup report
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="min-w-0 space-y-3 xl:col-span-4 xl:sticky xl:top-20">
          <section className="workflow-inspector rounded-2xl border border-violet-300/15 p-4" aria-live="polite">
            {isBlocked && (
              <div className="mb-4 rounded-xl border border-red-300/25 bg-red-400/[0.06] p-3 text-xs text-red-100">
                <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-red-300" /> Setup blocked by security policy</div>
                <p className="mt-1 leading-relaxed text-red-100/75">{setup.blockedReason || 'Policy check halted execution. No development environment was provisioned.'}</p>
              </div>
            )}
            {(isChangesRequested || isRejected) && (
              <div className={`mb-4 rounded-xl border p-3 text-xs ${isChangesRequested ? 'border-amber-300/25 bg-amber-300/[0.06] text-amber-100' : 'border-red-300/25 bg-red-400/[0.06] text-red-100'}`}>
                <div className="font-semibold">{isChangesRequested ? 'Administrator requested changes' : 'Request rejected'}</div>
                <p className="mt-1 leading-relaxed opacity-80">{setup.approval?.comment || setup.approval?.rejectionReason || setup.blockedReason || 'No review note was recorded.'}</p>
                {setup.approval?.reviewedBy && <p className="mt-1 font-mono text-[10px] opacity-60">Reviewed by {setup.approval.reviewedBy}</p>}
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-violet-100/40">
                  Component {String(architectureNodes.findIndex((node) => node.id === selectedArchitectureNode.id) + 1).padStart(2, '0')} of {architectureNodes.length}
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-white">{selectedArchitectureNode.name}</h2>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${selectedStageTone}`}>
                {selectedNodeStatus.label}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-violet-100/65">{selectedArchitectureNode.description}</p>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-violet-200/10 py-3 text-xs">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Started</dt>
                <dd className="mt-1 text-[11px] text-violet-100/75">{selectedStageData.startedAt ? new Date(selectedStageData.startedAt).toLocaleString() : 'Not started'}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Completed</dt>
                <dd className="mt-1 text-[11px] text-violet-100/75">{selectedStageData.completedAt ? new Date(selectedStageData.completedAt).toLocaleString() : 'Pending'}</dd>
              </div>
              {selectedStageData.startedAt && selectedStageData.completedAt && (
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Duration</dt>
                  <dd className="mt-1 font-mono text-[11px] text-violet-100/75">
                    {Math.max(0, Math.round((new Date(selectedStageData.completedAt).getTime() - new Date(selectedStageData.startedAt).getTime()) / 1000))} sec
                  </dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Upstream dependencies</dt>
                <dd className="mt-1 text-[11px] text-violet-100/75">{upstreamNames.join(', ') || 'External user request'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Downstream components</dt>
                <dd className="mt-1 text-[11px] text-violet-100/75">{downstreamNames.join(', ') || 'None'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Inputs</dt>
                <dd className="mt-1 text-[11px] text-violet-100/75">{selectedArchitectureNode.inputs}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Outputs</dt>
                <dd className="mt-1 text-[11px] text-violet-100/75">{selectedArchitectureNode.outputs}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[9px] uppercase tracking-wider text-violet-100/35">Implementation status</dt>
                <dd className="mt-1 text-[11px] text-amber-100/80">{selectedArchitectureNode.implementation}</dd>
              </div>
            </dl>

            {selectedStage.key === 'human_approval' && isAwaitingApproval ? (
              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.07] p-3 text-xs text-amber-100">
                <div className="flex items-center gap-2 font-semibold"><Clock className="h-3.5 w-3.5" /> Waiting for administrator approval</div>
                <p className="mt-1 leading-relaxed text-amber-100/75">Execution is paused here. Review the proposed plan and permission boundary before simulator actions continue.</p>
                {setup.approval?.proposedAction && (
                  <p className="mt-2 border-t border-amber-200/15 pt-2 text-[11px] leading-relaxed text-amber-50/80">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-amber-100/45">Proposed action</span>
                    <span className="mt-0.5 block">{setup.approval.proposedAction}</span>
                  </p>
                )}
                {setup.approval?.permissionsComparison && (
                  <div className="mt-2 grid grid-cols-1 gap-2 border-t border-amber-200/15 pt-2 text-[10px] sm:grid-cols-3">
                    <div>
                      <div className="font-mono uppercase tracking-wider text-amber-100/45">Requested</div>
                      <div className="mt-1 break-words text-amber-50/75">{setup.approval.permissionsComparison.requested.join(', ') || 'None'}</div>
                    </div>
                    <div>
                      <div className="font-mono uppercase tracking-wider text-amber-100/45">Granted</div>
                      <div className="mt-1 break-words text-amber-50/75">{setup.approval.permissionsComparison.granted.join(', ') || 'None'}</div>
                    </div>
                    <div>
                      <div className="font-mono uppercase tracking-wider text-amber-100/45">Removed by policy</div>
                      <div className="mt-1 break-words text-amber-50/75">{setup.approval.permissionsComparison.stripped.join(', ') || 'None'}</div>
                    </div>
                  </div>
                )}
                {currentRole === 'admin' && (
                  <button
                    onClick={() => onNavigate('approval_queue')}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-200/15"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Open approval queue
                  </button>
                )}
              </div>
            ) : selectedStage.key === 'human_approval' && setup.approval?.reviewedAt ? (
              <div className={`mt-3 rounded-xl border p-3 text-xs ${selectedStageTone}`}>
                <div className="font-semibold">Decision recorded · {setup.approval.reviewedBy}</div>
                <p className="mt-1">{setup.approval.comment || setup.approval.rejectionReason || 'No reviewer comment recorded.'}</p>
                <p className="mt-1 text-[11px]">{new Date(setup.approval.reviewedAt).toLocaleString()}</p>
              </div>
            ) : null}

            {selectedStage.key === 'human_approval' && (setup.reviewHistory?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-2 rounded-lg border border-violet-200/10 bg-black/10 p-3">
                <h3 className="font-mono text-[9px] uppercase tracking-wider text-violet-100/45">Approval history</h3>
                {[...(setup.reviewHistory || [])].reverse().slice(0, 4).map((review, index) => (
                  <div key={`${review.timestamp}-${index}`} className="border-t border-violet-200/[0.06] pt-2 text-[11px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-violet-100/80">{review.decision.replace('_', ' ')}</span>
                      <time className="font-mono text-[9px] text-violet-100/40">{new Date(review.timestamp).toLocaleString()}</time>
                    </div>
                    <p className="mt-1 text-violet-100/60">{review.reviewerName}: {review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedArchitectureNode.id === 'sandbox_registry' && setup.executionResult && (
              <div className="mt-3 rounded-lg border border-violet-200/10 bg-black/15 p-3 text-xs leading-relaxed text-violet-100/75">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Recorded allocation · simulated</div>
                <div>Sandbox ID: {setup.executionResult.sandboxId}</div>
                <div>Endpoint: {setup.executionResult.endpointUrl}</div>
                <div>Resources: {setup.executionResult.allocatedCpu} CPU · {setup.executionResult.allocatedMemory} memory</div>
                {setup.executionResult.reusedExisting && (
                  <>
                    <div>Reuse confirmed by execution record; no new sandbox was allocated.</div>
                    {setup.executionResult.configFingerprint && (
                      <div className="break-all">Configuration fingerprint: {setup.executionResult.configFingerprint}</div>
                    )}
                    {auditLogs.find((event) => event.requestId === setup.id && event.action === 'EXECUTED')?.details?.duplicateCreationEvents === 0 && (
                      <div>Duplicate creation events: 0 · execution audit record</div>
                    )}
                  </>
                )}
              </div>
            )}

            {selectedArchitectureNode.id === 'smoke_login_verification' && setup.smokeTest && (
              <div className="mt-3 rounded-lg border border-violet-200/10 bg-black/15 p-3 text-xs leading-relaxed text-violet-100/75">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Verification result · simulated</div>
                <div>Status: {setup.smokeTest.status} · HTTP {setup.smokeTest.responseStatusCode}</div>
                <div>Endpoint: {setup.smokeTest.loginEndpoint}</div>
                {setup.smokeTest.testedAt && <div>Tested: {new Date(setup.smokeTest.testedAt).toLocaleString()}</div>}
                {setup.smokeTest.checks.map((check) => <div key={check.name}>{check.passed ? 'Passed' : 'Failed'}: {check.name} · {check.details}</div>)}
              </div>
            )}

            {selectedArchitectureNode.id === 'setup_manifest_test_lab' && (
              <div className="mt-3 rounded-lg border border-violet-200/10 bg-black/15 p-3 text-xs leading-relaxed text-violet-100/75">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Available evidence</div>
                {setup.manifest ? (
                  <>
                    <div>Manifest: {setup.manifest.manifestId}</div>
                    <div>Generated: {new Date(setup.manifest.generatedAt).toLocaleString()}</div>
                    <div className="break-all">SHA-256: {setup.manifest.sha256Hash}</div>
                  </>
                ) : <div>No setup manifest has been generated for this request.</div>}
                <div className="mt-2">Scripted verification: {setup.smokeTest ? `${setup.smokeTest.status}, HTTP ${setup.smokeTest.responseStatusCode}` : 'No verification result available.'}</div>
              </div>
            )}

            {selectedStageData.summary && (
              <div className="mt-3 rounded-lg border border-violet-200/10 bg-black/15 p-3 text-xs leading-relaxed text-violet-100/75">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Stage output</div>
                {selectedStageData.summary}
              </div>
            )}

            {selectedArchitectureNode.id === 'audit_evidence_store' && (
              <div className="mt-4">
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Recorded audit evidence</div>
                <div className="max-h-48 space-y-2 overflow-auto rounded-lg border border-violet-200/10 bg-[#0c0a18] p-3 font-mono text-[10px] leading-relaxed text-violet-100/75">
                  {auditLogs.filter((event) => event.requestId === setup.id).map((event) => (
                    <div key={event.id}>
                      <time className="text-violet-200/45">{new Date(event.timestamp).toLocaleString()}</time>
                      {' '}· {event.action} · {event.actor}: {event.summary}
                    </div>
                  ))}
                  {!auditLogs.some((event) => event.requestId === setup.id) && <div>No audit events recorded for this setup.</div>}
                </div>
              </div>
            )}

            {selectedStage.key === 'plan_setup' && setup.plannedActions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Proposed actions</div>
                {setup.plannedActions.map((action) => (
                  <div key={`${action.order}-${action.action}`} className="rounded-lg border border-violet-200/10 bg-black/10 px-2.5 py-2 text-[11px] text-violet-100/70">
                    <span className="mr-1.5 font-mono text-violet-300/45">{String(action.order).padStart(2, '0')}</span>
                    {action.action}
                  </div>
                ))}
              </div>
            )}

            {selectedArchitectureNode.id !== 'audit_evidence_store' && selectedStageData.logs.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-violet-100/40">Simulator event log</div>
                <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-violet-200/10 bg-[#0c0a18] p-3 font-mono text-[10px] leading-relaxed text-violet-100/75">
                  {selectedStageData.logs.map((log, index) => <div key={`${index}-${log}`}>{log}</div>)}
                </div>
              </div>
            )}
          </section>

          {/* Environment Specs Card */}
          <div className="workflow-inspector space-y-4 rounded-2xl border border-violet-300/15 p-4">
            <div className="border-b border-violet-200/10 pb-2">
              <h3 className="text-xs font-semibold text-white">Environment details</h3>
              <div className="mt-0.5 font-mono text-[10px] text-violet-100/40">
                {setup.projectName}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-3 border-b border-violet-200/[0.06] py-1">
                <span className="text-violet-100/40">Request ID</span>
                <span className="font-mono text-[10px] text-violet-100/75">{setup.id}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-violet-200/[0.06] py-1">
                <span className="text-violet-100/40">Template</span>
                <span className="text-right text-violet-100/75">{setup.template}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-violet-200/[0.06] py-1">
                <span className="text-violet-100/40">Target tier</span>
                <span className="font-mono text-[10px] text-violet-100/75">{setup.accountType}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-violet-200/[0.06] py-1">
                <span className="text-violet-100/40">Branch</span>
                <span className="max-w-[65%] truncate font-mono text-[10px] text-violet-100/75">{setup.repoDetails.branch}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-violet-200/[0.06] py-1">
                <span className="text-violet-100/40">Submitted by</span>
                <span className="text-violet-100/75">{setup.submittedBy.name}</span>
              </div>
            </div>

            {/* Run Operations Buttons */}
            <div className="space-y-2 border-t border-violet-200/10 pt-3">
              <div className="font-mono text-[9px] font-medium uppercase tracking-wider text-violet-100/40">
                Run Operations
              </div>

              {setup.status === 'approved' && (
                <button
                  disabled={actionLoading}
                  onClick={handleExecute}
                  className="w-full rounded-lg border border-violet-300/20 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-50 transition-colors hover:bg-violet-500/30"
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
                    className="w-full rounded-lg border border-violet-200/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-violet-100/80 transition-colors hover:bg-white/[0.08]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Verification Smoke Test</span>
                  </button>

                  {setup.smokeTest && !setup.manifest && (
                    <button
                      disabled={actionLoading}
                      onClick={handleManifest}
                      className="w-full rounded-lg border border-violet-300/20 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-50 transition-colors hover:bg-violet-500/30"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate Setup Report</span>
                    </button>
                  )}

                  {setup.manifest && (
                    <button
                      onClick={() => onNavigate(currentRole === 'admin' ? 'all_manifests' : 'my_manifests')}
                      className="w-full rounded-lg border border-violet-300/20 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-50 transition-colors hover:bg-violet-500/30"
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
                  className="w-full rounded-lg border border-amber-200/30 bg-amber-300/15 px-3 py-2 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-300/25"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Authorize in Approvals</span>
                </button>
              )}
            </div>
          </div>

          {/* Policy checks summary */}
          <div className="workflow-inspector rounded-xl border border-violet-300/10 p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-violet-100/80">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
              <span>Policy Compliance</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-violet-100/45">
              The simulator applies production isolation and least-privilege checks, then masks credential-like values in generated reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
