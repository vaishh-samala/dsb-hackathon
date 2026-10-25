import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  Boxes,
  Lock,
} from 'lucide-react';
import type { SetupRequest } from '../../types/sandbox.js';

interface ApprovalQueueViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onApprove: (setupId: string, reviewerName: string, comment: string) => Promise<void>;
  onReject: (setupId: string, reviewerName: string, reason: string) => Promise<void>;
  onRequestChanges: (setupId: string, reviewerName: string, comment: string) => Promise<void>;
  onNavigate: (view: any) => void;
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({
  setups,
  onSelectSetup,
  onApprove,
  onReject,
  onRequestChanges,
  onNavigate,
}) => {
  const pendingSetups = setups.filter((s) => s.status === 'awaiting_approval');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Always resolve the active review setup against the latest setups prop
  const selectedForReview =
    (selectedId ? setups.find((s) => s.id === selectedId) : null) ||
    pendingSetups[0] ||
    setups[0] ||
    null;

  const [reviewerName, setReviewerName] = useState('Elena Vance');
  const [comment, setComment] = useState('Reviewed permissions and risks. Approved for execution.');
  const [rejectionReason, setRejectionReason] = useState('Scope exceeds allowable boundaries or targets production.');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async () => {
    if (!selectedForReview || selectedForReview.status !== 'awaiting_approval') return;
    try {
      setActionLoading(true);
      await onApprove(selectedForReview.id, reviewerName, comment);
      // Auto-advance to the next pending item
      const remaining = pendingSetups.filter((s) => s.id !== selectedForReview.id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        onSelectSetup(remaining[0]);
      } else {
        setSelectedId(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedForReview || selectedForReview.status !== 'awaiting_approval') return;
    try {
      setActionLoading(true);
      await onReject(selectedForReview.id, reviewerName, rejectionReason);
      setShowRejectDialog(false);
      const remaining = pendingSetups.filter((s) => s.id !== selectedForReview.id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        onSelectSetup(remaining[0]);
      } else {
        setSelectedId(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedForReview || selectedForReview.status !== 'awaiting_approval' || !changeRequestReason.trim()) return;
    try {
      setActionLoading(true);
      await onRequestChanges(selectedForReview.id, reviewerName, changeRequestReason.trim());
      setShowChangesDialog(false);
      setChangeRequestReason('');
      const remaining = pendingSetups.filter((s) => s.id !== selectedForReview.id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        onSelectSetup(remaining[0]);
      } else {
        setSelectedId(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const isSelectedProd = selectedForReview?.accountType === 'production' || selectedForReview?.isProductionTarget;
  const isAwaitingApproval = selectedForReview?.status === 'awaiting_approval';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Pending Approvals
            </h1>
            <span className="text-xs text-slate-500 font-medium">
              ({pendingSetups.length} awaiting authorization)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review proposed environment configurations, permission boundaries, and authorize setup actions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('security_policies')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Security Policies</span>
        </button>
      </div>

      {pendingSetups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2 shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-sm font-semibold text-slate-900">Approval Queue is Clear</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no environment requests currently awaiting administrator review. All submissions have been evaluated.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (4 cols): Queue List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Review Queue</span>
              <span className="font-mono text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                {pendingSetups.length} Pending
              </span>
            </div>

            {pendingSetups.map((setup) => {
              const isSelected = selectedForReview?.id === setup.id;
              const isProd = setup.accountType === 'production' || setup.isProductionTarget;

              return (
                <div
                  key={setup.id}
                  onClick={() => {
                    setSelectedId(setup.id);
                    onSelectSetup(setup);
                  }}
                  className={`p-4 cursor-pointer transition-colors text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-100/80 border-l-3 border-slate-900'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 truncate">
                      {setup.projectName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {setup.id}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    By <span className="font-medium text-slate-700">{setup.submittedBy.name}</span> · tier{' '}
                    <span className={`font-mono font-medium ${isProd ? 'text-red-700' : 'text-slate-700'}`}>
                      {setup.accountType}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Template: <span className="text-slate-600 font-medium">{setup.template}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column (8 cols): Detailed Review & Sign-Off Pane */}
          {selectedForReview && (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedForReview.projectName}
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      ({selectedForReview.id})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requested by {selectedForReview.submittedBy.name} ({selectedForReview.submittedBy.email})
                  </p>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Submitted {selectedForReview.createdAt.slice(0, 10)} {selectedForReview.createdAt.slice(11, 16)}
                </div>
              </div>

              {(selectedForReview.reviewHistory?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Earlier review activity</h3>
                  {selectedForReview.reviewHistory?.slice(-3).map((review, index) => (
                    <div key={`${review.timestamp}-${index}`} className="text-xs text-slate-700">
                      <span className="font-semibold capitalize">{review.decision.replace('_', ' ')}</span>
                      <span className="text-slate-500"> · {review.reviewerName} · {review.timestamp.slice(0, 10)}</span>
                      <p className="mt-0.5 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Security Warnings / Target Check */}
              {isSelectedProd && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-red-800">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>POLICY POL-001 VIOLATION: Production Account Target</span>
                  </div>
                  <p className="text-red-700 leading-normal">
                    Target account is marked as production. Security policy strictly forbids executing automated sandboxes against production accounts. This request must be rejected.
                  </p>
                </div>
              )}

              {/* Grid: Environment Config & Permissions Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Left: Environment Specs */}
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200/80">
                  <h3 className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
                    Environment Parameters
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Tier</span>
                      <span className="font-mono font-medium text-slate-800">
                        {selectedForReview.accountType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Template</span>
                      <span className="font-medium text-slate-800">{selectedForReview.template}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Repository</span>
                      <span className="font-mono text-slate-700 truncate max-w-[200px]">
                        {selectedForReview.repoDetails.url.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Branch</span>
                      <span className="font-mono text-slate-700">{selectedForReview.repoDetails.branch}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Permissions Boundary Diff */}
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200/80">
                  <h3 className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
                    Permissions Evaluation (POL-002)
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] text-slate-400">Granted Least-Privilege Scopes:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedForReview.approval?.permissionsComparison.granted || ['read_code', 'write_sandbox']).map(
                          (p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono"
                            >
                              {p}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {(selectedForReview.approval?.permissionsComparison.stripped?.length ?? 0) > 0 && (
                      <div>
                        <div className="text-[11px] text-red-600 font-medium">Stripped Elevated Privileges:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedForReview.approval?.permissionsComparison.stripped?.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[11px] font-mono line-through"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviewer Sign-Off Form */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <h3 className="font-semibold text-slate-900">
                  Administrator Authorization Sign-Off
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Reviewer Name</label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Decision Comment / Notes</label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {showRejectDialog && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <label className="block text-xs font-semibold text-red-800">
                      Rejection Reason (Audit Trail)
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-md text-xs text-red-900 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowRejectDialog(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={handleReject}
                        className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {showChangesDialog && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <label className="block text-xs font-semibold text-amber-900" htmlFor="change-request-reason">
                      What must the developer change? This note is retained in the review history.
                    </label>
                    <textarea
                      id="change-request-reason"
                      rows={3}
                      value={changeRequestReason}
                      onChange={(e) => setChangeRequestReason(e.target.value)}
                      placeholder="For example: remove production database access and select synthetic test data."
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChangesDialog(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading || !changeRequestReason.trim()}
                        onClick={handleRequestChanges}
                        className="px-3 py-1 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded"
                      >
                        Return for changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Authorization Buttons */}
                {!showRejectDialog && !showChangesDialog && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectDialog(true)}
                        className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Request</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading || !isAwaitingApproval}
                        onClick={() => {
                          setChangeRequestReason('');
                          setShowChangesDialog(true);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={actionLoading || isSelectedProd || !isAwaitingApproval}
                      onClick={handleApprove}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs ${
                        isSelectedProd || !isAwaitingApproval
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {isSelectedProd
                          ? 'Blocked by Policy POL-001'
                          : isAwaitingApproval
                          ? 'Authorize & Approve Setup'
                          : 'Already Processed'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
