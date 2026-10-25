import React from 'react';
import {
  ShieldCheck,
  Plus,
  LayoutDashboard,
  Boxes,
  PlayCircle,
  FileText,
  Clock,
  Shield,
  CheckCircle2,
  Lock,
  TestTubes,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { SetupRequest, UserProfile } from '../types/sandbox.js';

export type NavigationTarget =
  // Developer Views
  | 'dev_dashboard'
  | 'new_setup'
  | 'revise_setup'
  | 'my_setups'
  | 'workflow'
  | 'setup_results'
  | 'my_manifests'
  // Admin Views
  | 'admin_dashboard'
  | 'approval_queue'
  | 'all_setups'
  | 'workflow_monitoring'
  | 'security_policies'
  | 'test_cases'
  | 'all_manifests'
  | 'audit_logs';

interface NavigationProps {
  currentView: NavigationTarget;
  onNavigate: (view: NavigationTarget) => void;
  activeSetup: SetupRequest | null;
  pendingApprovalCount: number;
  currentUser: UserProfile;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  pendingApprovalCount,
  currentUser,
  onSignOut,
  collapsed,
  onToggleCollapse,
}) => {
  const isDev = currentUser.role === 'developer';

  interface NavItem {
    id: NavigationTarget;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | null;
  }

  const developerItems: NavItem[] = [
    { id: 'dev_dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'my_setups', label: 'Environments', icon: Boxes },
    { id: 'new_setup', label: 'Create Environment', icon: Plus },
    { id: 'workflow', label: 'Setup Runs', icon: PlayCircle },
    { id: 'my_manifests', label: 'Reports', icon: FileText },
  ];

  const adminItems: NavItem[] = [
    { id: 'admin_dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'all_setups', label: 'Environments', icon: Boxes },
    {
      id: 'approval_queue',
      label: 'Approvals',
      icon: CheckCircle2,
      count: pendingApprovalCount > 0 ? pendingApprovalCount : null,
    },
    { id: 'workflow_monitoring', label: 'Setup Runs', icon: PlayCircle },
    { id: 'security_policies', label: 'Security & Policies', icon: Lock },
    { id: 'test_cases', label: 'Verification Tests', icon: TestTubes },
    { id: 'all_manifests', label: 'Reports', icon: FileText },
    { id: 'audit_logs', label: 'Activity', icon: Clock },
  ];

  const navItems: NavItem[] = isDev ? developerItems : adminItems;

  return (
    <aside
      className={`studio-sidebar fixed top-0 left-0 bottom-0 z-30 bg-white border-r border-slate-200 flex flex-col transition-all duration-150 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
        <button
          onClick={() => onNavigate(isDev ? 'dev_dashboard' : 'admin_dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden leading-tight">
              <span className="block text-xs font-bold text-slate-900 tracking-tight">
                Sandbox Studio
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {isDev ? 'Developer' : 'Administration'}
              </span>
            </div>
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors text-left relative ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
              />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.count && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Compact User Persona & Role Switcher */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="truncate">
                <div className="font-semibold text-slate-900 truncate text-[11px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUser.email}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium capitalize">
                {currentUser.role}
              </span>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-1 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3 h-3 text-slate-400" />
              <span>Switch Role</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            title={`Signed in as ${currentUser.name} (${currentUser.role}). Click to switch role.`}
            className="w-full flex items-center justify-center p-1.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

interface HeaderProps {
  currentView: NavigationTarget;
  onNavigate: (view: NavigationTarget) => void;
  activeSetup: SetupRequest | null;
  currentUser: UserProfile;
  onSignOut: () => void;
  collapsed: boolean;
}

export const TopHeader: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  activeSetup,
  currentUser,
  onSignOut,
  collapsed,
}) => {
  const isDev = currentUser.role === 'developer';

  const viewTitles: Record<NavigationTarget, string> = {
    dev_dashboard: 'Developer Workspace',
    new_setup: 'Create Environment',
    revise_setup: 'Revise Request',
    my_setups: 'Environments',
    workflow: 'Setup Run',
    setup_results: 'Environment Details',
    my_manifests: 'Setup Reports',
    admin_dashboard: 'Administration',
    approval_queue: 'Approvals',
    all_setups: 'All Environments',
    workflow_monitoring: 'Setup Run Monitoring',
    security_policies: 'Security & Policies',
    test_cases: 'Verification Scenarios',
    all_manifests: 'Setup Reports',
    audit_logs: 'Activity History',
  };

  return (
    <header
      className={`studio-header h-14 bg-white border-b border-slate-200 sticky top-0 z-20 transition-all duration-150 ${
        collapsed ? 'ml-16' : 'ml-60'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Breadcrumb Area */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">Sandbox Studio</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="studio-breadcrumb-current text-slate-900 font-medium">{viewTitles[currentView] || 'Workspace'}</span>
          {activeSetup && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="studio-breadcrumb-setup text-slate-600 font-mono text-[11px]">
                {activeSetup.id} · {activeSetup.projectName}
              </span>
            </>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Environment Indicator */}
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5" title="Requests and runs are handled by the in-memory simulator">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Sandbox simulator</span>
          </div>

          {/* Role Status Tag */}
          <div className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
            {currentUser.name} ({isDev ? 'Developer' : 'Admin'})
          </div>

          {/* Primary Quick Action */}
          {isDev ? (
            <button
              onClick={() => onNavigate('new_setup')}
              aria-label="Create Environment"
              className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Environment</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('approval_queue')}
              aria-label="Review Approvals"
              className="px-3 py-1 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Review Approvals</span>
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={onSignOut}
            title="Switch persona or sign out"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
