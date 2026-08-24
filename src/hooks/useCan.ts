import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Frontend permission gate (contract §18.1). Backend remains the source of
 * truth — hidden buttons are defense in depth + UX, not security.
 */
export function useCan(permission: string): boolean {
  const user = useAuthStore((s: any) => s.user);
  return useMemo(() => {
    if (!user) return false;
    if (Array.isArray(user?.roles)) {
      const isAdmin = user.roles.some((r: any) => ['admin', 'super-admin'].includes(r?.name ?? r));
      if (isAdmin) return true;
      return user.roles.some((r: any) =>
        Array.isArray(r?.permissions) && r.permissions.some((p: any) => (p?.name ?? p) === permission)
      );
    }
    if (Array.isArray(user?.permissions)) {
      return user.permissions.some((p: any) => (p?.name ?? p) === permission);
    }
    return false;
  }, [user, permission]);
}
