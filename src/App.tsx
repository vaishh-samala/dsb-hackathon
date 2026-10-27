/**
 * Sandbox Studio
 * Isolated Development Environment Provisioning & Governance
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, TopHeader } from './components/Navigation.js';
import { SignInView } from './components/auth/SignInView.js';
import { SettingsView } from './components/SettingsView.js';
import { useAppRoute, navigateTo } from './utils/router.js';
import { subscribeToAuthState, signOutFromFirebase } from './lib/firebase.js';

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [route, navigate] = useAppRoute();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [setups, setSetups] = useState<SetupRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Firebase & Server session restoration
  useEffect(() => {
    let cancelled = false;

    // Check existing server session
    fetch('/api/auth/session')
      .then(async (response) => {
        if (!response.ok) return null;
        const data: { user: UserProfile | null; mode: 'demo' | 'authenticated' | null } = await response.json();
        return data.user;
      })
      .then((serverUser) => {
        if (!cancelled && serverUser) {
          setCurrentUser(serverUser);
          setAuthChecking(false);
        } else if (!cancelled) {
          setAuthChecking(false);
        }
      })
      .catch((error) => {
        console.error('Could not restore server session:', error);
        if (!cancelled) setAuthChecking(false);
      });

    // Listen to Firebase client auth state changes
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (cancelled) return;
      if (firebaseUser) {
        try {
          // Check if deliberate demo session is active on server
          const sessionRes = await fetch('/api/auth/session');
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData?.user?.sessionMode === 'demo') {
              // Active demo session must not be overridden by background Firebase auth
              return;
            }
          }

          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setSetups([]);
              setAuditLogs([]);
              setActiveSetupId(null);
              setCurrentUser(data.user);
            }
          }
        } catch (err) {
          console.error('Failed to sync Firebase session with server:', err);
        }
      }
      if (!cancelled) {
        setAuthChecking(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Google sign in success handler (Real User Account)
  const handleGoogleSignInSuccess = async (firebaseUser: any) => {
    // Clear any prior session state completely
    setSetups([]);
    setAuditLogs([]);
    setActiveSetupId(null);

    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to establish Google session.');
    setCurrentUser(data.user as UserProfile);
    navigate('/overview');
    showNotification(`Signed in with Google as ${data.user.name}`, 'success');
  };

  // Demo sign in handler (Populated Sample Data)
  const handleSignIn = async (user: UserProfile) => {
    // Clear any prior session state completely
    setSetups([]);
    setAuditLogs([]);
    setActiveSetupId(null);

    const response = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: user.id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Demo sign in failed.');
    setCurrentUser(data.user as UserProfile);
    navigate('/overview');
    showNotification(`Launched Demo Mode as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Developer'})`, 'info');
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOutFromFirebase();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setCurrentUser(null);
    setSetups([]);
    setAuditLogs([]);
    setActiveSetupId(null);
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

      if (!setupsRes.ok) throw new Error(`Could not load setup runs (${setupsRes.status}).`);
      const setupsData: SetupRequest[] = await setupsRes.json();
      setSetups(setupsData);
      if (setupsData.length > 0 && !activeSetupId) {
        const pending = setupsData.find((s) => s.status === 'awaiting_approval');
        setActiveSetupId((pending || setupsData[0]).id);
      }

      if (!logsRes.ok) throw new Error(`Could not load activity history (${logsRes.status}).`);
      const logsData: AuditLogEvent[] = await logsRes.json();
      setAuditLogs(logsData);
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Could not connect to sandbox daemon.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData(currentUser);
    }
  }, [currentUser]);

  // Keep the selected run synced with its stable URL identifier.
  useEffect(() => {
    if ((route.path === '/environments/:id' || route.path === '/environments/:id/edit' || route.path === '/runs/:id' || route.path === '/approvals/:id') && route.id) {
      setActiveSetupId(route.id);
    }
    setMobileNavOpen(false);
  }, [route]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const refreshData = async () => {
      try {
        const response = await fetch('/api/setups', {
          headers: {
            'x-user-role': currentUser.role,
            'x-user-id': currentUser.id,
            'x-user-name': currentUser.name,
          },
        });
        if (response.status === 401) {
          if (!cancelled) {
            setCurrentUser(null);
            setSetups([]);
            setAuditLogs([]);
            navigate('/login');
            showNotification('Demo session expired. Sign in again to continue.', 'info');
          }
          return;
        }
        if (!response.ok) throw new Error(`Could not refresh setup runs (${response.status}).`);
        const latestSetups: SetupRequest[] = await response.json();
        if (!cancelled) {
          setSetups(latestSetups);
          const routeId = route.path === '/environments/:id' || route.path === '/environments/:id/edit' || route.path === '/runs/:id'
            ? route.id
            : null;
          if (routeId && !latestSetups.some((setup) => setup.id === routeId)) {
            showNotification('This setup run is not available to the current demo account.', 'error');
            navigate('/runs');
          }
        }
      } catch (error) {
        if (!cancelled) console.error('Could not refresh workflow state:', error);
      }
    };
    const interval = window.setInterval(refreshData, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentUser, route]);

  const activeSetup = route.path === '/environments/:id' || route.path === '/environments/:id/edit' || route.path === '/runs/:id' || route.path === '/approvals/:id'
    ? setups.find((s) => s.id === route.id) || null
    : setups.find((s) => s.id === activeSetupId) || setups[0] || null;

  const adminOnlyRoutes = ['/approvals', '/approvals/:id', '/policies', '/scenarios', '/audit'];
  useEffect(() => {
    if (!authChecking && currentUser?.role === 'developer' && adminOnlyRoutes.includes(route.path)) {
      navigate('/overview');
    }
  }, [authChecking, currentUser, route]);

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
    navigate(`/runs/${created.id}`);
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
    try {
      await handleExecuteSetup(setupId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown simulator error.';
      showNotification(`Approval was recorded, but execution could not resume: ${message}`, 'error');
      return;
    }
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
    navigate(`/runs/${updated.id}`);
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

  // If unauthenticated or on /login, show the Sign-In page
  if (authChecking) {
    return <div className="min-h-screen bg-[var(--studio-bg)]" aria-label="Restoring demo session" />;
  }

  if (!currentUser || route.path === '/login') {
    return (
      <SignInView
        onSignIn={handleSignIn}
        onGoogleSignInSuccess={handleGoogleSignInSuccess}
      />
    );
  }

  const pendingApprovalCount = setups.filter((s) => s.status === 'awaiting_approval').length;
  const isDev = currentUser.role === 'developer';
  if (isDev && adminOnlyRoutes.includes(route.path)) {
    return (
      <div className="studio-shell flex min-h-screen items-center justify-center p-6 text-center text-sm text-slate-300">
        This demo account cannot access administrator tools. Returning to the Dashboard…
      </div>
    );
  }

  // Helper to navigate and change view smoothly
  const handleNavigate = (path: string) => {
    setMobileNavOpen(false);
    navigate(path);
  };

  return (
    <div className="studio-shell min-h-screen bg-[var(--studio-bg)] text-slate-900 flex flex-col font-sans">
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
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Dismiss navigation backdrop"
          className="fixed inset-0 z-20 bg-slate-950/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Top Header Bar */}
      <TopHeader
        currentPath={window.location.pathname}
        onNavigate={handleNavigate}
        activeSetup={activeSetup}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((open) => !open)}
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
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        }`}
      >
        {/* Explicit Demo Mode Notice Banner */}
        {currentUser?.sessionMode === 'demo' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                Demo Mode — Sample Data
              </span>
              <span className="text-[11px] text-amber-100/90 font-medium">
                You are viewing preloaded dummy projects, workflows, and test results. All data is fictional and isolated from real user accounts.
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[11px] font-semibold text-amber-300 hover:text-white underline cursor-pointer shrink-0"
            >
              Sign out / Exit demo
            </button>
          </div>
        )}

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
                      navigate(`/runs/${s.id}`);
                    }}
                    onNavigate={(target) => {
                      if (target === 'new_setup') navigate('/environments/new');
                      else if (target === 'my_manifests') navigate('/reports');
                      else if (target === 'setup_runs') navigate('/runs');
                      else navigate('/environments');
                    }}
                  />
                ) : (
                  <AdminDashboardView
                    setups={setups}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/approvals/${s.id}`);
                    }}
                    onNavigate={(target) => {
                      if (target === 'approval_queue') navigate('/approvals');
                      else if (target === 'setup_runs') navigate('/runs');
                      else if (target === 'test_cases') navigate('/scenarios');
                      else navigate('/environments');
                    }}
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

                      {/* ROUTE: /environments/:id/edit */}
                      {route.path === '/environments/:id/edit' && isDev && activeSetup?.status === 'changes_requested' && (
                        <NewSetupView
                          existingSetup={activeSetup}
                          onCreateSetup={handleCreateSetup}
                          onResubmitSetup={handleResubmitSetup}
                          onNavigate={(target) => {
                            if (target === 'workflow') navigate(`/runs/${activeSetup.id}`);
                            else navigate(`/environments/${activeSetup.id}`);
                          }}
                        />
                      )}
                      {route.path === '/environments/:id/edit' && isDev && activeSetup && activeSetup.status !== 'changes_requested' && (
                        <div className="mx-auto max-w-lg rounded-xl border border-violet-300/15 bg-[#1a1247] p-6 text-center">
                          <h1 className="text-sm font-semibold text-slate-100">Editing is not available</h1>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">
                            This demo supports revising a request only after an administrator requests changes. Approved and completed environment editing is not implemented.
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate(`/runs/${activeSetup.id}`)}
                            className="mt-4 rounded-lg border border-violet-300/20 px-3 py-2 text-xs font-medium text-violet-100 hover:bg-violet-400/10"
                          >
                            Return to setup run
                          </button>
                        </div>
                      )}
                      {route.path === '/environments/:id/edit' && isDev && !activeSetup && (
                        <div className="rounded-xl border border-red-300/20 bg-red-400/[0.06] p-5 text-center text-xs text-red-100">
                          This environment request is unavailable to the current demo developer.
                        </div>
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
                      navigate(`/environments/${s.id}/edit`);
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

              {/* ROUTE: /runs */}
              {route.path === '/runs' && (
                isDev ? (
                  <MyRequestsView
                    title="Setup Runs"
                    setups={setups}
                    onSelectSetup={(setup) => {
                      setActiveSetupId(setup.id);
                      navigate(`/runs/${setup.id}`);
                    }}
                    onReviseSetup={(setup) => {
                      setActiveSetupId(setup.id);
                      navigate(`/environments/${setup.id}/edit`);
                    }}
                    onNavigate={(target) => {
                      if (target === 'new_setup') navigate('/environments/new');
                      else navigate('/runs');
                    }}
                  />
                ) : (
                  <AllSetupsView
                    title="Setup Runs"
                    setups={setups}
                    onSelectSetup={(setup) => {
                      setActiveSetupId(setup.id);
                      navigate(`/runs/${setup.id}`);
                    }}
                    onNavigate={() => navigate('/runs')}
                  />
                )
              )}

              {/* ROUTE: /environments/:id */}
              {(route.path === '/environments/:id' || route.path === '/runs/:id') && (
                <AgentWorkflowView
                  setup={activeSetup}
                  requestedSetupId={route.id}
                  allSetups={setups}
                  auditLogs={auditLogs}
                  onSelectSetup={(s) => {
                    setActiveSetupId(s.id);
                    navigate(route.path === '/runs/:id' ? `/runs/${s.id}` : `/environments/${s.id}`);
                  }}
                  onNavigate={(target) => {
                    if (target === 'new_setup') navigate('/environments/new');
                    else if (target === 'my_setups' || target === 'all_setups') navigate('/environments');
                    else if (target === 'my_manifests' || target === 'all_manifests') navigate('/reports');
                    else if (target === 'approval_queue') navigate('/approvals');
                    else navigate('/overview');
                  }}
                  onExecuteSetup={handleExecuteSetup}
                  onRunSmokeTest={handleRunSmokeTest}
                  onGenerateManifest={handleGenerateManifest}
                  currentRole={currentUser.role}
                />
              )}

              {/* ROUTE: /approvals (Admin Only) */}
              {(route.path === '/approvals' || route.path === '/approvals/:id') && (
                !isDev ? (
                  <ApprovalQueueView
                    setups={setups}
                    selectedSetupId={route.path === '/approvals/:id' ? route.id : undefined}
                    onSelectSetup={(s) => {
                      setActiveSetupId(s.id);
                      navigate(`/approvals/${s.id}`);
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    onNavigate={(target) => {
                      if (target === 'security_policies') navigate('/policies');
                      else if (target === 'workflow' && activeSetupId) navigate(`/runs/${activeSetupId}`);
                      else if (target === 'approval_queue') navigate('/approvals');
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
                  onNavigateRuns={() => navigate('/runs')}
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

      </div>
    </div>
  );
}
