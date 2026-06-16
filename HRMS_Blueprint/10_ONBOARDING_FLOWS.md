# 10 — ONBOARDING & COMPANY CONFIG FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## PAGES IN THIS DOCUMENT
```
1. Your SaaS Website — New Client Registration
2. Payment Flow
3. Client First Time Setup Wizard (6 Steps)
4. YOUR Company Config (SaaS Provider Side)
5. Client Company Config (Settings Page)
6. White Label Configuration
7. DNS Setup Guide Page
```

---
---

## 1. YOUR SAAS WEBSITE — NEW CLIENT REGISTRATION
**URL:** `yourwebsite.com/register`
**Access:** Public

---

### Step 1.1 — Registration Form Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show plan comparison table | No call | No call |
| Plans: Basic / Standard / Professional / Enterprise | | |
| Each plan shows: modules included, max employees, price | | |
| "Get Started" button per plan | | |
| User selects plan → registration form opens | | |

---

### Step 1.2 — Registration Form Fields

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Contact Person Details:** | | |
| Full Name (first + last) | | |
| Mobile Number → validate 10 digits | | |
| Email → validate format | | |
| **Company Details:** | | |
| Company Name | | |
| GSTIN (optional at signup) | | |
| **Account Details:** | | |
| Desired subdomain → yourname.yourapp.com | | |
| Real-time subdomain availability check | POST /api/v1/platform/check-subdomain | READ: tenants WHERE subdomain = ? |
| Green tick if available, red X if taken | Return: { available: true/false } | |
| Password + Confirm Password | | |
| Password strength indicator | | |
| Accept Terms & Privacy checkbox | | |
| Submit button | | |

---

### Step 1.3 — Subdomain Auto-Suggestion

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| As user types company name | | |
| Auto-generate subdomain suggestion | | |
| Remove spaces, special chars, lowercase | | |
| Example: "ABC Pvt Ltd" → "abcpvtltd" | | |
| Show 3 suggestions if primary taken | | |
| User can edit subdomain freely | | |

---

### Step 1.4 — Form Submission

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Validate all fields | | |
| Show loader | | |
| POST /api/v1/platform/register | | |
| Send: { name, mobile, email, companyName, gstin, subdomain, password, planId } | | |
| | Receive registration data | |
| | Validate all fields (BE also validates) | |
| | Check email uniqueness | READ: tenants WHERE email = ? |
| | Check subdomain uniqueness (final check) | READ: tenants WHERE subdomain = ? |
| | Check mobile uniqueness | READ: tenants WHERE phone = ? |
| | Hash password: bcrypt.hash(password, 12) | |
| | Create tenant record (status: pending_payment) | WRITE: tenants { status: 'pending_payment' } |
| | Create admin user for this tenant | WRITE: users (central) |
| | Store selected planId | WRITE: tenants.plan_id |
| | Generate OTP for mobile verification | |
| | Send OTP via Fast2SMS/WhatsApp | |
| | Write audit log | WRITE: audit_logs |
| | Return: { tenantId, requiresOtp: true } | |
| Show OTP verification screen | | |

---

### Step 1.5 — Mobile OTP Verification

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show masked mobile number | | |
| 6-digit OTP input | | |
| 60 second resend countdown | | |
| Auto-submit on 6 digits | | |
| POST /api/v1/platform/verify-otp | | |
| | Verify OTP | READ: otp_store |
| | If valid: mark mobile as verified | WRITE: tenants.mobile_verified = true |
| | Return: { verified: true, redirectTo: '/payment' } | |
| Redirect to payment page | | |

---
---

## 2. PAYMENT FLOW
**URL:** `yourwebsite.com/payment`
**Access:** After OTP verified, before account activation

---

### Step 2.1 — Payment Page

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show order summary | | |
| Plan name, price, GST breakup | | |
| Monthly / Yearly toggle (yearly = discount) | | |
| Promo code input | | |
| Validate promo → POST /api/v1/platform/validate-promo | BE checks promo | READ: tenant_pricing_configs (offer_flat_paise, offer_expiry_date) |
| Final amount shown | | |
| Payment method: Razorpay / PhonePe | | |

---

