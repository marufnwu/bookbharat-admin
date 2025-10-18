// Extended API methods for new admin panel pages
import api from './axios';
import axios from 'axios';

// Extended Products API with all methods
export const productsApiExtended = {
  // Original methods
  getProducts: (filters?: any) => api.get('/products', { params: filters }).then(res => res.data),
  getProduct: (id: number) => api.get(`/products/${id}`).then(res => res.data),
  createProduct: (product: any) => api.post('/products', product).then(res => res.data),
  updateProduct: (id: number, product: any) => api.put(`/products/${id}`, product).then(res => res.data),
  deleteProduct: (id: number) => api.delete(`/products/${id}`).then(res => res.data),
  bulkAction: (action: string, productIds: number[]) => api.post('/products/bulk-action', { action, product_ids: productIds }).then(res => res.data),
  bulkDelete: (ids: number[]) => api.post('/products/bulk-action', { action: 'delete', product_ids: ids }).then(res => res.data),
  duplicate: (id: number) => api.post(`/products/${id}/duplicate`).then(res => res.data),
  uploadImages: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images[]', file);
    });
    return api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  deleteImage: (productId: number, imageId: number) => api.delete(`/products/${productId}/images/${imageId}`).then(res => res.data),
  updateImage: (productId: number, imageId: number, data: { alt_text?: string; is_primary?: boolean }) =>
    api.put(`/products/${productId}/images/${imageId}`, data).then(res => res.data),
  reorderImages: (productId: number, data: { image_orders: Array<{ id: number; sort_order: number }>; primary_image_id?: number }) =>
    api.post(`/products/${productId}/images/reorder`, data).then(res => res.data),
  toggleStatus: (id: number) => api.put(`/products/${id}/toggle-status`).then(res => res.data),
  toggleFeatured: (id: number) => api.put(`/products/${id}/toggle-featured`).then(res => res.data),
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  exportProducts: (filters?: any) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/products/export?${params.toString()}`, {
      responseType: 'blob'
    }).then(res => res.data);
  },

  // Extended/alias methods for components
  getById: (id: number) => api.get(`/products/${id}`).then(res => res.data),
  create: (data: FormData) => api.post('/products', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data),
  update: (id: number, data: FormData) => {
    // Add _method field for Laravel method spoofing with FormData
    data.append('_method', 'PUT');
    return api.post(`/products/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  delete: (id: number) => api.delete(`/products/${id}`).then(res => res.data),
  getReviews: (id: number) => api.get(`/products/${id}/reviews`).then(res => res.data),
  getAnalytics: (id: number) => api.get(`/products/${id}/analytics`).then(res => res.data),
};

