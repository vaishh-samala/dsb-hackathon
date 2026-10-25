import React from 'react';
import { ShieldCheck, User, Shield, ArrowRight, CheckCircle2, Lock, Terminal, FileText } from 'lucide-react';
import type { UserProfile } from '../types/sandbox.js';

interface RoleSelectViewProps {
  onSelectUser: (user: UserProfile) => void;
}

export const RoleSelectView: React.FC<RoleSelectViewProps> = ({ onSelectUser }) => {
  const developerUser: UserProfile = {
    id: 'usr-dev-alex',
    name: 'Alex Rivera',
    email: 'alex@dev.internal',
    role: 'developer',
  };

  const adminUser: UserProfile = {
    id: 'usr-adm-elena',
    name: 'Elena Vance',
    email: 'evance@security.corp',
    role: 'admin',
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Product Identity Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-slate-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Sandbox Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Isolated development environment provisioning, policy governance, and verification.
          </p>
        </div>

        {/* Responsive 2-Column Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Developer Card */}
          <div
            onClick={() => onSelectUser(developerUser)}
            className="group bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-6 cursor-pointer transition-all shadow-xs hover:shadow-sm flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-700 transition-colors shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Developer
                    </h2>
                    <div className="text-xs text-slate-500 font-medium">
                      Alex Rivera <span className="text-slate-300">·</span> alex@dev.internal
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Dev Role
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Configure isolated development sandboxes, request repo setups, inspect automated verification probes, and download setup manifests.
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Configure templates & test fixtures</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Track 8-stage setup progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Inspect sealed environment reports</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Continue as Developer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Administrator Card */}
          <div
            onClick={() => onSelectUser(adminUser)}
            className="group bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-6 cursor-pointer transition-all shadow-xs hover:shadow-sm flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-700 transition-colors shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Administrator
                    </h2>
                    <div className="text-xs text-slate-500 font-medium">
                      Elena Vance <span className="text-slate-300">·</span> evance@security.corp
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Admin Role
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Authorize pending environment changes, evaluate least-privilege boundaries, enforce security policies, and monitor organizational activity.
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Review and sign off on approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Enforce POL-001 through POL-006</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Execute test scenarios TC1 to TC4</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Continue as Administrator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clean Footer Notice */}
        <div className="text-center text-xs text-slate-400 pt-2">
          Demo authentication mechanism · Backend authorization enforces separation of duties per role.
        </div>
      </div>
    </div>
  );
};
