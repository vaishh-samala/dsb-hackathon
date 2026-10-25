import React, { useState } from 'react';
import { Search, Clock, ArrowRight } from 'lucide-react';
import type { AuditLogEvent } from '../types/sandbox.js';

interface AuditLogsViewProps {
  logs: AuditLogEvent[];
  onSelectRequestId?: (requestId: string) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onSelectRequestId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.id.toLowerCase().includes(term) ||
      log.requestId.toLowerCase().includes(term) ||
      log.actor.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.summary.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Activity History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Traceable audit trail documenting environment setup requests, policy evaluations, and approvals.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-48"
          />
        </div>
      </div>

      {/* Activity Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
          No activity recorded matching your search.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Request</th>
                <th className="py-2.5 px-4 font-semibold">Actor</th>
                <th className="py-2.5 px-4 font-semibold">Action</th>
                <th className="py-2.5 px-4 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => {
                const isBlocked = log.action === 'BLOCKED' || log.action === 'REJECTED';
                const isApproved = log.action === 'APPROVED';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp.slice(0, 10)} {log.timestamp.slice(11, 16)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {onSelectRequestId ? (
                        <button
                          onClick={() => onSelectRequestId(log.requestId)}
                          className="font-mono text-xs text-slate-900 font-medium hover:underline"
                        >
                          {log.requestId}
                        </button>
                      ) : (
                        <span className="font-mono text-xs text-slate-900">{log.requestId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800 whitespace-nowrap font-medium">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-mono ${
                          isBlocked
                            ? 'text-red-700 font-semibold'
                            : isApproved
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-normal">
                      {log.summary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
