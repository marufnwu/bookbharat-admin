# BookBharat Admin - Complete Design Update Roadmap

**Date:** 2026-03-14  
**Version:** 3.0  
**Status:** Comprehensive Roadmap for Remaining Design Updates

---

## Executive Summary

This document provides a complete roadmap for updating all remaining pages in the BookBharat Admin panel with the new design system. The design system foundation has been established with core components (Button, Card, Badge, Modal, Drawer, Skeleton, Input, Table) and layout components (Sidebar, Header, MobileNav). This plan outlines the remaining work to achieve a consistent, clean, professional, and mobile-friendly design across all pages.

---

## 1. Current State Analysis

### 1.1 Design System Components (Completed)

| Component | File | Status | Features |
|-----------|------|--------|----------|
| Button | `Button.tsx` | ✅ Complete | 6 variants, 6 sizes, loading state, icons |
| Card | `Card.tsx` | ✅ Complete | StatCard, EmptyState, compound components |
| Badge | `Badge.tsx` | ✅ Complete | 9 variants, StatusBadge, CountBadge, DotBadge |
| Input | `Input.tsx` | ✅ Complete | Textarea, Select, SearchInput |
| Modal | `Modal.tsx` | ✅ Complete | ConfirmModal, sizes, animations |
| Drawer | `Drawer.tsx` | ✅ Complete | Left/right/bottom positions |
| Skeleton | `Skeleton.tsx` | ✅ Complete | Multiple skeleton types |
| Table | `Table.tsx` | ✅ Complete | Sortable, pagination, responsive |
| LoadingSpinner | `LoadingSpinner.tsx` | ✅ Complete | Multiple sizes |

### 1.2 Layout Components (Completed)

| Component | File | Status | Features |
|-----------|------|--------|----------|
| Sidebar | `layout/Sidebar.tsx` | ✅ Complete | Collapsible, nested navigation |
| Header | `layout/Header.tsx` | ✅ Complete | Breadcrumbs, search, profile |
| MobileNav | `layout/MobileNav.tsx` | ✅ Complete | Bottom tab navigation |
| AdminLayout | `AdminLayout.tsx` | ✅ Complete | Responsive layout wrapper |

### 1.3 Pages Updated with New Design

| Page | File | Status | Notes |
|------|------|--------|-------|
| Login | `Login.tsx` | ✅ Complete | Modern split layout |
| Dashboard | `Dashboard/index.tsx` | ✅ Complete | Using Card, StatCard, Skeleton |
| OrderList | `Orders/OrderList.tsx` | ⚠️ Partial | Using Table, Badge, Button |
| ProductList | `Products/ProductList.tsx` | ⚠️ Partial | Using Table, Badge, Button |

---

## 2. Pages Requiring Design Updates

### 2.1 High Priority Pages (Core Business Operations)

#### Orders Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Order Detail | `OrderDetail.tsx` | 50,102 chars | Old styling, not mobile-friendly | 🔴 Critical |
| Create Shipment | `CreateShipment.tsx` | 67,988 chars | Large file, old styling | 🔴 Critical |

#### Products Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Product Create | `ProductCreate.tsx` | 46,213 chars | Old form styling | 🔴 Critical |
| Product Edit | `ProductEdit.tsx` | 44,963 chars | Old form styling | 🔴 Critical |
| Product Detail | `ProductDetail.tsx` | 46,072 chars | Old card styling | 🟡 High |

#### Customers Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Customer List | `Customers/index.tsx` | - | Needs investigation | 🟡 High |
| Customer Detail | `CustomerDetail.tsx` | 24,340 chars | Old styling | 🟡 High |
| Customer Create | `CustomerCreate.tsx` | 19,878 chars | Old form styling | 🟡 High |
| Customer Edit | `CustomerEdit.tsx` | 19,513 chars | Old form styling | 🟡 High |

### 2.2 Medium Priority Pages (Configuration & Management)

