import api from './axios';
import type {
  AiTask,
  AiUsageStats,
  AiTaskExecutionResponse,
  ProductFieldGenerationInput,
  SeoOptimizationInput,
  SeoOptimizationOutput,
} from '../types/ai';

const AI_BASE = '/ai';
const PRODUCTS_AI_BASE = '/products/ai';

export const aiTasksApi = {
  // Execute AI task
  execute: async (taskType: string, input: any, providerId?: number): Promise<AiTaskExecutionResponse> => {
    const response = await api.post(`${AI_BASE}/execute`, {
      task_type: taskType,
      input,
      provider_id: providerId,
    }, {
      timeout: 300000, // 5 minutes timeout for AI tasks
    });
    return response.data;
  },

  // Get task history
  getHistory: async (params?: {
    task_type?: string;
    status?: string;
    provider_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(`${AI_BASE}/tasks`, { params });
    return response.data;
  },

  // Get specific task
  getTask: async (id: number): Promise<{ success: boolean; data: AiTask }> => {
    const response = await api.get(`${AI_BASE}/tasks/${id}`);
    return response.data;
  },

  // Get usage statistics
  getUsageStats: async (): Promise<{ success: boolean; data: AiUsageStats }> => {
    const response = await api.get(`${AI_BASE}/usage-stats`);
    return response.data;
  },

  // Generate product fields (convenience method)
  generateProductFields: async (input: ProductFieldGenerationInput): Promise<AiTaskExecutionResponse> => {
    const response = await api.post(`${PRODUCTS_AI_BASE}/generate-fields`, input, {
      timeout: 300000,
    });
    return response.data;
  },

  // SEO content optimization
  seoOptimize: async (input: SeoOptimizationInput): Promise<AiTaskExecutionResponse & { data: SeoOptimizationOutput }> => {
    const response = await api.post(`${PRODUCTS_AI_BASE}/seo-optimize`, input, {
      timeout: 300000,
    });
    return response.data;
  },

  // SEO field variants (convenience wrapper)
  seoFieldVariants: async (input: Omit<SeoOptimizationInput, 'mode' | 'requested_field'> & { requested_field: string }): Promise<AiTaskExecutionResponse & { data: SeoOptimizationOutput }> => {
    const response = await api.post(`${PRODUCTS_AI_BASE}/seo-optimize`, {
      ...input,
      mode: 'variants',
    }, {
      timeout: 300000,
    });
    return response.data;
  },
};
