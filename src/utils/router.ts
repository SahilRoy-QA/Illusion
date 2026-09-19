/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestContext, UserAccount } from '../types/context.ts';

export type AppRoute =
  | { type: 'login'; redirect?: string }
  | { type: 'super-admin'; subPath?: string }
  | { type: 'business'; tenantId: string; tab?: string }
  | { type: 'public'; slug: string }
  | { type: 'root' };

/**
 * Parses current browser URL (supporting both HTML5 pathname and hash routing)
 */
export function parseCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') {
    return { type: 'root' };
  }

  // Check pathname first, fallback to hash
  let path = window.location.pathname;
  if (path === '/' && window.location.hash) {
    path = window.location.hash.replace(/^#/, '');
  }

  // Parse query parameters (e.g. ?redirect=/super-admin)
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('redirect') || undefined;

  // Clean path
  const normalized = path.replace(/\/+$/, '') || '/';

  if (normalized === '/login') {
    return { type: 'login', redirect: redirectParam };
  }

  if (normalized === '/super-admin' || normalized.startsWith('/super-admin/')) {
    const sub = normalized.replace(/^\/super-admin\/?/, '');
    return { type: 'super-admin', subPath: sub || undefined };
  }

  const businessMatch = normalized.match(/^\/business\/([^/]+)(?:\/([^/]+))?/);
  if (businessMatch) {
    return {
      type: 'business',
      tenantId: businessMatch[1],
      tab: businessMatch[2],
    };
  }

  const publicMatch = normalized.match(/^\/public\/([^/]+)/);
  if (publicMatch) {
    return {
      type: 'public',
      slug: publicMatch[1],
    };
  }

  return { type: 'root' };
}

/**
 * Validates whether the given user session is authorized for the target route.
 * Invariant: Route Guard runs BEFORE any data loads.
 */
export function evaluateRouteGuard(
  route: AppRoute,
  user: UserAccount | null,
  ctx: RequestContext
): { authorized: boolean; redirectPath?: string; message?: string } {
  // Public visitors can view public pages
  if (route.type === 'public') {
    return { authorized: true };
  }

  // Login route is always accessible
  if (route.type === 'login') {
    return { authorized: true };
  }

  // Unauthenticated user attempting to access protected route
  if (!user) {
    const redirectTarget =
      route.type === 'super-admin'
        ? '/super-admin'
        : route.type === 'business'
        ? `/business/${route.tenantId}`
        : '/';
    return {
      authorized: false,
      redirectPath: `/login?redirect=${encodeURIComponent(redirectTarget)}`,
      message: 'Authentication required. Please sign in to access this workspace.',
    };
  }

  // Super Admin Console Route Guard
  if (route.type === 'super-admin') {
    if (user.role !== 'super_admin') {
      return {
        authorized: false,
        redirectPath: user.tenantId ? `/business/${user.tenantId}` : '/login',
        message: 'Security Block: Only the verified Super Administrator can access the Fleet Command console.',
      };
    }
    return { authorized: true };
  }

  // Business Workspace Route Guard
  if (route.type === 'business') {
    // Super admin can access via support impersonation
    if (user.role === 'super_admin') {
      return { authorized: true };
    }

    // Business Owner or Staff must belong to this specific tenant
    if (user.tenantId !== route.tenantId) {
      return {
        authorized: false,
        redirectPath: user.tenantId ? `/business/${user.tenantId}` : '/login',
        message: `Cross-Tenant Isolation: You do not have permission to access business "${route.tenantId}".`,
      };
    }

    return { authorized: true };
  }

  return { authorized: true };
}

/**
 * Programmatically navigates to a new route and updates browser history
 */
export function navigateTo(path: string, replace = false) {
  if (typeof window === 'undefined') return;
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  // Dispatch custom popstate event so reactive listeners update immediately
  window.dispatchEvent(new Event('popstate'));
}
