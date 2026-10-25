import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react';
import type { SetupRequest } from '../types/sandbox.js';

interface AdminDashboardViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

function getStatus(status: SetupRequest['status']) {
  if (status === 'awaiting_approval') return { label: 'Awaiting approval', tone: 'text-amber-200' };
  if (status === 'changes_requested') return { label: 'Changes requested', tone: 'text-amber-200' };
  if (status === 'rejected') return { label: 'Rejected', tone: 'text-red-300' };
  if (status === 'blocked' || status === 'failed') return { label: status === 'blocked' ? 'Blocked' : 'Failed', tone: 'text-red-300' };
  if (status === 'completed') return { label: 'Completed', tone: 'text-emerald-300' };
  return { label: 'In progress', tone: 'text-violet-200' };
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  setups,
  onSelectSetup,
  onNavigate,
}) => {
  const pending = setups
    .filter((setup) => setup.status === 'awaiting_approval')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 4);
  const approvedCount = setups.filter((setup) =>
    setup.approval?.status === 'approved' || setup.reviewHistory?.some((review) => review.decision === 'approved')
  ).length;
  const rejectedCount = setups.filter((setup) =>
    setup.status === 'rejected' || setup.reviewHistory?.some((review) => review.decision === 'rejected')
  ).length;
  const failedCount = setups.filter((setup) => ['blocked', 'failed'].includes(setup.status)).length;
  const metrics = [
    { label: 'Pending Approvals', count: setups.filter((setup) => setup.status === 'awaiting_approval').length, icon: Clock3, tone: 'text-amber-200' },
    { label: 'Approved Requests', count: approvedCount, icon: CheckCircle2, tone: 'text-emerald-300' },
    { label: 'Rejected Requests', count: rejectedCount, icon: XCircle, tone: 'text-red-300' },
    { label: 'Blocked or Failed', count: failedCount, icon: ShieldAlert, tone: 'text-red-300' },
  ];

  return (
    <div className="w-full space-y-5">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">Dashboard</h1>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Governance summary">
        {metrics.map(({ label, count, icon: Icon, tone }) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-400">{label}</span>
              <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold text-slate-100">{count}</div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">Pending Approvals</h2>
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 font-mono text-[10px] text-amber-200">
              {setups.filter((setup) => setup.status === 'awaiting_approval').length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('approval_queue')}
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-200 hover:text-white"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {pending.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-300" />
            <p className="mt-2 text-xs text-slate-400">No requests are waiting for authorization.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((setup) => {
              const status = getStatus(setup.status);
              return (
                <li key={setup.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">{setup.projectName}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {setup.id} · {setup.submittedBy.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                    <button
                      type="button"
                      onClick={() => onSelectSetup(setup)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-violet-300/40 hover:text-white"
                    >
                      Review <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
