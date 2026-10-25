import React from 'react';
import {
  ShieldAlert,
  KeyRound,
  RefreshCw,
  Database,
  UserCheck,
  Lock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { SetupRequest } from '../../types/sandbox.js';

interface SecurityPoliciesViewProps {
  setups: SetupRequest[];
  onNavigate: (view: any) => void;
}

export const SecurityPoliciesView: React.FC<SecurityPoliciesViewProps> = ({ setups, onNavigate }) => {
  const policies = [
    {
      id: 'POL-001',
      name: 'Production Environment Isolation',
      icon: ShieldAlert,
      summary: 'Never create a development sandbox for a production account.',
      ruleDescription:
        'Prevents experimental, untrusted, or automated sandbox code from deploying to or modifying production infrastructure.',
      enforcementMechanism:
        'The API blocks requests marked production before approval or execution. Workflow and audit state are simulated in memory.',
      statusLabel: 'Strictly Enforced',
      violationsCount: setups.filter((s) => s.accountType === 'production' || s.isProductionTarget).length,
    },
    {
      id: 'POL-002',
      name: 'Strict Least-Privilege Scoping',
      icon: KeyRound,
      summary: 'Strip wildcard permissions and elevated cloud scopes.',
      ruleDescription:
        'Restricts developer sandbox permissions to safe local development capabilities. Strips wildcards ("*"), production database access, and cluster roles.',
      enforcementMechanism:
        'Policy Engine intercepts requested scopes, strips prohibited wildcards and unapproved privileges, and grants bounded safe scopes.',
      statusLabel: 'Scope Stripping Active',
      violationsCount: setups.filter((s) => (s.approval?.permissionsComparison.stripped?.length ?? 0) > 0).length,
    },
    {
      id: 'POL-003',
      name: 'Anti-Duplication Container Reuse',
      icon: RefreshCw,
      summary: 'Prevent duplicate container creation on retries and branch updates.',
      ruleDescription:
        'If the simulator registry contains a matching repository and branch, reuse that sandbox record instead of recording a second allocation.',
      enforcementMechanism:
        'Checks the in-memory registry during Discovery. This does not inspect or attach to a real container.',
      statusLabel: 'Idempotency Active',
      violationsCount: setups.filter((s) => s.executionResult?.reusedExisting).length,
    },
    {
      id: 'POL-004',
      name: 'Synthetic Data Requirement',
      icon: Database,
      summary: 'Prohibit real production customer PII; enforce synthetic fixtures.',
      ruleDescription:
        'Allows generated mock customers, anonymized telemetry, or synthetic fixtures. Requests to use real production customer data are blocked.',
      enforcementMechanism:
        'The API blocks a real-production-dump request before approval. Other data-source outcomes are represented by simulator state.',
      statusLabel: 'Synthetic Seeding Active',
      violationsCount: setups.filter((s) => s.isRealDataBlocked).length,
    },
    {
      id: 'POL-005',
      name: 'Separation of Duties & Authorization',
      icon: UserCheck,
      summary: 'Require explicit administrator approval before execution.',
      ruleDescription:
        'Developers cannot self-approve setup requests. A separate administrator must review proposed changes, permissions diff, and risks before containers launch.',
      enforcementMechanism:
        'Backend validates roles on approval endpoints. Developer authorization attempts return HTTP 403 Forbidden.',
      statusLabel: 'Role Gate Enforced',
      violationsCount: 0,
    },
    {
      id: 'POL-006',
      name: 'Zero Plaintext Secret Exposure',
      icon: Lock,
      summary: 'Redact all credentials, tokens, and keys in logs and reports.',
      ruleDescription:
        'Plaintext secrets, API tokens, and bearer tokens must never appear in setup logs, command previews, or exported reports.',
      enforcementMechanism:
        'The demo report generator masks credential-like values before including them and computes a content SHA-256 digest. It does not create an immutable signature.',
      statusLabel: 'Redaction Engine Active',
      violationsCount: 0,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Security & Governance Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic API policy checks represented across configuration and simulator workflow runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-emerald-700 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>6 Policies Active</span>
          </div>
          <button
            onClick={() => onNavigate('test_cases')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            Run Test Scenarios
          </button>
        </div>
      </div>

      {/* Responsive 3-Column Policy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {policies.map((pol) => {
          const Icon = pol.icon;
          return (
            <div
              key={pol.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {pol.id}
                      </span>
                      <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                        {pol.name}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-800 font-medium bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  {pol.summary}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {pol.ruleDescription}
                </p>

                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                    How the demo applies this rule
                  </div>
                  <p className="leading-normal">{pol.enforcementMechanism}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{pol.statusLabel}</span>
                </div>

                {pol.violationsCount > 0 && (
                  <span className="font-mono text-slate-500">
                    {pol.violationsCount} Triggered
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
