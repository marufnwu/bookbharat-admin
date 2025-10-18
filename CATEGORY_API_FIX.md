# Category API Hardcoded URL Fix

## Issue
The category dropdown in the product create page was using a hardcoded API base URL (`http://localhost:8000/api/v1`) instead of using environment variables. This would cause issues in production or when the API is hosted on a different domain.

## Fix Applied
Updated `src/api/extended.ts` line 81 to use environment variables with proper fallback:

### Before
```typescript
const publicApi = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

### After
```typescript
const publicBaseURL = process.env.REACT_APP_API_URL || process.env.REACT_APP_ADMIN_API_URL?.replace('/admin', '') || 'http://localhost:8000/api/v1';
const publicApi = axios.create({
  baseURL: publicBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

## Environment Variables Required

Create a `.env` file in the admin directory with the following variables:

```env
# Admin API URL (with /admin suffix)
REACT_APP_ADMIN_API_URL=http://localhost:8000/api/v1/admin

# Public API URL (without /admin suffix, for category tree and public endpoints)
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### For Production
```env
REACT_APP_ADMIN_API_URL=https://api.yourdomain.com/api/v1/admin
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
```

## Impact
- ✅ Product create page category dropdown now uses configurable API URL
- ✅ Works correctly in development, staging, and production environments
- ✅ No code changes needed for different environments
- ✅ Maintains backward compatibility with localhost fallback

## Files Modified
- `src/api/extended.ts` - Updated `getCategoryTree()` function in `categoriesApiExtended`

## Testing
1. Create a `.env` file with the environment variables
2. Restart the development server
3. Navigate to Products → Create Product
4. Verify the category dropdown loads correctly
5. Check browser network tab to ensure it's using the correct API URL