// Extended Categories API
export const categoriesApiExtended = {
  getCategories: (filters?: any) => api.get('/categories', { params: filters }).then(res => res.data),
  getCategory: (id: number) => api.get(`/categories/${id}`).then(res => res.data),
  createCategory: (category: any) => api.post('/categories', category).then(res => res.data),
  updateCategory: (id: number, category: any) => api.put(`/categories/${id}`, category).then(res => res.data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`).then(res => res.data),
  getCategoryTree: () => {
    // Use public API endpoint for category tree since it doesn't require admin auth
    const publicBaseURL = process.env.REACT_APP_API_URL || process.env.REACT_APP_ADMIN_API_URL?.replace('/admin', '') || 'http://localhost:8000/api/v1';
    const publicApi = axios.create({
      baseURL: publicBaseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return publicApi.get('/categories').then(res => ({
      success: true,
      data: res.data.data || [],
      categories: res.data.data || []
    }));
  },
  getAllCategories: () => api.get('/categories?per_page=100').then(res => res.data),
  moveCategory: (id: number, parentId: number | null, sortOrder?: number) =>
    api.put(`/categories/${id}/move`, { parent_id: parentId, sort_order: sortOrder }).then(res => res.data),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/categories/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  // Extended methods
  getAll: () => api.get('/categories?per_page=100').then(res => res.data),
  create: (data: FormData) => {
    // Remove Content-Type header to let axios set it with proper boundary
    const config = {
      headers: {
        'Content-Type': undefined, // This tells axios to auto-detect and set multipart boundary
      },
    };
    return api.post('/categories', data, config).then(res => res.data);
  },
  update: (id: number, data: FormData) => {
    // Remove Content-Type header to let axios set it with proper boundary
    const config = {
      headers: {
        'Content-Type': undefined, // This tells axios to auto-detect and set multipart boundary
      },
    };
    return api.post(`/categories/${id}`, data, config).then(res => res.data);
  },
  delete: (id: number) => api.delete(`/categories/${id}`).then(res => res.data),
};

// Extended Orders API
export const ordersApiExtended = {
  getOrders: (filters?: any) => api.get('/orders', { params: filters }).then(res => res.data),
  getOrder: (id: number) => api.get(`/orders/${id}`).then(res => res.data),
  updateOrderStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }).then(res => res.data),
  updatePaymentStatus: (id: number, payment_status: string) => api.put(`/orders/${id}/payment-status`, { payment_status }).then(res => res.data),
  cancelOrder: (id: number, reason?: string) => api.post(`/orders/${id}/cancel`, { reason }).then(res => res.data),
  refundOrder: (id: number, amount?: number, reason?: string) => api.post(`/orders/${id}/refund`, { amount, reason }).then(res => res.data),
  getTimeline: (id: number) => api.get(`/orders/${id}/timeline`).then(res => res.data),
  addNote: (id: number, note: string) => api.post(`/orders/${id}/note`, { note }).then(res => res.data),
  updateTracking: (id: number, trackingData: any) => api.post(`/orders/${id}/tracking`, trackingData).then(res => res.data),
  getInvoice: (id: number) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }).then(res => res.data),
  sendEmail: (id: number, emailType: string) => api.post(`/orders/${id}/send-email`, { email_type: emailType }).then(res => res.data),
  bulkUpdateStatus: (orderIds: number[], status: string) => api.post('/orders/bulk-update-status', { order_ids: orderIds, status }).then(res => res.data),
  exportOrders: (filters?: any) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/orders/export?${params.toString()}`, {
      responseType: 'blob'
    }).then(res => res.data);
  },

  // Extended methods
  getAll: (params?: any) => api.get('/orders', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/orders/${id}`).then(res => res.data),
  updateStatus: (id: number, status: string, note?: string) =>
    api.put(`/orders/${id}/status`, { status, note }).then(res => res.data),
};

// Extended Customers API
export const customersApiExtended = {
  getCustomers: (filters?: any) => api.get('/users', { params: filters }).then(res => res.data),
  getCustomer: (id: number) => api.get(`/users/${id}`).then(res => res.data),
  createCustomer: (customer: any) => api.post('/users', customer).then(res => res.data),
  updateCustomer: (id: number, customer: any) => api.put(`/users/${id}`, customer).then(res => res.data),
  deleteCustomer: (id: number) => api.delete(`/users/${id}`).then(res => res.data),

  // Extended methods
  getById: (id: number) => api.get(`/users/${id}`).then(res => res.data),
  create: (data: any) => api.post('/users', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/users/${id}`).then(res => res.data),
  updateStatus: (id: number, status: string, reason?: string) =>
    api.put(`/users/${id}/status`, { status, reason }).then(res => res.data),
};

