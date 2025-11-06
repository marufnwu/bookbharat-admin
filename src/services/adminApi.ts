import { axiosInstance } from '../api/axios';

// Blog API
export const adminApi = {
  // Marketing Settings
  getMarketingSettings: () => axiosInstance.get('/marketing/settings'),
  updateMarketingSettings: (data: any) => axiosInstance.post('/marketing/settings', data),
  testMarketingIntegration: (service: string) => axiosInstance.post(`/marketing/test/${service}`),

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
  getFeedStatus: () => axiosInstance.get('/feeds/status'),
  generateFeed: (type: string) => axiosInstance.post(`/feeds/generate/${type}`),
  testFeedUrl: (url: string) => axiosInstance.post('/feeds/test', { url }),

  // Social Commerce
  getSocialAccounts: () => axiosInstance.get('/social-commerce/accounts'),
  connectSocialAccount: (platform: string, data: any) => axiosInstance.post(`/social-commerce/connect/${platform}`, data),
  disconnectSocialAccount: (id: number) => axiosInstance.delete(`/social-commerce/accounts/${id}`),
  getSocialContent: (params?: any) => axiosInstance.get('/social-commerce/content', { params }),
  moderateSocialContent: (id: number, action: 'approve' | 'reject') => axiosInstance.post(`/social-commerce/content/${id}/${action}`),

  // Analytics
  getMarketingAnalytics: (params?: any) => axiosInstance.get('/debug-analytics', { params }),
  getBlogAnalytics: (params?: any) => axiosInstance.get('/analytics/blog', { params }),
  getSocialAnalytics: (params?: any) => axiosInstance.get('/analytics/social', { params }),
};