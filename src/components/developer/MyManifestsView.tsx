import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import type { SetupRequest } from '../../types/sandbox.js';

interface MyManifestsViewProps {
  setups: SetupRequest[];
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

export const MyManifestsView: React.FC<MyManifestsViewProps> = ({
  setups,
  onSelectSetup,
  onNavigate,
}) => {
  const reports = setups.filter((s) => s.manifest);
  const [selectedReportId, setSelectedReportId] = useState<string>(
    reports[0]?.manifest?.manifestId || ''
  );
  const [copied, setCopied] = useState(false);

  const selectedSetup = reports.find((s) => s.manifest?.manifestId === selectedReportId) || reports[0];
  const manifest = selectedSetup?.manifest;

  const handleCopy = () => {
    if (!manifest) return;
    navigator.clipboard.writeText(manifest.exportJson || JSON.stringify(manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!manifest) return;
    const blob = new Blob([manifest.exportJson || JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${manifest.manifestId.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!manifest) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-3 font-sans shadow-xs">
        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
        <h2 className="text-sm font-semibold text-slate-900">No Setup Reports Available</h2>
        <p className="text-xs text-slate-500">
          Once the simulated environment request is approved and its verification stage passes, a downloadable setup report is available here.
        </p>
        <button
          onClick={() => onNavigate('my_setups')}
          className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-block"
        >
          View Environments
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Setup Reports</h1>
            <span className="text-xs font-mono text-slate-500">({selectedSetup.projectName})</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditable records of completed environment executions and verification results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reports.length > 1 && (
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full max-w-full sm:w-60 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-400"
            >
              {reports.map((s) => (
                <option key={s.manifest!.manifestId} value={s.manifest!.manifestId}>
                  {s.projectName} ({s.manifest!.manifestId})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors inline-flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Seal Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800">Content SHA-256:</span>{' '}
            <span className="font-mono text-[11px] text-slate-600 break-all">{manifest.sha256Hash}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono shrink-0">
          Generated: {manifest.generatedAt.slice(0, 10)} {manifest.generatedAt.slice(11, 16)} UTC
        </div>
      </div>

      {/* Verification & Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Environment & Verification Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Environment</div>
            <div className="font-semibold text-slate-900 mt-0.5">{manifest.projectDetails.name}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Template</div>
            <div className="text-slate-800 mt-0.5">{manifest.projectDetails.template}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Verification</div>
            <div className="font-semibold text-emerald-700 mt-0.5">
              {manifest.verificationResult.passed ? '200 OK Verified' : 'Failed'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Latency</div>
            <div className="font-mono text-slate-800 mt-0.5">{manifest.verificationResult.latencyMs}ms</div>
          </div>
        </div>
      </div>

      {/* Sanitized Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sanitized Configuration
          </h2>
          <span className={`text-[11px] font-medium ${manifest.secretScan?.passed ? 'text-emerald-700' : manifest.secretScan ? 'text-red-700' : 'text-amber-700'}`}>
            {manifest.secretScan
              ? `${manifest.secretScan.passed ? 'Automated scan passed' : 'Automated scan failed'} · ${manifest.secretScan.redactedFields} source fields redacted`
              : 'Secret scan unavailable (legacy report)'}
          </span>
        </div>

        <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-1 overflow-x-auto">
          {Object.entries(manifest.sanitizedConfig).map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="text-slate-400">{key}:</span>
              <span className={val.includes('[REDACTED') ? 'text-amber-400' : 'text-slate-200'}>
                "{val}"
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
