import api from './axios';

function unwrap<T>(res: { data: any }): T {
  const body = res.data;
  if (body?.success === false) throw new Error(body.message || 'API error');
  return body?.data as T;
}

export const notificationsApi = {
  list: (params: { limit?: number; unread_only?: boolean } = {}) =>
    api.get('/notifications', { params }).then(unwrap<{ notifications: any[]; unread_count: number }>),

  markRead: (id: number) =>
    api.post(`/notifications/${id}/read`).then(unwrap<null>),

  markAllRead: () =>
    api.post('/notifications/read-all').then(unwrap<null>),
};
