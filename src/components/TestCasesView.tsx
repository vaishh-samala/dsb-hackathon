import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  TestTubes,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { SetupRequest } from '../types/sandbox.js';

interface TestCaseResultState {
  passStatus: 'PASS' | 'FAIL';
  actualResult: string;
  evidence: string;
  setup?: SetupRequest;
}

interface TestCasesViewProps {
  onRunTestCase: (tcId: 'TC1' | 'TC2' | 'TC3' | 'TC4') => Promise<SetupRequest>;
  onSelectSetup: (setup: SetupRequest) => void;
  onNavigate: (view: any) => void;
}

export const TestCasesView: React.FC<TestCasesViewProps> = ({
  onRunTestCase,
  onSelectSetup,
  onNavigate,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestCaseResultState>>({});

  const scenarios = [
    {
      id: 'TC1' as const,
      name: 'Standard Environment Provisioning',
      subtitle: 'Valid Project Template & Isolated Sandbox',
      input: 'Template: Next.js Web App · Repo: github.com/organization/cart-service · Account: development · Permissions: [read_code, write_sandbox, execute_tests]',
      expected: 'The simulated setup record reaches completed state and contains a passing smoke-test result.',
      safetyRule: 'POL-001 (Dev Target) · POL-002 (Least Privilege) · POL-005 (Mandatory Approval)',
      defaultEvidence: 'HTTP/1.1 200 OK\n{"status":"UP","synthetic":true,"session":"valid","latencyMs":14}',
    },
    {
      id: 'TC2' as const,
      name: 'Production Target Prevention',
      subtitle: 'Production Account Selected (Hostile Request)',
      input: 'Template: Go Worker · Repo: github.com/organization/banking-ledger · Account: production [RESTRICTED] · Permissions: [read_code, write_sandbox, access_production_db]',
      expected: 'Setup is aborted, no sandbox setup action or container is executed, and clear failure reason is displayed.',
      safetyRule: 'POL-001: Strict Production Isolation · Never create a sandbox for a production account',
      defaultEvidence: 'POLICY_VIOLATION: POL-001 Prohibits sandboxes in production environments.\nTarget: production-primary-cluster\nAction: ABORTED_IMMEDIATELY\nAllocated Containers: 0',
    },
    {
      id: 'TC3' as const,
      name: 'Container Anti-Duplication Reuse',
      subtitle: 'Sandbox Container Already Active',
      input: 'Template: Node.js Microservice · Repo: github.com/organization/analytics-service@main (Active container sbx-worker-existing-09 on port 8089)',
      expected: 'The execution result identifies an existing sandbox as reused.',
      safetyRule: 'POL-003: Anti-Duplication Guard & State Idempotency',
      defaultEvidence: 'ANTI_DUPLICATION_VERIFIED: Found active container sbx-worker-existing-09 on port 8089.\nStrategy: REUSE_EXISTING\nDuplicate Containers Created: 0\nDelta Applied: true',
    },
    {
      id: 'TC4' as const,
      name: 'Report Digest & Secret Masking',
      subtitle: 'Audit Report with Simulated Credentials',
      input: 'Request: Completed development sandbox setup containing simulated raw credentials (Stripe secret key, bearer tokens, DB passwords)',
      expected: 'The setup report is generated with traceable results and zero raw secrets.',
      safetyRule: 'POL-006: Secret Redaction & Report Content Digest',
      defaultEvidence: 'MANIFEST_ID: MNF-TC4-ZERO-SECRETS\nSHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nSECRETS_REDACTED: 4 keys\nPLAIN_TEXT_SECRETS_EXPOSED: 0',
    },
  ];

  const handleExecute = async (tc: typeof scenarios[0]) => {
    try {
      setRunningId(tc.id);
      const setup = await onRunTestCase(tc.id);

      let actualResult = '';
      let passed = false;
      const evidence = `SIMULATED EVIDENCE\n${tc.defaultEvidence}`;

      if (tc.id === 'TC1') {
        passed = setup.status === 'completed' && !!setup.executionResult && setup.smokeTest?.status === 'passed';
        actualResult = passed
          ? `Simulated setup ${setup.executionResult?.sandboxId} completed and its smoke-test result passed.`
          : `Expected completed setup and passing smoke test; received status "${setup.status}" and verification "${setup.smokeTest?.status || 'not run'}".`;
      } else if (tc.id === 'TC2') {
        passed = setup.status === 'blocked' &&
          !setup.executionResult &&
          setup.stages.security_validation.summary?.includes('POL-001') === true;
        actualResult = passed
          ? `Simulated request was blocked by POL-001 before execution.`
          : `Expected a POL-001 block with no execution result; received status "${setup.status}".`;
      } else if (tc.id === 'TC3') {
        passed = setup.executionResult?.reusedExisting === true;
        actualResult = passed
          ? `Simulated execution reused existing sandbox ${setup.executionResult?.sandboxId}.`
          : 'Expected the setup execution result to indicate an existing sandbox was reused.';
      } else if (tc.id === 'TC4') {
        const redactionCheck = setup.manifest?.safetyAuditTrail.find((entry) => entry.ruleId === 'POL-006');
        const containsUnredactedSecret = Object.values(setup.manifest?.sanitizedConfig || {}).some((value) =>
          /(?:sk_(?:live|test)_|gh[pousr]_|Bearer\s+[A-Za-z0-9])/i.test(value)
        );
        passed = !!setup.manifest && redactionCheck?.outcome === 'COMPLIANT' && !containsUnredactedSecret;
        actualResult = passed
          ? `Simulated report ${setup.manifest?.manifestId} includes a passing redaction audit and no detected raw credential patterns.`
          : 'Expected a generated report with a passing POL-006 audit and no detected raw credential patterns.';
      }

      setResults((prev) => ({
        ...prev,
        [tc.id]: {
          passStatus: passed ? 'PASS' : 'FAIL',
          actualResult,
          evidence,
          setup,
        },
      }));
    } catch (err: any) {
      console.error(err);
      setResults((prev) => ({
        ...prev,
        [tc.id]: {
          passStatus: 'FAIL',
          actualResult: `Error: ${err.message}`,
          evidence: 'Execution threw unexpected exception.',
        },
      }));
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    for (const sc of scenarios) {
      await handleExecute(sc);
    }
  };

  const passedCount = Object.values(results).filter((r) => r.passStatus === 'PASS').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Verification Scenarios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic simulator scenarios for lifecycle and policy behavior. Results validate the returned demo state, not real containers or external services.
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3 text-xs text-blue-900">
          Test evidence below is generated fixture text for this in-memory simulation; it is not captured from a live service.
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-600 font-medium">
            {passedCount} / {scenarios.length} Evaluated
          </span>
          <button
            onClick={handleRunAll}
            disabled={runningId !== null}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run All Scenarios</span>
          </button>
        </div>
      </div>

      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {scenarios.map((tc) => {
          const res = results[tc.id];
          const isRunning = runningId === tc.id;

          return (
            <div
              key={tc.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {tc.id}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900">
                        {tc.name}
                      </h2>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {tc.subtitle}
                    </div>
                  </div>

                  {res && (
                    <div
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                        res.passStatus === 'PASS'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {res.passStatus === 'PASS' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span>{res.passStatus}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">
                      Evaluation Input:
                    </span>
                    <p className="text-slate-700 font-mono text-[11px] mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                      {tc.input}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">
                      Expected Policy Behavior:
                    </span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      {tc.expected}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-600">Governing Policy:</span>{' '}
                    <span>{tc.safetyRule}</span>
                  </div>
                </div>

                {/* Simulator result and evidence fixture */}
                {res && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">
                        Observed Simulator Result:
                      </span>
                      <p className="text-slate-800 font-medium text-xs mt-0.5">
                        {res.actualResult}
                      </p>
                    </div>

                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto max-h-36">
                      <div className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 pb-1 mb-1">
                        Simulated Evidence Fixture
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed">{res.evidence}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  disabled={isRunning}
                  onClick={() => handleExecute(tc)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isRunning ? 'Evaluating...' : 'Run Scenario'}</span>
                </button>

                {res?.setup && (
                  <button
                    onClick={() => {
                      if (res.setup) {
                        onSelectSetup(res.setup);
                        onNavigate('workflow_monitoring');
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                  >
                    <span>View Setup Run</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