### Step 2.2 — Payment Initiation

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| User clicks Pay | | |
| POST /api/v1/platform/create-payment-order | | |
| | Create Razorpay/PhonePe order | |
| | Store order details | WRITE: invoices { status: 'pending', gateway_order_id } |
| | Return: { orderId, amount, gateway, key } | |
| Open Razorpay/PhonePe payment modal | | |
| User completes payment | | |

---

### Step 2.3 — Payment Webhook & Verification

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Payment modal closes with result | | |
| POST /api/v1/platform/verify-payment | | |
| Send: { orderId, paymentId, signature } | | |
| | Verify signature (Razorpay standard) | |
| | If signature invalid → reject | |
| | If valid: | |
| | → Update invoice status to paid | WRITE: invoices.status = 'paid' |
| | → Create subscription record | WRITE: tenants (plan, plan_expires_at) { status: 'active', start_date, end_date } |
| | → Activate tenant account | WRITE: tenants.is_active = true, status = 'active' |
| | → Set tenants.plan + plan_expires_at | WRITE: tenants, tenant_pricing_configs |
| | → Create tenant's own database (run migrations) | CREATE DATABASE + RUN MIGRATIONS |
| | → Send welcome email with login link | |
| | → Send invoice PDF via email | |
| | → Write audit log | WRITE: audit_logs |
| | Return: { success: true, loginUrl, licenceKey } | |
| Show success page | | |
| Show login URL + licence key (copy button) | | |
| Send to client's subdomain to begin setup | | |

---
---

## 3. CLIENT FIRST TIME SETUP WIZARD
**URL:** `clientdomain.yourapp.com/setup`
**Access:** First admin login only — redirected automatically

---

### Step 3.1 — Wizard Overview

```
Step 1: Company Information
Step 2: Branding & White Label
Step 3: Database Configuration
Step 4: Modules Selection
Step 5: First Admin Profile
Step 6: Finish & Launch
```

---

### Step 3.2 — Wizard Step 1: Company Information

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Progress bar: Step 1 of 6 | | |
| **Pre-filled from registration (not editable):** | | |
| Company Name (shown, locked) | | |
| Admin Email (shown, locked) | | |
| Admin Mobile (shown, locked) | | |
| **Fill now:** | | |
| Legal Company Name | | |
| GSTIN → verify button | POST /api/v1/compliance/verify-gst | READ: central_gst_records + central_kyc_records |
| → If in central lib → auto-fill all fields | Return company data | |
| → If not → automation fetches from GST portal | Playwright scrapes GST portal | WRITE: central_gst_records |
| PAN Number | | |
| CIN Number (optional) | | |
| TAN Number | | |
| Registered Address (auto-fill from GST if available) | | |
| City, State, Pincode (auto-fill from GST) | | |
| Company Phone | | |
| Company Website | | |
| Financial Year Start Month (dropdown: April default) | | |
| EPF Code (optional) | | |
| ESIC Code (optional) | | |
| Next button → validate → save | PUT /api/v1/platform/setup/company | WRITE: companies all fields |

---

### Step 3.3 — Wizard Step 2: Branding

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Progress bar: Step 2 of 6 | | |
| Upload company logo (drag & drop) | | |
| Image preview shown immediately | | |
| Accepted: PNG, JPG, SVG | | |
| Max size: configurable (default 2MB) | | |
| Upload → POST /api/v1/platform/setup/upload-logo | Store in MinIO | WRITE: companies.logo_url |
| Primary color picker | | |
| Secondary color picker | | |
| Live preview: sidebar + header with chosen colors | | |
| **"Powered by" setting:** | | |
| Show "Powered by [Your Company]" toggle | | |
| If ON: shown on footer/login page | | |
| If OFF: completely hidden | | |
| Custom footer text (optional) | | |
| Save → POST /api/v1/platform/setup/branding | | WRITE: tenants (logo_url, primary_color, background_color) table |

---