#### Shipping Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Carrier Config | `CarrierConfiguration.tsx` | 67,988 chars | Large file, old styling | 🟡 High |
| Warehouses | `Warehouses.tsx` | 22,715 chars | Old styling | 🟡 High |
| Pincode Zones | `PincodeZones.tsx` | 20,744 chars | Old styling | 🟡 High |
| Zone Rates | `ZoneRates.tsx` | 28,182 chars | Old styling | 🟡 High |
| Weight Slabs | `WeightSlabs.tsx` | 10,977 chars | Old styling | 🟢 Medium |
| Free Shipping | `FreeShippingThresholds.tsx` | 12,601 chars | Old styling | 🟢 Medium |
| Shipping Analytics | `Analytics.tsx` | 11,467 chars | Old charts styling | 🟢 Medium |
| Test Calculator | `TestCalculator.tsx` | 16,042 chars | Old styling | 🟢 Medium |

#### Payments Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Refunds | `Refunds.tsx` | 14,744 chars | Old styling | 🟡 High |
| Transaction Log | `TransactionLog.tsx` | 23,125 chars | Old table styling | 🟡 High |
| Webhook Log | `WebhookLog.tsx` | 12,297 chars | Old styling | 🟢 Medium |

#### Settings Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Main Settings | `index.tsx` | 16,191 chars | Old styling | 🟢 Medium |
| Payment Settings | `PaymentSettings.tsx` | 72,362 chars | Large file, old styling | 🟡 High |
| Site Settings | `SiteSettings.tsx` | 23,496 chars | Old form styling | 🟢 Medium |
| System Settings | `SystemSettings.tsx` | 16,965 chars | Old styling | 🟢 Medium |
| Tax Configurations | `TaxConfigurations.tsx` | 21,273 chars | Old styling | 🟢 Medium |
| Order Charges | `OrderCharges.tsx` | 31,381 chars | Old styling | 🟢 Medium |
| Cache Management | `CacheManagement.tsx` | 8,701 chars | Old styling | 🟢 Medium |
| Messaging Channels | `MessagingChannels.tsx` | 13,154 chars | Old styling | 🟢 Medium |
| WhatsApp Templates | `WhatsAppTemplates.tsx` | 23,031 chars | Old styling | 🟢 Medium |
| AI Providers | `AiProvidersPage.tsx` | 19,359 chars | Old styling | 🟢 Medium |
| Abandoned Cart Settings | `AbandonedCartRecoverySettings.tsx` | 40,806 chars | Large file | 🟢 Medium |

### 2.3 Standard Priority Pages (Content & Marketing)

#### Blog Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Blog Posts | `BlogPosts.tsx` | 25,788 chars | Old styling | 🟢 Medium |
| Blog Categories | `BlogCategories.tsx` | 15,529 chars | Old styling | 🟢 Medium |
| Blog Comments | `BlogComments.tsx` | 878 chars | Minimal implementation | 🟢 Low |

#### Marketing Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Marketing Settings | `MarketingSettings.tsx` | 133,224 chars | Very large file! | 🟡 High |
| Abandoned Carts | `AbandonedCarts.tsx` | 17,094 chars | Old styling | 🟢 Medium |
| Analytics Dashboard | `AnalyticsDashboard.tsx` | 19,300 chars | Old chart styling | 🟢 Medium |
| Feed Management | `FeedManagement.tsx` | 13,390 chars | Old styling | 🟢 Low |

#### Content Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Content Blocks | `ContentBlocks.tsx` | 16,739 chars | Old styling | 🟢 Medium |
| Email Templates | `EmailTemplates.tsx` | 18,139 chars | Old styling | 🟢 Medium |
| Invoice Templates | `InvoiceTemplates.tsx` | 17,155 chars | Old styling | 🟢 Medium |
| Content Pages | `ContentPages/index.tsx` | 21,782 chars | Old styling | 🟢 Medium |

### 2.4 Lower Priority Pages (Supporting Features)

