# 09 — AUTH FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Last Updated: June 2026

---

## ⚡ ACTUAL API ENDPOINTS (from auth.routes.js)

```
POST /api/v1/auth/lookup           → Find tenant by email (returns subdomain, tenantId)
POST /api/v1/auth/login            → Login → { accessToken } + httpOnly refresh cookie
POST /api/v1/auth/refresh          → Rotate access token using refresh cookie
POST /api/v1/auth/logout           → Clear refresh cookie
POST /api/v1/auth/forgot-password  → Send reset email
POST /api/v1/auth/reset-password   → Apply new password with token
POST /api/v1/auth/change-password  → Change password (authenticated)
POST /api/v1/auth/send-otp         → Send OTP email for verification
POST /api/v1/auth/verify-otp       → Verify OTP → issues access token
```

## ⚡ CSRF & TOKEN RULES
```
Login + lookup + refresh: CSRF EXEMPT (whitelist in server.js)
All other auth mutations:  Require X-CSRF-Token header matching _csrf cookie
Access token:              15 min JWT — sent as Authorization: Bearer <token>
Refresh token:             7 day JWT — httpOnly cookie (never accessible by JS)
is_platform_admin:         Fetched from central_user_index on every request (not in JWT)
```

---

## PAGES IN THIS DOCUMENT
```
1. Login Page (with tenant lookup)
2. Forgot Password Page
3. Reset Password Page
4. First Time Password Setup
5. OTP Verification
6. Session Expiry Handling
7. Logout
```

---
---

## 1. LOGIN PAGE
**URL:** `/login`
**Access:** Public (redirect to dashboard if already logged in)

---

### Step 1.1 — Page Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Check localStorage for tenant branding config | No BE call on load | No DB call |
| If branding exists → show client logo & colors | | |
| If no branding → show default app logo | | |
| Render form: Email/Phone field + Password field | | |
| Show "Remember me" checkbox | | |
| Check URL for `?redirect=` param → store it | | |
| If already has valid token → redirect to dashboard | | |

---

### Step 1.2 — User Fills Email/Phone Field

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Input type: text (accepts both email & phone) | No call yet | No call yet |
| Real-time format detect: is it email or phone? | | |
| Email: validate format (x@x.x) | | |
| Phone: validate 10 digits India format | | |
| Show green tick when valid format | | |
| Trim whitespace automatically | | |
| Convert email to lowercase automatically | | |
| Store cleaned value in form state | | |

---

### Step 1.3 — User Fills Password Field

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Input type: password (masked by default) | No call yet | No call yet |
| Show/hide toggle eye icon | | |
| Min length: 1 character (no FE complexity check on login) | | |
| Store value in form state | | |
| Never log or expose password value | | |

---

### Step 1.4 — User Clicks Login Button

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Validate both fields filled | | |
| If empty → show inline error, stop | | |
| Show loader spinner on button | | |
| Disable button (prevent double submit) | | |
| POST /api/v1/auth/login | | |
| Send: { identifier, password, rememberMe } | | |

---

### Step 1.5 — Backend Processes Login

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Waiting (loader showing) | Receive POST /api/v1/auth/login | |
| | Sanitize identifier (trim, lowercase) | |
| | Detect type: email or phone | |
| | Check rate limit: max 5 attempts per IP per 15 min | READ: rate_limit cache |
| | If rate limited → return ERR_RATE_LIMITED | |
| | Resolve tenant from request domain/subdomain | READ: tenants WHERE domain = ? |
| | If tenant not found → return ERR_INVALID_TENANT | |
| | Check tenant subscription status | READ: tenants (plan field) WHERE tenant_id = ? |
| | If suspended → return ERR_ACCOUNT_SUSPENDED | |
| | Connect to tenant's own database | |
| | Find user by email OR phone | READ: users WHERE email = ? OR phone = ? AND deleted_at IS NULL |
| | If user not found → return ERR_INVALID_CREDENTIALS (never say "email not found") | |
| | Check user is_active | READ: users.is_active |
| | If inactive → return ERR_ACCOUNT_DISABLED | |
| | Check locked_until | READ: users.locked_until |
| | If locked → return ERR_ACCOUNT_LOCKED with unlock time | |
| | Compare password: bcrypt.compare(input, hash) | READ: users.password_hash |
| | If wrong password: | |
| | → increment login_attempts | WRITE: users.login_attempts += 1 |
| | → if attempts >= 5 → set locked_until = now + 30min | WRITE: users.locked_until |
| | → return ERR_INVALID_CREDENTIALS | |
| | If correct password: | |
| | → reset login_attempts = 0 | WRITE: users.login_attempts = 0 |
| | → fetch employee linked to user | READ: employees WHERE id = users.employee_id |
| | → fetch role & permissions | READ: roles WHERE id = users.role_id |
| | → fetch active modules for tenant | READ: tenant_modules WHERE tenant_id = ? AND is_active = true |
| | → generate access_token (JWT, 15 min expiry) | |
| | → payload: { userId, tenantId, roleId, permissions, modules } | |
| | → generate refresh_token (JWT, 7 days or 30 days if rememberMe) | |
| | → set refresh_token in httpOnly cookie | |
| | → update last_login_at | WRITE: users.last_login_at = NOW() |
| | → write audit log | WRITE: audit_logs (action: login) |
| | → return: { accessToken, user { name, email, role, photo }, modules[] } | |

