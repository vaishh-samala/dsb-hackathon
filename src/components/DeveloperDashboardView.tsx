import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  Boxes,
  PlayCircle,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Layers,
  FileText,
  Activity,
} from 'lucide-react';
import type { SetupRequest } from '../types/sandbox.js';

interface DeveloperDashboardViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

export const DeveloperDashboardView: React.FC<DeveloperDashboardViewProps> = ({
  setups,
  onSelectSetup,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSetups = setups.filter(
    (s) =>
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = setups.length;
  const completedCount = setups.filter((s) => s.status === 'completed').length;
  const pendingCount = setups.filter((s) => s.status === 'awaiting_approval').length;
  const blockedCount = setups.filter(
    (s) => s.status === 'blocked' || s.status === 'rejected' || s.status === 'failed'
  ).length;

  const getStatusDisplay = (status: SetupRequest['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Ready',
          dot: 'bg-emerald-500',
          text: 'text-emerald-700',
        };
      case 'awaiting_approval':
        return {
          label: 'Awaiting Approval',
          dot: 'bg-amber-500',
          text: 'text-amber-800',
        };
      case 'running':
      case 'planning':
      case 'validating':
        return {
          label: 'In Progress',
          dot: 'bg-blue-500',
          text: 'text-blue-700',
        };
      case 'blocked':
        return {
          label: 'Blocked',
          dot: 'bg-red-500',
          text: 'text-red-700',
        };
      case 'rejected':
      case 'failed':
        return {
          label: 'Failed',
          dot: 'bg-red-500',
          text: 'text-red-700',
        };
      default:
        return {
          label: 'Draft',
          dot: 'bg-slate-400',
          text: 'text-slate-600',
        };
    }
  };

  return (
    <div className="space-y-6 font-sans w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Developer Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Request, track, and verify your development sandbox setups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('my_manifests')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Setup Reports</span>
          </button>
          <button
            onClick={() => onNavigate('new_setup')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Environment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              My Total Requests
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Configured sandboxes</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Completed Setups
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ready for development</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting admin review</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Blocked Requests
            </div>
            <div className="text-2xl font-bold text-red-700 mt-1">{blockedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Policy stopped</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-700 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Responsive Main Layout (8 cols Table + 4 cols Runs on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Environments Inventory */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Environments</h2>
              <p className="text-xs text-slate-500">
                Environment requests and simulator-recorded setup runs for your projects.
              </p>
            </div>
            {setups.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter environments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-full sm:w-48"
                />
              </div>
            )}
          </div>

          {setups.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
              <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">No environments yet</div>
                <p className="text-xs text-slate-500">
                  Create a sandbox environment to begin development.
                </p>
              </div>
              <button
                onClick={() => onNavigate('new_setup')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Environment</span>
              </button>
            </div>
          ) : filteredSetups.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500 shadow-xs">
              No environments match "{searchTerm}".
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[580px]">
                  <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Environment</th>
                      <th className="py-2.5 px-3 font-semibold">Template</th>
                      <th className="py-2.5 px-3 font-semibold">Target Tier</th>
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
                            onNavigate('workflow');
                          }}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{setup.projectName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {setup.id} · {setup.repoDetails.branch}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {setup.template}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] text-slate-600">
                              {setup.accountType}
                            </span>
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSetup(setup);
                                onNavigate('workflow');
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                            >
                              <span>Open</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Setup Runs & Workspace Overview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Recent Setup Runs</h2>
                <p className="text-xs text-slate-500">Execution timeline & probes.</p>
              </div>
              <button
                onClick={() => onNavigate('workflow')}
                className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
              >
                View all
              </button>
            </div>

            {setups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500 shadow-xs">
                No setup runs recorded yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                {setups.slice(0, 4).map((setup) => {
                  const statusInfo = getStatusDisplay(setup.status);
                  return (
                    <div
                      key={setup.id}
                      onClick={() => {
                        onSelectSetup(setup);
                        onNavigate('workflow');
                      }}
                      className="p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <PlayCircle className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 truncate max-w-[170px]">
                              {setup.projectName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {setup.id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span className={`font-medium text-[11px] ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                        <span>{setup.template}</span>
                        <span className="font-mono">{setup.createdAt.slice(0, 10)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Guidance Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Layers className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Standard Dev Workflow</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              1. Submit a template and repository configuration.<br />
              2. Administrator evaluates permissions and signs off.<br />
              3. The simulator records the approved setup, returns configured verification results, and generates a report digest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
