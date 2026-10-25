import React, { useState } from 'react';
import { Search, ArrowRight, Boxes } from 'lucide-react';
import type { SetupRequest } from '../../types/sandbox.js';

interface AllSetupsViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
  title?: string;
}

export const AllSetupsView: React.FC<AllSetupsViewProps> = ({
  setups,
  onSelectSetup,
  onNavigate,
  title = 'All Environments',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [developerFilter, setDeveloperFilter] = useState<string>('all');

  const developers = Array.from(new Set(setups.map((s) => s.submittedBy?.name || 'Alex Rivera')));

  const filtered = setups.filter((s) => {
    const devName = s.submittedBy?.name || 'Alex Rivera';
    const matchesSearch =
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (developerFilter !== 'all' && devName !== developerFilter) return false;
    return true;
  });

  const getStatusDisplay = (status: SetupRequest['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Ready', dot: 'bg-emerald-500', text: 'text-emerald-700' };
      case 'awaiting_approval':
        return { label: 'Awaiting Approval', dot: 'bg-amber-500', text: 'text-amber-800' };
      case 'blocked':
        return { label: 'Blocked', dot: 'bg-red-500', text: 'text-red-700' };
      case 'rejected':
      case 'failed':
        return { label: 'Failed', dot: 'bg-red-500', text: 'text-red-700' };
      default:
        return { label: 'In Progress', dot: 'bg-blue-500', text: 'text-blue-700' };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {title === 'Setup Runs' ? 'Organization-wide simulator execution history and status.' : 'Organization-wide inventory of demo environments and status.'}
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Total: {setups.length}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by project, ID, developer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Statuses</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="completed">Ready</option>
            <option value="blocked">Blocked</option>
          </select>

          {developers.length > 1 && (
            <select
              value={developerFilter}
              onChange={(e) => setDeveloperFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="all">All Developers</option>
              {developers.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 shadow-xs">
          <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-semibold text-slate-900">No environments match criteria</div>
          <p className="text-xs text-slate-500">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Environment</th>
                <th className="py-2.5 px-4 font-semibold">Developer</th>
                <th className="py-2.5 px-4 font-semibold">Tier</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Updated</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((setup) => {
                const statusInfo = getStatusDisplay(setup.status);
                return (
                  <tr
                    key={setup.id}
                    onClick={() => {
                      onSelectSetup(setup);
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{setup.projectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {setup.id} · {setup.template}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {setup.submittedBy?.name || 'Alex Rivera'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {setup.accountType}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        <span className={`font-medium ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {setup.updatedAt.slice(0, 10)} {setup.updatedAt.slice(11, 16)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSetup(setup);
                        }}
                        className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
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
  );
};
