import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Shield,
  ArrowRight,
  Lock,
  Terminal,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Info,
} from 'lucide-react';
import type { UserProfile } from '../../types/sandbox.js';

interface SignInViewProps {
  onSignIn: (user: UserProfile) => Promise<void>;
}

export const SignInView: React.FC<SignInViewProps> = ({ onSignIn }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const demoAccounts: {
    user: UserProfile;
    roleLabel: string;
    description: string;
    permissions: string;
  }[] = [
    {
      user: {
        id: 'usr-dev-alex',
        name: 'Alex Rivera',
        email: 'alex@dev.internal',
        role: 'developer',
      },
      roleLabel: 'Demo Developer',
      description: 'Create demo environment requests and inspect their simulator workflows.',
      permissions: 'Demo data only',
    },
    {
      user: {
        id: 'usr-adm-elena',
        name: 'Elena Vance',
        email: 'evance@security.corp',
        role: 'admin',
      },
      roleLabel: 'Demo Administrator',
      description: 'Review demo requests, record decisions, and inspect policy activity.',
      permissions: 'Demo data only',
    },
  ];

  const handleQuickSelect = async (user: UserProfile) => {
    setErrorMessage(null);
    try {
      await onSignIn(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Demo sign in failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#100b2e] text-slate-100 flex flex-col justify-between font-sans selection:bg-violet-500 selection:text-white">
      {/* Main Split Layout */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Hero / Architectural Showcase (5 cols on lg) */}
          <div className="login-hero lg:col-span-5 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-violet-300/15 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white block">
                    Choose a demo account
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Environment Governance Platform
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Deterministic sandbox provisioning for modern engineering teams.
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automate repository onboarding, analyze permission scopes, enforce hard security invariants, and mandate human sign-off before configuration changes take effect.
                </p>
              </div>

              {/* Architectural Feature Highlights */}
              <div className="pt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Terminal className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Automated Verification Probes</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deterministic policy validation and 8-stage sandbox progression pipeline.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Mandatory Human Sign-off</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Privilege expansion and database seeding require explicit administrative authorization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Verifiable Setup Reports</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Simulator reports include a SHA-256 digest, token masking, and compliance metadata.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Architecture Badge */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
              ENGINE: DETERMINISTIC POLICY RUNNER (v2.4)
            </div>
          </div>

          {/* Right Form & Demo Switcher (7 cols on lg) */}
          <div className="login-panel lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Sandbox Studio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Use an isolated demo identity to explore the developer or administrator workspace.
                </p>
              </div>

              {/* Explicit demo-only account selection */}
              <div className="mb-6 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Demo accounts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoAccounts.map(({ user, roleLabel, description, permissions }) => {
                    const isDeveloper = user.role === 'developer';
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleQuickSelect(user)}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800/90 hover:border-slate-700 text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                  isDeveloper
                                    ? 'bg-sky-500/20 text-sky-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {isDeveloper ? <User className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs font-semibold text-white group-hover:text-sky-300">
                                {roleLabel}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">
                              Demo only
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {user.email}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                            {description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{permissions}</span>
                          <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            Sign in <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-slate-500">
                Demo identities use synthetic in-memory records and are not production authentication.
              </p>
            </div>

            {/* Footer helper */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Demo identities are not verified and should not be used for production access.</span>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="hover:text-slate-400 transition-colors inline-flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Help & Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery / Access Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Demo Access Information</span>
              </div>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The local demo adapter creates a session without verifying identity or connecting to an authentication provider. Use one of these demo personas:
            </p>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-sky-400">Developer Account:</span>
                <div className="font-mono text-[11px] text-slate-400">alex@dev.internal (Alex Rivera)</div>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="font-semibold text-emerald-400">Administrator Account:</span>
                <div className="font-mono text-[11px] text-slate-400">evance@security.corp (Elena Vance)</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Demo sessions are for local evaluation only. Do not use this authentication adapter to protect a production deployment.
            </p>

            <button
              type="button"
              onClick={() => setShowRecoveryModal(false)}
              className="w-full py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Subtle Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        <span>Sandbox Studio · Isolated Development Environment Provisioning & Policy Governance</span>
      </footer>
    </div>
  );
};