#### Analytics Module
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Analytics Index | `Analytics/index.tsx` | 3,505 chars | Minimal implementation | 🟢 Low |
| Message Logs | `MessageLogs.tsx` | 18,829 chars | Old styling | 🟢 Low |
| Payment Analytics | `PaymentAnalytics.tsx` | 15,897 chars | Old chart styling | 🟢 Low |

#### Other Modules
| Page | File | Size | Current Issues | Priority |
|------|------|------|----------------|----------|
| Users List | `Users/UserList.tsx` | 12,712 chars | Old table styling | 🟢 Medium |
| Admin Users | `AdminUsers/index.tsx` | 24,590 chars | Old styling | 🟢 Medium |
| Categories | `Categories/index.tsx` | 19,007 chars | Old styling | 🟢 Medium |
| Coupons | `Coupons/index.tsx` | 42,392 chars | Large file, old styling | 🟢 Medium |
| Reviews | `Reviews/index.tsx` | 18,487 chars | Old styling | 🟢 Medium |
| Newsletter | `Newsletter/index.tsx` | 30,465 chars | Old styling | 🟢 Low |
| Media Library | `MediaLibrary/index.tsx` | 28,286 chars | Old styling | 🟢 Medium |
| Profile | `Profile/index.tsx` | 30,615 chars | Old form styling | 🟢 Medium |
| Navigation Menu | `NavigationMenu/index.tsx` | 16,614 chars | Old styling | 🟢 Low |
| Hero Config | `HeroConfig/index.tsx` | 37,520 chars | Large file | 🟢 Low |
| Homepage Layout | `HomepageLayout/index.tsx` | 20,203 chars | Old styling | 🟢 Low |
| Promotional Banners | `PromotionalBanners/index.tsx` | 17,276 chars | Old styling | 🟢 Low |
| Packaging List | `Packaging/PackagingList.tsx` | 5,069 chars | Old styling | 🟢 Low |
| Error Logs | `System/ErrorLogs.tsx` | 15,159 chars | Old styling | 🟢 Low |

---

## 3. Mobile Responsiveness Audit

### 3.1 Current Mobile Issues

#### Global Issues
1. **Tables not responsive** - Horizontal scroll required on most table pages
2. **Filters collapse poorly** - Hidden behind toggles, not optimized for touch
3. **Action buttons overflow** - Too many buttons in rows for mobile screens
4. **Sidebars hidden** - No mobile drawer equivalent for some pages
5. **Charts too small** - Not readable on mobile screens

#### Per-Module Mobile Issues

| Module | Issues | Recommended Fix |
|--------|--------|-----------------|
| Orders | Table overflow, action buttons too many | Card view for mobile, kebab menu |
| Products | Table overflow, image thumbnails small | Card grid view for mobile |
| Customers | Table overflow, long email addresses | Truncated text, card view |
| Shipping | Forms too wide, map not visible | Stack forms vertically |
| Settings | Long forms, tabs not scrollable | Vertical tabs, collapsible sections |
| Blog | Rich text editor not mobile-friendly | Simplified mobile editor |
| Analytics | Charts unreadable | Responsive chart containers |

### 3.2 Mobile-First Approach for Updates

For each page update, follow this mobile-first checklist:

1. **Use responsive grid layouts**
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
   ```

2. **Implement card views for tables on mobile**
   ```tsx
   {/* Desktop: Table view */}
   <div className="hidden md:block">
     <Table ... />
   </div>
   {/* Mobile: Card view */}
   <div className="md:hidden space-y-4">
     {items.map(item => <MobileCard key={item.id} ... />)}
   </div>
   ```

3. **Use bottom sheet/drawer for actions**
   ```tsx
   <Drawer position="bottom" ... >
     {/* Actions for mobile */}
   </Drawer>
   ```

4. **Stack forms vertically on mobile**
   ```tsx
   <div className="flex flex-col md:flex-row gap-4">
   ```

5. **Make charts responsive**
   ```tsx
   <ResponsiveContainer width="100%" height={300}>
   ```

---

## 4. Component Patterns to Follow

### 4.1 Page Header Pattern
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="text-gray-500 mt-1">Page description or subtitle</p>
  </div>
  <div className="flex gap-3">
    <Button variant="outline" size="sm">Secondary Action</Button>
    <Button variant="primary" size="sm">Primary Action</Button>
  </div>
</div>
```

