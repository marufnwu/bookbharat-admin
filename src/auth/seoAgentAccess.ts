import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

/**
 * Whether a user may reach the SEO Agent surfaces.
 *
 * The backend gates these routes on the `role:admin` middleware and seeds a
 * granular `seo-agent.review` permission for finer control. The admin UI checks
 * the same things, in the same order, rather than matching a role name: a
 * custom role that has been granted `seo-agent.review` must see the menu, and a
 * role that has not must not.
 */
export const canReviewSeoAgent = (user: User | null | undefined): boolean => {
  if (!user) {
    return false;
  }

  const roles = user.roles ?? [];

  if (roles.some((role) => ['admin', 'super-admin'].includes(role.name))) {
    return true;
  }

  return roles.some((role) =>
    (role.permissions ?? []).some((permission) => permission.name === 'seo-agent.review')
  );
};

/**
 * Whether a user may run the agent (as opposed to reviewing its proposals).
 */
export const canRunSeoAgent = (user: User | null | undefined): boolean => {
  if (!user) {
    return false;
  }

  const roles = user.roles ?? [];

  if (roles.some((role) => ['admin', 'super-admin'].includes(role.name))) {
    return true;
  }

  return roles.some((role) =>
    (role.permissions ?? []).some((permission) => permission.name === 'seo-agent.run')
  );
};

/**
 * Hook form, so components do not each re-derive the check.
 */
export const useSeoAgentAccess = (): { canReview: boolean; canRun: boolean } => {
  const user = useAuthStore((state) => state.user);

  return {
    canReview: canReviewSeoAgent(user),
    canRun: canRunSeoAgent(user),
  };
};
