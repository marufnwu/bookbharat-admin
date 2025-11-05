import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  AuthResponse,
  User,
  Product,
  Order,
  Customer,
  DashboardStats,
  RevenueData,
  TopProduct,
  FilterOptions,
  Category,
  Brand,
} from '../types';

// Import extended APIs at the top
import {
  productsApiExtended,
  categoriesApiExtended,
  ordersApiExtended,
  customersApiExtended,
  couponsApiExtended,
  reviewsApiExtended,
  usersApiExtended,
  authApiExtended,
  settingsApi as settingsApiExtended,
  rolesApi,
  publishersApi,
  authorsApi,
  productAssociationsApi,
  bundleDiscountRulesApi,
  bundleAnalyticsApi,
  bundleVariantsApi,
} from './extended';

// Auth API (base)
const authApiBase = {
  login: (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> =>
    api.post('/auth/login', credentials).then(res => res.data),

  logout: (): Promise<ApiResponse> =>
    api.post('/auth/logout').then(res => res.data),

  check: (): Promise<ApiResponse<User>> =>
    api.get('/auth/check').then(res => res.data),

  me: (): Promise<ApiResponse<User>> =>
    api.get('/auth/user').then(res => res.data), // Using user endpoint for me

  refreshToken: (): Promise<ApiResponse<AuthResponse>> =>
    api.post('/auth/refresh').then(res => res.data),
};

// Dashboard API
export const dashboardApi = {
  getOverview: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/overview').then(res => res.data),

  getStats: (): Promise<any> =>
    api.get('/dashboard/overview').then(res => res.data), // Returns the full response including dashboard object

  getRevenueData: (period: string = '30d'): Promise<any> =>
    api.get('/dashboard/sales-analytics').then(res => {
      // Transform the response to match expected format
      const salesData = res.data?.data?.chart_data || [];
      return {
        data: salesData.map((item: any) => ({
          date: item.date,
          revenue: item.revenue || 0,
          orders: item.orders || 0
        }))
      };
    }),

  getTopProducts: (limit: number = 5): Promise<any> =>
    api.get('/dashboard/overview').then(res => {
      // Extract top products from the overview response
      const topProducts = res.data?.dashboard?.top_products || [];
      return {
        data: topProducts.slice(0, limit)
      };
    }),

  getRecentOrders: (limit: number = 5): Promise<any> =>
    api.get('/dashboard/order-insights').then(res => {
      // Extract recent orders from the response
      const orders = res.data?.data?.recent_orders || [];
      return {
        data: orders.slice(0, limit)
      };
    }),

  getSalesAnalytics: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/sales-analytics').then(res => res.data),

  getCustomerAnalytics: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/customer-analytics').then(res => res.data),

  getInventoryOverview: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/inventory-overview').then(res => res.data),

  getOrderInsights: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/order-insights').then(res => res.data),

  getMarketingPerformance: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/marketing-performance').then(res => res.data),

  getRealTimeStats: (): Promise<ApiResponse<any>> =>
    api.get('/dashboard/real-time-stats').then(res => res.data),
};

// Products API (base)
const productsApiBase = {
  getProducts: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/products?${params.toString()}`).then(res => res.data);
  },

  getProduct: (id: number): Promise<ApiResponse<Product>> =>
    api.get(`/products/${id}`).then(res => res.data),

  createProduct: (product: Partial<Product>): Promise<ApiResponse<Product>> =>
    api.post('/products', product).then(res => res.data),

  updateProduct: (id: number, product: Partial<Product>): Promise<ApiResponse<Product>> =>
    api.put(`/products/${id}`, product).then(res => res.data),

  deleteProduct: (id: number): Promise<ApiResponse> =>
    api.delete(`/products/${id}`).then(res => res.data),

  bulkAction: (action: string, productIds: number[]): Promise<ApiResponse> =>
    api.post('/products/bulk-action', { action, product_ids: productIds }).then(res => res.data),

  bulkDelete: (ids: number[]): Promise<ApiResponse> =>
    api.post('/products/bulk-action', { action: 'delete', product_ids: ids }).then(res => res.data),

  duplicate: (id: number): Promise<ApiResponse<Product>> =>
    api.post(`/products/${id}/duplicate`).then(res => res.data),

  uploadImages: (id: number, files: File[]): Promise<ApiResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images[]', file);
    });
    return api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  deleteImage: (productId: number, imageId: number): Promise<ApiResponse> =>
    api.delete(`/products/${productId}/images/${imageId}`).then(res => res.data),

  toggleStatus: (id: number): Promise<ApiResponse> =>
    api.put(`/products/${id}/toggle-status`).then(res => res.data),

  toggleFeatured: (id: number): Promise<ApiResponse> =>
    api.put(`/products/${id}/toggle-featured`).then(res => res.data),

  getAnalytics: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/products/${id}/analytics`).then(res => res.data),

  importProducts: (file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  exportProducts: (filters: FilterOptions = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/products/export?${params.toString()}`, {
      responseType: 'blob'
    }).then(res => res.data);
  },
};

// Categories API (base)
const categoriesApiBase = {
  getCategories: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Category>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/categories?${params.toString()}`).then(res => res.data);
  },

  getCategoryTree: (): Promise<ApiResponse<Category[]>> =>
    api.get('/categories/tree').then(res => res.data),

  getAllCategories: (): Promise<ApiResponse<Category[]>> =>
    api.get('/categories?per_page=100').then(res => res.data),

  getCategory: (id: number): Promise<ApiResponse<Category>> =>
    api.get(`/categories/${id}`).then(res => res.data),

  createCategory: (category: Partial<Category>): Promise<ApiResponse<Category>> =>
    api.post('/categories', category).then(res => res.data),

  updateCategory: (id: number, category: Partial<Category>): Promise<ApiResponse<Category>> =>
    api.put(`/categories/${id}`, category).then(res => res.data),

  deleteCategory: (id: number): Promise<ApiResponse> =>
    api.delete(`/categories/${id}`).then(res => res.data),

  moveCategory: (id: number, parentId: number | null, sortOrder?: number): Promise<ApiResponse> =>
    api.put(`/categories/${id}/move`, { parent_id: parentId, sort_order: sortOrder }).then(res => res.data),

  uploadImage: (id: number, file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/categories/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
};

// Orders API (base)
const ordersApiBase = {
  getOrders: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/orders?${params.toString()}`).then(res => res.data);
  },

  getOrder: (id: number): Promise<ApiResponse<Order>> =>
    api.get(`/orders/${id}`).then(res => res.data),

  updateOrderStatus: (id: number, status: string): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${id}/status`, { status }).then(res => res.data),

  updatePaymentStatus: (id: number, payment_status: string): Promise<ApiResponse<Order>> =>
    api.put(`/orders/${id}/payment-status`, { payment_status }).then(res => res.data),

  cancelOrder: (id: number, reason?: string): Promise<ApiResponse> =>
    api.post(`/orders/${id}/cancel`, { reason }).then(res => res.data),

  refundOrder: (id: number, amount?: number, reason?: string): Promise<ApiResponse> =>
    api.post(`/orders/${id}/refund`, { amount, reason }).then(res => res.data),

  getTimeline: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/orders/${id}/timeline`).then(res => res.data),

  addNote: (id: number, note: string): Promise<ApiResponse> =>
    api.post(`/orders/${id}/note`, { note }).then(res => res.data),

  updateTracking: (id: number, trackingData: any): Promise<ApiResponse> =>
    api.post(`/orders/${id}/tracking`, trackingData).then(res => res.data),

  getInvoice: (id: number): Promise<Blob> =>
    api.get(`/orders/${id}/invoice`, { responseType: 'blob' }).then(res => res.data),

  sendEmail: (id: number, emailType: string): Promise<ApiResponse> =>
    api.post(`/orders/${id}/send-email`, { email_type: emailType }).then(res => res.data),

  bulkUpdateStatus: (orderIds: number[], status: string): Promise<ApiResponse> =>
    api.post('/orders/bulk-update-status', { order_ids: orderIds, status }).then(res => res.data),

  exportOrders: (filters: FilterOptions = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/orders/export?${params.toString()}`, {
      responseType: 'blob'
    }).then(res => res.data);
  },
};