### 4.2 Stats Cards Pattern
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
  <StatCard
    title="Metric Name"
    value={formatCurrency(value)}
    change={changePercent}
    icon={<Icon className="h-6 w-6" />}
  />
</div>
```

### 4.3 Filters Pattern
```tsx
<Card className="mb-6">
  <CardContent className="p-4">
    <div className="flex flex-col md:flex-row gap-4">
      <SearchInput
        placeholder="Search..."
        value={search}
        onChange={setSearch}
        className="flex-1"
      />
      <Select
        options={statusOptions}
        value={status}
        onChange={setStatus}
        placeholder="Filter by status"
      />
      <Button variant="outline" onClick={handleExport}>
        Export
      </Button>
    </div>
  </CardContent>
</Card>
```

### 4.4 Data Table Pattern
```tsx
<Card>
  <CardContent className="p-0">
    {/* Desktop Table */}
    <div className="hidden md:block overflow-x-auto">
      <Table
        columns={columns}
        data={data}
        loading={isLoading}
        onSort={handleSort}
      />
    </div>
    
    {/* Mobile Cards */}
    <div className="md:hidden divide-y divide-gray-200">
      {data.map(item => (
        <MobileDataCard key={item.id} item={item} />
      ))}
    </div>
  </CardContent>
</Card>
```

### 4.5 Form Pattern
```tsx
<Card>
  <CardHeader>
    <CardTitle>Form Section Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Field 1" ... />
        <Input label="Field 2" ... />
      </div>
    </form>
  </CardContent>
  <CardFooter className="flex justify-end gap-3">
    <Button variant="outline" onClick={onCancel}>Cancel</Button>
    <Button variant="primary" type="submit" loading={isSubmitting}>
      Save Changes
    </Button>
  </CardFooter>