### Step 3.4 — Wizard Step 3: Database Configuration

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Progress bar: Step 3 of 6 | | |
| **DB Mode selection:** | | |
| ○ Local Only | | |
| ○ Cloud Only | | |
| ○ Local Primary + Cloud Backup | | |
| ○ Cloud Primary + Local Backup | | |
| ○ Hybrid Realtime Sync | | |
| Based on selection show relevant fields: | | |
| **If Local:** | | |
| DB Type: PostgreSQL / MySQL / MSSQL | | |
| Host, Port, Database name, Username, Password | | |
| Test Connection button → POST /api/v1/platform/setup/test-db | BE tries connection | No write yet |
| Green tick or error shown | Return: { connected: true/false, error } | |
| **If Cloud:** | | |
| Supabase URL + Key (or other provider) | | |
| Test Connection button | | |
| **If Hybrid:** | | |
| Both local + cloud fields | | |
| Sync interval selector (5/15/30/60 minutes) | | |
| Save & Connect → migrate schema to chosen DB | POST /api/v1/platform/setup/configure-db | WRITE: tenant_db_config (db connection settings) |
| Progress bar during migration | BE runs Prisma migrations | CREATE TABLES in tenant DB |
| Success → automatically move to Step 4 | | |

---

### Step 3.5 — Wizard Step 4: Module Selection

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Progress bar: Step 4 of 6 | | |
| Show all available modules as cards | | |
| Based on plan → some modules greyed out (upgrade required) | | |
| Toggle each module ON/OFF | | |
| Dependency warning: | | |
| "Payroll requires Attendance to be ON" | | |
| If user turns off dependency → warn + auto-handle | | |
| Minimum: Employee Management always ON (cannot disable) | | |
| Save → POST /api/v1/platform/setup/modules | | WRITE: tenant_modules table |
| | Activates selected modules | WRITE: tenant_modules { module, is_active } |

---

### Step 3.6 — Wizard Step 5: Admin Profile

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Progress bar: Step 5 of 6 | | |
| **Pre-filled (from registration — not editable):** | | |
| Email address (locked) | | |
| Mobile number (locked) | | |
| **Fill now:** | | |
| First Name | | |
| Last Name | | |
| Profile photo upload (optional) | | |
| Designation (e.g. HR Manager) | | |
| **2FA Setup (optional but recommended):** | | |
| Enable 2FA toggle | | |
| If enabled: show QR for authenticator app | BE generates TOTP secret | WRITE: users.two_fa_secret |
| Or: OTP via email/SMS option | | |
| Save → POST /api/v1/platform/setup/admin-profile | | WRITE: employees + users |

---

### Step 3.7 — Wizard Step 6: Finish & Launch

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Progress bar: Step 6 of 6 — Complete ✅ | | |
| Summary of all setup choices shown | | |
| System checklist: | | |
| ✅ Company info saved | | |
| ✅ Logo uploaded | | |
| ✅ Database connected | | |
| ✅ X modules activated | | |
| ✅ Admin profile complete | | |
| "Go to Dashboard" button | | |
| | Mark setup complete | WRITE: tenants.setup_complete = true |
| | Write audit log | WRITE: audit_logs (action: setup_completed) |
| | Send setup complete notification to your central server | |
| Redirect to main dashboard | | |
| First time dashboard tour shown | | |

---
---

## 4. YOUR COMPANY CONFIG (SaaS Provider — Admin Panel)
**URL:** `admin.yourapp.com/settings`
**Access:** Your team only (super admin)

---

### 4.1 — Your Company Details

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Pre-filled & Editable:** | | |
| Your company legal name | | |
| GSTIN | | |
| PAN | | |
| Registered address | | |
| Support email | | |
| Support phone | | |
| Support WhatsApp number | | |
| Website URL | | |
| **Invoice Settings:** | | |
| Invoice prefix (INV-2024-) | | |
| Invoice starting number | | |
| GST rate (18%) | | |
| Bank details for invoice display | | |
| Invoice terms & conditions text | | |
| Invoice footer text | | |
| Save → PUT /api/v1/platform/admin/company | | WRITE: platform_settings table |

---

### 4.2 — Plans Management

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all plans | GET /api/v1/platform/admin/plans | READ: tenant_pricing_configs |
| Edit plan: name, price, modules, limits | | |
| Save changes | PUT /api/v1/platform/admin/plans/:id | WRITE: tenant_pricing_configs |
| Add new plan | POST /api/v1/platform/admin/plans | WRITE: tenant_pricing_configs |

---

### 4.3 — Client Management

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all clients with status | GET /api/v1/platform/admin/tenants | READ: tenants (plan, plan_expires_at, is_active) |
| Filter: active / suspended / trial / expired | | |
| Click client → view details | | |
| Actions: suspend / activate / extend / upgrade | | |
| View client's subscription & payment history | | READ: invoices WHERE tenant_id = ? |

---
---