// Users API (Admin manages customers as users) (base)
const usersApiBase = {
  getUsers: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/users?${params.toString()}`).then(res => res.data);
  },

  getUser: (id: number): Promise<ApiResponse<User>> =>
    api.get(`/users/${id}`).then(res => res.data),

  updateUser: (id: number, user: Partial<User>): Promise<ApiResponse<User>> =>
    api.put(`/users/${id}`, user).then(res => res.data),

  resetPassword: (id: number): Promise<ApiResponse> =>
    api.post(`/users/${id}/reset-password`).then(res => res.data),

  toggleStatus: (id: number): Promise<ApiResponse> =>
    api.post(`/users/${id}/toggle-status`).then(res => res.data),

  getUserOrders: (id: number, filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/users/${id}/orders?${params.toString()}`).then(res => res.data);
  },

  getUserAddresses: (id: number): Promise<ApiResponse<any[]>> =>
    api.get(`/users/${id}/addresses`).then(res => res.data),

  getUserAnalytics: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/users/${id}/analytics`).then(res => res.data),

  sendEmail: (id: number, subject: string, message: string): Promise<ApiResponse> =>
    api.post(`/users/${id}/send-email`, { subject, message }).then(res => res.data),

  bulkAction: (action: string, userIds: number[]): Promise<ApiResponse> =>
    api.post('/users/bulk-action', { action, user_ids: userIds }).then(res => res.data),

  exportUsers: (filters: FilterOptions = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/users/export?${params.toString()}`, {
      responseType: 'blob'
    }).then(res => res.data);
  },
};