---

### Step 1.6 — Frontend Handles Response

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **On Success:** | Response sent | |
| Store accessToken in memory (NOT localStorage) | | |
| Store user info in Zustand global state | | |
| Store active modules list in Zustand | | |
| Build sidebar menu based on active modules | | |
| Build route permissions based on role | | |
| Check if 2FA is enabled for this user | | |
| If 2FA enabled → redirect to /verify-2fa | | |
| If no 2FA → redirect to dashboard (or ?redirect= url) | | |
| **On Error:** | | |
| Hide loader, re-enable button | | |
| ERR_INVALID_CREDENTIALS → "Invalid email or password" | | |
| ERR_ACCOUNT_LOCKED → "Account locked until HH:MM" | | |
| ERR_ACCOUNT_DISABLED → "Account disabled, contact HR" | | |
| ERR_ACCOUNT_SUSPENDED → "Subscription suspended, contact support" | | |
| ERR_RATE_LIMITED → "Too many attempts, try after X minutes" | | |

---
---

## 2. FORGOT PASSWORD PAGE
**URL:** `/forgot-password`
**Access:** Public only

---

### Step 2.1 — Page Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Simple form: one email/phone input | No call | No call |
| Back to login link | | |
| No branding check needed | | |

---

### Step 2.2 — User Submits Email/Phone

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Validate format | | |
| Show loader | | |
| POST /api/v1/auth/forgot-password | | |
| Send: { identifier } | | |

---

### Step 2.3 — Backend Processes Request

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Waiting | Receive request | |
| | Resolve tenant from domain | READ: tenants |
| | Find user by email or phone | READ: users |
| | **Whether user exists or not → same success response** (security — never reveal if email exists) | |
| | If user exists: | |
| | → generate reset_token (random 64 char hex) | |
| | → hash the token (store hash, send raw) | |
| | → set expiry: now + 1 hour | |
| | → store in DB | WRITE: password_resets { user_id, token_hash, expires_at, used: false } |
| | → send email with reset link | |
| | → reset link: https://domain/reset-password?token=RAW_TOKEN | |
| | → write audit log | WRITE: audit_logs (action: password_reset_requested) |
| | Return: { success: true, message: "If account exists, reset link sent" } | |

---

### Step 2.4 — Frontend Shows Result

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Always show success message (even if email wrong) | | |
| "Reset link sent if account exists" | | |
| Show resend option after 60 seconds countdown | | |
| Disable resend button during countdown | | |

---
---

## 3. RESET PASSWORD PAGE
**URL:** `/reset-password?token=xxx`
**Access:** Public, token required

---

### Step 3.1 — Page Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Extract token from URL | | |
| If no token → redirect to /forgot-password | | |
| POST /api/v1/auth/verify-reset-token | | |
| Send: { token } | Receive token | |
| | Hash the token | |
| | Look up in password_resets | READ: password_resets WHERE token_hash = ? |
| | Check: exists? not used? not expired? | READ: used, expires_at |
| | If invalid/expired → return ERR_INVALID_TOKEN | |
| | Return: { valid: true, email: masked (x***@gmail.com) } | |
| If valid → show password reset form | | |
| Show masked email so user knows which account | | |
| If invalid → show "Link expired" with new request option | | |

---

### Step 3.2 — User Sets New Password

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Input: New password | | |
| Input: Confirm password | | |
| Real-time password strength indicator | | |
| Rules shown: min 8 chars, 1 uppercase, 1 number, 1 special | | |
| Confirm must match new password (FE check) | | |
| Submit button disabled until all rules met | | |
| POST /api/v1/auth/reset-password | | |
| Send: { token, newPassword } | | |
| | Receive request | |
| | Re-verify token validity | READ: password_resets |
| | Validate password strength (BE also validates) | |
| | bcrypt.hash(newPassword, 12) | |
| | Update user password | WRITE: users.password_hash = newHash |
| | Mark reset token as used | WRITE: password_resets.used = true |
| | Invalidate all existing sessions | WRITE: DELETE user_sessions WHERE user_id = ? |
| | Send confirmation email "Password changed successfully" | |
| | Write audit log | WRITE: audit_logs (action: password_reset) |
| | Return success | |
| Show success message | | |
| Redirect to /login after 3 seconds | | |

