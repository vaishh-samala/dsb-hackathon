import React, { useState } from 'react';
import { Search, Plus, ArrowRight, Boxes } from 'lucide-react';
import type { SetupRequest } from '../../types/sandbox.js';

interface MyRequestsViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onReviseSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

export const MyRequestsView: React.FC<MyRequestsViewProps> = ({
  setups,
  onSelectSetup,
  onReviseSetup,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'blocked'>('all');

  const filtered = setups.filter((s) => {
    const matchesSearch =
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.template.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return s.status === 'awaiting_approval' || s.status === 'changes_requested';
    if (statusFilter === 'completed') return s.status === 'completed';
    if (statusFilter === 'blocked') return s.status === 'blocked' || s.status === 'rejected';
    return true;
  });

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Environments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configured and active development environments.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new_setup')}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Environment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID, or template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          {(['all', 'pending', 'completed', 'blocked'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-2.5 py-1 rounded transition-colors capitalize ${
                statusFilter === key
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 shadow-xs">
          <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-semibold text-slate-900">No environments found</div>
          <p className="text-xs text-slate-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search query or filter.'
              : 'Create an environment to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Environment</th>
                <th className="py-2.5 px-4 font-semibold">Template</th>
                <th className="py-2.5 px-4 font-semibold">Tier</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Last Updated</th>
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
                    <td className="py-3 px-4 text-slate-600">
                      {setup.template}
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
                      {setup.status === 'changes_requested' && (
                        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-orange-800">
                          {setup.approval?.comment || 'Administrator requested an update.'}
                        </p>
                      )}
                      {setup.status === 'rejected' && setup.approval?.rejectionReason && (
                        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-red-700">
                          {setup.approval.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {setup.updatedAt.slice(0, 10)} {setup.updatedAt.slice(11, 16)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {setup.status === 'changes_requested' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSetup(setup);
                            onReviseSetup(setup);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <span>Revise request</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSetup(setup);
                            onNavigate('workflow');
                          }}
                          className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
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
