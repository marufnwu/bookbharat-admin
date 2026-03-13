# 🔧 Refactoring Prompt Series
## BookBharat Admin — Sequential Execution Guide

> Run these prompts **in order**. Each prompt builds on the previous one.
> Do NOT skip ahead. Each phase assumes the previous is complete.

---

# ════════════════════════════════════════
# PROMPT 01 — CRITICAL SECURITY FIXES
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
This is PROMPT 01 of a series. Complete ALL tasks in this prompt before moving to the next.

## Your Tasks

### Task 1 — Remove the exposed debug route
Open `routes/admin.php` and find this block (around lines 62-72):
```php
Route::get('/debug-analytics', function () {
    $controller = new \App\Http\Controllers\Admin\AnalyticsController();
    ...
});
```
Delete it entirely. This route bypasses authentication and exposes analytics to anyone.

### Task 2 — Add rate limiting to admin auth routes
In `routes/admin.php`, find the login/auth routes and wrap them with throttle middleware:
```php
Route::middleware(['throttle:5,1'])->group(function () {
    // login, forgot-password, reset-password routes here
});
```
Also apply `throttle:10,1` to the impersonation route.

### Task 3 — Protect mass assignment in all Models
Search every file in `app/Models/` for any model that has:
- `protected $guarded = []` → Replace with explicit `$fillable` listing only safe fields
- No `$fillable` or `$guarded` at all → Add `$fillable` with only the columns that should be user-settable

For `User` model specifically, ensure `role`, `is_admin`, `email_verified_at`, `password` are NOT in `$fillable` (they should be set programmatically only).

### Task 4 — Fix the UserController mass assignment risk
In `app/Http/Controllers/Admin/UserController.php`, find:
```php
$user->update($request->all());
```
Replace with:
```php
$user->update($request->only(['name', 'email', 'phone'])); // list only safe fields
```
Do the same for any other controller that uses `$request->all()` passed directly to `update()` or `create()`.

### Task 5 — Add authorization stubs to sensitive controller methods
In `OrderController.php`, add this to the refund method:
```php
public function refund(Request $request, Order $order)
{
    // Temporary guard until Policies are created in Prompt 03
    if (!auth()->user()->hasRole('admin')) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    // ... rest of method
}
```
Do the same for any method involving: impersonation, deleting orders, changing user roles.

## Verification
After completing all tasks:
- Run `php artisan route:list | grep debug` — should return nothing
- Confirm no model has `$guarded = []`
- Confirm login routes have throttle middleware

## Do NOT proceed to Prompt 02 until all 5 tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 02 — STANDARDIZE API RESPONSES
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompt 01 is complete. This is PROMPT 02.

The problem: Every controller returns a different JSON structure. Some return `{success, orders}`, others return `{success, dashboard}`, some omit `success` entirely. The React frontend has to handle all these inconsistencies.

## Your Tasks

### Task 1 — Create a reusable ApiResponse helper
Create the file `app/Http/Helpers/ApiResponse.php`:
```php
<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        $response = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        return response()->json($response, $status);
    }

    public static function created(mixed $data = null, string $message = 'Created successfully'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    public static function error(string $message = 'Error', int $status = 400, mixed $errors = null): JsonResponse
    {
        $response = ['success' => false, 'message' => $message];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        return response()->json($response, $status);
    }

    public static function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return self::error($message, 404);
    }

    public static function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return self::error($message, 403);
    }

    public static function validationError(mixed $errors, string $message = 'Validation failed'): JsonResponse
    {
        return self::error($message, 422, $errors);
    }
}
```

Register it in `config/app.php` aliases or use it via full namespace. Add a trait for convenience:

Create `app/Http/Traits/ApiResponseTrait.php`:
```php
<?php

namespace App\Http\Traits;

use App\Http\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    protected function successResponse(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return ApiResponse::success($data, $message, $status);
    }

    protected function errorResponse(string $message, int $status = 400, mixed $errors = null): JsonResponse
    {
        return ApiResponse::error($message, $status, $errors);
    }

    protected function createdResponse(mixed $data = null, string $message = 'Created successfully'): JsonResponse
    {
        return ApiResponse::created($data, $message);
    }

    protected function notFoundResponse(string $message = 'Resource not found'): JsonResponse
    {
        return ApiResponse::notFound($message);
    }
}
```

