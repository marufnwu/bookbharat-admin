import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import ProductDetail from './pages/Products/ProductDetail';
import ProductCreate from './pages/Products/ProductCreate';
import ProductEdit from './pages/Products/ProductEdit';
import OrderList from './pages/Orders/OrderList';
import OrderDetail from './pages/Orders/OrderDetail';
import CreateShipment from './pages/Orders/CreateShipment';
import UserList from './pages/Users/UserList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerCreate from './pages/Customers/CustomerCreate';
import CustomerEdit from './pages/Customers/CustomerEdit';
import Settings from './pages/Settings';
import TestTailwind from './pages/TestTailwind';
import Categories from './pages/Categories';
import Reviews from './pages/Reviews';
import Coupons from './pages/Coupons';
import AdminUsers from './pages/AdminUsers';
import Profile from './pages/Profile';
import Shipping from './pages/Shipping';
import ProductAssociations from './pages/FrequentlyBoughtTogether/ProductAssociations';
import BundleDiscountRules from './pages/FrequentlyBoughtTogether/BundleDiscountRules';
import BundleAnalytics from './pages/FrequentlyBoughtTogether/BundleAnalytics';
import HeroConfig from './pages/HeroConfig';
import ContentPages from './pages/ContentPages';
import NavigationMenu from './pages/NavigationMenu';
import HomepageLayout from './pages/HomepageLayout';
import MediaLibrary from './pages/MediaLibrary';
import PromotionalBanners from './pages/PromotionalBanners';
import Newsletter from './pages/Newsletter';

// Components
import { ProtectedRoute } from './components';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/test" element={<TestTailwind />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* Products */}
              <Route path="products" element={<ProductList />} />
              <Route path="products/create" element={<ProductCreate />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="products/:id/edit" element={<ProductEdit />} />

              {/* Orders */}
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="orders/:orderId/create-shipment" element={<CreateShipment />} />

              {/* Customers */}
              <Route path="customers" element={<UserList />} />
              <Route path="customers/create" element={<CustomerCreate />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="customers/:id/edit" element={<CustomerEdit />} />

              {/* Categories */}
              <Route path="categories" element={<Categories />} />

              {/* Reviews */}
              <Route path="reviews" element={<Reviews />} />

              {/* Coupons */}
              <Route path="coupons" element={<Coupons />} />

              {/* Admin Users */}
              <Route path="users" element={<AdminUsers />} />

              {/* Shipping */}
              <Route path="shipping" element={<Shipping />} />

              {/* Bundle Manager (Frequently Bought Together) */}
              <Route path="bundle-manager">
                <Route index element={<Navigate to="/bundle-manager/associations" replace />} />
                <Route path="associations" element={<ProductAssociations />} />
                <Route path="discount-rules" element={<BundleDiscountRules />} />
                <Route path="analytics" element={<BundleAnalytics />} />
              </Route>

              {/* Hero Configuration */}
              <Route path="hero-config" element={<HeroConfig />} />

              {/* Homepage Layout */}
              <Route path="homepage-layout" element={<HomepageLayout />} />

              {/* Media Library */}
              <Route path="media-library" element={<MediaLibrary />} />

              {/* Promotional Banners */}
              <Route path="promotional-banners" element={<PromotionalBanners />} />

              {/* Newsletter */}
              <Route path="newsletter" element={<Newsletter />} />

              {/* Content Pages */}
              <Route path="content-pages" element={<ContentPages />} />

              {/* Navigation Menu */}
              <Route path="navigation-menu" element={<NavigationMenu />} />

              {/* Settings - with sub-routes */}
              <Route path="settings/*" element={<Settings key="settings-default" />} />
              <Route path="settings/general" element={<Settings key="settings-general" />} />
              <Route path="settings/site" element={<Settings key="settings-site" />} />
              <Route path="settings/payment" element={<Settings key="settings-payment" />} />
              <Route path="settings/shipping" element={<Settings key="settings-shipping" />} />
              <Route path="settings/email" element={<Settings key="settings-email" />} />
              <Route path="settings/roles" element={<Settings key="settings-roles" />} />
              <Route path="settings/charges" element={<Settings key="settings-charges" />} />
              <Route path="settings/taxes" element={<Settings key="settings-taxes" />} />
              <Route path="settings/system" element={<Settings key="settings-system" />} />
              <Route path="settings/notifications" element={<Settings key="settings-notifications" />} />

              {/* Profile */}
              <Route path="profile" element={<Profile />} />

              {/* Catch all - 404 */}
              <Route path="*" element={<div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>} />
            </Route>

            {/* Catch all for non-authenticated routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>

      {/* React Query Devtools (only in development) */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
};

export default App;
