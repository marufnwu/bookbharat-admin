import { api } from './axios';

export interface ErrorLog {
  id: number;
  level: string;
  type: string;
  message: string;
  short_message: string;
  file: string;
  short_file: string;
  line: number;
  trace: string;
  url: string;
  method: string;
  ip_address: string;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  context: Record<string, any>;
  tags: string[];
  is_resolved: boolean;
  resolution_notes: string | null;
  resolved_by: number | null;
  resolver?: {
    id: number;
    name: string;
  };
  resolved_at: string | null;
  created_at: string;
  severity_color: string;
}

export interface ErrorLogFilters {
  level?: string;
  is_resolved?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  user_id?: number;
  tags?: string[];
  per_page?: number;
  page?: number;
}

export interface ErrorLogStats {
  total: number;
  unresolved: number;
  critical: number;
  by_level: Record<string, number>;
  by_type: Record<string, number>;
  recent_errors: Array<{ id: number; level: string; message: string; created_at: string }>;
}

const errorLogApi = {
  /**
   * Get paginated list of error logs with filters
   */
  getErrorLogs: async (filters?: ErrorLogFilters) => {
    const response = await api.get('/system/error-logs', { params: filters });
    return response.data;
  },

  /**
   * Get single error log details
   */
  getErrorLog: async (id: number) => {
    const response = await api.get(`/system/error-logs/${id}`);
    return response.data;
  },

  /**
   * Mark error as resolved
   */
  resolveError: async (id: number, notes?: string) => {
    const response = await api.post(`/system/error-logs/${id}/resolve`, {
      resolution_notes: notes,
    });
    return response.data;
  },

  /**
   * Delete error log
   */
  deleteError: async (id: number) => {
    const response = await api.delete(`/system/error-logs/${id}`);
    return response.data;
  },

  /**
   * Bulk resolve errors
   */
  bulkResolve: async (ids: number[], notes?: string) => {
    const response = await api.post('/system/error-logs/bulk-resolve', {
      ids,
      resolution_notes: notes,
    });
    return response.data;
  },

  /**
   * Bulk delete errors
   */
  bulkDelete: async (ids: number[]) => {
    const response = await api.delete('/system/error-logs/bulk-delete', {
      data: { ids },
    });
    return response.data;
  },

  /**
   * Cleanup old errors
   */
  cleanup: async (days?: number) => {
    const response = await api.delete('/system/error-logs/cleanup', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Get error statistics
   */
  getStats: async (period: string = '24h') => {
    const response = await api.get('/system/error-logs/stats', {
      params: { period },
    });
    return response.data;
  },
};

export default errorLogApi;