### Task 2 — Create a base AdminController
Create `app/Http/Controllers/Admin/AdminController.php`:
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;

abstract class AdminController extends Controller
{
    use ApiResponseTrait;
}
```

### Task 3 — Update OrderController to use the new response format
Open `app/Http/Controllers/Admin/OrderController.php`.
1. Change `extends Controller` to `extends AdminController`
2. Add `use App\Http\Controllers\Admin\AdminController;`
3. Replace ALL `return response()->json([...])` calls using the trait methods:
   - `return response()->json(['success' => true, 'orders' => $data])` → `return $this->successResponse(['orders' => $data])`
   - `return response()->json(['success' => false, 'message' => $e->getMessage()], 400)` → `return $this->errorResponse($e->getMessage())`
   - `return response()->json(['success' => false, 'message' => '...'], 404)` → `return $this->notFoundResponse('...')`

### Task 4 — Update DashboardController the same way
Open `app/Http/Controllers/Admin/DashboardController.php`.
Apply the exact same changes as Task 3. Every `response()->json()` call must be replaced.

### Task 5 — Create a global exception handler for clean JSON errors
Open `app/Exceptions/Handler.php`. In the `register()` method, add:
```php
$this->renderable(function (\Illuminate\Validation\ValidationException $e, $request) {
    if ($request->expectsJson()) {
        return \App\Http\Helpers\ApiResponse::validationError($e->errors());
    }
});

$this->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
    if ($request->expectsJson()) {
        return \App\Http\Helpers\ApiResponse::error('Unauthenticated', 401);
    }
});

$this->renderable(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
    if ($request->expectsJson()) {
        return \App\Http\Helpers\ApiResponse::notFound();
    }
});
```

## Verification
- Hit any admin API endpoint — all responses must have `success`, `message`, `data` keys
- Trigger a 404 — it must return JSON, not an HTML page
- Trigger a validation error — it must return `{success: false, message, errors}`

## Do NOT proceed to Prompt 03 until all 5 tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 03 — CREATE FORM REQUEST CLASSES
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01 and 02 are complete. This is PROMPT 03.

The problem: There is only 1 Form Request class in the entire project. All validation is written inline in every controller method, causing duplication, inconsistency, and security gaps.

## Your Tasks

### Task 1 — Create StoreProductRequest
Create `app/Http/Requests/Admin/Product/StoreProductRequest.php`:

Extract ALL validation rules from `ProductController`'s store method into this class.
The `authorize()` method should return `true` for now (Policies come in Prompt 04).
Rules should match exactly what was inline, just moved here.

```php
<?php

