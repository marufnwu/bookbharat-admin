#!/usr/bin/env python3

backend_controllers = [
    'AbandonedCartAnalytics', 'AbandonedCart', 'ABTesting', 'AdminSettings', 'Analytics', 'AuditLog', 'Auth', 
    'Blog', 'BlogCategory', 'BlogComment', 'BundleAnalytics', 'BundleDiscount', 'BundleDiscountRule', 
    'CartRecoverySms', 'Category', 'Communication', 'CommunicationConfig', 'Configuration', 'Content', 
    'ContentModeration', 'Coupon', 'Dashboard', 'DeliveryOption', 'Discount', 'Documentation', 'EmailTemplate', 
    'FeedsStatus', 'HeroConfig', 'HomepageLayout', 'Inventory', 'InvoiceTemplate', 'MarketingSettings', 
    'MediaLibrary', 'Migration', 'MultiChannelRecovery', 'Notification', 'NotificationPreference', 
    'NotificationSettings', 'Order', 'OrderCharge', 'PaymentAnalytics', 'PaymentMethod', 'PaymentTransaction', 
    'Product', 'ProductAssociation', 'ProductBundleVariant', 'PromotionalBanner', 'PromotionalCampaign', 
    'RecoveryFlow', 'Report', 'Review', 'Settings', 'ShippingConfig', 'ShippingInsurance', 'SystemFlexibility', 
    'TaxConfiguration', 'User', 'Webhook'
]

frontend_navigation = [
    'Dashboard', 'Products', 'Categories', 'Reviews', 'Orders', 'AbandonedCarts', 'Shipping', 'Customers', 
    'Coupons', 'Marketing', 'BundleManager', 'Blog', 'SocialCommerce', 'ContentManagement', 'Newsletter', 
    'Settings', 'Communication', 'Documentation', 'Migration', 'System'
]

frontend_pages = [
    'AbandonedCarts', 'AdminUsers', 'Analytics', 'Blog', 'BlogCategories', 'BlogComments', 'BlogCreate', 
    'BlogEdit', 'BlogPosts', 'Categories', 'CommunicationConfig', 'ContentBlocks', 'ContentPages', 
    'Coupons', 'CustomerCreate', 'CustomerDetail', 'CustomerEdit', 'Dashboard', 'Documentation', 
    'DynamicDocumentationPage', 'BundleAnalytics', 'BundleDiscountRules', 'ProductAssociations', 'HeroConfig', 
    'HomepageLayout', 'MediaLibrary', 'Newsletter', 'PromotionalBanners', 'MarketingAnalytics', 'FeedManagement', 
    'MarketingSettings', 'SocialCommerce', 'SocialAccounts', 'SocialContent', 'MigrationDashboard', 
    'MigrationSettings', 'MigrationConflicts', 'MigrationLogs', 'OrderDetail', 'OrderList', 'CreateShipment', 
    'ProductCreate', 'ProductDetail', 'ProductEdit', 'ProductList', 'UserList', 'PaymentMethodConfiguration', 
    'SiteSettings', 'PaymentSettings', 'SystemSettings', 'TaxConfigurations', 'OrderCharges', 
    'NotificationSettings', 'AbandonedCartRecoverySettings', 'FreeShippingThresholds', 'PincodeZones', 
    'TestCalculator', 'Warehouses', 'WeightSlabs', 'ZoneRates', 'CarrierConfiguration', 'ShippingAnalytics',
    'PaymentAnalytics', 'WebhookLog', 'TransactionLog', 'Refunds', 'Reviews', 'Shipping'
]

print("=== BOOKBHARAT ADMIN PANEL NAVIGATION ANALYSIS ===\n")
print("1. BACKEND CONTROLLERS (API endpoints)")
print(f"   Total: {len(backend_controllers)}")
for controller in sorted(backend_controllers):
    print(f"   - {controller}")
print()

print("2. FRONTEND NAVIGATION MENU")
print(f"   Total: {len(frontend_navigation)}")
for item in sorted(frontend_navigation):
    print(f"   - {item}")
print()

print("3. FRONTEND PAGE IMPLEMENTATIONS")
print(f"   Total: {len(frontend_pages)}")
for page in sorted(frontend_pages):
    print(f"   - {page}")
print()

# Find backend controllers not covered by navigation
print("4. MISSING FROM NAVIGATION (Backend exists but no UI access)")
missing_nav = []
for controller in backend_controllers:
    normalized = controller.lower().replace('controller', '')
    matched = False
    
    for nav_item in frontend_navigation:
        if normalized in nav_item.lower() or nav_item.lower() in normalized:
            matched = True
            break
    
    for page in frontend_pages:
        if normalized in page.lower() or page.lower() in normalized:
            matched = True
            break
    
    if not matched:
        missing_nav.append(controller)

print(f"   Total missing: {len(missing_nav)}")
for item in sorted(missing_nav):
    print(f"   - {item}")
print()

# Find navigation items without backend
print("5. NAVIGATION ITEMS WITHOUT BACKEND")
nav_without_backend = []
for nav_item in frontend_navigation:
    normalized = nav_item.lower()
    matched = False
    
    for controller in backend_controllers:
        if normalized in controller.lower() or controller.lower() in normalized:
            matched = True
            break
    
    if not matched:
        nav_without_backend.append(nav_item)

print(f"   Total: {len(nav_without_backend)}")
for item in sorted(nav_without_backend):
    print(f"   - {item}")
print()

print("=== SUMMARY ===")
print(f"Backend Controllers: {len(backend_controllers)}")
print(f"Frontend Navigation Items: {len(frontend_navigation)}")
print(f"Frontend Page Implementations: {len(frontend_pages)}")
print(f"Missing from Navigation: {len(missing_nav)}")
print(f"Navigation Items without Backend: {len(nav_without_backend)}")

print("\n=== KEY GAPS IDENTIFIED ===")
print("BACKEND FEATURES NOT EXPOSED IN UI:")
for item in missing_nav[:10]:  # Show first 10
    print(f"  - {item}")
if len(missing_nav) > 10:
    print(f"  ... and {len(missing_nav) - 10} more")

print("\nNAVIGATION ITEMS WITHOUT BACKEND:")
for item in nav_without_backend:
    print(f"  - {item}")
