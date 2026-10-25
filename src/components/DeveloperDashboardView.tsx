import React from 'react';
import { ArrowRight, Boxes, CheckCircle2, Clock3, Plus, ShieldAlert } from 'lucide-react';
import type { SetupRequest } from '../types/sandbox.js';

interface DeveloperDashboardViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

function getStatus(status: SetupRequest['status']) {
  if (status === 'completed') return { label: 'Completed', tone: 'text-emerald-300' };
  if (status === 'awaiting_approval') return { label: 'Awaiting approval', tone: 'text-amber-200' };
  if (status === 'changes_requested') return { label: 'Changes requested', tone: 'text-amber-200' };
  if (status === 'rejected' || status === 'blocked' || status === 'failed') {
    return { label: status === 'rejected' ? 'Rejected' : status === 'blocked' ? 'Blocked' : 'Failed', tone: 'text-red-300' };
  }
  if (status === 'approved' || status === 'running' || status === 'planning' || status === 'validating') {
    return { label: 'Running', tone: 'text-violet-200' };
  }
  return { label: 'Queued', tone: 'text-slate-400' };
}

export const DeveloperDashboardView: React.FC<DeveloperDashboardViewProps> = ({
  setups,
  onSelectSetup,
  onNavigate,
}) => {
  const metrics = [
    { label: 'Total Requests', count: setups.length, icon: Boxes, tone: 'text-violet-200' },
    { label: 'Completed Setups', count: setups.filter((setup) => setup.status === 'completed').length, icon: CheckCircle2, tone: 'text-emerald-300' },
    { label: 'Pending Approvals', count: setups.filter((setup) => setup.status === 'awaiting_approval').length, icon: Clock3, tone: 'text-amber-200' },
    { label: 'Blocked Requests', count: setups.filter((setup) => ['blocked', 'rejected', 'failed'].includes(setup.status)).length, icon: ShieldAlert, tone: 'text-red-300' },
  ];
  const recentRuns = [...setups]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 4);

  return (
    <div className="w-full space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">Dashboard</h1>
        <button
          type="button"
          onClick={() => onNavigate('new_setup')}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Environment
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Setup summary">
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
          <h2 className="text-sm font-semibold text-slate-100">Recent Setup Runs</h2>
          <button
            type="button"
            onClick={() => onNavigate('setup_runs')}
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-200 hover:text-white"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentRuns.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-200">No setup runs yet</p>
            <p className="mt-1 text-xs text-slate-400">Create an environment request to start a workflow.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentRuns.map((setup) => {
              const status = getStatus(setup.status);
              return (
                <li key={setup.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">{setup.projectName}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {setup.id} · Updated {new Date(setup.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                    <button
                      type="button"
                      onClick={() => onSelectSetup(setup)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-violet-300/40 hover:text-white"
                    >
                      View details <ArrowRight className="h-3 w-3" />
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