namespace App\Http\Requests\Admin\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'sku'         => ['required', 'string', 'max:100', 'unique:products,sku'],
            'price'       => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            // ... copy ALL rules from ProductController::store() inline validation
        ];
    }
}
```

### Task 2 — Create UpdateProductRequest
Create `app/Http/Requests/Admin/Product/UpdateProductRequest.php`:

Same as above but for the update method. Note: `unique` rule needs to ignore the current record:
```php
'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($this->route('product'))],
```

### Task 3 — Create Order Form Requests
Create these two files, extracting all inline validation from `OrderController`:
- `app/Http/Requests/Admin/Order/UpdateOrderStatusRequest.php`
- `app/Http/Requests/Admin/Order/RefundOrderRequest.php`

### Task 4 — Create User Form Requests
Create:
- `app/Http/Requests/Admin/User/StoreUserRequest.php`
- `app/Http/Requests/Admin/User/UpdateUserRequest.php`

### Task 5 — Wire Form Requests into Controllers
In each controller, replace:
```php
// BEFORE
public function store(Request $request)
{
    $request->validate([...rules...]);
```
With:
```php
// AFTER
public function store(StoreProductRequest $request)
{
    // validation is automatic — no $request->validate() needed
```
Remove ALL `$request->validate([...])` blocks that are now covered by Form Requests.

### Task 6 — Add custom error messages to Form Requests
In each Form Request, add a `messages()` method with human-friendly messages:
```php
public function messages(): array
{
    return [
        'name.required'  => 'Product name is required.',
        'sku.unique'     => 'This SKU is already taken.',
        'price.min'      => 'Price cannot be negative.',
    ];
}
```

## Verification
- POST to `/api/admin/products` with missing `name` → should return 422 with `{success: false, errors: {name: [...]}}`
- POST to `/api/admin/products` with duplicate SKU → should return 422 with SKU error
- Grep for `$request->validate` in all Admin controllers → should return 0 results (all moved to Form Requests)

## Do NOT proceed to Prompt 04 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 04 — CREATE POLICY CLASSES
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–03 are complete. This is PROMPT 04.

The problem: There are ZERO Policy classes. Authorization is only checked via a blanket `role:admin` middleware. There are no granular checks — any admin can do anything, including delete orders, impersonate users, or issue refunds.

## Your Tasks

### Task 1 — Create ProductPolicy
Create `app/Policies/ProductPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Product;

class ProductPolicy
{
    public function viewAny(User $user): bool   { return $user->hasRole('admin'); }
    public function view(User $user, Product $product): bool { return $user->hasRole('admin'); }
    public function create(User $user): bool    { return $user->hasRole('admin'); }
    public function update(User $user, Product $product): bool { return $user->hasRole('admin'); }
    public function delete(User $user, Product $product): bool { return $user->hasRole('super_admin'); }
    public function bulkDelete(User $user): bool { return $user->hasRole('super_admin'); }
    public function import(User $user): bool    { return $user->hasRole('admin'); }
    public function export(User $user): bool    { return $user->hasRole('admin'); }
}
```

### Task 2 — Create OrderPolicy
Create `app/Policies/OrderPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Order;

class OrderPolicy
{
    public function viewAny(User $user): bool   { return $user->hasRole('admin'); }
    public function view(User $user, Order $order): bool { return $user->hasRole('admin'); }
    public function updateStatus(User $user, Order $order): bool { return $user->hasRole('admin'); }
    public function refund(User $user, Order $order): bool { return $user->hasRole('super_admin'); }
    public function delete(User $user, Order $order): bool { return false; } // Orders are never deleted
    public function addNote(User $user, Order $order): bool { return $user->hasRole('admin'); }
}
```

### Task 3 — Create UserPolicy
Create `app/Policies/UserPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool   { return $user->hasRole('admin'); }
    public function view(User $user, User $model): bool { return $user->hasRole('admin'); }
    public function update(User $user, User $model): bool { return $user->hasRole('admin'); }
    public function delete(User $user, User $model): bool { return $user->hasRole('super_admin'); }
    public function impersonate(User $user, User $model): bool {
        // Admins cannot impersonate other admins
        return $user->hasRole('super_admin') && !$model->hasRole('admin');
    }
    public function changeRole(User $user, User $model): bool { return $user->hasRole('super_admin'); }
}
```

### Task 4 — Register all Policies
Open `app/Providers/AuthServiceProvider.php` and add to the `$policies` array:
```php
protected $policies = [
    \App\Models\Product::class => \App\Policies\ProductPolicy::class,
    \App\Models\Order::class   => \App\Policies\OrderPolicy::class,
    \App\Models\User::class    => \App\Policies\UserPolicy::class,
];
```

### Task 5 — Add authorize() calls to controllers
In each controller method, add `$this->authorize()` calls:

**ProductController:**
```php
public function index()  { $this->authorize('viewAny', Product::class); ... }
public function store()  { $this->authorize('create', Product::class); ... }
public function update() { $this->authorize('update', $product); ... }
public function destroy(){ $this->authorize('delete', $product); ... }
```

**OrderController:**
```php
public function refund() { $this->authorize('refund', $order); ... }
public function updateStatus() { $this->authorize('updateStatus', $order); ... }
```

**UserController:**
```php
public function impersonate() { $this->authorize('impersonate', $user); ... }
public function changeRole()  { $this->authorize('changeRole', $user); ... }
```

### Task 6 — Remove the temporary guards added in Prompt 01
Now that Policies exist, go back to all controllers and remove the manual `if (!auth()->user()->hasRole('admin'))` guards added in Prompt 01 Task 5 — they are now replaced by `$this->authorize()`.

## Verification
- Log in as a regular admin and attempt to delete a product → should return 403
- Attempt to impersonate another admin → should return 403
- Run `php artisan auth:list` to confirm policies are registered

## Do NOT proceed to Prompt 05 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 05 — CREATE API RESOURCE CLASSES
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–04 are complete. This is PROMPT 05.

The problem: Raw Eloquent models are returned directly from controllers. This exposes database internals, leaks sensitive fields, and makes the response format hard to control.

## Your Tasks

### Task 1 — Create ProductResource
Create `app/Http/Resources/Admin/ProductResource.php`:
```php
<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'sku'           => $this->sku,
            'price'         => $this->price,
            'stock'         => $this->stock_quantity,
            'status'        => $this->status,
            'primary_image' => $this->primary_image,
            'category'      => $this->whenLoaded('category', fn() => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),
            'created_at'    => $this->created_at->toISOString(),
            'updated_at'    => $this->updated_at->toISOString(),
        ];
    }
}
```

Also create `ProductCollection`:
```php
class ProductCollection extends ResourceCollection
{
    public $collects = ProductResource::class;
}
```

### Task 2 — Create OrderResource
Create `app/Http/Resources/Admin/OrderResource.php`:
```php
public function toArray($request): array
{
    return [
        'id'             => $this->id,
        'order_number'   => $this->order_number,
        'status'         => $this->status,
        'payment_status' => $this->payment_status,
        'total_amount'   => $this->total_amount,
        'customer'       => $this->whenLoaded('user', fn() => [
            'id'    => $this->user->id,
            'name'  => $this->user->name,
            'email' => $this->user->email,
        ]),
        'items_count'    => $this->whenLoaded('orderItems', fn() => $this->orderItems->count()),
        'created_at'     => $this->created_at->toISOString(),
    ];
}
```

### Task 3 — Create UserResource
Create `app/Http/Resources/Admin/UserResource.php`.
Ensure `password`, `remember_token`, `two_factor_secret` are NEVER included.

### Task 4 — Wire Resources into Controllers

In `ProductController::index()`:
```php
// BEFORE
return $this->successResponse(['products' => $products]);