// Extended Coupons API
export const couponsApiExtended = {
  getCoupons: (filters?: any) => api.get('/coupons', { params: filters }).then(res => res.data),
  getCoupon: (id: number) => api.get(`/coupons/${id}`).then(res => res.data),
  createCoupon: (coupon: any) => api.post('/coupons', coupon).then(res => res.data),
  updateCoupon: (id: number, coupon: any) => api.put(`/coupons/${id}`, coupon).then(res => res.data),
  deleteCoupon: (id: number) => api.delete(`/coupons/${id}`).then(res => res.data),

  // Extended methods
  getAll: (params?: any) => api.get('/coupons', { params }).then(res => res.data),
  getStats: () => api.get('/coupons/stats').then(res => res.data),
  create: (data: any) => api.post('/coupons', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/coupons/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/coupons/${id}`).then(res => res.data),
  updateStatus: (id: number, active: boolean) =>
    api.put(`/coupons/${id}/status`, { is_active: active }).then(res => res.data),
};

// Extended Reviews API
export const reviewsApiExtended = {
  getReviews: (filters?: any) => api.get('/reviews', { params: filters }).then(res => res.data),
  getReview: (id: number) => api.get(`/reviews/${id}`).then(res => res.data),
  approveReview: (id: number) => api.put(`/reviews/${id}/approve`).then(res => res.data),
  rejectReview: (id: number, reason: string) => api.put(`/reviews/${id}/reject`, { reason }).then(res => res.data),
  deleteReview: (id: number) => api.delete(`/reviews/${id}`).then(res => res.data),

  // Extended methods
  getAll: (params?: any) => api.get('/reviews', { params }).then(res => res.data),
  updateStatus: (id: number, approved: boolean) =>
    api.put(`/reviews/${id}/status`, { is_approved: approved }).then(res => res.data),
  delete: (id: number) => api.delete(`/reviews/${id}`).then(res => res.data),
  addResponse: (id: number, response: string) =>
    api.post(`/reviews/${id}/response`, { admin_response: response }).then(res => res.data),
};

// Extended Users API for admin users
export const usersApiExtended = {
  getUsers: (filters?: any) => api.get('/users', { params: filters }).then(res => res.data),
  getUser: (id: number) => api.get(`/users/${id}`).then(res => res.data),
  updateUser: (id: number, user: any) => api.put(`/users/${id}`, user).then(res => res.data),

  // Extended methods for admin users
  getAdminUsers: (params?: any) => api.get('/users?role=admin', { params }).then(res => res.data),
  createAdminUser: (data: any) => api.post('/users', { ...data, role: 'admin' }).then(res => res.data),
  updateAdminUser: (id: number, data: any) => api.put(`/users/${id}`, data).then(res => res.data),
  deleteAdminUser: (id: number) => api.delete(`/users/${id}`).then(res => res.data),
  updateAdminUserStatus: (id: number, active: boolean) =>
    api.put(`/users/${id}/status`, { is_active: active }).then(res => res.data),
  changeAdminPassword: (id: number, password: string) =>
    api.put(`/users/${id}/password`, { password }).then(res => res.data),
};

// Extended Auth API for profile
export const authApiExtended = {
  login: (credentials: any) => api.post('/auth/login', credentials).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  check: () => api.get('/auth/check').then(res => res.data),
  me: () => api.get('/auth/check').then(res => res.data),
  refreshToken: () => api.post('/auth/refresh').then(res => res.data),

  // Profile methods
  getProfile: () => api.get('/auth/profile').then(res => res.data),
  updateProfile: (data: FormData) => api.post('/auth/profile', data).then(res => res.data),
  changePassword: (data: any) => api.put('/auth/password', data).then(res => res.data),
  updatePreferences: (data: any) => api.put('/auth/preferences', data).then(res => res.data),
  getActivityLogs: () => api.get('/auth/activity').then(res => res.data),
};

// Settings API (kept as is)
export const settingsApi = {
  getGeneralSettings: () => api.get('/settings/general').then(res => res.data),
  updateGeneralSettings: (settings: any) => api.put('/settings/general', settings).then(res => res.data),
  getRoles: () => api.get('/settings/roles').then(res => res.data),
  createRole: (role: any) => api.post('/settings/roles', role).then(res => res.data),
  updateRole: (id: number, role: any) => api.put(`/settings/roles/${id}`, role).then(res => res.data),
  deleteRole: (id: number) => api.delete(`/settings/roles/${id}`).then(res => res.data),
  getEmailTemplates: () => api.get('/settings/email-templates').then(res => res.data),
  updateEmailTemplate: (id: number, template: any) => api.put(`/settings/email-templates/${id}`, template).then(res => res.data),
  getPaymentSettings: () => api.get('/settings/payment').then(res => res.data),
  updatePaymentSettings: (settings: any) => api.put('/settings/payment', settings).then(res => res.data),
  updatePaymentGateway: (id: number, updates: any) => api.put(`/payment-methods/${id}`, updates).then(res => res.data),
  togglePaymentGateway: (id: number) => api.post(`/payment-methods/${id}/toggle`).then(res => res.data),
  getShippingSettings: () => api.get('/settings/shipping').then(res => res.data),
  updateShippingSettings: (settings: any) => api.put('/settings/shipping', settings).then(res => res.data),

  // Alias methods for components
  getGeneral: () => api.get('/settings/general').then(res => res.data),
  updateGeneral: (settings: any) => api.put('/settings/general', settings).then(res => res.data),
  getPayment: () => api.get('/settings/payment').then(res => res.data),

  // Configuration APIs
  getSiteConfig: () => api.get('/configuration/site-config').then(res => res.data),
  updateSiteConfig: (config: any) => api.put('/configuration/site-config', config).then(res => res.data),
  getHomepageConfig: () => api.get('/configuration/homepage-config').then(res => res.data),
  getNavigationConfig: () => api.get('/configuration/navigation-config').then(res => res.data),
  getContentPage: (slug: string) => api.get(`/configuration/content-page/${slug}`).then(res => res.data),

  // Content Management APIs
  getContentSiteConfig: () => api.get('/content/site-config').then(res => res.data),
  updateContentSiteConfig: (config: any) => api.put('/content/site-config', config).then(res => res.data),
  getContentHomepageConfig: () => api.get('/content/homepage-config').then(res => res.data),
  updateContentHomepageConfig: (config: any) => api.put('/content/homepage-config', config).then(res => res.data),
  getContentNavigationConfig: () => api.get('/content/navigation-config').then(res => res.data),
  updateContentNavigationConfig: (config: any) => api.put('/content/navigation-config', config).then(res => res.data),

  // System Management APIs
  getSystemHealth: () => api.get('/system/health').then(res => res.data),
  clearCache: () => api.post('/system/cache/clear').then(res => res.data),
  optimizeSystem: () => api.post('/system/optimize').then(res => res.data),
  getBackups: () => api.get('/system/backup').then(res => res.data),
  createBackup: () => api.post('/system/backup/create').then(res => res.data),
  restoreBackup: (backupId: string) => api.post('/system/backup/restore', { backup_id: backupId }).then(res => res.data),
  getSystemLogs: () => api.get('/system/logs').then(res => res.data),
  getQueueStatus: () => api.get('/system/queue-status').then(res => res.data),

  getShipping: () => api.get('/settings/shipping').then(res => res.data),

  // Payment Flow Settings
  getPaymentFlowSettings: () => api.get('/admin-settings/payment-flow').then(res => res.data),
  updatePaymentFlowSettings: (settings: {
    flow_type?: string;
    default_type?: string;
    cod_enabled?: string;
    online_payment_enabled?: string;
  }) =>
    api.put('/admin-settings/payment-flow', settings).then(res => res.data),

  // Payment Configuration Management
  updatePaymentConfiguration: (id: number, updates: any) =>
    api.put(`/settings/payment-configurations/${id}`, updates).then(res => res.data),
  togglePaymentConfiguration: (id: number) =>
    api.post(`/settings/payment-configurations/${id}/toggle`).then(res => res.data),
};

// Roles API
export const rolesApi = {
  getAll: () => api.get('/settings/roles').then(res => res.data),
  create: (data: any) => api.post('/settings/roles', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/settings/roles/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/settings/roles/${id}`).then(res => res.data),
};

