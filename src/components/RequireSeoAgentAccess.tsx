import React from 'react';
import { useAuthStore } from '../store/authStore';
import { canReviewSeoAgent } from '../auth/seoAgentAccess';

/**
 * Route-level gate for the SEO Agent and Growth surfaces.
 *
 * The sidebar hides the menu, but hiding a link is not access control: the URL
 * is still reachable by typing it or through the command palette. This checks
 * the same permission the backend enforces, so an unauthorised user sees a
 * clear refusal instead of a page that fires 403s.
 */
const RequireSeoAgentAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);

  if (!canReviewSeoAgent(user)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-900">Access denied</h1>
          <p className="mt-2 text-sm text-red-800">
            You need the <code className="rounded bg-white/60 px-1">seo-agent.review</code> permission
            to view this page. Ask an administrator to grant it to your role.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireSeoAgentAccess;
