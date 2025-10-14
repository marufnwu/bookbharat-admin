# Admin Carrier Controls - Enhanced UI

## Overview
The admin UI now provides comprehensive controls for managing shipping carriers through a tabbed configuration interface.

## Available Controls

### Main Carrier List Actions

| Control | Icon | Function | Description |
|---------|------|----------|-------------|
| **Test Connection** | 🧪 | Tests carrier API connectivity | Verifies credentials and API endpoint |
| **Enable/Disable** | 🔘 | Toggles carrier active status | Green (active) / Gray (inactive) |
| **Set Primary** | ⭐ | Makes carrier the default | Only one carrier can be primary |
| **Configure** | ⚙️ | Opens configuration modal | Full carrier settings (NEW!) |
| **View Details** | ▼ | Expands carrier details | Shows features, services, specs |
| **Sync from Config** | 🔄 | Syncs carriers from config file | Updates all carriers from system config |

### Enhanced Configuration Modal (NEW!)

The "Configure" button now opens a comprehensive tabbed interface:

#### **Tab 1: Credentials** 🔑

**API Connection:**
- ✅ API Endpoint URL (editable)
- ✅ Test/Live mode switch (in Settings tab)

**Carrier-Specific Credentials** (Dynamic based on carrier):

| Carrier | Required Fields |
|---------|----------------|
| Delhivery | API Key, Client Name |
| BlueDart | License Key, Login ID |
| Xpressbees | Email, Password, Account ID (optional) |
| DTDC | Access Token, Customer Code |
| Ecom Express | Username, Password |
| Shadowfax | API Token |
| Shiprocket | Email, Password |
| Ekart | Client ID, Access Key |
| BigShip | API Key, API Secret |
| RapidShyp | API Key |

**Features:**
- ✅ Password fields with show/hide toggle (👁️)
- ✅ Required field indicators (*)
- ✅ Placeholder text for guidance
- ✅ Real-time validation
- ✅ **Validate Credentials** button - Tests credentials without saving

#### **Tab 2: Settings** ⚙️

**Operational Settings:**
- ✅ **API Mode**: Switch between Test and Live mode
- ✅ **Priority**: Set carrier selection priority (0-1000)
  - Higher priority = checked first for rates
  - Affects automatic carrier selection
- ✅ **Cutoff Time**: Last pickup time for same-day shipping
  - Format: HH:MM (24-hour)
  - Orders after cutoff go to next day

**Use Cases:**
- Switch to live mode when going to production
- Set priority to prefer certain carriers
- Configure pickup schedules

#### **Tab 3: Limits & Rules** 🛡️

**Weight & Value Limits:**
- ✅ **Maximum Weight**: Carrier's weight limit (in kg)
  - Shipments exceeding this won't use this carrier
  - Helps filter suitable carriers automatically
- ✅ **Maximum Insurance Value**: Max insurable amount (₹)
  - Limits high-value shipments
  - Prevents over-insuring

**Auto-Filtering:**
- System automatically excludes carriers that can't handle:
  - Package weight
  - Insurance requirements
  - Payment modes (COD/Prepaid)

## What Admins CAN Control

### ✅ Full Control
- Enable/Disable carriers
- Set primary carrier
- Update all credentials
- Switch test/live mode
- Set priority
- Configure cutoff time
- Set weight limits
- Set insurance limits
- Test connections
- Validate credentials