// AFTER
return $this->successResponse(ProductResource::collection($products));
```

In `ProductController::show()`:
```php
// AFTER
return $this->successResponse(new ProductResource($product));
```

Do the same for `OrderController` and `UserController`.

### Task 5 — Disable wrapping globally
In `app/Providers/AppServiceProvider.php` → `boot()`:
```php
\Illuminate\Http\Resources\Json\JsonResource::withoutWrapping();
```
This prevents the default `{"data": {...}}` wrapper from conflicting with your `ApiResponse` format.

## Verification
- GET `/api/admin/products` → `password` field must not appear in response
- GET `/api/admin/orders` → response must use camelCase keys matching what React expects
- Confirm no raw `$model->toArray()` calls remain in controllers

## Do NOT proceed to Prompt 06 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 06 — CONSOLIDATE FRONTEND API LAYER
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–05 are complete. This is PROMPT 06.

The problem: There are THREE API layers in the React app — `src/api/index.ts` (900+ lines), `src/api/extended.ts` (600+ lines, duplicated), and inline API calls scattered in components. This causes confusion, inconsistency, and bugs where different parts of the app call the same endpoint in different ways.

## Your Tasks

### Task 1 — Audit all three layers first
Before changing anything:
1. List every function in `src/api/index.ts` with its endpoint
2. List every function in `src/api/extended.ts` with its endpoint
3. Search all component/page files for inline `axios.get/post/put/delete` or `fetch()` calls

Output a table like:
```
Function Name     | File         | Endpoint              | Duplicate of
getProducts       | index.ts     | GET /products         | —
getProducts       | extended.ts  | GET /products         | index.ts:getProducts ← DUPLICATE
fetchOrders       | OrderList.tsx| GET /orders           | index.ts:getOrders ← INLINE DUPE
```

### Task 2 — Create a clean base axios instance
Create `src/api/axios.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/admin',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Task 3 — Create one API file per resource domain
Delete `src/api/extended.ts` after migrating its unique content.
Restructure `src/api/index.ts` into separate domain files:

