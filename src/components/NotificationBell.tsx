import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationsApi } from '@/api/notifications';
import { cn } from '@/utils/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => notificationsApi.list({ limit: 20 }),
    refetchInterval: 30000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleClick(notification: any) {
    if (!notification.is_read) {
      await notificationsApi.markRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  }

  const typeIcon: Record<string, string> = {
    action: '🔔',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    !n.is_read && 'bg-primary-50/50'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">{typeIcon[n.type] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', n.is_read ? 'text-gray-700' : 'font-medium text-gray-900')}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
