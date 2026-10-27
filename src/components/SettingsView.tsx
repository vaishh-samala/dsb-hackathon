import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  Cpu,
  Key,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Terminal,
} from 'lucide-react';
import type { UserProfile } from '../types/sandbox.js';

interface SettingsViewProps {
  currentUser: UserProfile;
  onSignOut: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onSignOut }) => {
  const [simulationLatency, setSimulationLatency] = useState<'instant' | 'realistic'>('realistic');
  const [syntheticSeedSize, setSyntheticSeedSize] = useState('50');
  const [requireDualApproval, setRequireDualApproval] = useState(false);
  const [autoVerifyProbes, setAutoVerifyProbes] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Platform Settings & Simulation Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage sandbox daemon policies, developer verification profiles, and simulation parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          Save Preferences
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Simulation preferences updated successfully.</span>
        </div>
      )}

      {/* Grid of Setting Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Session & Persona */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Active Identity & Role</h2>
              <p className="text-[11px] text-slate-500">Security headers dispatched to the API</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Account Name:</span>
              <div className="flex items-center gap-2">
                {currentUser.avatar && (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-slate-300"
                  />
                )}
                <span className="font-semibold text-slate-900">{currentUser.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-700">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Auth Method:</span>
              <span className="font-medium text-slate-800">
                {currentUser.authProvider === 'google' ? 'Google Account (Firebase)' : 'Demo Identity'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Role:</span>
              <span className="font-mono font-medium text-sky-700 uppercase text-[11px]">
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Authorization Token:</span>
              <span className="font-mono text-[11px] text-slate-400">sbx_auth_***_active</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onSignOut}
              className="w-full py-2 px-3 text-xs font-medium text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-center"
            >
              Sign Out & Switch Persona
            </button>
          </div>
        </div>

        {/* Policy Engine Mode */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Policy & Verification Engine</h2>
              <p className="text-[11px] text-slate-500">Deterministic rule enforcement and LLM fallback</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Primary Engine:</span>
                <span className="text-emerald-700 font-semibold font-mono text-[11px]">DETERMINISTIC RULES</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Enforces strict policies (POL-001 through POL-005). Cannot be overridden by LLM output.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Gemini AI Assistant:</span>
                <span className="text-slate-600 font-medium font-mono text-[11px]">STANDBY / ADVISORY</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generates qualitative recommendations when a valid GEMINI_API_KEY is present; falls back cleanly to deterministic policy logic otherwise.
              </p>
            </div>
          </div>
        </div>

        {/* Simulator Latency & Synthetic Data Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Execution Simulation Tuning</h2>
              <p className="text-[11px] text-slate-500">Realistic response timers and fixture generation</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Simulation Response Timing
              </label>
              <select
                value={simulationLatency}
                onChange={(e) => setSimulationLatency(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-slate-400"
              >
                <option value="realistic">Realistic (200ms - 500ms probe latency)</option>
                <option value="instant">Instantaneous (&lt; 20ms)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Default Synthetic Dataset Rows
              </label>
              <select
                value={syntheticSeedSize}
                onChange={(e) => setSyntheticSeedSize(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-slate-400"
              >
                <option value="25">25 Synthetic Rows</option>
                <option value="50">50 Synthetic Rows (Recommended)</option>
                <option value="100">100 Synthetic Rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* Governance & Compliance Guardrails */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Guardrails & Invariants</h2>
              <p className="text-[11px] text-slate-500">Non-bypassable platform security requirements</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoVerifyProbes}
                onChange={(e) => setAutoVerifyProbes(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Automated Post-Setup Smoke Probes</span>
                <p className="text-[11px] text-slate-500">
                  Mandates endpoint 200 OK health check before setting environment status to completed.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={requireDualApproval}
                onChange={(e) => setRequireDualApproval(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Dual Authorization for Elevated Scopes</span>
                <p className="text-[11px] text-slate-500">
                  Requires two distinct administrator reviews when deploy_preview or production target is requested.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