// Coupons API (base)
const couponsApiBase = {
  getCoupons: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/coupons?${params.toString()}`).then(res => res.data);
  },

  getCoupon: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/coupons/${id}`).then(res => res.data),

  createCoupon: (coupon: any): Promise<ApiResponse<any>> =>
    api.post('/coupons', coupon).then(res => res.data),

  updateCoupon: (id: number, coupon: any): Promise<ApiResponse<any>> =>
    api.put(`/coupons/${id}`, coupon).then(res => res.data),

  deleteCoupon: (id: number): Promise<ApiResponse> =>
    api.delete(`/coupons/${id}`).then(res => res.data),

  bulkAction: (action: string, couponIds: number[]): Promise<ApiResponse> =>
    api.post('/coupons/bulk-action', { action, coupon_ids: couponIds }).then(res => res.data),

  generateCode: (): Promise<ApiResponse<{ code: string }>> =>
    api.post('/coupons/generate-code').then(res => res.data),

  validateCoupon: (code: string): Promise<ApiResponse<any>> =>
    api.post('/coupons/validate', { code }).then(res => res.data),

  getUsageReport: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/coupons/${id}/usage-report`).then(res => res.data),

  bulkGenerate: (data: any): Promise<ApiResponse<any>> =>
    api.post('/coupons/bulk-generate', data).then(res => res.data),
};

// Reviews API (base)
const reviewsApiBase = {
  getReviews: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/reviews?${params.toString()}`).then(res => res.data);
  },

  getReview: (id: number): Promise<ApiResponse<any>> =>
    api.get(`/reviews/${id}`).then(res => res.data),

  approveReview: (id: number): Promise<ApiResponse> =>
    api.put(`/reviews/${id}/approve`).then(res => res.data),

  rejectReview: (id: number, reason: string): Promise<ApiResponse> =>
    api.put(`/reviews/${id}/reject`, { reason }).then(res => res.data),

  deleteReview: (id: number): Promise<ApiResponse> =>
    api.delete(`/reviews/${id}`).then(res => res.data),

  bulkAction: (action: string, reviewIds: number[], reason?: string): Promise<ApiResponse> =>
    api.post('/reviews/bulk-action', { action, review_ids: reviewIds, reason }).then(res => res.data),

  getPending: (): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/reviews/pending').then(res => res.data),

  getReported: (): Promise<ApiResponse<PaginatedResponse<any>>> =>
    api.get('/reviews/reported').then(res => res.data),
};