Create these files (consolidating from both index.ts and extended.ts):
- `src/api/products.ts` — all product API calls
- `src/api/orders.ts` — all order API calls
- `src/api/customers.ts` — all customer/user API calls
- `src/api/dashboard.ts` — all dashboard API calls
- `src/api/settings.ts` — all settings API calls

Each file should look like:
```typescript
import api from './axios';

export const productsApi = {
  getAll:  (params?: ProductFilters) => api.get('/products', { params }),
  getById: (id: number)              => api.get(`/products/${id}`),
  create:  (data: CreateProductDto)  => api.post('/products', data),
  update:  (id: number, data: UpdateProductDto) => api.put(`/products/${id}`, data),
  delete:  (id: number)              => api.delete(`/products/${id}`),
  bulkDelete: (ids: number[])        => api.post('/products/bulk-delete', { ids }),
};
```

### Task 4 — Create a unified index that re-exports everything
Update `src/api/index.ts` to be only this:
```typescript
export { productsApi } from './products';
export { ordersApi }   from './orders';
export { customersApi } from './customers';
export { dashboardApi } from './dashboard';
export { settingsApi }  from './settings';
```

### Task 5 — Replace all inline API calls in components
Search for any component that directly calls `axios` or `fetch` inline.
Move each one to the appropriate domain API file.
Update the component to import from `src/api/index.ts`.

### Task 6 — Add TypeScript types for API responses
Create `src/types/api.ts`:
```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```
Use these as return types for all API functions.

## Verification
- `src/api/extended.ts` should not exist anymore
- `grep -r "axios.get\|axios.post" src/pages src/components` should return 0 results
- All API calls must go through the domain files
- TypeScript should compile with no `any` on API return types

## Do NOT proceed to Prompt 07 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 07 — ELIMINATE DUPLICATE FUNCTIONS
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–06 are complete. This is PROMPT 07.

The problem: The same logic exists in multiple places — price formatting, shipping threshold checks, image upload handling, and error formatting are all duplicated across multiple files.

## Your Tasks

### Task 1 — Find and consolidate all duplicate PHP functions

Search for these known duplicate groups and consolidate them:

**Free shipping threshold logic** (exists in ShippingService, ConfigurationController, ShippingConfigController):
- Keep one canonical version in `ShippingService.php`
- Delete it from ConfigurationController and ShippingConfigController
- Update both controllers to call `ShippingService::getFreeShippingThreshold()`

**Order data transformation** (exists in OrderController::show() AND OrderService):
- Keep it in `OrderService`
- Delete it from `OrderController::show()`
- Update controller to call the service method

**Image upload logic** (scattered across multiple controllers):
- `ImageUploadService` exists but isn't used consistently
- Search for any controller that does manual `$request->file()->store()` without using `ImageUploadService`
- Move that logic to `ImageUploadService`
- Update every controller to call `ImageUploadService::upload()`

**Response formatting** (already fixed in Prompt 02 but verify):
- Grep for any remaining `return response()->json(['success' => ...])` NOT using the ApiResponse helper
- Fix all remaining instances

### Task 2 — Find and consolidate all duplicate React functions