// Publishers API (stub)
export const publishersApi = {
  getAll: () => Promise.resolve({ publishers: [] }),
};

// Authors API (stub)
export const authorsApi = {
  getAll: () => Promise.resolve({ authors: [] }),
};

// Product Associations API (Frequently Bought Together)
export const productAssociationsApi = {
  getAssociations: (params?: any) => api.get('/product-associations', { params }).then(res => res.data),
  getAssociation: (id: number) => api.get(`/product-associations/${id}`).then(res => res.data),
  getProductAssociations: (productId: number) => api.get(`/product-associations/product/${productId}`).then(res => res.data),
  createAssociation: (data: any) => api.post('/product-associations', data).then(res => res.data),
  updateAssociation: (id: number, data: any) => api.put(`/product-associations/${id}`, data).then(res => res.data),
  deleteAssociation: (id: number) => api.delete(`/product-associations/${id}`).then(res => res.data),
  bulkDelete: (ids: number[]) => api.post('/product-associations/bulk-delete', { ids }).then(res => res.data),
  generateAssociations: (data: { months?: number; min_orders?: number; async?: boolean }) =>
    api.post('/product-associations/generate', data).then(res => res.data),
  clearAll: () => api.delete('/product-associations/clear-all').then(res => res.data),
  getStatistics: () => api.get('/product-associations/statistics').then(res => res.data),
};

