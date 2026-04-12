import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { overrideGlobalAlert } from "./utils/globalAlert";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/Products/ProductList";
import ProductDetail from "./pages/Products/ProductDetail";
import ProductCreate from "./pages/Products/ProductCreate";
import ProductEdit from "./pages/Products/ProductEdit";
import PackagingList from "./pages/Packaging/PackagingList";
import OrderList from "./pages/Orders/OrderList";
import OrderDetail from "./pages/Orders/OrderDetail";
import CreateShipment from "./pages/Orders/CreateShipment";
import ManualShipment from "./pages/Orders/ManualShipment";
import UserList from "./pages/Users/UserList";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import CustomerCreate from "./pages/Customers/CustomerCreate";
import CustomerEdit from "./pages/Customers/CustomerEdit";
import Settings from "./pages/Settings";
import TestTailwind from "./pages/TestTailwind";
import Categories from "./pages/Categories";
import PublishersList from "./pages/Publishers/PublishersList";
import Reviews from "./pages/Reviews";
import Coupons from "./pages/Coupons";
import AdminUsers from "./pages/AdminUsers";
import Profile from "./pages/Profile";
import Shipping from "./pages/Shipping";
import ProductAssociations from "./pages/FrequentlyBoughtTogether/ProductAssociations";
import BundleDiscountRules from "./pages/FrequentlyBoughtTogether/BundleDiscountRules";
import BundleAnalytics from "./pages/FrequentlyBoughtTogether/BundleAnalytics";
import BundleManagerLayout from "./pages/FrequentlyBoughtTogether/Layout";
import HeroConfig from "./pages/HeroConfig";
import ContentPages from "./pages/ContentPages";
import NavigationMenu from "./pages/NavigationMenu";
import HomepageLayout from "./pages/HomepageLayout";
import MediaLibrary from "./pages/MediaLibrary";
import PromotionalBanners from "./pages/PromotionalBanners";
import Newsletter from "./pages/Newsletter";
import ContentBlocks from "./pages/Content/ContentBlocks";
import EmailTemplates from "./pages/Content/EmailTemplates";
import InvoiceTemplates from "./pages/Content/InvoiceTemplates";
import AbandonedCarts from "./pages/Marketing/AbandonedCarts";
import MessagingChannels from "./pages/Settings/MessagingChannels";
import WhatsAppTemplates from "./pages/Settings/WhatsAppTemplates";
import AiProvidersPage from "./pages/Settings/AiProvidersPage";

// Documentation Pages
import DynamicDocumentationPage from "./pages/Documentation/DynamicDocumentationPage";

// Communication & Notification Pages - REMOVED

import MarketingSettings from "./pages/Marketing/MarketingSettings";
import MarketingAnalytics from "./pages/Marketing/MarketingAnalytics";
import FeedManagement from "./pages/Marketing/FeedManagement";
import AnalyticsHub from "./pages/Analytics";
import PaymentAnalytics from "./pages/Analytics/PaymentAnalytics";
import MessageLogs from "./pages/Analytics/MessageLogs";
import ActiveCarts from "./pages/ActiveCarts";
import ActiveCartDetail from "./pages/ActiveCarts/Detail";

// Blog Pages
import BlogPosts from "./pages/Blog/BlogPosts";
import BlogCategories from "./pages/Blog/BlogCategories";
import BlogComments from "./pages/Blog/BlogComments";
import BlogCreate from "./pages/Blog/BlogCreate";
import BlogEdit from "./pages/Blog/BlogEdit";
import CategoryCreate from "./pages/Blog/CategoryCreate";
import CategoryEdit from "./pages/Blog/CategoryEdit";

// Social Commerce
import SocialCommerce from "./pages/SocialCommerce/SocialCommerce";
import SocialAccounts from "./pages/SocialCommerce/SocialAccounts";
import SocialContent from "./pages/SocialCommerce/SocialContent";

// Migration Pages
import MigrationDashboard from "./pages/Migration/Dashboard";
import MigrationSettings from "./pages/Migration/Settings";
import MigrationConflicts from "./pages/Migration/Conflicts";
import MigrationLogs from "./pages/Migration/Logs";
import { ProductBrowser } from "./pages/Migration/components/ProductBrowser";
import { CategoryBrowser } from "./pages/Migration/components/CategoryBrowser";
import MigrationDocumentation from "./pages/Migration/Documentation";

// System Pages
import ErrorLogs from "./pages/System/ErrorLogs";

// Payment Pages
import Refunds from "./pages/Payments/Refunds";
import TransactionLog from "./pages/Payments/TransactionLog";
import WebhookLog from "./pages/Payments/WebhookLog";

