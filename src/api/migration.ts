import api from './axios';
import type { ApiResponse, PaginatedResponse } from '../types';

// Migration API Types
export interface MigrationDashboard {
  status: {
    legacy_available: boolean;
    legacy_version: string;
    auto_sync_enabled: boolean;
    last_sync: string | null;
  };
  statistics: {
    total_migrations: number;
    successful_migrations: number;
    failed_migrations: number;
    last_migration: MigrationLog | null;
    total_conflicts: number;
    unresolved_conflicts: number;
  };
  recent_logs: any[];
  settings: {
    legacy_system_url: string;
    legacy_system_token: string;
    auto_sync_enabled: boolean;
    auto_sync_interval: number;
    image_optimization_enabled: boolean;
    image_quality: number;
    conflict_resolution: string;
    max_batch_size: number;
    syncable_entity_types: string[];
  };
  entity_counts: {
    v2: {
      products: number;
      categories: number;
      product_images: number;
    };
    legacy: {
      products: number;
      categories: number;
      brands: number;
    };
  };
}

export interface MigrationLog {
  id: number;
  migration_type: string;
  status: string;
  records_processed?: number;
  records_created?: number;
  records_updated?: number;
  records_failed?: number;
  duration?: number;
  success_rate?: number;
  started_at?: string;
  completed_at?: string;
  conflicts_count?: number;
}

export interface MigrationConflict {
  id: number;
  entity_type: string;
  entity_id: number | null;
  legacy_id: number;
  conflict_type: string;
  conflict_details: any;
  resolution: string | null;
  resolution_notes: string | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface MigrationSettings {
  legacy_system_url: string;
  legacy_system_token: string;
  auto_sync_enabled: boolean;
  auto_sync_interval: number;
  image_optimization_enabled: boolean;
  image_quality: number;
  conflict_resolution: string;
  max_batch_size: number;
  syncable_entity_types: string[];
}

export interface MigrationPreview {
  [entityType: string]: {
    legacy_count: number;
    v2_count: number;
    will_migrate: number;
  };
}

export interface ConnectionTest {
  success: boolean;
  message: string;
  data: any;
}

// Migration API
export const migrationApi = {
  // Dashboard and Overview
  getDashboard: (): Promise<ApiResponse<MigrationDashboard>> =>
    api.get('/migration/dashboard').then(res => res.data),

  // Connection Testing
  testConnection: (): Promise<ApiResponse<ConnectionTest>> =>
    api.post('/migration/test-connection').then(res => res.data),

  // Migration Operations
  runFullMigration: (entities?: string[]): Promise<ApiResponse<any>> =>
    api.post('/migration/full-migration', { entities }).then(res => res.data),

  runIncrementalSync: (): Promise<ApiResponse<any>> =>
    api.post('/migration/incremental-sync').then(res => res.data),

  previewMigration: (entities: string[]): Promise<ApiResponse<MigrationPreview>> =>
    api.post('/migration/preview', { entities }).then(res => res.data),

  // Migration Logs
  getLogs: (filters: {
    status?: string;
    migration_type?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<ApiResponse<{
    data: MigrationLog[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/migration/logs?${params.toString()}`).then(res => res.data);
  },

  // Conflict Management
  getConflicts: (filters: {
    resolved?: boolean;
    entity_type?: string;
    conflict_type?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<ApiResponse<{
    data: MigrationConflict[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/migration/conflicts?${params.toString()}`).then(res => res.data);
  },

  resolveConflict: (conflictId: number, data: {
    resolution: 'skip' | 'overwrite' | 'manual' | 'merge';
    resolution_notes?: string;
  }): Promise<ApiResponse<MigrationConflict>> =>
    api.post(`/migration/conflicts/${conflictId}/resolve`, data).then(res => res.data),

  // Settings Management
  getSettings: (): Promise<ApiResponse<MigrationSettings>> =>
    api.get('/migration/settings').then(res => res.data),

  updateSettings: (settings: {
    settings: Partial<MigrationSettings>;
  }): Promise<ApiResponse<MigrationSettings>> =>
    api.put('/migration/settings', settings).then(res => res.data),
};