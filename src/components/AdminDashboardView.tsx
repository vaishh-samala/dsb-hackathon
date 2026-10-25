import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Boxes,
  UserCheck,
  Search,
  Lock,
  Layers,
  TestTubes,
} from 'lucide-react';
import type { SetupRequest, UserRole } from '../types/sandbox.js';

interface AdminDashboardViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onApprove: (setupId: string, reviewerName: string, comment: string) => Promise<void>;
  onReject: (setupId: string, reviewerName: string, reason: string) => Promise<void>;
  onRequestChanges: (setupId: string, reviewerName: string, comment: string) => Promise<void>;
  onNavigate: (view: any) => void;
  currentRole: UserRole;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  setups,
  onSelectSetup,
  onApprove,
  onReject,
  onRequestChanges,
  onNavigate,
  currentRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewModalSetup, setReviewModalSetup] = useState<SetupRequest | null>(null);
  const [reviewerName, setReviewerName] = useState('Elena Vance');
  const [comment, setComment] = useState('Reviewed least privilege bounds. Approved for sandbox execution.');
  const [rejectionReason, setRejectionReason] = useState('Prohibited environment target or scope violation.');
  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingSetups = setups.filter((s) => s.status === 'awaiting_approval');
  const blockedSetups = setups.filter((s) => s.status === 'blocked' || s.status === 'rejected');
  const completedSetups = setups.filter((s) => s.status === 'completed');

  const filteredSetups = setups.filter(
    (s) =>
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (setupId: string) => {
    try {
      setIsSubmitting(true);
      await onApprove(setupId, reviewerName, comment);
      setReviewModalSetup(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (setupId: string) => {
    try {
      setIsSubmitting(true);
      await onReject(setupId, reviewerName, rejectionReason);
      setReviewModalSetup(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async (setupId: string) => {
    if (!changeRequestReason.trim()) return;
    try {
      setIsSubmitting(true);
      await onRequestChanges(setupId, reviewerName, changeRequestReason.trim());
      setReviewModalSetup(null);
      setChangeRequestReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (status: SetupRequest['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Ready', dot: 'bg-emerald-500', text: 'text-emerald-700' };
      case 'awaiting_approval':
        return { label: 'Awaiting Approval', dot: 'bg-amber-500', text: 'text-amber-800' };
      case 'changes_requested':
        return { label: 'Changes Requested', dot: 'bg-orange-500', text: 'text-orange-800' };
      case 'blocked':
        return { label: 'Blocked', dot: 'bg-red-500', text: 'text-red-700' };
      case 'rejected':
      case 'failed':
        return { label: 'Rejected', dot: 'bg-red-500', text: 'text-red-700' };
      case 'running':
      case 'planning':
      case 'validating':
        return { label: 'In Progress', dot: 'bg-blue-500', text: 'text-blue-700' };
      default:
        return { label: 'Draft', dot: 'bg-slate-300', text: 'text-slate-500' };
    }
  };

  return (
    <div className="space-y-6 font-sans w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review environment proposals, authorize changes, and govern sandbox policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingSetups.length > 0 && (
            <button
              onClick={() => onNavigate('approval_queue')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{pendingSetups.length} Pending Approval</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('test_cases')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <TestTubes className="w-3.5 h-3.5 text-slate-500" />
            <span>Test Scenarios</span>
          </button>

          <button
            onClick={() => onNavigate('security_policies')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Policy Engine</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Environments
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{setups.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all developers</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending Authorization
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{pendingSetups.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Requires admin sign-off</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active / Ready
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{completedSetups.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Passed verification probe</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Blocked / Flagged
            </div>
            <div className="text-2xl font-bold text-red-700 mt-1">{blockedSetups.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Policy violations</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-700 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): All Environments Table */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Environment Inventory</h2>
              <p className="text-xs text-slate-500">
                All environment requests and simulator-recorded setup runs.
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search environment or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Environment</th>
                    <th className="py-2.5 px-3 font-semibold">Developer</th>
                    <th className="py-2.5 px-3 font-semibold">Tier</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Last Updated</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSetups.map((setup) => {
                    const statusInfo = getStatusDisplay(setup.status);
                    return (
                      <tr
                        key={setup.id}
                        onClick={() => {
                          onSelectSetup(setup);
                          onNavigate('workflow_monitoring');
                        }}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{setup.projectName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {setup.id} · {setup.template}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {setup.submittedBy.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {setup.accountType}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            <span className={`font-medium ${statusInfo.text}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {setup.updatedAt.slice(0, 10)} {setup.updatedAt.slice(11, 16)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {setup.status === 'awaiting_approval' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReviewModalSetup(setup);
                                  setChangeRequestReason('');
                                }}
                                className="px-2 py-1 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
                              >
                                Review
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSetup(setup);
                                onNavigate('workflow_monitoring');
                              }}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Pending Approvals & Security Posture */}
        <div className="lg:col-span-4 space-y-4">
          {/* Pending Action Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pending Approvals</h2>
                <p className="text-xs text-slate-500">Awaiting authorization sign-off.</p>
              </div>
              <button
                onClick={() => onNavigate('approval_queue')}
                className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
              >
                Open queue
              </button>
            </div>

            {pendingSetups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500 shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <span className="font-semibold text-slate-800">All requests reviewed</span>
                <p className="text-[11px] text-slate-400 mt-0.5">No environments pending sign-off.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                {pendingSetups.map((setup) => (
                  <div
                    key={setup.id}
                    className="p-3.5 hover:bg-slate-50/50 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">{setup.projectName}</div>
                        <div className="text-[11px] text-slate-500">
                          by <span className="font-medium text-slate-700">{setup.submittedBy.name}</span> · tier <span className="font-mono text-slate-700">{setup.accountType}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setReviewModalSetup(setup);
                          setChangeRequestReason('');
                        }}
                        className="w-full py-1.5 px-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
                      >
                        Authorize / Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Policy Compliance Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Deterministic Policies</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold font-mono">
                6 / 6 ENFORCED
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              POL-001 strictly isolates production. POL-002 enforces least-privilege scoping. POL-005 enforces mandatory human sign-off before sandbox creation.
            </p>
            <button
              onClick={() => onNavigate('security_policies')}
              className="text-[11px] text-slate-700 hover:text-slate-900 underline font-medium"
            >
              Inspect policy rules →
            </button>
          </div>
        </div>
      </div>

      {/* Review & Approval Modal */}
      {reviewModalSetup && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review Setup Request
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reviewModalSetup.projectName} ({reviewModalSetup.id})
                </p>
              </div>
              <button
                onClick={() => setReviewModalSetup(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Scope Details */}
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-slate-400 text-[11px]">Requested By</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {reviewModalSetup.submittedBy.name}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Target Tier</div>
                  <div className="font-mono font-medium text-slate-800 mt-0.5">
                    {reviewModalSetup.accountType}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reviewer Identity
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reviewer Notes
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="dashboard-change-reason">
                  Required changes (for return to developer)
                </label>
                <textarea
                  id="dashboard-change-reason"
                  rows={2}
                  value={changeRequestReason}
                  onChange={(e) => setChangeRequestReason(e.target.value)}
                  placeholder="Describe the specific updates needed before approval."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReject(reviewModalSetup.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  disabled={isSubmitting || !changeRequestReason.trim()}
                  onClick={() => handleRequestChanges(reviewModalSetup.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Request Changes
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => setReviewModalSetup(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleApprove(reviewModalSetup.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorize Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