// Shipping API
export const shippingApi = {
  getZones: (): Promise<ApiResponse<any[]>> =>
    api.get('/shipping/zones').then(res => res.data),

  createZone: (zone: any): Promise<ApiResponse<any>> =>
    api.post('/shipping/zones', zone).then(res => res.data),

  updateZone: (id: number, zone: any): Promise<ApiResponse<any>> =>
    api.put(`/shipping/zones/${id}`, zone).then(res => res.data),

  deleteZone: (id: number): Promise<ApiResponse> =>
    api.delete(`/shipping/zones/${id}`).then(res => res.data),

  getWeightSlabs: (): Promise<ApiResponse<any>> =>
    api.get('/shipping/weight-slabs').then(res => res.data),

  createWeightSlab: (slab: any): Promise<ApiResponse<any>> =>
    api.post('/shipping/weight-slabs', slab).then(res => res.data),

  updateWeightSlab: (id: number, slab: any): Promise<ApiResponse<any>> =>
    api.put(`/shipping/weight-slabs/${id}`, slab).then(res => res.data),

  deleteWeightSlab: (id: number): Promise<ApiResponse> =>
    api.delete(`/shipping/weight-slabs/${id}`).then(res => res.data),

  getPincodes: (params?: { page?: number; search?: string; zone?: string; state?: string }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.zone) queryParams.append('zone', params.zone);
    if (params?.state) queryParams.append('state', params.state);
    const query = queryParams.toString();
    return api.get(`/shipping/pincodes${query ? `?${query}` : ''}`).then(res => res.data);
  },

  createPincodeZone: (pincode: any): Promise<ApiResponse<any>> =>
    api.post('/shipping/pincodes', pincode).then(res => res.data),

  updatePincodeZone: (id: number, pincode: any): Promise<ApiResponse<any>> =>
    api.put(`/shipping/pincodes/${id}`, pincode).then(res => res.data),

  deletePincodeZone: (id: number): Promise<ApiResponse> =>
    api.delete(`/shipping/pincodes/${id}`).then(res => res.data),

  testCalculation: (data: any): Promise<ApiResponse<any>> =>
    api.post('/shipping/test-calculation', data).then(res => res.data),

  getAnalytics: (): Promise<ApiResponse<any>> =>
    api.get('/shipping/analytics').then(res => res.data),

  // Warehouses
  getWarehouses: (): Promise<ApiResponse<any>> =>
    api.get('/shipping/warehouses').then(res => res.data),

  createWarehouse: (warehouse: any): Promise<ApiResponse<any>> =>
    api.post('/shipping/warehouses', warehouse).then(res => res.data),

  updateWarehouse: (id: number, warehouse: any): Promise<ApiResponse<any>> =>
    api.put(`/shipping/warehouses/${id}`, warehouse).then(res => res.data),

  deleteWarehouse: (id: number): Promise<ApiResponse> =>
    api.delete(`/shipping/warehouses/${id}`).then(res => res.data),

  setDefaultWarehouse: (id: number): Promise<ApiResponse<any>> =>
    api.post(`/shipping/warehouses/${id}/set-default`).then(res => res.data),

  // Free Shipping Thresholds
  getFreeShippingThresholds: (): Promise<ApiResponse<any>> =>
    api.get('/shipping/free-shipping-thresholds').then(res => res.data),

  updateFreeShippingThreshold: (data: { zone: string; threshold?: number; enabled?: boolean }): Promise<ApiResponse<any>> =>
    api.post('/shipping/free-shipping-thresholds', data).then(res => res.data),
};