// Components
import { ProtectedRoute } from "./components";

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
  // Override native alert() to use toast system (optional)
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Only override alerts in production
      return overrideGlobalAlert();
    }
  }, []);

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
              <Route path="packaging" element={<PackagingList />} />

              {/* Orders */}
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/create-shipment" element={<ManualShipment />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route
                path="orders/:orderId/create-shipment"
                element={<CreateShipment />}
              />

              {/* Customers */}
              <Route path="customers" element={<UserList />} />
              <Route path="customers/create" element={<CustomerCreate />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="customers/:id/edit" element={<CustomerEdit />} />

              {/* Categories */}
              <Route path="categories" element={<Categories />} />
              <Route path="publishers" element={<PublishersList />} />

              {/* Reviews */}
              <Route path="reviews" element={<Reviews />} />

              {/* Coupons */}
              <Route path="coupons" element={<Coupons />} />

              {/* Admin Users */}
              <Route path="users" element={<AdminUsers />} />

              {/* Shipping */}
              <Route path="shipping" element={<Shipping />} />

              {/* Payment Management */}
              <Route path="payments/transactions" element={<TransactionLog />} />
              <Route path="payments/refunds" element={<Refunds />} />
              <Route path="payments/webhooks" element={<WebhookLog />} />

              {/* Bundle Manager (Frequently Bought Together) */}
              <Route path="bundle-manager" element={<BundleManagerLayout />}>
                <Route
                  index
                  element={
                    <Navigate to="/bundle-manager/associations" replace />
                  }
                />
                <Route path="associations" element={<ProductAssociations />} />
                <Route
                  path="discount-rules"
                  element={<BundleDiscountRules />}
                />
                <Route path="analytics" element={<BundleAnalytics />} />
              </Route>

              {/* Hero Configuration */}
              <Route path="hero-config" element={<HeroConfig />} />

              {/* Homepage Layout */}
              <Route path="homepage-layout" element={<HomepageLayout />} />

              {/* Media Library */}
              <Route path="media-library" element={<MediaLibrary />} />

              {/* Promotional Banners */}
              <Route
                path="promotional-banners"
                element={<PromotionalBanners />}
              />

              {/* Newsletter */}
              <Route path="newsletter" element={<Newsletter />} />

              {/* Active Carts */}
              <Route path="active-carts" element={<ActiveCarts />} />
              <Route path="active-carts/:id" element={<ActiveCartDetail />} />

              {/* Content Pages */}
              <Route path="content-pages" element={<ContentPages />} />

              {/* Navigation Menu */}
              <Route path="navigation-menu" element={<NavigationMenu />} />

              {/* Content Blocks */}
              <Route path="content-blocks" element={<ContentBlocks />} />

              {/* Invoice Templates */}
              <Route path="invoice-templates" element={<InvoiceTemplates />} />

              {/* Email Templates */}
              <Route path="email-templates" element={<EmailTemplates />} />

              {/* Settings - single catch-all route (dynamic) */}
              <Route path="settings" element={<Settings />} />
              <Route path="settings/:settingsType" element={<Settings />} />

              {/* Legacy Settings Pages */}
              <Route path="settings/site" element={<Settings key="settings-site" />} />
              <Route path="settings/payment" element={<Settings key="settings-payment" />} />
              <Route path="settings/taxes" element={<Settings key="settings-taxes" />} />
              <Route path="settings/charges" element={<Settings key="settings-charges" />} />
              <Route path="settings/messaging-channels" element={<MessagingChannels />} />
              <Route path="settings/whatsapp-templates" element={<WhatsAppTemplates />} />
              <Route path="settings/ai-providers" element={<AiProvidersPage />} />

              {/* Communication & Notifications - REMOVED */}

              {/* Marketing Management */}
              <Route
                path="marketing/settings"
                element={<MarketingSettings />}
              />
              <Route
                path="marketing/analytics"
                element={<MarketingAnalytics />}
              />
              <Route path="marketing/feeds" element={<FeedManagement />} />
              <Route path="marketing/abandoned-carts" element={<AbandonedCarts />} />

              {/* Analytics */}
              <Route path="analytics" element={<AnalyticsHub />} />
              <Route path="analytics/payments" element={<PaymentAnalytics />} />
              <Route path="analytics/message-logs" element={<MessageLogs />} />

              {/* Blog Management */}
              <Route path="blog/posts" element={<BlogPosts />} />
              <Route path="blog/posts/create" element={<BlogCreate />} />
              <Route path="blog/posts/:id/edit" element={<BlogEdit />} />
              <Route path="blog/categories" element={<BlogCategories />} />
              <Route
                path="blog/categories/create"
                element={<CategoryCreate />}
              />
              <Route
                path="blog/categories/:id/edit"
                element={<CategoryEdit />}
              />
              <Route path="blog/comments" element={<BlogComments />} />

              {/* Social Commerce */}
              <Route path="social-commerce" element={<SocialCommerce />} />
              <Route
                path="social-commerce/accounts"
                element={<SocialAccounts />}
              />
              <Route
                path="social-commerce/content"
                element={<SocialContent />}
              />

              {/* Migration */}
              <Route path="migration" element={<MigrationDashboard />} />
              <Route
                path="migration/settings"
                element={<MigrationSettings />}
              />
              <Route
                path="migration/conflicts"
                element={<MigrationConflicts />}
              />
              <Route path="migration/logs" element={<MigrationLogs />} />
              <Route path="migration/products" element={<ProductBrowser />} />
              <Route
                path="migration/categories"
                element={<CategoryBrowser />}
              />
              <Route
                path="migration/documentation"
                element={<MigrationDocumentation />}
              />

              {/* Documentation */}
              <Route path="docs" element={<DynamicDocumentationPage />} />
              <Route path="docs/:slug" element={<DynamicDocumentationPage />} />

              {/* System - Error Logs */}
              <Route path="system/error-logs" element={<ErrorLogs />} />

              {/* Profile */}
              <Route path="profile" element={<Profile />} />

              {/* Catch all - 404 */}
              <Route
                path="*"
                element={
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      Page Not Found
                    </h1>
                    <p className="text-gray-600">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                }
              />
            </Route>

            {/* Catch all for non-authenticated routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>

      {/* React Query Devtools (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
};

export default App;
