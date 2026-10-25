import React, { useState } from 'react';
import {
  Boxes,
  PlayCircle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Terminal,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import type { SetupRequest } from '../../types/sandbox.js';

interface SetupResultsViewProps {
  setup: SetupRequest | null;
  allSetups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

export const SetupResultsView: React.FC<SetupResultsViewProps> = ({
  setup,
  allSetups,
  onSelectSetup,
  onNavigate,
}) => {
  const [showLogs, setShowLogs] = useState(false);

  const active = setup || allSetups[0];

  if (!active) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3 font-sans shadow-xs">
        <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
        <h2 className="text-sm font-semibold text-slate-900">No Environment Selected</h2>
        <p className="text-xs text-slate-500">
          Create or select an environment to view details and runtime configuration.
        </p>
      </div>
    );
  }

  const result = active.executionResult;
  const smoke = active.smokeTest;

  const getStatusDisplay = (status: SetupRequest['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Ready', dot: 'bg-emerald-500', text: 'text-emerald-700' };
      case 'awaiting_approval':
        return { label: 'Awaiting Approval', dot: 'bg-amber-500', text: 'text-amber-800' };
      case 'blocked':
        return { label: 'Blocked', dot: 'bg-red-500', text: 'text-red-700' };
      default:
        return { label: 'In Progress', dot: 'bg-blue-500', text: 'text-blue-700' };
    }
  };

  const statusInfo = getStatusDisplay(active.status);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {active.projectName}
            </h1>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              <span className={`text-xs font-medium ${statusInfo.text}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Environment identifier: <span className="font-mono">{active.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allSetups.length > 1 && (
            <select
              value={active.id}
              onChange={(e) => {
                const target = allSetups.find((s) => s.id === e.target.value);
                if (target) onSelectSetup(target);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-400 shadow-xs"
            >
              {allSetups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.projectName} ({s.status})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              onSelectSetup(active);
              onNavigate('workflow');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Setup Run</span>
          </button>
        </div>
      </div>

      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overview & Runtime Section */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">Template</div>
                <div className="font-medium text-slate-900 mt-0.5">{active.template}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Target Tier</div>
                <div className="font-mono text-slate-900 mt-0.5 capitalize">{active.accountType}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Owner</div>
                <div className="text-slate-900 mt-0.5">{active.submittedBy.name}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Last Updated</div>
                <div className="font-mono text-slate-600 text-[11px] mt-0.5">
                  {active.updatedAt.slice(0, 10)} {active.updatedAt.slice(11, 16)}
                </div>
              </div>
            </div>
          </div>

          {/* Runtime Endpoint (if provisioned) */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Runtime Container Status
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Local Endpoint</div>
                  <div className="font-mono text-slate-900 font-semibold mt-0.5">{result.endpointUrl}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Bound Port</div>
                  <div className="font-mono text-slate-900 font-medium mt-0.5">{result.containerPort}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Container ID</div>
                  <div className="font-mono text-slate-900 text-[11px] mt-0.5 truncate">{result.sandboxId}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Allocation</div>
                  <div className="text-slate-800 font-medium mt-0.5">
                    {result.reusedExisting ? 'Reused Existing' : 'New Container'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration & Permissions Section */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Repository & Permissions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">Repository</div>
                <div className="font-mono text-[11px] text-slate-900 mt-0.5">{active.repoDetails.url}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Branch</div>
                <div className="font-mono text-[11px] text-slate-900 mt-0.5">{active.repoDetails.branch}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-400 text-[11px] mb-1.5">Permissions Granted</div>
              <div className="flex flex-wrap gap-1.5">
                {active.grantedPermissions.length > 0 ? (
                  active.grantedPermissions.map((perm) => (
                    <span
                      key={perm}
                      className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  active.requestedPermissions.map((perm) => (
                    <span
                      key={perm}
                      className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                    >
                      {perm} (requested)
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Setup History Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Setup Run History
            </h2>

            <div className="border border-slate-100 rounded-lg p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">Run {active.id}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Initiated {active.createdAt.slice(0, 10)} {active.createdAt.slice(11, 16)} UTC
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                  <span className={`font-medium ${statusInfo.text}`}>{statusInfo.label}</span>
                </div>

                {active.manifest ? (
                  <button
                    onClick={() => {
                      onSelectSetup(active);
                      onNavigate('my_manifests');
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Report</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onSelectSetup(active);
                      onNavigate('workflow');
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors"
                  >
                    View Timeline
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Execution Logs (Expandable) */}
      {result?.executionLogs && result.executionLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>Technical Execution Logs</span>
            {showLogs ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {showLogs && (
            <div className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-[10px] space-y-1 overflow-x-auto">
              {result.executionLogs.map((log, i) => (
                <div key={i}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