**Currency/price formatting** — Find every component that has:
```typescript
// Variations of this exist everywhere
const formatPrice = (price) => `₹${price.toFixed(2)}`;
const displayAmount = (amount) => `₹${parseFloat(amount).toLocaleString()}`;
```
Create `src/utils/format.ts`:
```typescript
export const formatCurrency = (amount: number, currency = 'INR'): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(date));

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat('en-IN').format(num);
```
Delete all inline formatting functions from components and import from `src/utils/format.ts`.

**API error handling** — Find every component that has:
```typescript
// Variations of this
} catch (error) {
  toast.error(error.response?.data?.message || 'Something went wrong');
}
```
Create `src/utils/errors.ts`:
```typescript
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};
```
Replace all inline error extraction with `getErrorMessage(error)`.

**Auth token checks** — Find every component that checks `localStorage.getItem('token')` or `useAuthStore().token` directly:
Create a single `src/hooks/useAuth.ts` that provides the auth state.
Replace all direct store/localStorage access with this hook.

### Task 3 — Consolidate React Query keys
Find all places where query keys are strings like `'products'`, `['products', id]`, `'orders'`:
Create `src/constants/queryKeys.ts`:
```typescript
export const QUERY_KEYS = {
  products:   { all: ['products'] as const,  detail: (id: number) => ['products', id] as const },
  orders:     { all: ['orders'] as const,    detail: (id: number) => ['orders', id] as const },
  customers:  { all: ['customers'] as const, detail: (id: number) => ['customers', id] as const },
  dashboard:  { overview: ['dashboard', 'overview'] as const },
};
```
Update all `useQuery` and `queryClient.invalidateQueries` calls to use `QUERY_KEYS`.

## Verification
- Grep for `formatPrice\|displayPrice\|getPriceFormatted` in src/ → 0 results (replaced by formatCurrency)
- Grep for `getFreeShippingThreshold\|free_shipping_threshold` in Controllers → only 1 result (the service)
- Grep for `ImageUploadService` usages — should be called in all upload controllers

## Do NOT proceed to Prompt 08 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 08 — SPLIT FAT CONTROLLERS
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–07 are complete. This is PROMPT 08.

The problem: DashboardController is 860 lines. OrderController is 553 lines. These are unmaintainable.

## Your Tasks

### Task 1 — Split DashboardController (860 lines → 3 controllers)

The current DashboardController has 20+ methods covering: overview stats, sales analytics, customer analytics, inventory analytics, and marketing metrics.

Create:
- `app/Http/Controllers/Admin/Dashboard/DashboardOverviewController.php` — main stats (revenue, orders, customers today)
- `app/Http/Controllers/Admin/Dashboard/DashboardAnalyticsController.php` — trend charts, period comparisons
- `app/Http/Controllers/Admin/Dashboard/DashboardInventoryController.php` — stock alerts, low inventory, top products

Move methods to the appropriate controller. Each new controller should extend `AdminController`.

Update `routes/admin.php`:
```php
Route::prefix('dashboard')->group(function () {
    Route::get('/overview',   [DashboardOverviewController::class,   'index']);
    Route::get('/analytics',  [DashboardAnalyticsController::class,  'index']);
    Route::get('/inventory',  [DashboardInventoryController::class,  'index']);
});
```

Delete the original `DashboardController.php`.

### Task 2 — Split OrderController (553 lines → 3 controllers)

Create:
- `app/Http/Controllers/Admin/Orders/OrderController.php` — index, show, update (core CRUD only, ~100 lines)
- `app/Http/Controllers/Admin/Orders/OrderStatusController.php` — status transitions only
- `app/Http/Controllers/Admin/Orders/OrderRefundController.php` — refund logic only

### Task 3 — Extract business logic into Services

For every method moved in Tasks 1 and 2:
- If the method contains database queries or business logic (not just request handling + response), extract it to the corresponding Service class
- Controllers should only: validate input → call service → return response

Target controller method structure:
```php
public function store(StoreProductRequest $request): JsonResponse
{
    $product = $this->productService->create($request->validated());
    return $this->createdResponse(new ProductResource($product), 'Product created');
}
```

### Task 4 — Fix the Dashboard query inefficiency

