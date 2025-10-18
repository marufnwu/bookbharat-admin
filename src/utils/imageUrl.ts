/**
 * Helper to convert relative image paths to full URLs
 * Handles both relative paths (/storage/...) and full URLs (https://...)
 * 
 * @param url - The image URL (relative or absolute)
 * @returns Full URL that can be used in img src
 */
export const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path, prepend the backend URL
  if (url.startsWith('/')) {
    const backendUrl = process.env.REACT_APP_ADMIN_API_URL?.replace('/api/v1/admin', '') || 'http://localhost:8000';
    return backendUrl + url;
  }
  
  // Return as-is for other cases
  return url;
};

/**
 * Get backend base URL
 */
export const getBackendUrl = (): string => {
  return process.env.REACT_APP_ADMIN_API_URL?.replace('/api/v1/admin', '') || 'http://localhost:8000';
};