// Bundle Discount Rules API
export const bundleDiscountRulesApi = {
  getRules: (params?: any) => api.get('/bundle-discount-rules', { params }).then(res => res.data),
  getRule: (id: number) => api.get(`/bundle-discount-rules/${id}`).then(res => res.data),
  createRule: (data: any) => api.post('/bundle-discount-rules', data).then(res => res.data),
  updateRule: (id: number, data: any) => api.put(`/bundle-discount-rules/${id}`, data).then(res => res.data),
  deleteRule: (id: number) => api.delete(`/bundle-discount-rules/${id}`).then(res => res.data),
  toggleActive: (id: number) => api.post(`/bundle-discount-rules/${id}/toggle-active`).then(res => res.data),
  testRule: (id: number, data: any) => api.post(`/bundle-discount-rules/${id}/test`, data).then(res => res.data),
  duplicateRule: (id: number) => api.post(`/bundle-discount-rules/${id}/duplicate`).then(res => res.data),
  getStatistics: () => api.get('/bundle-discount-rules/statistics').then(res => res.data),
  getCategories: () => api.get('/bundle-discount-rules/categories').then(res => res.data),
  getCustomerTiers: () => api.get('/bundle-discount-rules/customer-tiers').then(res => res.data),
};

// Bundle Analytics API
export const bundleAnalyticsApi = {
  getBundles: (params?: any) => api.get('/bundle-analytics', { params }).then(res => res.data),
  getStatistics: () => api.get('/bundle-analytics/statistics').then(res => res.data),
  getTopBundles: (params?: { metric?: string; limit?: number }) =>
    api.get('/bundle-analytics/top-bundles', { params }).then(res => res.data),
  getPerformance: (bundleId: string) =>
    api.get('/bundle-analytics/performance', { params: { bundle_id: bundleId } }).then(res => res.data),
  getFunnel: () => api.get('/bundle-analytics/funnel').then(res => res.data),
  getProductParticipation: (productId: number) =>
    api.get(`/bundle-analytics/product/${productId}/participation`).then(res => res.data),
  exportData: (format: 'json' | 'csv') =>
    api.get('/bundle-analytics/export', { params: { format } }).then(res => res.data),
  compareBundles: (bundleIds: string[]) =>
    api.post('/bundle-analytics/compare', { bundle_ids: bundleIds }).then(res => res.data),
  clearAnalytics: (bundleId?: string) =>
    api.delete('/bundle-analytics/clear', { data: bundleId ? { bundle_id: bundleId } : {} }).then(res => res.data),
};
// Order Charges API
export const orderChargesApi = {
  getAll: () => api.get('/order-charges').then(res => res.data),
  getOne: (id: number) => api.get(`/order-charges/${id}`).then(res => res.data),
  create: (data: any) => api.post('/order-charges', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/order-charges/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/order-charges/${id}`).then(res => res.data),
  toggleStatus: (id: number) => api.patch(`/order-charges/${id}/toggle`).then(res => res.data),
  updatePriority: (charges: Array<{id: number, priority: number}>) => 
    api.post('/order-charges/update-priority', { charges }).then(res => res.data),
};

// Tax Configurations API
export const taxConfigurationsApi = {
  getAll: () => api.get('/tax-configurations').then(res => res.data),
  getOne: (id: number) => api.get(`/tax-configurations/${id}`).then(res => res.data),
  create: (data: any) => api.post('/tax-configurations', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/tax-configurations/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/tax-configurations/${id}`).then(res => res.data),
  toggleStatus: (id: number) => api.patch(`/tax-configurations/${id}/toggle`).then(res => res.data),
};

// Hero Configuration API
export const heroConfigApi = {
  getAll: () => api.get('/hero-config').then(res => res.data),
  getActive: () => api.get('/hero-config/active').then(res => res.data),
  getOne: (variant: string) => api.get(`/hero-config/${variant}`).then(res => res.data),
  create: (data: any) => api.post('/hero-config', data).then(res => res.data),
  update: (variant: string, data: any) => api.put(`/hero-config/${variant}`, data).then(res => res.data),
  delete: (variant: string) => api.delete(`/hero-config/${variant}`).then(res => res.data),
  setActive: (variant: string) => api.post('/hero-config/set-active', { variant }).then(res => res.data),
};
