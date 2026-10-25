import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
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
  onSignIn: (user: UserProfile) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('alex@dev.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      roleLabel: 'Developer Role',
      description: 'Request, configure, and verify isolated container sandboxes with least-privilege scoping.',
      permissions: 'Configure · Test · Inspect Reports',
    },
    {
      user: {
        id: 'usr-adm-elena',
        name: 'Elena Vance',
        email: 'evance@security.corp',
        role: 'admin',
      },
      roleLabel: 'Security Administrator',
      description: 'Authorize environment changes, enforce governance policies, and monitor organizational activity.',
      permissions: 'Authorize · Policies · Audit Stream',
    },
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (trimmed.includes('admin') || trimmed === 'evance@security.corp') {
        onSignIn(demoAccounts[1].user);
      } else {
        onSignIn({
          id: 'usr-custom-' + trimmed.split('@')[0],
          name: trimmed.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
          email: trimmed,
          role: 'developer',
        });
      }
    }, 450);
  };

  const handleQuickSelect = (user: UserProfile) => {
    setEmail(user.email);
    setPassword('demo-session-token');
    setLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      setLoading(false);
      onSignIn(user);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 text-center text-xs text-slate-400">
        <span className="text-sky-400 font-semibold">Sandbox Studio Development Authentication</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>Simulated isolated environment platform with pre-configured developer and administrator credentials</span>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Hero / Architectural Showcase (5 cols on lg) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white block">
                    Sandbox Studio
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
                    <span className="font-semibold text-white">Immutable Audit Manifests</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      SHA-256 sealed setup reports with token masking and compliance metadata.
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
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-slate-900/60">
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Sign in to your account
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select a demonstration persona below or sign in with your engineering credentials.
                </p>
              </div>

              {/* Quick Select Demo Credentials */}
              <div className="mb-6 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Select Demo Credentials
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
                                {user.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">
                              {isDeveloper ? 'Developer' : 'Admin'}
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

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <span className="relative bg-slate-900 px-3 text-[11px] text-slate-400 font-medium">
                  Or enter credentials manually
                </span>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@dev.internal"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-sans"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 pr-10 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Sandbox Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer helper */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Account registration managed by organization admin.</span>
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
                <span>Development Credentials & Access</span>
              </div>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sandbox Studio is currently running with the local development authentication adapter. To access the platform:
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
              You can click either demo card on the sign-in screen to instantly authenticate without remembering a password.
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