---
---

## 4. FIRST TIME PASSWORD SETUP
**URL:** `/setup-password?token=xxx`
**Access:** New employee first login

---

### Step 4.1 — Flow Trigger

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| HR creates employee → system auto creates user account | | |
| | Generate setup_token | |
| | Store token hash with 7 day expiry | WRITE: password_resets { type: 'setup' } |
| | Send welcome email with setup link | |
| Employee clicks link in email | | |

---

### Step 4.2 — Setup Page Load

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Extract token from URL | | |
| Verify token | BE verifies token | READ: password_resets |
| If valid: show welcome message with employee name | Return: { name, email, company } | READ: users, employees |
| Show: set password + confirm password | | |
| Show company logo (from tenant branding) | | |
| If invalid: "Link expired, contact HR" | | |

---

### Step 4.3 — Employee Sets Password

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Same password strength rules as reset | | |
| Submit → POST /api/v1/auth/setup-password | | |
| | Hash password | |
| | Save password | WRITE: users.password_hash |
| | Mark account as active | WRITE: users.is_active = true |
| | Mark token used | WRITE: password_resets.used = true |
| | Write audit log | WRITE: audit_logs (action: account_activated) |
| | Auto-login user (generate tokens) | |
| | Return access_token | |
| Store token | | |
| Redirect to dashboard (first time tour shown) | | |

---
---

## 5. TWO FACTOR AUTHENTICATION (2FA)
**URL:** `/verify-2fa`
**Access:** After successful password login, if 2FA enabled

---

### Step 5.1 — 2FA Verification Page

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show 6-digit OTP input | | |
| Show where OTP was sent (email/phone masked) | | |
| Resend option after 60 seconds | | |
| Auto-submit when 6 digits entered | | |
| POST /api/v1/auth/verify-2fa | | |
| Send: { otp, tempToken } | | |
| | Verify tempToken valid | READ: temp_auth_tokens |
| | Verify OTP not expired (5 min window) | READ: otp_store |
| | Verify OTP matches | READ: otp_store.code |
| | If wrong: increment attempt count | WRITE: otp_attempts |
| | If 3 wrong attempts: invalidate session | WRITE: temp_auth_tokens |
| | If valid: generate full access_token | |
| | Clear OTP from store | DELETE: otp_store |
| | Write audit log | WRITE: audit_logs (action: 2fa_verified) |
| | Return: { accessToken, user, modules } | |
| Store token → redirect to dashboard | | |

---
---

## 6. SESSION EXPIRY HANDLING
**Trigger:** Access token expires (every 15 minutes)

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Any API call returns 401 ERR_TOKEN_EXPIRED | | |
| Axios interceptor catches 401 automatically | | |
| Interceptor calls POST /api/v1/auth/refresh | | |
| (User sees nothing — happens in background) | Reads httpOnly refresh cookie | READ: refresh_token_blacklist |
| | Verifies refresh token valid & not blacklisted | |
| | If valid: generate new access_token | |
| | If refresh also expired: return ERR_SESSION_EXPIRED | WRITE: audit_logs (session_expired) |
| | Return: { accessToken } | |
| Store new access_token in memory | | |
| Retry original failed API call automatically | | |
| If refresh also expired: | | |
| → Clear all state from Zustand | | |
| → Show "Session expired, please login again" | | |
| → Redirect to /login?redirect=current_page | | |

---
---

## 7. LOGOUT

---

### Step 7.1 — User Clicks Logout

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Show confirm dialog: "Are you sure?" | | |
| On confirm: POST /api/v1/auth/logout | | |
| | Add refresh token to blacklist | WRITE: token_blacklist { token_hash, expires_at } |
| | Clear httpOnly cookie | |
| | Write audit log | WRITE: audit_logs (action: logout) |
| | Return success | |
| Clear accessToken from memory | | |
| Clear all Zustand state | | |
| Clear any cached data | | |
| Redirect to /login | | |
| Browser back button → cannot go back (history replaced) | | |

---

## DB TABLES USED IN AUTH FLOWS

```
users              → main auth record
password_resets    → reset & setup tokens
token_blacklist    → invalidated refresh tokens
otp_store          → temporary OTP codes
temp_auth_tokens   → temporary token during 2FA
audit_logs         → all auth events logged
tenants            → tenant resolution on login
tenants.plan, tenants.plan_expires_at, tenants.is_active → subscription status
roles              → permissions on login
tenant_modules     → active modules on login
```

---

## 🔗 Related Documents
- User & tenant tables → [04_DATABASE.md](./04_DATABASE.md)
- Client onboarding → [10_ONBOARDING_FLOWS.md](./10_ONBOARDING_FLOWS.md)
- Employee setup → [12_EMPLOYEE_FLOWS.md](./12_EMPLOYEE_FLOWS.md)