</Card>
```

---

## 5. Implementation Phases

### Phase 1: Critical Business Pages (Week 1-2)

**Goal:** Update core revenue-generating pages

| Task | File | Effort | Dependencies |
|------|------|--------|--------------|
| Update Order Detail page | `OrderDetail.tsx` | High | None |
| Update Create Shipment page | `CreateShipment.tsx` | High | None |
| Update Product Create page | `ProductCreate.tsx` | High | None |
| Update Product Edit page | `ProductEdit.tsx` | High | None |
| Add mobile card views for Orders | `OrderList.tsx` | Medium | None |
| Add mobile card views for Products | `ProductList.tsx` | Medium | None |

**Deliverables:**
- Updated Order Detail with responsive layout
- Updated Shipment creation with better UX
- Updated Product forms with consistent styling
- Mobile-friendly Order and Product lists

### Phase 2: Customer Management (Week 3)

**Goal:** Update customer-facing operations

| Task | File | Effort | Dependencies |
|------|------|--------|--------------|
| Update Customer List page | `Customers/index.tsx` | Medium | None |
| Update Customer Detail page | `CustomerDetail.tsx` | Medium | None |
| Update Customer Create/Edit forms | `CustomerCreate.tsx`, `CustomerEdit.tsx` | Medium | None |
| Update Profile page | `Profile/index.tsx` | Medium | None |

**Deliverables:**
- Consistent customer management UI
- Mobile-friendly customer views

### Phase 3: Shipping & Payments (Week 4)

**Goal:** Update operational configuration pages

| Task | File | Effort | Dependencies |
|------|------|--------|--------------|
| Refactor Carrier Configuration | `CarrierConfiguration.tsx` | High | Code split first |
| Update Warehouses page | `Warehouses.tsx` | Medium | None |
| Update Pincode Zones page | `PincodeZones.tsx` | Medium | None |
| Update Zone Rates page | `ZoneRates.tsx` | Medium | None |
| Update Refunds page | `Refunds.tsx` | Medium | None |
| Update Transaction Log | `TransactionLog.tsx` | Medium | None |

**Deliverables:**
- Updated shipping configuration
- Improved payment management

### Phase 4: Settings & Configuration (Week 5)

**Goal:** Update admin configuration pages

| Task | File | Effort | Dependencies |
|------|------|--------|--------------|
| Update Payment Settings | `PaymentSettings.tsx` | High | Code split first |
| Update Marketing Settings | `MarketingSettings.tsx` | High | Code split first |
| Update Site Settings | `SiteSettings.tsx` | Medium | None |
| Update Tax Configurations | `TaxConfigurations.tsx` | Medium | None |
| Update System Settings | `SystemSettings.tsx` | Medium | None |
| Update remaining settings pages | Multiple | Medium | None |

**Deliverables:**
- Consistent settings UI
- Better form organization

### Phase 5: Content & Marketing (Week 6)

**Goal:** Update content management pages

| Task | File | Effort | Dependencies |
|------|------|--------|--------------|
| Update Blog Posts page | `BlogPosts.tsx` | Medium | None |
| Update Blog Categories | `BlogCategories.tsx` | Low | None |
| Update Content Blocks | `ContentBlocks.tsx` | Medium | None |
| Update Email Templates | `EmailTemplates.tsx` | Medium | None |
| Update Invoice Templates | `InvoiceTemplates.tsx` | Medium | None |
| Update Newsletter page | `Newsletter/index.tsx` | Medium | None |

**Deliverables:**
- Updated content management
- Consistent template editors

### Phase 6: Remaining Pages (Week 7)

**Goal:** Complete remaining page updates

| Task | File | Effort | Dependencies |
|------|------|--------|--------------|
| Update Users pages | `Users/UserList.tsx`, `AdminUsers/index.tsx` | Medium | None |
| Update Categories page | `Categories/index.tsx` | Medium | None |
| Update Coupons page | `Coupons/index.tsx` | Medium | None |
| Update Reviews page | `Reviews/index.tsx` | Low | None |
| Update Media Library | `MediaLibrary/index.tsx` | Medium | None |
| Update Analytics pages | Multiple | Medium | None |
| Update remaining pages | Multiple | Low | None |

---

## 6. Large File Refactoring Strategy

Several files are extremely large and should be refactored before or during design updates:

### Files Over 50,000 Characters

| File | Size | Strategy |
|------|------|----------|
| `MarketingSettings.tsx` | 133,224 chars | Split into 5-6 sub-pages |
| `CreateShipment.tsx` | 67,988 chars | Extract components: CarrierCard, RateComparison, PackageForm |
| `CarrierConfiguration.tsx` | 67,988 chars | Extract components: CarrierCard, CredentialsForm, ServiceMapping |
| `PaymentSettings.tsx` | 72,362 chars | Split by payment gateway |
| `ProductCreate.tsx` | 46,213 chars | Extract: ProductForm, VariantManager, ImageUploader |
| `ProductEdit.tsx` | 44,963 chars | Reuse ProductForm component |
| `Coupons/index.tsx` | 42,392 chars | Extract: CouponForm, CouponList, UsageHistory |
| `AbandonedCartRecoverySettings.tsx` | 40,806 chars | Split into configuration sections |

### Recommended Component Extractions

```tsx
// CreateShipment.tsx -> Extract these components:
src/components/Shipping/
  ├── CarrierCard.tsx        // Display carrier option
  ├── RateComparison.tsx     // Rate comparison table
  ├── PackageForm.tsx        // Package details form
  ├── WarehouseSelector.tsx  // Warehouse dropdown
  └── InsuranceOptions.tsx   // Insurance configuration

// MarketingSettings.tsx -> Split into sub-pages:
src/pages/Settings/Marketing/
  ├── EmailSettings.tsx
  ├── SMSSettings.tsx
  ├── WhatsAppSettings.tsx
  ├── PushNotificationSettings.tsx
  └── index.tsx              // Tab navigation
