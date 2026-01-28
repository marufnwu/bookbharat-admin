import api from './axios';
import type {
  AiProvider,
  AiProviderFormData,
} from '../types/ai';

const AI_PROVIDERS_BASE = '/ai-providers';

export const aiProvidersApi = {
  // Get all AI providers
  getAll: async (): Promise<{ success: boolean; data: AiProvider[]; supported_providers: string[] }> => {
    const response = await api.get(AI_PROVIDERS_BASE);
    return response.data;
  },

  // Create new provider
  create: async (data: AiProviderFormData): Promise<{ success: boolean; data: AiProvider; message: string }> => {
    const response = await api.post(AI_PROVIDERS_BASE, data);
    return response.data;
  },

  // Update provider
  update: async (id: number, data: Partial<AiProviderFormData>): Promise<{ success: boolean; data: AiProvider; message: string }> => {
    const response = await api.put(`${AI_PROVIDERS_BASE}/${id}`, data);
    return response.data;
  },

  // Delete provider
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`${AI_PROVIDERS_BASE}/${id}`);
    return response.data;
  },

  // Test provider connection
  test: async (id: number): Promise<{ success: boolean; message: string; model_info?: any }> => {
    const response = await api.post(`${AI_PROVIDERS_BASE}/${id}/test`);
    return response.data;
  },

  // Toggle provider enabled status
  toggle: async (id: number): Promise<{ success: boolean; data: AiProvider; message: string }> => {
    const response = await api.post(`${AI_PROVIDERS_BASE}/${id}/toggle`);
    return response.data;
  },

  // Set provider as default
  setDefault: async (id: number): Promise<{ success: boolean; data: AiProvider; message: string }> => {
    const response = await api.post(`${AI_PROVIDERS_BASE}/${id}/set-default`);
    return response.data;
  },
};
