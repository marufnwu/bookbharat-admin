// AI Types and Interfaces

export interface AiProvider {
  id: number;
  provider_name: string;
  display_name: string;
  model: string;
  api_endpoint?: string | null;
  configuration: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  usage_stats: {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
  };
  tasks_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AiTask {
  id: number;
  ai_provider_id: number;
  task_type: string;
  input_data: any;
  output_data: any;
  prompt_tokens: number;
  completion_tokens: number;
  total_cost?: number | null;
  status: 'pending' | 'success' | 'failed';
  error_message?: string | null;
  user_id?: number | null;
  provider?: AiProvider;
  created_at: string;
  updated_at: string;
}

export interface ProductFieldGenerationInput {
  book_name: string;
  author?: string;
  publisher?: string;
  language?: string;
  category_id?: number;
  isbn?: string;
  pages?: number;
  key_themes?: string;
  provider_id?: number;
}

export interface ProductFieldGenerationOutput {
  description: string;
  short_description: string;
  focus_keyword: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  tags: string[];
}

export interface SeoOptimizationInput {
  name: string;
  description: string;
  short_description: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  focus_keyword: string;
  slug: string;
  author?: string;
  category?: string;
  language?: string;
  format?: string;
  isbn?: string;
  mode?: 'single' | 'variants';
  requested_field?: string;
  provider_id?: number;
}

export interface SeoOptimizationOutput {
  current_score: number;
  improved_meta_title: string;
  improved_meta_description: string;
  improved_focus_keyword: string;
  improved_slug: string;
  improved_short_description: string;
  improved_description: string;
  keyword_suggestions: string[];
  improvement_tips: string[];
  content_suggestions: string;
  focus_keyword_variants?: string[];
  meta_title_variants?: string[];
  meta_description_variants?: string[];
  slug_variants?: string[];
  meta_keywords_variants?: string[][];
  short_description_variants?: string[];
  description_variants?: string[];
}

export interface AiTaskExecutionResponse {
  success: boolean;
  data: ProductFieldGenerationOutput;
  task_id: number;
  provider_used: string;
  provider_display_name: string;
  tokens_used: number;
  estimated_cost?: number | null;
}

export interface AiProviderFormData {
  provider_name: string;
  display_name: string;
  api_key: string;
  api_endpoint?: string;
  model: string;
  configuration?: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  priority?: number;
  is_enabled?: boolean;
}

export interface AiUsageStats {
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  total_tokens: number;
  total_cost: number;
  by_provider: Array<{
    provider_name: string;
    tasks_count: number;
    successful_count: number;
    usage_stats: AiProvider['usage_stats'];
  }>;
  by_task_type: Array<{
    task_type: string;
    total: number;
  }>;
}