In the new `DashboardOverviewController`, replace the 6 separate Order queries:
```php
// BEFORE — 6 queries
'total_revenue' => Order::where('status', 'delivered')->sum('total_amount'),
'today_revenue' => Order::where('status', 'delivered')->whereDate(...)->sum(...),
// ... 4 more

// AFTER — 1 query
$stats = Order::where('status', 'delivered')
    ->selectRaw("
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as today_revenue,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders
    ")
    ->first();
```

## Verification
- `php artisan route:list | grep dashboard` → should show 3 separate routes pointing to 3 controllers
- No controller file in the project should be more than 150 lines
- `DashboardController.php` should not exist anymore

## Do NOT proceed to Prompt 09 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 09 — IMPLEMENT CODE SPLITTING & LAZY LOADING
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–08 are complete. This is PROMPT 09.

The problem: All 70+ route components are imported at the top of App.tsx, creating a massive single bundle. Users downloading the initial page receive code for pages they haven't visited yet.

## Your Tasks

### Task 1 — Convert all route imports to lazy imports
Open `src/App.tsx`.

Replace every static import of a page component:
```typescript
// BEFORE
import ProductList   from "./pages/Products/ProductList";
import ProductDetail from "./pages/Products/ProductDetail";
import OrderList     from "./pages/Orders/OrderList";
// ... 70+ more

// AFTER — delete all page imports and replace with:
import { lazy, Suspense } from 'react';

const ProductList   = lazy(() => import('./pages/Products/ProductList'));
const ProductDetail = lazy(() => import('./pages/Products/ProductDetail'));
const OrderList     = lazy(() => import('./pages/Orders/OrderList'));
// ... all 70+ routes converted to lazy
```

### Task 2 — Wrap routes in Suspense
Wrap your route tree in a `<Suspense>` boundary:
```tsx
// Create src/components/common/PageLoader.tsx
export const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

// In App.tsx, wrap the router:
<Suspense fallback={<PageLoader />}>
  <Routes>
    {/* all routes here */}
  </Routes>
</Suspense>
```

### Task 3 — Group routes into logical chunks
Instead of lazy loading every file individually, group related routes so they share a chunk:
```typescript
// Vite will create one chunk for all product pages
const ProductList   = lazy(() => import('./pages/Products/ProductList'));
const ProductDetail = lazy(() => import('./pages/Products/ProductDetail'));
const ProductCreate = lazy(() => import('./pages/Products/ProductCreate'));

// Add chunk name hints for Vite:
const ProductList = lazy(() => import(/* webpackChunkName: "products" */ './pages/Products/ProductList'));
```

### Task 4 — Lazy load heavy components
These components are large and only used on specific pages:
- `BundleVariantManager.tsx` (26KB) — only used on product create/edit pages
- `AiFieldGenerator.tsx` (16KB) — only used on product pages

In the pages that use them, replace direct imports with lazy:
```typescript
const BundleVariantManager = lazy(() => import('../../components/BundleVariantManager'));
```

### Task 5 — Consolidate the icon library
The app imports from both `lucide-react` and `@heroicons/react`. Pick one.

