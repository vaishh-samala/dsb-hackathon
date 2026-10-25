import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  CheckCircle2,
  Lock,
  Boxes,
  ShieldCheck,
  ChevronRight,
  Terminal,
  Layers,
} from 'lucide-react';
import type { SetupRequest } from '../types/sandbox.js';

interface SetupManifestViewProps {
  setup: SetupRequest | null;
  allSetups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onGenerateManifest: (setupId: string) => Promise<void>;
  onNavigate: (view: any) => void;
}

export const SetupManifestView: React.FC<SetupManifestViewProps> = ({
  setup,
  allSetups,
  onSelectSetup,
  onGenerateManifest,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'operations' | 'config'>('summary');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!setup) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3 font-sans shadow-xs">
        <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
        <h2 className="text-sm font-semibold text-slate-900">No Environment Selected</h2>
        <p className="text-xs text-slate-500">
          Select an environment to view its setup report.
        </p>
      </div>
    );
  }

  const manifest = setup.manifest;

  const handleCopy = () => {
    if (!manifest) return;
    const content = manifest.exportJson || JSON.stringify(manifest, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!manifest) return;
    const content = manifest.exportJson || JSON.stringify(manifest, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setup-report-${setup.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await onGenerateManifest(setup.id);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Setup Report: {setup.projectName}
            </h1>
            <span className="text-xs font-mono text-slate-500">({setup.id})</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditable record of environment configuration, execution, verification, and policy compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allSetups.length > 1 && (
            <select
              value={setup.id}
              onChange={(e) => {
                const target = allSetups.find((s) => s.id === e.target.value);
                if (target) onSelectSetup(target);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-400 shadow-xs"
            >
              {allSetups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.projectName} ({s.manifest ? 'Report Generated' : 'Pending'})
                </option>
              ))}
            </select>
          )}

          {manifest && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors inline-flex items-center gap-1 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!manifest ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-xs">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-900">Report Not Generated Yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This setup run has no report record yet. Complete verification to generate a downloadable report with a SHA-256 content digest.
          </p>
          <button
            disabled={isGenerating}
            onClick={handleGenerate}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            {isGenerating ? 'Generating...' : 'Generate Setup Report'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Integrity Seal Hero Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    Simulator Report Record
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {manifest.manifestId}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-xl">
                  Content SHA-256: {manifest.sha256Hash}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono text-left sm:text-right shrink-0">
              Generated {manifest.generatedAt.slice(0, 10)} {manifest.generatedAt.slice(11, 16)}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-200 flex items-center gap-6 text-xs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'summary'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Summary & Verification
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'operations'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed Operations ({manifest.executedActions.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'config'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sanitized Configuration & Redaction
            </button>
          </div>

          {/* TAB 1: SUMMARY (Responsive 2-Column Grid) */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Environment Parameters */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Environment Specification
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Environment</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {manifest.projectDetails.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Template</span>
                    <span className="font-medium text-slate-800">
                      {manifest.projectDetails.template}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Target Tier</span>
                    <span className="font-mono font-medium text-slate-800">
                      {manifest.projectDetails.accountType}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Repository</span>
                    <span className="font-mono text-slate-700 truncate max-w-[240px]">
                      {manifest.projectDetails.repoUrl}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Branch</span>
                    <span className="font-mono text-slate-700">
                      {manifest.projectDetails.branch}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification & Probe Results */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Verification Probes
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Endpoint URL</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {manifest.verificationResult.endpoint}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Verification Result</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {manifest.verificationResult.passed ? 'PASSED' : 'FAILED'} (HTTP {manifest.verificationResult.statusCode})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Probe Latency</span>
                    <span className="font-mono text-slate-800">
                      {manifest.verificationResult.latencyMs} ms
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Policy Compliance Score</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {manifest.policyComplianceScore}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Secret Redaction</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Zero Raw Secrets Exposed (POL-006)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONS */}
          {activeTab === 'operations' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Step</th>
                    <th className="py-2.5 px-4 font-semibold">Operation</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold font-mono">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {manifest.executedActions.map((op, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {op.action}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{op.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                        {op.executedAt ? op.executedAt.slice(11, 19) : '00:00:00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: CONFIG & REDACTION */}
          {activeTab === 'config' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="text-xs font-semibold text-slate-700">
                  Sanitized Environment Variables & Credentials
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Policy POL-006 Enforced
                </span>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96">
                <pre className="leading-relaxed">
                  {manifest.exportJson || JSON.stringify(manifest, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
