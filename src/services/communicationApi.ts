import { axiosInstance } from '../api/axios';
import { CommunicationLog, CommunicationTemplate, CommunicationSetting, CommunicationStats } from '../types/communication';

export const communicationApi = {
  // Logs
  getLogs: (params?: any) => axiosInstance.get<{ success: boolean; data: { data: CommunicationLog[]; total: number; current_page: number; last_page: number } }>('/communication/logs', { params }),
  getLog: (id: number) => axiosInstance.get<{ success: boolean; data: CommunicationLog }>(`/communication/logs/${id}`),
  getStats: (range: string = '30d') => axiosInstance.get<{ success: boolean; data: CommunicationStats }>('/communication/logs/stats', { params: { range } }),

  // Templates
  getTemplates: (params?: any) => axiosInstance.get<{ success: boolean; data: Record<string, CommunicationTemplate[]> }>('/communication/templates', { params }),
  getTemplate: (id: number) => axiosInstance.get<{ success: boolean; data: CommunicationTemplate }>(`/communication/templates/${id}`),
  createTemplate: (data: Partial<CommunicationTemplate>) => axiosInstance.post<{ success: boolean; data: CommunicationTemplate }>('/communication/templates', data),
  updateTemplate: (id: number, data: Partial<CommunicationTemplate>) => axiosInstance.put<{ success: boolean; data: CommunicationTemplate }>(`/communication/templates/${id}`, data),
  deleteTemplate: (id: number) => axiosInstance.delete(`/communication/templates/${id}`),
  toggleTemplateActive: (id: number) => axiosInstance.post<{ success: boolean; data: CommunicationTemplate }>(`/communication/templates/${id}/toggle-active`),

  // Settings (reusing existing endpoints structure but mapping to new types if needed)
  getSettings: () => axiosInstance.get('/communication'), // Maps to CommunicationConfigController logic
  updateSetting: (id: number, data: any) => axiosInstance.put(`/communication/${id}`, data),
  testConnection: (channel: string, data: any) => axiosInstance.post(`/communication/${channel}/test`, data),
};