**Decision: Keep `lucide-react`** (it's already used in AdminLayout which is always loaded).

Search for all `@heroicons/react` imports across the entire `src/` directory.
For each heroicon used, find the equivalent lucide icon and replace it.
After replacing all, run: `npm uninstall @heroicons/react`

### Task 6 — Update AdminLayout navigation to be data-driven
Open `src/layouts/AdminLayout.tsx`.
The 190-line hardcoded navigation array should become a config:
```typescript
// src/config/navigation.ts
export const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Home', group: 'main' },
  { name: 'Products',  href: '/products',  icon: 'Package', group: 'catalog' },
  // ...
];
```
AdminLayout reads from this config. Adding a nav item is now a 1-line change.

## Verification
- Run `npm run build` and check the `dist/assets/` folder — there should be multiple `.js` chunks, not one giant file
- The initial `index.js` bundle should be under 200KB
- Navigating to `/products` in the browser should trigger a new network request for the products chunk
- `@heroicons/react` should not appear in `package.json`

## Do NOT proceed to Prompt 10 until all tasks are complete.

---

# ════════════════════════════════════════
# PROMPT 10 — CLEAN UP DEAD CODE & FINAL POLISH
# ════════════════════════════════════════

## Context
You are refactoring a Laravel + React e-commerce admin panel (BookBharat).
Prompts 01–09 are complete. This is the FINAL PROMPT 10.

## Your Tasks

### Task 1 — Delete all dead PHP code
Run `php artisan route:list --json` and compare against all Controller methods.

Delete (or mark for deletion after confirmation):
- Any Controller method that no route points to
- Any Service method that no Controller calls (search entire codebase for the method name)
- Any Model method that is never called in any Controller, Service, or other Model
- Any Event class that is never fired (`event(new X())` or `X::dispatch()`)
- Any Job class that is never dispatched
- Any Middleware that is never applied to any route

For each deletion, output:
```
DELETED: app/Http/Controllers/Admin/OldController.php
REASON: No routes point to any of its methods
CONFIRMED: grep -r "OldController" routes/ app/ = 0 results
```

### Task 2 — Delete all dead React code
Run ESLint with unused exports rule, then:
- Delete any component file that is imported nowhere
- Delete any hook file that is called nowhere
- Delete any utility function that is used nowhere
- Remove all `console.log` statements from production code

```bash
# Find console.logs
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx"
```

### Task 3 — Remove all TODO/commented-out code
Search for:
```bash
grep -rn "TODO\|FIXME\|HACK\|// \$this->middleware" app/ src/
```

For each one:
- If it's a real TODO that needs doing → create a GitHub issue and delete the comment
- If it's commented-out code → delete it
- If it's a fake/placeholder implementation (like `return 'RAZORPAY_' . uniqid()`) → replace with proper implementation or throw a `NotImplementedException`

### Task 4 — Verify final file sizes
After all cleanup, run:
```bash
# Laravel — no controller should be over 150 lines
find app/Http/Controllers -name "*.php" | xargs wc -l | sort -rn | head -20

# React — no component should be over 300 lines  
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
```
Fix any file still over the limit.

### Task 5 — Final verification checklist
Run through this checklist and confirm each passes:

**Backend:**
- [ ] `php artisan route:list | grep debug` → 0 results
- [ ] `grep -r "\$guarded = \[\]" app/Models` → 0 results
- [ ] `grep -r "\$request->validate" app/Http/Controllers/Admin` → 0 results (all in FormRequests)
- [ ] `grep -r "response()->json" app/Http/Controllers/Admin` → 0 results (all use ApiResponse)
- [ ] `php artisan test` → all tests pass
- [ ] `php artisan route:cache` → no errors

**Frontend:**
- [ ] `npm run build` → no TypeScript errors, no warnings
- [ ] `npm audit` → no critical or high vulnerabilities
- [ ] `grep -r "any" src/api` → 0 results (no untyped API calls)
- [ ] `grep -r "@heroicons" src` → 0 results
- [ ] `grep -r "console\.log" src` → 0 results
- [ ] `grep -r "extended\.ts" src` → 0 results

### Task 6 — Update documentation
Update `README.md` with:
- The new folder structure (use the target structure from the audit)
- How to add a new admin feature (the pattern: FormRequest → Policy → Service → Controller → Resource → API file → React page)
- Environment variables needed
- How to run tests

---

## 🎉 Refactor Complete

All 10 prompts executed. Your codebase now has:
- ✅ No security vulnerabilities (debug route, mass assignment, missing auth)
- ✅ Standardized API responses across all endpoints
- ✅ Form Request validation on every endpoint
- ✅ Policy-based authorization (no more ad-hoc checks)
- ✅ API Resources controlling every response shape
- ✅ Single consolidated API layer in React
- ✅ No duplicate functions (one canonical location for each utility)
- ✅ Controllers under 150 lines each
- ✅ Code-split React bundle (no more 2MB initial load)
- ✅ No dead code, no commented-out code, no console.logs