```

---

## 7. New Components to Create

### 7.1 Data Display Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| `DataCard` | Mobile-friendly data card for list views | High |
| `StatsGrid` | Responsive stats grid with configurable columns | High |
| `ChartCard` | Card wrapper for charts with title and actions | Medium |
| `Timeline` | Status timeline for orders/shipments | High |
| `ActivityFeed` | Activity log display | Low |

### 7.2 Form Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| `FormSection` | Grouped form fields with title | High |
| `FormActions` | Consistent form submit/cancel buttons | High |
| `DateTimePicker` | Date and time selection | Medium |
| `ColorPicker` | Color selection for themes | Low |
| `FileUploader` | Drag-drop file upload | Medium |

### 7.3 Navigation Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| `PageTabs` | Tabbed page navigation | High |
| `BreadcrumbNav` | Breadcrumb with schema | Medium |
| `QuickActions` | Floating action button for mobile | Medium |
| `CommandPalette` | Keyboard shortcut navigation | Low |

---

## 8. Quality Assurance Checklist

### For Each Updated Page:

- [ ] **Desktop Layout**
  - [ ] Proper spacing and alignment
  - [ ] Consistent header styling
  - [ ] Card shadows and borders match design system
  - [ ] Button variants used correctly

- [ ] **Mobile Layout**
  - [ ] Stacked layout on small screens
  - [ ] Card view alternative for tables
  - [ ] Touch-friendly tap targets (min 44px)
  - [ ] Bottom sheet for actions

- [ ] **Loading States**
  - [ ] Skeleton loaders implemented
  - [ ] Button loading states
  - [ ] Proper disabled states

- [ ] **Empty States**
  - [ ] EmptyState component used
  - [ ] Helpful guidance text
  - [ ] Call-to-action when appropriate

- [ ] **Error States**
  - [ ] Error messages displayed properly
  - [ ] Retry mechanisms
  - [ ] Form validation feedback

- [ ] **Accessibility**
  - [ ] Proper heading hierarchy
  - [ ] ARIA labels on interactive elements
  - [ ] Keyboard navigation
  - [ ] Color contrast meets WCAG AA

- [ ] **Performance**
  - [ ] No unnecessary re-renders
  - [ ] Proper React Query caching
  - [ ] Lazy loading for heavy components

---

## 9. Testing Strategy

### 9.1 Visual Regression Testing
- Capture screenshots before and after updates
- Test at multiple viewport sizes (320px, 375px, 768px, 1024px, 1440px)
- Compare against design mockups

### 9.2 Responsive Testing
- Test on actual mobile devices
- Test touch interactions
- Test landscape orientations
- Test tablet views

### 9.3 Accessibility Testing
- Run axe-core accessibility tests
- Test with screen readers
- Test keyboard-only navigation

---

## 10. Migration Checklist

### Before Starting Updates:
1. [ ] Create feature branch for design updates
2. [ ] Run existing tests to establish baseline
3. [ ] Document current page functionality
4. [ ] Create backup of large files before refactoring

### During Updates:
1. [ ] Update one module at a time
2. [ ] Run tests after each page update
3. [ ] Test on mobile devices regularly
4. [ ] Get design review for major changes

### After Updates:
1. [ ] Run full test suite
2. [ ] Perform visual regression testing
3. [ ] Conduct accessibility audit
4. [ ] Update documentation
5. [ ] Create pull request with detailed description

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mobile-friendly pages | 100% | All pages have mobile views |
| Component consistency | 100% | All pages use design system components |
| Accessibility score | > 90 | Lighthouse accessibility score |
| Performance score | > 80 | Lighthouse performance score |
| Code reduction | 20% | Reduced duplicate styling code |

---

## 12. Appendices

### A. Design Token Reference
See `tailwind.config.js` for complete design tokens.

### B. Component Documentation
See `src/components/README.md` (to be created) for component usage guide.

### C. Migration Examples
See `DESIGN_UPDATE_PLAN.md` for detailed component examples.

---

*Document End*