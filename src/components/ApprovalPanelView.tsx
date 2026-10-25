import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  KeyRound,
  Layers,
  ArrowRight,
  Info,
  Lock,
  Sparkles,
  Server,
  AlertOctagon,
} from 'lucide-react';
import type { SetupRequest, UserRole } from '../types/sandbox.js';

interface ApprovalPanelViewProps {
  setup: SetupRequest | null;
  allSetups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onApprove: (setupId: string, reviewerName: string, comment: string) => Promise<void>;
  onReject: (setupId: string, reviewerName: string, reason: string) => Promise<void>;
  onNavigate: (view: any) => void;
  currentRole: UserRole;
}

export const ApprovalPanelView: React.FC<ApprovalPanelViewProps> = ({
  setup,
  allSetups,
  onSelectSetup,
  onApprove,
  onReject,
  onNavigate,
  currentRole,
}) => {
  const [reviewerName, setReviewerName] = useState('Elena Vance (Security Operations)');
  const [comment, setComment] = useState('Least privilege verified. Ephemeral sandbox parameters approved.');
  const [rejectionReason, setRejectionReason] = useState('Elevated permissions requested outside scope.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (!setup) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
        <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-semibold text-slate-900">No Setup Request Selected</h2>
        <p className="text-xs text-slate-500">
          Select a pending request to review permissions, risks, and provide administrator sign-off.
        </p>
      </div>
    );
  }

  const approval = setup.approval;

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await onApprove(setup.id, reviewerName, comment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await onReject(setup.id, reviewerName, rejectionReason);
      setShowRejectModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProdTarget = setup.accountType === 'production' || setup.isProductionTarget;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Human Approval Review</h1>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                setup.approval?.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : setup.approval?.status === 'rejected'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {setup.approval?.status ? setup.approval.status.toUpperCase() : 'PENDING'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stage 5: Separation of duties requires explicit administrator authorization before executing sandbox provisioning.
          </p>
        </div>

        {/* Request Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Reviewing:</label>
          <select
            value={setup.id}
            onChange={(e) => {
              const target = allSetups.find((s) => s.id === e.target.value);
              if (target) onSelectSetup(target);
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
          >
            {allSetups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.projectName} ({s.approval?.status || 'no-approval'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Notice */}
      {currentRole === 'developer' && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Developer View:</strong> You can inspect the proposed actions and permissions. Self-approval is blocked by Rule POL-005. Switch to Administrator demo role to submit decisions.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
            READ-ONLY
          </span>
        </div>
      )}

      {/* Target Environment Banner */}
      <div
        className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
          isProdTarget
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isProdTarget ? (
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <div>
            <div className="font-bold uppercase tracking-wide">
              {isProdTarget
                ? 'SECURITY POLICY POL-001: TARGET IS PRODUCTION ENVIRONMENT (BLOCKED)'
                : 'VERIFIED TARGET: ISOLATED DEVELOPMENT SANDBOX'}
            </div>
            <div className="text-slate-600 mt-0.5">
              Environment: {setup.targetEnvironment} ({setup.accountType})
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: AI Recommendations & Setup Plan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            1. AI Recommendations & Proposed Setup Plan
          </span>
        </div>

        <div className="space-y-2">
          {setup.plannedActions && setup.plannedActions.length > 0 ? (
            setup.plannedActions.map((action) => (
              <div key={action.order} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Step {action.order}: {action.action}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                    {action.category}
                  </span>
                </div>
                <p className="text-slate-600">{action.description}</p>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded">
              No actions planned. Setup was blocked by safety policy.
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Security Validation & Permissions Boundary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Security Validation & Permissions Bounds (POL-002)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-medium">LEAST-PRIVILEGE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">REQUESTED SCOPES</span>
            <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
              {(approval?.permissionsComparison.requested || setup.requestedPermissions).map((p) => (
                <div key={p}>• {p}</div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800">GRANTED BOUNDS</span>
            <div className="font-mono text-[11px] text-emerald-700 space-y-0.5">
              {(approval?.permissionsComparison.granted || setup.grantedPermissions).map((p) => (
                <div key={p}>✓ {p}</div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-red-50/60 rounded-lg border border-red-200 space-y-1">
            <span className="text-[11px] font-semibold text-red-800">STRIPPED BY POLICY</span>
            <div className="font-mono text-[11px] text-red-700 space-y-0.5">
              {approval?.permissionsComparison.stripped && approval.permissionsComparison.stripped.length > 0 ? (
                approval.permissionsComparison.stripped.map((p) => (
                  <div key={p}>✕ {p}</div>
                ))
              ) : (
                <div className="text-slate-400 italic">None stripped (Safe)</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Risk Assessment */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            3. Automated Risk Assessment
          </span>
        </div>

        <div className="space-y-2">
          {approval?.risks && approval.risks.length > 0 ? (
            approval.risks.map((risk) => (
              <div
                key={risk.code}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-3"
              >
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase mt-0.5 border ${
                    risk.severity === 'critical'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : risk.severity === 'high'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : risk.severity === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {risk.severity}
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-slate-900">{risk.title}</div>
                  <p className="text-slate-600 leading-normal">{risk.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded text-center">
              No elevated security risks detected. Safe for sandbox provisioning.
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Human Approval Sign-off Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            4. Human Authorization Sign-Off
          </span>
          <span className="text-[11px] font-mono text-slate-400">PLAN {approval?.planVersion || 'v1.0.0'}</span>
        </div>

        {setup.status === 'blocked' ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-mono space-y-1">
            <div className="font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>REQUEST PERMANENTLY BLOCKED</span>
            </div>
            <p className="font-sans text-red-700">{setup.blockedReason}</p>
          </div>
        ) : approval?.status === 'approved' ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 font-mono text-emerald-900">
            <div className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ADMINISTRATOR APPROVAL CONFIRMED</span>
            </div>
            <div>Reviewer: {approval.reviewedBy}</div>
            <div>Approval reference: {approval.signature}</div>
            <div>Timestamp: {approval.reviewedAt}</div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('workflow')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Proceed to Execution Stage
              </button>
            </div>
          </div>
        ) : approval?.status === 'rejected' ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1 font-mono text-red-900">
            <div className="font-bold text-red-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>REQUEST REJECTED BY ADMINISTRATOR</span>
            </div>
            <div>Reviewer: {approval.reviewedBy}</div>
            <div>Reason: {approval.rejectionReason}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorizing Administrator Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Justification / Comment
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={isSubmitting || currentRole !== 'admin'}
                className="px-4 py-2 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Reject Setup
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting || currentRole !== 'admin'}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentRole !== 'admin'
                    ? 'Administrator Role Required'
                    : isSubmitting
                    ? 'Signing Approval...'
                    : 'Approve & Sign Sandbox Provisioning'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Sandbox Setup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              State the reason for halting this request. The rejection will be permanently recorded in the audit trail.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
