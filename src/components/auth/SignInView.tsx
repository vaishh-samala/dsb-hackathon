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
  Loader2,
  Sparkles,
  Layers,
  Database,
} from 'lucide-react';
import type { UserProfile } from '../../types/sandbox.js';
import {
  signInWithGoogle,
  isFirebaseConfigured,
  firebaseConfig,
} from '../../lib/firebase.js';

interface SignInViewProps {
  onSignIn: (user: UserProfile) => Promise<void>;
  onGoogleSignInSuccess: (googleUser: any) => Promise<void>;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSignIn,
  onGoogleSignInSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDemoPersona, setSelectedDemoPersona] = useState<'developer' | 'admin'>('developer');

  const demoAccounts: Record<'developer' | 'admin', {
    user: UserProfile;
    roleLabel: string;
    description: string;
    permissions: string;
  }> = {
    developer: {
      user: {
        id: 'usr-dev-alex',
        name: 'Alex Rivera',
        email: 'alex@dev.internal',
        role: 'developer',
        authProvider: 'demo',
        sessionMode: 'demo',
      },
      roleLabel: 'Demo Developer (Alex Rivera)',
      description: 'Preloaded sample projects, simulated execution pipeline, smoke test results, and verifiable manifests.',
      permissions: 'Preloaded Dummy Data',
    },
    admin: {
      user: {
        id: 'usr-adm-elena',
        name: 'Elena Vance',
        email: 'evance@security.corp',
        role: 'admin',
        authProvider: 'demo',
        sessionMode: 'demo',
      },
      roleLabel: 'Demo Administrator (Elena Vance)',
      description: 'Pending approvals queue, least-privilege policy reviews, dual-authorization checks, and governance logs.',
      permissions: 'Preloaded Dummy Data',
    },
  };

  const handleDemoLogin = async (personaKey: 'developer' | 'admin' = selectedDemoPersona) => {
    if (isDemoLoading || isGoogleLoading) return;
    setErrorMessage(null);
    setIsDemoLoading(true);

    try {
      const persona = demoAccounts[personaKey];
      await onSignIn(persona.user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Demo sign in failed.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    if (isGoogleLoading || isDemoLoading) return;
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      if (!isFirebaseConfigured) {
        throw new Error(
          'Firebase Authentication is not configured yet. Please verify your Firebase settings.'
        );
      }
      const firebaseUser = await signInWithGoogle();
      await onGoogleSignInSuccess(firebaseUser);
    } catch (err: any) {
      console.error('[SignInView] Google Sign-In error:', err);
      setErrorMessage(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#100b2e] text-slate-100 flex flex-col justify-between font-sans selection:bg-violet-500 selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-[#0b0722] border-b border-violet-950 px-4 py-2 text-center text-xs text-slate-400">
        <span className="text-sky-400 font-semibold">Sandbox Studio</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>Choose between an instant populated Demo session or a clean Google-authenticated workspace</span>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Hero / Architecture Showcase (5 cols on lg) */}
          <div className="login-hero lg:col-span-5 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-violet-300/15 relative bg-gradient-to-br from-[#120d33] via-[#0b0824] to-[#120d33]">
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
                  Automate repository onboarding, analyze permission scopes with least-privilege checks, mandate human sign-off, and seal tamper-evident setup manifests.
                </p>
              </div>

              {/* Architectural Feature Highlights */}
              <div className="pt-4 space-y-3.5 text-xs text-slate-300">
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

            {/* Architecture Badge */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>ENGINE: DETERMINISTIC POLICY (v2.4)</span>
              {isFirebaseConfigured && (
                <span className="text-emerald-400 flex items-center gap-1 font-sans text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Firebase Auth Ready
                </span>
              )}
            </div>
          </div>

          {/* Right Form & Auth Switcher (7 cols on lg) */}
          <div className="login-panel lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-slate-900/60">
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Sign in to Sandbox Studio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your session type. Demo data and authenticated accounts are strictly isolated.
                </p>
              </div>

              {/* Error Message Banner */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold text-red-300">Authentication Error:</span>
                      <p className="mt-0.5 leading-relaxed text-red-200">{errorMessage}</p>
                    </div>
                  </div>
                  {errorMessage.includes('authorized domain') && (
                    <div className="pl-6 pt-1 text-[11px] text-red-300">
                      <span>Add authorized domain: </span>
                      <code className="px-1.5 py-0.5 bg-red-900/60 rounded text-white font-mono select-all">
                        {window.location.hostname}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* TWO SEPARATE LOGIN EXPERIENCES */}
              <div className="space-y-5">
                {/* 1. DEMO VERSION LOGIN (PRELOADED DUMMY DATA) */}
                <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 hover:border-violet-500/50 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">
                            Demo Version Login
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            Sample Data
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Explore with preloaded dummy projects, workflows, and audit history.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Persona Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDemoPersona('developer')}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] border transition-all cursor-pointer ${
                        selectedDemoPersona === 'developer'
                          ? 'bg-slate-800 border-sky-500/60 text-white font-medium'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-semibold">Developer</span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">Alex Rivera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDemoPersona('admin')}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] border transition-all cursor-pointer ${
                        selectedDemoPersona === 'admin'
                          ? 'bg-slate-800 border-emerald-500/60 text-white font-medium'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold">Administrator</span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">Elena Vance</span>
                    </button>
                  </div>

                  {/* Demo Login Button */}
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(selectedDemoPersona)}
                    disabled={isDemoLoading || isGoogleLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDemoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Opening Demo Workspace...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Launch Demo Version ({selectedDemoPersona === 'developer' ? 'Developer' : 'Administrator'})</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <span className="relative bg-slate-900 px-3 text-[11px] text-slate-400 font-medium">
                    Or sign in to your real workspace
                  </span>
                </div>

                {/* 2. CONTINUE WITH GOOGLE (CLEAN REAL-USER EXPERIENCE) */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-300">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">
                            Live Personal Workspace
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Clean State
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Clean dashboard with zero dummy data. Build and save your own environments.
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    disabled={isGoogleLoading || isDemoLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-md shadow-black/20 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                        <span>Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        {/* Official Google 'G' Logo SVG */}
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span className="tracking-tight">Continue with Google</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                    New users start with a clean dashboard (&ldquo;No projects yet&rdquo;). Returning users see only their saved records.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer info & modal toggle */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Firebase Auth: <code className="font-mono text-slate-400">{firebaseConfig.projectId || 'sandbox-studio-1533a'}</code></span>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="hover:text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Configuration Status</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Setup Info Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Firebase Authentication Details</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Sandbox Studio provides strict separation between Demo Mode and Google Authenticated sessions.
              </p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-400">Current Configuration:</div>
                <div className="text-slate-300">Project ID: <span className="text-sky-300">{firebaseConfig.projectId || 'None'}</span></div>
                <div className="text-slate-300">Auth Domain: <span className="text-sky-300">{firebaseConfig.authDomain || 'None'}</span></div>
                <div className="text-slate-300">Status: <span className={isFirebaseConfigured ? 'text-emerald-400' : 'text-amber-400'}>{isFirebaseConfigured ? 'Configured & Active' : 'Missing Credentials'}</span></div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Authorized Domains Reminder:</span>
                <p>
                  Ensure your app domain (<code className="text-white font-mono">{window.location.hostname}</code>) is added in Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        <span>Sandbox Studio · Isolated Development Environment Provisioning & Policy Governance</span>
      </footer>
    </div>
  );
};
