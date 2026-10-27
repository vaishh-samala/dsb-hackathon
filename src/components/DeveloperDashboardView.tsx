import React from 'react';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldAlert,
  Sparkles,
  Bot,
  FolderPlus,
  GitBranch,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
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
  const isCleanState = setups.length === 0;

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
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isCleanState
              ? 'Clean personal workspace · No demo projects loaded'
              : 'Overview of your isolated sandbox environments'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('new_setup')}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Environment
        </button>
      </header>

      {/* When Clean State (Brand New Real User) */}
      {isCleanState ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Welcome Hero Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#120d33]/80 p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto shadow-inner">
              <FolderPlus className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-white tracking-tight">
                No projects yet
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Welcome to your private workspace. Your account starts clean and isolated with zero dummy data.
                Create your first sandbox project to initiate automated AI planning and security verification.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('new_setup')}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-5 py-2.5 transition-all shadow-lg shadow-violet-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create your first project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick-Start Building Blocks */}
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Get Started Building
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action 1: Create a Project */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Create Environment</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deploy an isolated container with custom Next.js, Node, Python, or Go templates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('new_setup')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  <span>Start configuration</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Action 2: Configure AI Agent */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Configure Agent</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set up least-privilege policies, synthetic data tiers, and automated smoke test rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('new_setup')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 cursor-pointer"
                >
                  <span>Configure agent</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Action 3: Connect Tools & Repos */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Connect Tools</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Link your Git repository URL, branch references, and container ports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('new_setup')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <span>Connect repository</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Populated Dashboard View (For Demo mode or Returning Authenticated Users) */
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Setup summary">
            {metrics.map(({ label, count, icon: Icon, tone }) => (
              <article key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-slate-400">{label}</span>
                  <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold text-slate-100">{count}</div>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">Recent Setup Runs</h2>
              <button
                type="button"
                onClick={() => onNavigate('setup_runs')}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-white cursor-pointer"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <ul className="divide-y divide-slate-800/80">
              {recentRuns.map((setup) => {
                const status = getStatus(setup.status);
                return (
                  <li key={setup.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-100">{setup.projectName}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">
                        {setup.id} · Updated {new Date(setup.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                      <button
                        type="button"
                        onClick={() => onSelectSetup(setup)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-violet-400/40 hover:text-white cursor-pointer"
                      >
                        View details <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
