/**
 * Sandbox Studio
 * Isolated Development Environment Provisioning & Governance
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, TopHeader, NavigationTarget } from './components/Navigation.js';
import { RoleSelectView } from './components/RoleSelectView.js';

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

import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { SetupRequest, AccountType, UserRole, UserProfile, AuditLogEvent } from './types/sandbox.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<NavigationTarget>('dev_dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [setups, setSetups] = useState<SetupRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);
  const [activeSetup, setActiveSetup] = useState<SetupRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // When user selects a role on Welcome page
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'developer') {
      setCurrentView('dev_dashboard');
    } else {
      setCurrentView('admin_dashboard');
    }
    showNotification(`Signed in as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Developer'})`, 'info');
  };

  // Sign out / return to role-selection Welcome page
  const handleSignOut = () => {
    setCurrentUser(null);
    setActiveSetup(null);
    showNotification('Returned to role selection.', 'info');
  };

  // Fetch setups and logs scoped to the active role
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
        if (setupsData.length > 0) {
          const pending = setupsData.find((s) => s.status === 'awaiting_approval');
          setActiveSetup(pending || setupsData[0]);
        } else {
          setActiveSetup(null);
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
    setActiveSetup(created);
    await refreshAuditLogs();
    showNotification(`Environment request ${created.id} submitted.`);
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
      setActiveSetup(updated);
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
    setActiveSetup(updated);
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
    setActiveSetup(updated);
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
    setActiveSetup(updated);
    await refreshAuditLogs();
    showNotification(
      updated.status === 'blocked'
        ? `Request ${setupId} was blocked by policy. Review the reason before submitting another request.`
        : `Request ${setupId} was resubmitted for administrator review.`,
      updated.status === 'blocked' ? 'error' : 'success'
    );
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
    setActiveSetup(updated);
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
    setActiveSetup(updated);
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
    setActiveSetup(updated);
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
    setActiveSetup(createdSetup);
    await refreshAuditLogs();
    showNotification(`${tcId} executed: ${data.message}`);
    return createdSetup;
  };

  // If no user is selected, display the clean Welcome / Sign In screen
  if (!currentUser) {
    return <RoleSelectView onSelectUser={handleSelectUser} />;
  }

  const pendingApprovalCount = setups.filter((s) => s.status === 'awaiting_approval').length;
  const isDev = currentUser.role === 'developer';

  return (
    <div className="studio-app min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Role-Specific Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        activeSetup={activeSetup}
        pendingApprovalCount={pendingApprovalCount}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Top Header Bar */}
      <TopHeader
        currentView={currentView}
        onNavigate={setCurrentView}
        activeSetup={activeSetup}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="studio-toast fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className={`px-3.5 py-2 rounded-lg border text-xs shadow-md flex items-center gap-2 bg-white ${
              notification.type === 'success'
                ? 'border-emerald-200 text-emerald-800'
                : notification.type === 'error'
                ? 'border-red-200 text-red-800'
                : 'border-slate-200 text-slate-800'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
            {notification.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`studio-content flex-1 flex flex-col transition-all duration-150 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {loading && setups.length === 0 ? (
            <div className="text-center py-20 text-xs font-mono text-slate-400">
              Loading environments...
            </div>
          ) : (
            <>
              {/* DEVELOPER INTERFACE VIEWS */}
              {isDev && currentView === 'dev_dashboard' && (
                <DeveloperDashboardView
                  setups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                />
              )}

              {isDev && currentView === 'new_setup' && (
                <NewSetupView
                  onCreateSetup={handleCreateSetup}
                  onNavigate={setCurrentView}
                />
              )}

              {isDev && currentView === 'revise_setup' && activeSetup?.status === 'changes_requested' && (
                <NewSetupView
                  key={activeSetup.id}
                  existingSetup={activeSetup}
                  onCreateSetup={handleCreateSetup}
                  onResubmitSetup={handleResubmitSetup}
                  onNavigate={setCurrentView}
                />
              )}

              {isDev && currentView === 'my_setups' && (
                <MyRequestsView
                  setups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onReviseSetup={(s) => {
                    setActiveSetup(s);
                    setCurrentView('revise_setup');
                  }}
                  onNavigate={setCurrentView}
                />
              )}

              {isDev && currentView === 'workflow' && (
                <AgentWorkflowView
                  setup={activeSetup}
                  allSetups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                  onExecuteSetup={handleExecuteSetup}
                  onRunSmokeTest={handleRunSmokeTest}
                  onGenerateManifest={handleGenerateManifest}
                  currentRole="developer"
                />
              )}

              {isDev && currentView === 'setup_results' && (
                <SetupResultsView
                  setup={activeSetup}
                  allSetups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                />
              )}

              {isDev && currentView === 'my_manifests' && (
                <MyManifestsView
                  setups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                />
              )}

              {/* ADMINISTRATOR INTERFACE VIEWS */}
              {!isDev && currentView === 'admin_dashboard' && (
                <AdminDashboardView
                  setups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRequestChanges={handleRequestChanges}
                  onNavigate={setCurrentView}
                  currentRole="admin"
                />
              )}

              {!isDev && currentView === 'approval_queue' && (
                <ApprovalQueueView
                  setups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRequestChanges={handleRequestChanges}
                  onNavigate={setCurrentView}
                />
              )}

              {!isDev && currentView === 'all_setups' && (
                <AllSetupsView
                  setups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                />
              )}

              {!isDev && currentView === 'workflow_monitoring' && (
                <AgentWorkflowView
                  setup={activeSetup}
                  allSetups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                  onExecuteSetup={handleExecuteSetup}
                  onRunSmokeTest={handleRunSmokeTest}
                  onGenerateManifest={handleGenerateManifest}
                  currentRole="admin"
                />
              )}

              {!isDev && currentView === 'security_policies' && (
                <SecurityPoliciesView
                  setups={setups}
                  onNavigate={setCurrentView}
                />
              )}

              {!isDev && currentView === 'test_cases' && (
                <TestCasesView
                  onRunTestCase={handleRunTestCase}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onNavigate={setCurrentView}
                />
              )}

              {!isDev && currentView === 'all_manifests' && (
                <SetupManifestView
                  setup={activeSetup}
                  allSetups={setups}
                  onSelectSetup={(s) => setActiveSetup(s)}
                  onGenerateManifest={handleGenerateManifest}
                  onNavigate={setCurrentView}
                />
              )}

              {!isDev && currentView === 'audit_logs' && (
                <AuditLogsView
                  logs={auditLogs}
                  onSelectRequestId={(id) => {
                    const target = setups.find((s) => s.id === id);
                    if (target) {
                      setActiveSetup(target);
                      setCurrentView('workflow_monitoring');
                    }
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Clean Enterprise Footer */}
        <footer className="studio-footer border-t border-slate-200 bg-white py-3.5 px-4 sm:px-6 lg:px-8 mt-8">
          <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Sandbox Studio</span>
              <span aria-hidden="true">·</span>
              <span>Sandbox lifecycle and policy governance · in-memory simulator</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-700 font-medium">Policy checks active · demo auth</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900 underline"
              >
                Switch Role ({isDev ? 'Developer' : 'Admin'})
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
