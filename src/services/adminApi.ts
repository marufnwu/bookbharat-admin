import { axiosInstance } from '../api/axios';

export const adminApi = {
  // Marketing Settings
  getMarketingSettings: () => axiosInstance.get('/marketing/settings'),
  updateMarketingSettings: (data: any) => axiosInstance.post('/marketing/settings', data),

  // Blog Posts
  getBlogPosts: (params?: any) => axiosInstance.get('/blog/posts', { params }),
  getBlogPost: (id: number) => axiosInstance.get(`/blog/posts/${id}`),
  createBlogPost: (data: any) => axiosInstance.post('/blog/posts', data),
  updateBlogPost: (id: number, data: any) => axiosInstance.put(`/blog/posts/${id}`, data),
  deleteBlogPost: (id: number) => axiosInstance.delete(`/blog/posts/${id}`),
  publishBlogPost: (id: number) => axiosInstance.post(`/blog/posts/${id}/publish`),
  unpublishBlogPost: (id: number) => axiosInstance.post(`/blog/posts/${id}/unpublish`),

  // Blog Categories
  getBlogCategories: (params?: any) => axiosInstance.get('/blog/categories', { params }),
  getBlogCategory: (id: number) => axiosInstance.get(`/blog/categories/${id}`),
  createBlogCategory: (data: any) => axiosInstance.post('/blog/categories', data),
  updateBlogCategory: (id: number, data: any) => axiosInstance.put(`/blog/categories/${id}`, data),
  deleteBlogCategory: (id: number) => axiosInstance.delete(`/blog/categories/${id}`),

  // Blog Comments
  getBlogComments: (params?: any) => axiosInstance.get('/blog/comments', { params }),
  approveBlogComment: (id: number) => axiosInstance.post(`/blog/comments/${id}/approve`),
  rejectBlogComment: (id: number) => axiosInstance.post(`/blog/comments/${id}/reject`),
  deleteBlogComment: (id: number) => axiosInstance.delete(`/blog/comments/${id}`),

  // Feeds
  getFeedStatus: () => axiosInstance.get('/marketing/feeds/status'),
  generateFeed: (type: string, format?: string) => {
    const url = format
      ? `/marketing/feeds/generate/${type}/${format}`
      : `/marketing/feeds/generate/${type}`;
    return axiosInstance.post(url);
  },
  testFeedUrl: (url: string) => axiosInstance.post('/marketing/feeds/test', { url }),

  // Product Collections
  getProductCollections: (params?: any) => axiosInstance.get('/product-collections', { params }),
  getProductCollection: (id: number) => axiosInstance.get(`/product-collections/${id}`),
  createProductCollection: (data: any) => axiosInstance.post('/product-collections', data),
  updateProductCollection: (id: number, data: any) => axiosInstance.put(`/product-collections/${id}`, data),
  deleteProductCollection: (id: number) => axiosInstance.delete(`/product-collections/${id}`),
  addProductsToCollection: (id: number, productIds: number[]) =>
    axiosInstance.post(`/product-collections/${id}/products`, { product_ids: productIds }),
  removeProductsFromCollection: (id: number, productIds: number[]) =>
    axiosInstance.delete(`/product-collections/${id}/products`, { data: { product_ids: productIds } }),
  getAvailableProducts: (params?: any) => axiosInstance.get('/product-collections/products/available', { params }),
  getAvailableCategories: () => axiosInstance.get('/product-collections/categories/available'),

  // Analytics
  getMarketingAnalytics: (params?: any) => axiosInstance.get('/debug-analytics', { params }),
};