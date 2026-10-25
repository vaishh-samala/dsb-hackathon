import React from 'react';
import { ArrowRight, CircleDashed, FlaskConical, Info } from 'lucide-react';

interface TestCasesViewProps {
  onNavigateRuns: () => void;
}

const officialTestCases = [
  {
    id: 'TC1',
    title: 'Project template',
    outcome: 'Pass',
    input: 'A valid project template, a permitted demo repository, sandbox target, and minimal required permissions.',
    behavior: [
      'Validate the request and prepare the setup plan.',
      'Obtain the required approval.',
      'Create the sandbox and seed synthetic data.',
      'Run smoke login verification and confirm that it passes.',
    ],
    evidence: ['Sandbox ID', 'Approval record', 'Seed status', 'Smoke login output'],
  },
  {
    id: 'TC2',
    title: 'Production account selected by mistake',
    outcome: 'Abort',
    input: 'The target environment is explicitly marked as production.',
    behavior: [
      'Detect the production designation before any provisioning action.',
      'Abort the setup.',
      'Do not create a sandbox, seed data, or modify production.',
    ],
    evidence: ['Policy decision', 'Blocked action record', 'Evidence of zero provisioning actions'],
  },
  {
    id: 'TC3',
    title: 'Sandbox repository already exists',
    outcome: 'Reuse',
    input: 'A matching sandbox and repository configuration already exist.',
    behavior: [
      'Find the existing sandbox.',
      'Check that its configuration matches the requested setup.',
      'Reuse it instead of creating a duplicate.',
      'Verify the existing environment.',
    ],
    evidence: ['Existing sandbox ID', 'Matching configuration fingerprint', 'Evidence of no duplicate creation event'],
  },
  {
    id: 'TC4',
    title: 'Setup report generated',
    outcome: 'Secret-free report',
    input: 'A completed setup with synthetic credentials and sample configuration.',
    behavior: [
      'Generate the setup manifest.',
      'Include setup steps, permissions, approvals, verification results, and unresolved issues.',
      'Exclude passwords, tokens, private keys, and session cookies.',
    ],
    evidence: ['Generated setup manifest', 'Automated secret-scanning results'],
  },
] as const;

export const TestCasesView: React.FC<TestCasesViewProps> = ({ onNavigateRuns }) => (
  <div className="mx-auto w-full max-w-7xl space-y-5 font-sans">
    <header className="flex flex-col justify-between gap-3 border-b border-violet-200/10 pb-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-sky-300" aria-hidden="true" />
          <h1 className="text-xl font-semibold tracking-tight text-white">Official Test Cases</h1>
        </div>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-violet-100/55">
          The four official cases are listed below. Results are not inferred from expected behavior or sample records.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 self-start rounded-lg border border-violet-200/15 bg-violet-300/[0.05] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-violet-100/65 sm:self-auto">
        TC1–TC4 only
      </span>
    </header>

    <div className="flex items-start gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.04] px-3.5 py-3 text-xs leading-relaxed text-sky-100/75">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
      <p>
        <span className="font-semibold text-sky-100">Official execution status: Not Run.</span>{' '}
        This demo has no isolated official test runner or real provisioning infrastructure. Existing simulator examples are not accepted as proof of these cases. Use Setup Runs to inspect actual request records; no case will be marked passed without linked execution evidence.
      </p>
    </div>

    <section aria-label="Exactly four official test cases" className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {officialTestCases.map((testCase) => (
        <article key={testCase.id} className="workflow-inspector flex min-w-0 flex-col rounded-xl border border-violet-300/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="rounded-md border border-sky-300/20 bg-sky-300/[0.07] px-2 py-1 font-mono text-[10px] font-semibold text-sky-200">{testCase.id}</span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-white">{testCase.title}</h2>
                <p className="mt-1 text-[11px] text-violet-100/50">
                  Expected outcome: <span className="font-semibold text-violet-100/80">{testCase.outcome}</span>
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200/15 bg-violet-100/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-slate-300">
              <CircleDashed className="h-3 w-3" aria-hidden="true" />
              Not Run
            </span>
          </div>

          <div className="mt-3 grid min-w-0 gap-3 text-xs sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-violet-200/10 bg-black/10 p-3">
              <h3 className="font-mono text-[9px] uppercase tracking-wider text-violet-100/45">Input</h3>
              <p className="mt-1.5 leading-relaxed text-violet-100/75">{testCase.input}</p>
            </div>
            <div className="min-w-0 rounded-lg border border-violet-200/10 bg-black/10 p-3">
              <h3 className="font-mono text-[9px] uppercase tracking-wider text-violet-100/45">Expected behavior</h3>
              <ol className="mt-1.5 list-inside list-decimal space-y-1 leading-relaxed text-violet-100/75">
                {testCase.behavior.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-violet-200/10 bg-black/10 p-3">
            <h3 className="font-mono text-[9px] uppercase tracking-wider text-violet-100/45">Required evidence</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {testCase.evidence.map((item) => (
                <li key={item} className="rounded-md border border-violet-200/10 bg-violet-100/[0.04] px-2 py-1 text-[10px] text-violet-100/70">{item}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-amber-100/70">
              No linked official execution or evidence is recorded for this case.
            </p>
          </div>
        </article>
      ))}
    </section>

    <div className="flex justify-end">
      <button
        type="button"
        onClick={onNavigateRuns}
        className="inline-flex items-center gap-2 rounded-lg border border-violet-200/15 bg-violet-300/[0.05] px-3 py-2 text-xs font-semibold text-violet-100/80 transition-colors hover:bg-violet-300/10 focus-visible:outline-2 focus-visible:outline-violet-300"
      >
        Browse Setup Runs <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
);
