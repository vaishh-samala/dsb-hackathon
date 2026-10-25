import React from 'react';
import {
  ShieldCheck,
  Plus,
  LayoutDashboard,
  Boxes,
  PlayCircle,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  TestTubes,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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
  mobileOpen: boolean;
  onCloseMobile: () => void;
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
  mobileOpen,
  onCloseMobile,
}) => {
  const isDev = currentUser.role === 'developer';

  const developerGroups: NavGroup[] = [{
    heading: 'Developer',
    items: [
      { path: '/overview', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/environments/new', label: 'Create Environment', icon: Plus },
      { path: '/runs', label: 'Setup Runs', icon: PlayCircle },
      { path: '/environments', label: 'Environments', icon: Boxes },
      { path: '/reports', label: 'Setup Reports', icon: FileText },
      { path: '/settings', label: 'Account', icon: Settings },
    ],
  }];

  const adminGroups: NavGroup[] = [
    {
      heading: 'Governance',
      items: [
        { path: '/overview', label: 'Dashboard', icon: LayoutDashboard },
        {
          path: '/approvals',
          label: 'Approvals',
          icon: CheckCircle2,
          count: pendingApprovalCount > 0 ? pendingApprovalCount : null,
        },
        { path: '/environments', label: 'All Environments', icon: Boxes },
        { path: '/runs', label: 'Setup Runs', icon: PlayCircle },
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
      heading: 'Account',
      items: [
        { path: '/reports', label: 'Setup Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const groups = isDev ? developerGroups : adminGroups;

  const isItemActive = (path: string) => {
    if (path === '/environments' && currentPath === '/environments') return true;
    if (path.startsWith('/environments/') && currentPath.startsWith('/environments/')) return true;
    if (path === '/runs' && currentPath.startsWith('/runs')) return true;
    if (path === '/approvals' && currentPath.startsWith('/approvals')) return true;
    return currentPath === path;
  };

  return (
    <aside
      className={`studio-sidebar fixed top-0 left-0 bottom-0 z-30 border-r border-[var(--studio-sidebar-border)] flex flex-col transition-all duration-200 select-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${
        collapsed ? 'w-60 md:w-16' : 'w-60 md:w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3.5 border-b border-[var(--studio-sidebar-border)] flex items-center justify-between">
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
          className="hidden md:inline-flex p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-500 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
                        ? 'bg-violet-300/[0.055] text-violet-100 font-semibold ring-1 ring-violet-300/15'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-violet-300' : 'text-slate-400'
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
      <div className="p-3 border-t border-[var(--studio-sidebar-border)]">
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
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  mobileNavOpen,
  onToggleMobileNav,
}) => {
  return (
    <header className="sticky top-0 z-20 h-12 border-b border-slate-200 bg-[#100b2e]/95 px-4 backdrop-blur md:hidden">
      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileNavOpen}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
