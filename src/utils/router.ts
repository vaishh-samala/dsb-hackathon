import { useEffect, useState } from 'react';

export type AppRoute =
  | { path: '/login' }
  | { path: '/overview' }
  | { path: '/runs' }
  | { path: '/runs/:id'; id: string }
  | { path: '/environments' }
  | { path: '/environments/new' }
  | { path: '/environments/:id/edit'; id: string }
  | { path: '/environments/:id'; id: string }
  | { path: '/approvals' }
  | { path: '/approvals/:id'; id: string }
  | { path: '/policies' }
  | { path: '/scenarios' }
  | { path: '/reports' }
  | { path: '/audit' }
  | { path: '/settings' };

export function parseRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/$/, '') || '/';

  if (clean === '/login' || clean === '/signin') {
    return { path: '/login' };
  }
  if (clean === '/overview' || clean === '/') {
    return { path: '/overview' };
  }
  if (clean === '/runs') {
    return { path: '/runs' };
  }
  if (clean.startsWith('/runs/')) {
    const id = clean.slice('/runs/'.length);
    if (id) return { path: '/runs/:id', id };
  }
  if (clean === '/approvals') {
    return { path: '/approvals' };
  }
  if (clean.startsWith('/approvals/')) {
    const id = clean.slice('/approvals/'.length);
    if (id) return { path: '/approvals/:id', id };
  }
  if (clean === '/environments/new') {
    return { path: '/environments/new' };
  }
  if (clean.startsWith('/environments/') && clean.endsWith('/edit')) {
    const id = clean.slice('/environments/'.length, -'/edit'.length);
    if (id) return { path: '/environments/:id/edit', id };
  }
  if (clean.startsWith('/environments/')) {
    const id = clean.replace('/environments/', '');
    if (id) {
      return { path: '/environments/:id', id };
    }
    return { path: '/environments' };
  }
  if (clean === '/environments') {
    return { path: '/environments' };
  }
  if (clean === '/policies') {
    return { path: '/policies' };
  }
  if (clean === '/scenarios' || clean === '/tests') {
    return { path: '/scenarios' };
  }
  if (clean === '/reports' || clean === '/manifests') {
    return { path: '/reports' };
  }
  if (clean === '/audit' || clean === '/activity') {
    return { path: '/audit' };
  }
  if (clean === '/settings') {
    return { path: '/settings' };
  }

  // Fallback to overview
  return { path: '/overview' };
}

export function navigateTo(url: string) {
  if (window.location.pathname !== url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('popstate'));
  }
}

export function useAppRoute(): [AppRoute, (url: string) => void] {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return [route, navigateTo];
}
