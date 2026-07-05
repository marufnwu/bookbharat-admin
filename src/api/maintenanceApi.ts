import { api } from './axios';

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  allowed_ips: string[];
  retry_after: number;
  redirect: string | null;
  storefront_url: string;
  secret: string;
  is_using_app_key: boolean;
  bypass_url: string;
}

export interface MaintenanceTogglePayload {
  enabled: boolean;
  message?: string;
  allowed_ips?: string[];
  retry_after?: number;
  redirect?: string;
  storefront_url?: string;
  secret?: string;
  regenerate_secret?: boolean;
}

export interface MaintenanceToggleResponse {
  success: boolean;
  message: string;
  maintenance_mode: boolean;
  secret: string;
}

export interface MaintenanceStatusResponse {
  success: boolean;
  maintenance_mode: MaintenanceSettings;
}

export const maintenanceApi = {
  getStatus: () =>
    api.get<MaintenanceStatusResponse>('/system/maintenance-mode').then(res => res.data),
  toggle: (data: MaintenanceTogglePayload) =>
    api.post<MaintenanceToggleResponse>('/system/maintenance-mode', data).then(res => res.data),
};

export default maintenanceApi;
