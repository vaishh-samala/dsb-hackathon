import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Layers,
  Lock,
  Database,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import type { SetupRequest, AccountType } from '../types/sandbox.js';

interface NewSetupViewProps {
  onCreateSetup: (payload: {
    projectName: string;
    template: 'nextjs-saas' | 'node-microservice' | 'python-fastapi' | 'go-worker' | 'custom';
    repoDetails: { url: string; branch: string; visibility: 'private' | 'internal' | 'public' };
    accountType: AccountType;
    sandboxType?: 'isolated-container' | 'microservice-pod' | 'ephemeral-vm' | 'serverless-mock';
    developmentPurpose?: 'feature_development' | 'bugfix_repro' | 'integration_testing' | 'experimentation';
    requestedTools?: string[];
    requestedPermissions: string[];
    sampleDataRequirement: 'synthetic_customers' | 'anonymized_telemetry' | 'seed_fixtures' | 'synthetic_financial' | 'real_production_dump';
  }) => Promise<SetupRequest>;
  onNavigate: (view: any) => void;
}

export const NewSetupView: React.FC<NewSetupViewProps> = ({ onCreateSetup, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form Fields
  const [projectName, setProjectName] = useState('payments-service-dev');
  const [template, setTemplate] = useState<'nextjs-saas' | 'node-microservice' | 'python-fastapi' | 'go-worker' | 'custom'>('node-microservice');
  const [repoUrl, setRepoUrl] = useState('https://github.com/organization/payments-service');
  const [branch, setBranch] = useState('main');
  const [accountType, setAccountType] = useState<AccountType>('development');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'read_code',
    'write_sandbox',
    'execute_tests',
  ]);
  const [sampleDataRequirement, setSampleDataRequirement] = useState<
    'synthetic_customers' | 'anonymized_telemetry' | 'seed_fixtures' | 'synthetic_financial' | 'real_production_dump'
  >('synthetic_customers');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availablePermissions = [
    {
      id: 'read_code',
      label: 'read_code',
      safe: true,
      description: 'Clone repository and inspect code within sandbox boundaries.',
    },
    {
      id: 'write_sandbox',
      label: 'write_sandbox',
      safe: true,
      description: 'Generate local environment files and temporary container mounts.',
    },
    {
      id: 'execute_tests',
      label: 'execute_tests',
      safe: true,
      description: 'Run automated test suites and validation probes inside container.',
    },
    {
      id: 'deploy_preview',
      label: 'deploy_preview',
      safe: true,
      description: 'Expose local loopback port for developer preview.',
    },
    {
      id: 'access_production_db',
      label: 'access_production_db',
      safe: false,
      description: 'Direct production database connectivity (prohibited by policy POL-001).',
    },
    {
      id: 'wildcard_*',
      label: 'wildcard_*',
      safe: false,
      description: 'Unbounded administrative privileges (stripped by policy POL-002).',
    },
  ];

  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!projectName.trim()) {
      errs.projectName = 'Environment name is required.';
    }
    if (!repoUrl.trim()) {
      errs.repoUrl = 'Repository URL is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSubmitFinal = async () => {
    try {
      setIsSubmitting(true);
      await onCreateSetup({
        projectName,
        template,
        repoDetails: {
          url: repoUrl,
          branch,
          visibility: 'internal',
        },
        accountType,
        sandboxType: 'isolated-container',
        developmentPurpose: 'feature_development',
        requestedTools: ['Node.js 20', 'Docker Engine'],
        requestedPermissions: selectedPermissions,
        sampleDataRequirement,
      });
      onNavigate('workflow');
    } catch (err: any) {
      console.error(err);
      setErrors({ form: err.message || 'Failed to submit environment setup request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProdTarget = accountType === 'production';
  const hasDangerousPerms = selectedPermissions.some((p) => p === 'access_production_db' || p === 'wildcard_*');
  const isRealDataSelected = sampleDataRequirement === 'real_production_dump';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header and Step Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {currentStep === 1 ? 'Configure Environment' : 'Review & Submit Setup'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentStep === 1
              ? 'Specify environment archetype, repository bounds, and permissions.'
              : 'Review configuration and deterministic policy checks before submission.'}
          </p>
        </div>

        {/* Clean Step Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 ${
              currentStep === 1
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>1</span>
            <span>Configuration</span>
          </div>
          <span className="text-slate-300">→</span>
          <div
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 ${
              currentStep === 2
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>2</span>
            <span>Review & Policies</span>
          </div>
        </div>
      </div>

      {errors.form && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* STEP 1: CONFIGURATION WITH RESPONSIVE 8/4 GRID */}
      {currentStep === 1 && (
        <form onSubmit={handleProceedToReview}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 cols: Form Inputs */}
            <div className="lg:col-span-8 space-y-4">
              {/* Section 1: Environment Identity & Archetype */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Environment Details
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Environment Identifier <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => {
                        setProjectName(e.target.value);
                        if (errors.projectName) setErrors({ ...errors, projectName: '' });
                      }}
                      placeholder="e.g. payments-service-dev"
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-md text-slate-900 focus:outline-none focus:border-slate-500 font-mono ${
                        errors.projectName ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                    {errors.projectName && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.projectName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Template Archetype
                      </label>
                      <select
                        value={template}
                        onChange={(e: any) => setTemplate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-500"
                      >
                        <option value="node-microservice">Node.js Microservice</option>
                        <option value="nextjs-saas">Next.js Web Application</option>
                        <option value="python-fastapi">Python FastAPI Service</option>
                        <option value="go-worker">Go Background Worker</option>
                        <option value="custom">Custom Service</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Target Tier
                      </label>
                      <select
                        value={accountType}
                        onChange={(e: any) => setAccountType(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs bg-white border rounded-md text-slate-900 focus:outline-none focus:border-slate-500 ${
                          accountType === 'production'
                            ? 'border-red-300 text-red-900 font-semibold'
                            : 'border-slate-200'
                        }`}
                      >
                        <option value="development">Development (Isolated Sandbox)</option>
                        <option value="staging">Staging Testbed</option>
                        <option value="qa">QA Integration</option>
                        <option value="production">Production (Restricted)</option>
                      </select>
                    </div>
                  </div>

                  {accountType === 'production' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Security Policy Notice:</span> Target account is set to production. Policy POL-001 prohibits creating development sandboxes in production clusters.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Repository Bounds */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Repository Configuration
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Repository URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value);
                        if (errors.repoUrl) setErrors({ ...errors, repoUrl: '' });
                      }}
                      placeholder="https://github.com/organization/repo"
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-md text-slate-900 focus:outline-none focus:border-slate-500 font-mono ${
                        errors.repoUrl ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                    {errors.repoUrl && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.repoUrl}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Git Branch
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Permission Boundaries */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Permissions Boundary
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {selectedPermissions.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availablePermissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? perm.safe
                              ? 'bg-slate-50 border-slate-400'
                              : 'bg-red-50/60 border-red-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {perm.label}
                            </span>
                            {!perm.safe && (
                              <span className="text-[10px] font-medium text-red-700 bg-red-100/60 px-1 py-0.2 rounded">
                                High Risk
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Data Fixtures */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Synthetic Fixtures & Mock Data
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fixture Strategy
                  </label>
                  <select
                    value={sampleDataRequirement}
                    onChange={(e: any) => setSampleDataRequirement(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    <option value="synthetic_customers">Synthetic Customers (500 mock profiles)</option>
                    <option value="anonymized_telemetry">Anonymized Event Stream</option>
                    <option value="seed_fixtures">Minimal Seed Fixtures</option>
                    <option value="synthetic_financial">Synthetic Financial Ledger</option>
                    <option value="real_production_dump">Real Customer Dump (Restricted by POL-004)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right 4 cols: Live Environment Preview & Policy Guardrails */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
              {/* Specification Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Specification Summary
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {projectName || 'unnamed-env'}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Template</span>
                    <span className="font-medium text-slate-800">{template}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Target Tier</span>
                    <span className="font-mono font-medium text-slate-800">{accountType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Branch</span>
                    <span className="font-mono text-slate-800">{branch}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Isolation Type</span>
                    <span className="font-medium text-slate-800">Docker Container</span>
                  </div>
                </div>

                {/* Policy Guardrails Status Box */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Automated Policy Pre-Checks
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">POL-001 (Prod Isolation)</span>
                      {isProdTarget ? (
                        <span className="text-red-700 font-semibold font-mono">VIOLATION</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold font-mono">PASS</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">POL-002 (Least Privilege)</span>
                      {hasDangerousPerms ? (
                        <span className="text-amber-700 font-semibold font-mono">STRIPPED</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold font-mono">PASS</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">POL-004 (Synthetic Data)</span>
                      {isRealDataSelected ? (
                        <span className="text-red-700 font-semibold font-mono">PROHIBITED</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold font-mono">PASS</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Review Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Informational Guidance Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Separation of Duties</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  After submission, the setup run will plan steps and request human authorization from an Administrator before creating the sandbox.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: REVIEW & SUBMIT */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Environment Specification */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Environment Specification
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Environment Name</span>
                  <span className="font-semibold text-slate-900 font-mono">{projectName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Template</span>
                  <span className="font-medium text-slate-800">{template}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Target Tier</span>
                  <span className="font-mono font-medium text-slate-800">{accountType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Repository</span>
                  <span className="font-mono text-slate-700 truncate max-w-[220px]">
                    {repoUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Branch</span>
                  <span className="font-mono text-slate-700">{branch}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Fixtures</span>
                  <span className="font-medium text-slate-700">{sampleDataRequirement}</span>
                </div>
              </div>
            </div>

            {/* Permissions & Policy Boundary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Permissions & Policy Boundary
              </h2>
              <div className="space-y-2 text-xs">
                <div className="text-slate-500">Requested Permissions:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPermissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]"
                    >
                      {perm}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-slate-500 font-medium">Policy Verification:</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>POL-003: Idempotent container reuse active</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>POL-005: Admin sign-off mandatory prior to launch</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>POL-006: Redacted credentials evidence sealing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Configuration</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitFinal}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit Environment Request'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