### ⚠️ Partial Control
- View features (can't add/remove - set in config file)
- View services (can't add/remove - set in config file)
- View carrier code (read-only identifier)

### ❌ No Control (Developer-Only)
- Add/remove carriers (requires config file + seeder update)
- Change credential field structure (predefined per carrier)
- Modify webhook URLs (security sensitive)
- Change carrier name/code (system identifiers)

## How It Works

### Credential Management
```
1. Admin clicks "Configure" on a carrier
2. Modal opens with 3 tabs
3. Tab 1 (Credentials) shows:
   - API Endpoint (editable)
   - Dynamic credential fields (based on carrier type)
4. Admin fills credentials
5. Clicks "Validate Credentials" (optional) - tests without saving
6. Clicks "Save Configuration" - saves to database
7. System stores in config.credentials JSON
8. Modal closes, list refreshes with updated data
```

### Settings Management
```
1. Admin switches to "Settings" tab
2. Changes API mode (test/live)
3. Adjusts priority (e.g., 200 for preferred carrier)
4. Sets cutoff time (e.g., 17:00)
5. Clicks "Save Configuration"
6. Settings applied immediately
```

### Limits Management
```
1. Admin switches to "Limits & Rules" tab
2. Sets max weight (e.g., 30 kg for BlueDart)
3. Sets max insurance (e.g., 50000 for most carriers)
4. Clicks "Save Configuration"
5. System uses these limits for auto-filtering
```

## User Experience Improvements

### Before ❌
- Only "Edit Credentials" button
- Simple form with just credential fields
- No control over mode, priority, or limits
- Had to manually edit database for advanced settings

### After ✅
- Prominent "Configure" button
- Professional tabbed interface
- Three organized sections:
  - Credentials (API authentication)
  - Settings (operational config)
  - Limits (filtering rules)
- All editable from admin UI
- No database access needed

## Benefits

### For Admins
- ✅ Complete control without technical knowledge
- ✅ Clear organization with tabs
- ✅ Helpful descriptions for each field
- ✅ Validate before saving
- ✅ Immediate feedback

### For Business
- ✅ Quick carrier onboarding
- ✅ Easy test-to-live migration
- ✅ Fine-tune carrier selection
- ✅ Operational flexibility

### For Developers
- ✅ Less admin support needed
- ✅ Clear separation of concerns
- ✅ Structure still controlled by code
- ✅ Audit trail ready

## Security

### Admin Permissions
- ✅ Can update credential VALUES
- ❌ Cannot change credential FIELDS
- ❌ Cannot add new carriers
- ❌ Cannot modify system structure

### Data Protection
- ✅ Passwords masked by default
- ✅ Show/hide toggle for viewing
- ✅ Credentials encrypted in storage (when enabled)
- ✅ Validation uses temp instance (doesn't save)

## Mobile Responsive
- ✅ Modal width: 90% on mobile, max-width on desktop
- ✅ Grid columns: 1 on mobile, 2 on tablet+
- ✅ Touch-friendly buttons
- ✅ Scrollable content

## Validation Flow

### Test Without Saving
1. Admin fills credentials in Credentials tab
2. Clicks "Validate Credentials"
3. System creates temporary carrier with new credentials
4. Calls carrier API to test authentication
5. Shows success/failure message
6. **Does NOT save** to database
7. Admin can fix issues and validate again
8. When satisfied, clicks "Save Configuration"

### Save and Apply
1. Admin completes all tabs
2. Clicks "Save Configuration"
3. System saves:
   - Credentials → `config.credentials`
   - Settings → `api_mode`, `priority`, `cutoff_time`
   - Limits → `max_weight`, `max_insurance_value`
4. Success toast appears
5. Modal closes
6. Carrier list refreshes with new data

## Future Enhancements

### Potential Additions
- [ ] Features tab (enable/disable tracking, COD, etc.)
- [ ] Services tab (enable/disable express, standard, etc.)
- [ ] Pickup days configuration
- [ ] Rate markup/markdown settings
- [ ] Webhook configuration
- [ ] Service level agreements (SLA) settings
- [ ] Auto-retry configuration
- [ ] Notification preferences
- [ ] Carrier performance metrics

### Advanced Features
- [ ] Bulk edit multiple carriers
- [ ] Import/export carrier configs
- [ ] Credential rotation scheduling
- [ ] API usage analytics
- [ ] Cost comparison dashboard
- [ ] Performance-based auto-prioritization

## Technical Implementation

### Component Structure
```tsx
<EnhancedCarrierConfigForm>
  <Tabs>
    <Tab id="credentials">
      <SecurityNotice />
      <DynamicCredentialFields />
      <ValidationButton />
      <ValidationResult />
    </Tab>
    
    <Tab id="settings">
      <APIModeSelector />
      <PriorityInput />
      <CutoffTimeInput />
      <ConfigurationNotice />
    </Tab>
    
    <Tab id="limits">
      <MaxWeightInput />
      <MaxInsuranceInput />
      <LimitsNotice />
    </Tab>
  </Tabs>
  
  <ActionButtons>
    <CancelButton />
    <ValidateButton /> (only on credentials tab)
    <SaveButton />
  </ActionButtons>
</EnhancedCarrierConfigForm>
```

### State Management
- `activeTab`: Current tab ('credentials', 'settings', 'limits')
- `formData`: All form values across all tabs
- `showPassword`: Password visibility toggles per field
- `validationResult`: Latest validation result

### Data Flow
```
Component Mount
  ↓
Load carrier data → Initialize formData
  ↓
User edits fields → Update formData state
  ↓
User clicks tab → Switch activeTab
  ↓
User clicks validate → Call API, show result
  ↓
User clicks save → POST to backend
  ↓
Backend saves → Returns updated carrier
  ↓
React Query updates cache → List refreshes
  ↓
Modal closes
```

## Conclusion

The admin UI now provides **comprehensive carrier management** with:
- ✅ Professional tabbed interface
- ✅ All essential controls accessible
- ✅ Clear organization by category
- ✅ Validation before saving
- ✅ Helpful guidance text
- ✅ Production-ready UX

Admins can now fully manage carriers without developer intervention! 🚀