// Settings API (base)
const settingsApiBase = {
  getGeneralSettings: (): Promise<ApiResponse<any>> =>
    api.get('/settings/general').then(res => res.data),

  updateGeneralSettings: (settings: any): Promise<ApiResponse> =>
    api.put('/settings/general', settings).then(res => res.data),

  getRoles: (): Promise<ApiResponse<any>> =>
    api.get('/settings/roles').then(res => res.data),

  createRole: (role: any): Promise<ApiResponse<any>> =>
    api.post('/settings/roles', role).then(res => res.data),

  updateRole: (id: number, role: any): Promise<ApiResponse<any>> =>
    api.put(`/settings/roles/${id}`, role).then(res => res.data),

  deleteRole: (id: number): Promise<ApiResponse> =>
    api.delete(`/settings/roles/${id}`).then(res => res.data),

  getEmailTemplates: (): Promise<ApiResponse<any>> =>
    api.get('/settings/email-templates').then(res => res.data),

  updateEmailTemplate: (id: number, template: any): Promise<ApiResponse<any>> =>
    api.put(`/settings/email-templates/${id}`, template).then(res => res.data),

  getPaymentSettings: (): Promise<ApiResponse<any>> =>
    api.get('/settings/payment').then(res => res.data),

  updatePaymentSettings: (settings: any): Promise<ApiResponse> =>
    api.put('/settings/payment', settings).then(res => res.data),

  getShippingSettings: (): Promise<ApiResponse<any>> =>
    api.get('/settings/shipping').then(res => res.data),

  updateShippingSettings: (settings: any): Promise<ApiResponse> =>
    api.put('/settings/shipping', settings).then(res => res.data),
};

// System API
export const systemApi = {
  getHealth: (): Promise<ApiResponse<any>> =>
    api.get('/system/health').then(res => res.data),

  clearCache: (): Promise<ApiResponse> =>
    api.post('/system/cache/clear').then(res => res.data),

  optimize: (): Promise<ApiResponse> =>
    api.post('/system/optimize').then(res => res.data),

  getBackups: (): Promise<ApiResponse<any[]>> =>
    api.get('/system/backup').then(res => res.data),

  createBackup: (): Promise<ApiResponse> =>
    api.post('/system/backup/create').then(res => res.data),

  restoreBackup: (backupId: string): Promise<ApiResponse> =>
    api.post('/system/backup/restore', { backup_id: backupId }).then(res => res.data),

  getLogs: (): Promise<ApiResponse<any[]>> =>
    api.get('/system/logs').then(res => res.data),

  getQueueStatus: (): Promise<ApiResponse<any>> =>
    api.get('/system/queue-status').then(res => res.data),
};

// Content API
export const contentApi = {
  getSiteConfig: (): Promise<ApiResponse<any>> =>
    api.get('/content/site-config').then(res => res.data),

  updateSiteConfig: (config: any): Promise<ApiResponse> =>
    api.put('/content/site-config', config).then(res => res.data),

  getHomepageConfig: (): Promise<ApiResponse<any>> =>
    api.get('/content/homepage-config').then(res => res.data),

  updateHomepageConfig: (config: any): Promise<ApiResponse> =>
    api.put('/content/homepage-config', config).then(res => res.data),

  getNavigationConfig: (): Promise<ApiResponse<any>> =>
    api.get('/content/navigation-config').then(res => res.data),

  updateNavigationConfig: (config: any): Promise<ApiResponse> =>
    api.put('/content/navigation-config', config).then(res => res.data),

  uploadMedia: (file: File, type: string = 'image'): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/content/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  getMediaLibrary: (): Promise<ApiResponse<any[]>> =>
    api.get('/content/media/library').then(res => res.data),

  deleteMedia: (id: number): Promise<ApiResponse> =>
    api.delete(`/content/media/${id}`).then(res => res.data),
};

// Reports API
export const reportsApi = {
  getSalesReport: (filters: any = {}): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/reports/sales?${params.toString()}`).then(res => res.data);
  },

  getProductsReport: (filters: any = {}): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/reports/products?${params.toString()}`).then(res => res.data);
  },

  getCustomersReport: (filters: any = {}): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get(`/reports/customers?${params.toString()}`).then(res => res.data);
  },

  getInventoryReport: (): Promise<ApiResponse<any>> =>
    api.get('/reports/inventory').then(res => res.data),

  generateCustomReport: (data: any): Promise<ApiResponse<any>> =>
    api.post('/reports/generate', data).then(res => res.data),
};

