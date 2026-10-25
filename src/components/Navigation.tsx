import React, { useState } from 'react';
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
  Settings,
  User,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import type { SetupRequest, UserProfile } from '../types/sandbox.js';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeSetup: SetupRequest | null;
  pendingApprovalCount: number;
  currentUser: UserProfile;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavGroup {
  heading: string;
  items: {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | null;
  }[];
}

export const Sidebar: React.FC<NavigationProps> = ({
  currentPath,
  onNavigate,
  activeSetup,
  pendingApprovalCount,
  currentUser,
  onSignOut,
  collapsed,
  onToggleCollapse,
}) => {
  const isDev = currentUser.role === 'developer';

  const developerGroups: NavGroup[] = [
    {
      heading: 'Workspace',
      items: [
        { path: '/overview', label: 'Overview', icon: LayoutDashboard },
        { path: '/environments', label: 'Environments', icon: Boxes },
        { path: '/environments/new', label: 'Create Environment', icon: Plus },
      ],
    },
    {
      heading: 'Pipeline & Reports',
      items: [
        {
          path: activeSetup ? `/environments/${activeSetup.id}` : '/environments',
          label: 'Setup Runs',
          icon: PlayCircle,
        },
        { path: '/reports', label: 'Setup Reports', icon: FileText },
      ],
    },
    {
      heading: 'Preferences',
      items: [{ path: '/settings', label: 'Settings', icon: Settings }],
    },
  ];

  const adminGroups: NavGroup[] = [
    {
      heading: 'Governance',
      items: [
        { path: '/overview', label: 'Overview', icon: LayoutDashboard },
        {
          path: '/approvals',
          label: 'Approvals',
          icon: CheckCircle2,
          count: pendingApprovalCount > 0 ? pendingApprovalCount : null,
        },
        { path: '/environments', label: 'All Environments', icon: Boxes },
      ],
    },
    {
      heading: 'Security & QA',
      items: [
        { path: '/policies', label: 'Security & Policies', icon: Lock },
        { path: '/scenarios', label: 'Verification Tests', icon: TestTubes },
        { path: '/audit', label: 'Activity Log', icon: Clock },
      ],
    },
    {
      heading: 'Compliance',
      items: [
        { path: '/reports', label: 'Sealed Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const groups = isDev ? developerGroups : adminGroups;

  const isItemActive = (path: string) => {
    if (path === '/environments' && currentPath === '/environments') return true;
    if (path.startsWith('/environments/') && currentPath.startsWith('/environments/')) return true;
    return currentPath === path;
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-[#090e17] border-r border-[#192434] flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3.5 border-b border-[#192434] flex items-center justify-between">
        <button
          onClick={() => onNavigate('/overview')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-sky-600/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden leading-tight">
              <span className="block text-xs font-bold text-white tracking-tight">
                Sandbox Studio
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {isDev ? 'Developer Workspace' : 'Administrator'}
              </span>
            </div>
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Grouped Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                {group.heading}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);

                return (
                  <button
                    key={item.path + item.label}
                    onClick={() => onNavigate(item.path)}
                    title={item.label}
                    aria-label={item.label}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left relative ${
                      active
                        ? 'bg-sky-500/15 text-sky-300 font-semibold ring-1 ring-sky-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-sky-400' : 'text-slate-400'
                      }`}
                    />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!collapsed && item.count && (
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.2 rounded font-mono">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile & Sign Out */}
      <div className="p-3 border-t border-[#192434] bg-[#070b12]">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDev ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-white truncate text-[11px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-400 capitalize font-medium">{currentUser.role} Account</span>
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onSignOut}
            title="Sign Out"
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

interface TopHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeSetup: SetupRequest | null;
  currentUser: UserProfile;
  onSignOut: () => void;
  collapsed: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPath,
  onNavigate,
  activeSetup,
  currentUser,
  onSignOut,
  collapsed,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const isDev = currentUser.role === 'developer';

  // Format contextual breadcrumb trail
  const getBreadcrumb = () => {
    if (currentPath === '/overview') return 'Overview';
    if (currentPath === '/environments/new') return 'New Environment';
    if (currentPath.startsWith('/environments/')) {
      return activeSetup ? `Environments · ${activeSetup.id}` : 'Environment Details';
    }
    if (currentPath === '/environments') return 'Environments';
    if (currentPath === '/approvals') return 'Pending Approvals';
    if (currentPath === '/policies') return 'Security & Policies';
    if (currentPath === '/scenarios') return 'Verification Tests';
    if (currentPath === '/reports') return 'Setup Reports';
    if (currentPath === '/audit') return 'Security Audit Log';
    if (currentPath === '/settings') return 'Settings';
    return 'Sandbox Studio';
  };

  return (
    <header
      className={`h-14 bg-white border-b border-slate-200 sticky top-0 z-20 transition-all duration-200 ${
        collapsed ? 'ml-16' : 'ml-60'
      }`}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Breadcrumb trail */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium min-w-0">
          <button
            onClick={() => onNavigate('/overview')}
            className="hover:text-slate-900 transition-colors shrink-0 font-semibold text-slate-800"
          >
            Sandbox Studio
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-700 font-semibold truncate">{getBreadcrumb()}</span>
        </div>

        {/* Center/Right controls */}
        <div className="flex items-center gap-3">
          {/* Active Sandbox Indicator if present */}
          {activeSetup && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-slate-400">Target:</span>
              <span className="font-mono text-[11px] text-slate-800 font-medium">
                {activeSetup.projectName}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-500 capitalize">{activeSetup.accountType}</span>
            </div>
          )}

          {/* Primary Action Button */}
          {isDev ? (
            <button
              onClick={() => onNavigate('/environments/new')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Environment</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/approvals')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Approval Queue</span>
            </button>
          )}

          {/* User Profile Popover */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white ${
                  isDev ? 'bg-sky-600' : 'bg-emerald-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-slate-800 hidden lg:inline">
                {currentUser.name}
              </span>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 text-xs"
                onClick={() => setProfileOpen(false)}
              >
                <div className="px-2.5 py-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                  <div className="mt-1 text-[10px] font-semibold text-sky-700 uppercase">
                    Role: {currentUser.role}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => onNavigate('/settings')}
                    className="w-full text-left px-2.5 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings & Preferences</span>
                  </button>
                  <button
                    onClick={onSignOut}
                    className="w-full text-left px-2.5 py-1.5 rounded text-red-700 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
