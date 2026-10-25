/**
 * Sandbox Studio
 * Isolated Development Environment Provisioning & Governance
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, TopHeader } from './components/Navigation.js';
import { SignInView } from './components/auth/SignInView.js';
import { SettingsView } from './components/SettingsView.js';
import { useAppRoute, navigateTo } from './utils/router.js';

// Developer Views
import { DeveloperDashboardView } from './components/DeveloperDashboardView.js';
import { NewSetupView, type SetupFormPayload } from './components/NewSetupView.js';
import { MyRequestsView } from './components/developer/MyRequestsView.js';
import { SetupResultsView } from './components/developer/SetupResultsView.js';
import { MyManifestsView } from './components/developer/MyManifestsView.js';

// Shared / Pipeline Views
import { AgentWorkflowView } from './components/AgentWorkflowView.js';

// Admin Views
import { AdminDashboardView } from './components/AdminDashboardView.js';
import { ApprovalQueueView } from './components/admin/ApprovalQueueView.js';
import { AllSetupsView } from './components/admin/AllSetupsView.js';
import { SecurityPoliciesView } from './components/admin/SecurityPoliciesView.js';
import { TestCasesView } from './components/TestCasesView.js';
import { SetupManifestView } from './components/SetupManifestView.js';
import { AuditLogsView } from './components/AuditLogsView.js';

import { CheckCircle2, AlertTriangle, Info, ShieldAlert, ArrowRight } from 'lucide-react';
import type { SetupRequest, AccountType, UserRole, UserProfile, AuditLogEvent } from './types/sandbox.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sbx_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [route, navigate] = useAppRoute();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [setups, setSetups] = useState<SetupRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sign in handler
  const handleSignIn = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('sbx_active_user', JSON.stringify(user));
    navigate('/overview');
    showNotification(`Signed in as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Developer'})`, 'info');
  };

  // Sign out handler
  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('sbx_active_user');
    navigate('/login');
    showNotification('Signed out from Sandbox Studio.', 'info');
  };

  // Fetch setups and logs scoped to active role
  const fetchData = async (user: UserProfile) => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        'x-user-role': user.role,
        'x-user-id': user.id,
        'x-user-name': user.name,
      };

      const [setupsRes, logsRes] = await Promise.all([
        fetch('/api/setups', { headers }),
        fetch('/api/audit-logs'),
      ]);

      if (setupsRes.ok) {
        const setupsData: SetupRequest[] = await setupsRes.json();
        setSetups(setupsData);
        if (setupsData.length > 0 && !activeSetupId) {
          const pending = setupsData.find((s) => s.status === 'awaiting_approval');
          setActiveSetupId((pending || setupsData[0]).id);
        }
      }

      if (logsRes.ok) {
        const logsData: AuditLogEvent[] = await logsRes.json();
        setAuditLogs(logsData);
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Could not connect to sandbox daemon.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData(currentUser);
    }
  }, [currentUser]);

  // Keep route synced with activeSetupId if on /environments/:id
  useEffect(() => {
    if (route.path === '/environments/:id' && route.id) {
      setActiveSetupId(route.id);
    }
  }, [route]);

  const activeSetup = setups.find((s) => s.id === activeSetupId) || setups[0] || null;

  const refreshAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const logsData: AuditLogEvent[] = await res.json();
        setAuditLogs(logsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSetup = async (payload: {
    projectName: string;
    template: 'nextjs-saas' | 'node-microservice' | 'python-fastapi' | 'go-worker' | 'custom';
    repoDetails: { url: string; branch: string; visibility: 'private' | 'internal' | 'public' };
    accountType: AccountType;
    sandboxType?: 'isolated-container' | 'microservice-pod' | 'ephemeral-vm' | 'serverless-mock';
    developmentPurpose?: 'feature_development' | 'bugfix_repro' | 'integration_testing' | 'experimentation';
    requestedTools?: string[];
    requestedPermissions: string[];
    sampleDataRequirement: 'synthetic_customers' | 'anonymized_telemetry' | 'seed_fixtures' | 'synthetic_financial' | 'real_production_dump';
  }): Promise<SetupRequest> => {
    if (!currentUser) throw new Error('Not authenticated');

    const res = await fetch('/api/setups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
        'x-user-name': currentUser.name,
      },
      body: JSON.stringify({
        ...payload,
        submittedBy: currentUser,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initialize setup');
    }

    const created: SetupRequest = await res.json();
    setSetups((prev) => [created, ...prev]);
    setActiveSetupId(created.id);
    await refreshAuditLogs();
    showNotification(`Environment request ${created.id} submitted.`);
    navigate(`/environments/${created.id}`);
    return created;
  };

  const handleApprove = async (setupId: string, reviewerName: string, comment: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    const existing = setups.find((s) => s.id === setupId);
    if (existing?.status === 'approved') {
      showNotification(`Setup ${setupId} is already approved.`);
      return;
    }

    const res = await fetch(`/api/setups/${setupId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
        'x-user-name': reviewerName || currentUser.name,
      },
      body: JSON.stringify({
        reviewerName: reviewerName || currentUser.name,
        reviewerEmail: currentUser.email,
        comment,
        role: currentUser.role,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Approval rejected by authorization policy', 'error');
      await refreshAuditLogs();
      throw new Error(err.error || 'Failed to approve');
    }

    const data = await res.json();
    const updated: SetupRequest = data.setup;
    if (updated) {
      setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
      setActiveSetupId(updated.id);
    }
    await refreshAuditLogs();
    showNotification(`Authorization confirmed for ${setupId}.`);
  };

  const handleReject = async (setupId: string, reviewerName: string, reason: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    const existing = setups.find((s) => s.id === setupId);
    if (existing?.status === 'rejected') {
      showNotification(`Setup ${setupId} is already rejected.`);
      return;
    }

    const res = await fetch(`/api/setups/${setupId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
        'x-user-name': reviewerName || currentUser.name,
      },
      body: JSON.stringify({
        reviewerName: reviewerName || currentUser.name,
        reason,
        role: currentUser.role,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Rejection failed', 'error');
      await refreshAuditLogs();
      throw new Error(err.error || 'Failed to reject');
    }

    const data = await res.json();
    const updated: SetupRequest = data.setup;
    setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
    setActiveSetupId(updated.id);
    await refreshAuditLogs();
    showNotification(`Environment request ${setupId} rejected.`, 'info');
  };

  const handleRequestChanges = async (setupId: string, reviewerName: string, comment: string) => {
    if (!currentUser) throw new Error('Not authenticated');
    const res = await fetch(`/api/setups/${setupId}/request-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
        'x-user-name': reviewerName || currentUser.name,
      },
      body: JSON.stringify({ reviewerName: reviewerName || currentUser.name, comment, role: currentUser.role }),
    });
    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Could not request changes', 'error');
      throw new Error(err.error || 'Could not request changes');
    }
    const data = await res.json();
    const updated: SetupRequest = data.setup;
    setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
    setActiveSetupId(updated.id);
    await refreshAuditLogs();
    showNotification(`Changes requested for ${setupId}.`, 'info');
  };

  const handleResubmitSetup = async (setupId: string, payload: SetupFormPayload) => {
    if (!currentUser) throw new Error('Not authenticated');
    const res = await fetch(`/api/setups/${setupId}/resubmit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
        'x-user-name': currentUser.name,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Could not resubmit request');
    }
    const data = await res.json();
    const updated: SetupRequest = data.setup;
    setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
    setActiveSetupId(updated.id);
    await refreshAuditLogs();
    showNotification(
      updated.status === 'blocked'
        ? `Request ${setupId} was blocked by policy. Review the reason before submitting another request.`
        : `Request ${setupId} was resubmitted for administrator review.`,
      updated.status === 'blocked' ? 'error' : 'success'
    );
    navigate(`/environments/${updated.id}`);
    return updated;
  };

  const handleExecuteSetup = async (setupId: string) => {
    const res = await fetch(`/api/setups/${setupId}/execute`, {
      method: 'POST',
      headers: {
        'x-user-role': currentUser?.role || 'developer',
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to execute');
    }

    const data = await res.json();
    const updated: SetupRequest = data.setup;
    setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
    setActiveSetupId(updated.id);
    await refreshAuditLogs();
    showNotification(
      `Simulator recorded ${updated.executionResult?.sandboxId} on port ${updated.executionResult?.containerPort}; no container was started.`
    );
  };

  const handleRunSmokeTest = async (setupId: string) => {
    const res = await fetch(`/api/setups/${setupId}/smoke-test`, {
      method: 'POST',
      headers: {
        'x-user-role': currentUser?.role || 'developer',
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to run verification');
    }

    const data = await res.json();
    const updated: SetupRequest = data.setup;
    setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
    setActiveSetupId(updated.id);
    await refreshAuditLogs();
    showNotification(`Simulated verification for ${setupId} returned the configured 200 OK result.`);
  };

  const handleGenerateManifest = async (setupId: string) => {
    const res = await fetch(`/api/setups/${setupId}/manifest`, {
      method: 'POST',
      headers: {
        'x-user-role': currentUser?.role || 'developer',
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate report');
    }

    const data = await res.json();
    const updated: SetupRequest = data.setup;
    setSetups((prev) => prev.map((s) => (s.id === setupId ? updated : s)));
    setActiveSetupId(updated.id);
    await refreshAuditLogs();
    showNotification(`Simulated setup report generated with SHA-256 evidence metadata.`);
  };

  const handleRunTestCase = async (tcId: 'TC1' | 'TC2' | 'TC3' | 'TC4'): Promise<SetupRequest> => {
    const res = await fetch(`/api/test-cases/run/${tcId}`, {
      method: 'POST',
      headers: {
        'x-user-role': currentUser?.role || 'admin',
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Failed to run ${tcId}`);
    }

    const data = await res.json();
    const createdSetup: SetupRequest = data.setup;
    setSetups((prev) => [createdSetup, ...prev]);
    setActiveSetupId(createdSetup.id);
    await refreshAuditLogs();
    showNotification(`${tcId} executed: ${data.message}`);
    return createdSetup;
  };

  // If unauthenticated or on /login, show the Sign-In page
  if (!currentUser || route.path === '/login') {
    return <SignInView onSignIn={handleSignIn} />;
  }

  const pendingApprovalCount = setups.filter((s) => s.status === 'awaiting_approval').length;
  const isDev = currentUser.role === 'developer';

  // Helper to navigate and change view smoothly
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Enterprise Dark Left Sidebar */}
      <Sidebar
        currentPath={window.location.pathname}
        onNavigate={handleNavigate}
        activeSetup={activeSetup}
        pendingApprovalCount={pendingApprovalCount}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Top Header Bar */}
      <TopHeader
        currentPath={window.location.pathname}
        onNavigate={handleNavigate}
        activeSetup={activeSetup}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs shadow-lg flex items-center gap-2.5 bg-white ${
              notification.type === 'success'
                ? 'border-emerald-200 text-emerald-900'
                : notification.type === 'error'
                ? 'border-red-200 text-red-900'
                : 'border-slate-200 text-slate-900'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-sky-600 shrink-0" />}
            <span className="font-semibold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && setups.length === 0 ? (
            <div className="text-center py-24 text-xs font-mono text-slate-400">
              Loading environments and governance state...
            </div>
          ) : (
            <>
              {/* ROUTE: /overview */}
              {route.path === '/overview' && (
                isDev ? (
                  <DeveloperDashboardView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onNavigate={(target) => {
                      if (target === 'new_setup') navigate('/environments/new');
                      else if (target === 'my_manifests') navigate('/reports');
                      else navigate('/environments');
                    }}
                  />
                ) : (
                  <AdminDashboardView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    onNavigate={(target) => {
                      if (target === 'approval_queue') navigate('/approvals');
                      else if (target === 'test_cases') navigate('/scenarios');
                      else navigate('/environments');
                    }}
                    currentRole="admin"
                  />
                )
              )}

              {/* ROUTE: /environments/new */}
              {route.path === '/environments/new' && (
                <NewSetupView
                  onCreateSetup={handleCreateSetup}
                  onNavigate={(target) => {
                    if (target === 'dev_dashboard') navigate('/overview');
                    else navigate('/environments');
                  }}
                />
              )}

              {/* ROUTE: /environments */}
              {route.path === '/environments' && (
                isDev ? (
                  <MyRequestsView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onReviseSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onNavigate={(target) => {
                      if (target === 'new_setup') navigate('/environments/new');
                      else navigate('/overview');
                    }}
                  />
                ) : (
                  <AllSetupsView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onNavigate={(target) => {
                      if (target === 'approval_queue') navigate('/approvals');
                      else navigate('/overview');
                    }}
                  />
                )
              )}

              {/* ROUTE: /environments/:id */}
              {route.path === '/environments/:id' && (
                <AgentWorkflowView
                  setup={activeSetup}
                  allSetups={setups}
                  onSelectSetup={(s) => {
                    setActiveSetupId(s.id);
                    navigate(`/environments/${s.id}`);
                  }}
                  onNavigate={(target) => {
                    if (target === 'new_setup') navigate('/environments/new');
                    else if (target === 'my_setups' || target === 'all_setups') navigate('/environments');
                    else navigate('/overview');
                  }}
                  onExecuteSetup={handleExecuteSetup}
                  onRunSmokeTest={handleRunSmokeTest}
                  onGenerateManifest={handleGenerateManifest}
                  currentRole={currentUser.role}
                />
              )}

              {/* ROUTE: /approvals (Admin Only) */}
              {route.path === '/approvals' && (
                !isDev ? (
                  <ApprovalQueueView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    onNavigate={(target) => {
                      if (target === 'security_policies') navigate('/policies');
                      else navigate('/overview');
                    }}
                  />
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4 shadow-sm">
                    <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                    <h2 className="text-base font-bold text-slate-900">Administrator Authorization Required</h2>
                    <p className="text-xs text-slate-600">
                      The Approval Queue is restricted to security administrators. Your developer account can request environments and inspect verification reports.
                    </p>
                    <button
                      onClick={() => navigate('/overview')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Return to Developer Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              )}

              {/* ROUTE: /policies */}
              {route.path === '/policies' && (
                <SecurityPoliciesView
                  setups={setups}
                  onNavigate={(target) => {
                    if (target === 'admin_dashboard' || target === 'dev_dashboard') navigate('/overview');
                    else navigate('/environments');
                  }}
                />
              )}

              {/* ROUTE: /scenarios */}
              {route.path === '/scenarios' && (
                <TestCasesView
                  onRunTestCase={handleRunTestCase}
                  onSelectSetup={(s) => {
                    setActiveSetupId(s.id);
                    navigate(`/environments/${s.id}`);
                  }}
                  onNavigate={(target) => navigate('/overview')}
                />
              )}

              {/* ROUTE: /reports */}
              {route.path === '/reports' && (
                isDev ? (
                  <MyManifestsView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/environments/${s.id}`);
                    }}
                    onNavigate={(target) => navigate('/overview')}
                  />
                ) : (
                  <SetupManifestView
                    setup={activeSetup}
                    allSetups={setups}
                    onSelectSetup={(s) => setActiveSetupId(s.id)}
                    onGenerateManifest={handleGenerateManifest}
                    onNavigate={(target) => navigate('/overview')}
                  />
                )
              )}

              {/* ROUTE: /audit */}
              {route.path === '/audit' && (
                <AuditLogsView
                  logs={auditLogs}
                  onSelectRequestId={(id) => {
                    const target = setups.find((s) => s.id === id);
                    if (target) {
                      setActiveSetupId(target.id);
                      navigate(`/environments/${target.id}`);
                    }
                  }}
                />
              )}

              {/* ROUTE: /settings */}
              {route.path === '/settings' && (
                <SettingsView
                  currentUser={currentUser}
                  onSignOut={handleSignOut}
                />
              )}
            </>
          )}
        </main>

        {/* Clean Enterprise Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 px-4 sm:px-6 lg:px-8 mt-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Sandbox Studio</span>
              <span aria-hidden="true">·</span>
              <span>Isolated Development Environment Bootstrapper</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 font-mono text-[11px]">In-Memory Policy Engine</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-700 font-medium">Policy checks active</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => navigate('/settings')}
                className="text-slate-600 hover:text-slate-900 underline"
              >
                Settings
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900 underline"
              >
                Switch Account
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