// Brands API (stub for now - brands handled as product metadata)
export const brandsApi = {
  getBrands: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Brand>>> => {
    // Brands are not a separate entity in backend, return empty for now
    return Promise.resolve({
      success: true,
      message: 'Brands loaded',
      data: {
        data: [],
        total: 0,
        per_page: 20,
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
      }
    } as any);
  },

  getAllBrands: (): Promise<ApiResponse<Brand[]>> =>
    Promise.resolve({ success: true, message: 'Brands loaded', data: [] } as any),

  getBrand: (id: number): Promise<ApiResponse<Brand>> =>
    Promise.resolve({ success: true, message: 'Brand loaded', data: {} as Brand } as any),

  createBrand: (brand: Partial<Brand>): Promise<ApiResponse<Brand>> =>
    Promise.resolve({ success: true, message: 'Brand created', data: brand as Brand } as any),

  updateBrand: (id: number, brand: Partial<Brand>): Promise<ApiResponse<Brand>> =>
    Promise.resolve({ success: true, message: 'Brand updated', data: brand as Brand } as any),

  deleteBrand: (id: number): Promise<ApiResponse> =>
    Promise.resolve({ success: true, message: 'Brand deleted' } as any),
};

// Customers API (alias for users API since backend treats customers as users) (base)
const customersApiBase = {
  getCustomers: (filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Customer>>> =>
    usersApiBase.getUsers(filters) as Promise<ApiResponse<PaginatedResponse<Customer>>>,

  getCustomer: (id: number): Promise<ApiResponse<Customer>> =>
    usersApiBase.getUser(id) as Promise<ApiResponse<Customer>>,

  createCustomer: (customer: Partial<Customer>): Promise<ApiResponse<Customer>> =>
    Promise.resolve({ success: true, message: 'Customer created', data: customer as Customer } as any),

  updateCustomer: (id: number, customer: Partial<Customer>): Promise<ApiResponse<Customer>> =>
    usersApiBase.updateUser(id, customer as Partial<User>) as Promise<ApiResponse<Customer>>,

  deleteCustomer: (id: number): Promise<ApiResponse> =>
    Promise.resolve({ success: true, message: 'Customer deleted' } as any),

  getCustomerOrders: (id: number, filters: FilterOptions = {}): Promise<ApiResponse<PaginatedResponse<Order>>> =>
    usersApiBase.getUserOrders(id, filters),
};

// Override with extended versions
const productsApi = productsApiExtended;
const categoriesApi = categoriesApiExtended;
const ordersApi = ordersApiExtended;
const customersApi = customersApiExtended;
const couponsApi = couponsApiExtended;
const reviewsApi = reviewsApiExtended;
const usersApi = usersApiExtended;
const authApi = authApiExtended;
const settingsApi = settingsApiExtended;

// Export the extended versions
export {
  productsApi,
  categoriesApi,
  ordersApi,
  customersApi,
  couponsApi,
  reviewsApi,
  usersApi,
  authApi,
  rolesApi,
  publishersApi,
  authorsApi,
  settingsApi,
  productAssociationsApi,
  bundleDiscountRulesApi,
  bundleAnalyticsApi,
  bundleVariantsApi,
};

// Export Hero Config API
export { heroConfigApi } from './extended';


// Export all APIs
export default {
  auth: authApi,
  dashboard: dashboardApi,
  products: productsApi,
  categories: categoriesApi,
  brands: brandsApi,
  orders: ordersApi,
  users: usersApi,
  customers: customersApi,
  coupons: couponsApi,
  reviews: reviewsApi,
  shipping: shippingApi,
  settings: settingsApi,
  system: systemApi,
  content: contentApi,
  reports: reportsApi,
  productAssociations: productAssociationsApi,
  bundleVariants: bundleVariantsApi,
  bundleDiscountRules: bundleDiscountRulesApi,
  bundleAnalytics: bundleAnalyticsApi,
};