## 5. CLIENT COMPANY CONFIG
**URL:** `clientdomain.yourapp.com/settings/company`
**Access:** HR Admin / Super Admin

---

### 5.1 — Company Details Tab

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| All company fields editable | | |
| **Non-editable after first save:** | | |
| GSTIN (locked after verification) | | |
| PAN (locked after verification) | | |
| CIN (locked after save) | | |
| **Always editable:** | | |
| Address, phone, email, website | | |
| Financial year start | | |
| EPF/ESIC codes | | |
| Save → PUT /api/v1/settings/company | | WRITE: companies |

---

### 5.2 — Branches Tab

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List all branches | GET /api/v1/settings/branches | READ: branches |
| Add branch: name, address, city, state | | |
| Mark as head office toggle | | |
| Activate / deactivate branch | | |
| Save | POST/PUT /api/v1/settings/branches | WRITE: branches |

---

### 5.3 — Notifications Config Tab

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **Email Settings:** | | |
| Provider: SMTP / SendGrid / Resend | | |
| SMTP: host, port, username, password, SSL | | |
| Test email button → sends test email | POST /api/v1/settings/test-email | No DB write |
| **SMS Settings:** | | |
| Provider: Fast2SMS / MSG91 / None | | |
| API key input (masked) | | |
| Sender ID | | |
| Test SMS button | | |
| **WhatsApp Settings:** | | |
| Provider: WhatsApp Business API / None | | |
| API credentials (masked) | | |
| Test WhatsApp button | | |
| **Notification Rules:** | | |
| Toggle each event: email/SMS/WhatsApp on/off | | |
| Events: leave approved, payslip generated, birthday, etc. | | |
| Save all | PUT /api/v1/settings/notifications | WRITE: notification_config |

---
---

## 6. WHITE LABEL CONFIGURATION
**URL:** `clientdomain.yourapp.com/settings/branding`
**Access:** HR Admin / Super Admin

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Company name shown on app header | | |
| Upload logo → preview immediately | POST /api/v1/settings/upload-logo | WRITE: tenants (logo_url, primary_color, background_color).logo_url |
| Primary color picker → live preview | | |
| Secondary color picker → live preview | | |
| Login page background image upload | | |
| Login page welcome message text | | |
| App title (browser tab name) | | |
| Favicon upload | | |
| Footer text | | |
| "Powered by" toggle (if plan allows hiding) | | |
| Email header logo | | |
| Email footer text | | |
| Payslip header logo | | |
| Payslip company details display | | |
| Save → PUT /api/v1/settings/branding | | WRITE: tenants (logo_url, primary_color, background_color) |
| Changes reflect immediately across app | | |

---
---

## 7. DNS SETUP GUIDE
**URL:** `yourwebsite.com/dns-setup` or shown in setup wizard

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Step by step DNS guide | | |
| Client's assigned subdomain shown | | |
| If client wants own domain: | | |
| Enter custom domain: hr.clientcompany.com | | |
| System shows DNS records to add: | | |
| CNAME: hr.clientcompany.com → yourapp.com | | |
| TXT record for verification | | |
| Verify DNS button → POST /api/v1/settings/verify-dns | BE does DNS lookup | READ: tenants.custom_domain |
| | Checks CNAME + TXT records live | |
| | If verified → activate custom domain | WRITE: tenants.custom_domain, domain_verified = true |
| Success → app accessible on their own domain | | |
| SSL auto-provisioned (Let's Encrypt) | BE runs certbot | |

---

## DB TABLES USED IN ONBOARDING FLOWS

```
tenants              → client company record
tenants (plan, plan_expires_at, is_active) → subscription status
invoices             → payment records
(no licence_keys table — plan tracked in tenants)
companies            → company details (tenant DB)
tenant_branding → logo, colors, white label
tenant_modules       → active modules per client
tenants (db_mode, db_url, local_db_*) → DB connection settings
notification_config  → email/SMS/WhatsApp settings
platform_settings → platform owner config
plans                → subscription plans
otp_store            → verification OTPs
audit_logs           → all actions logged
```

---

## 🔗 Related Documents
- Auth flows → [09_AUTH_FLOWS.md](./09_AUTH_FLOWS.md)
- Employee flows → [12_EMPLOYEE_FLOWS.md](./12_EMPLOYEE_FLOWS.md)
- Database tables → [04_DATABASE.md](./04_DATABASE.md)
