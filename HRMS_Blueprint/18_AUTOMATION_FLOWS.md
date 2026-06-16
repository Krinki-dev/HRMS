# 18 — BROWSER AUTOMATION FLOWS
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Format: FE = Frontend | BE = Backend | DB = Database
> Tool: Playwright + playwright-extra stealth + tesseract.js OCR + jimp + jsqr
> Last Updated: June 2026

---

## ⚡ ACTUAL API ENDPOINTS

```
# GST routes (mounted at /api/v1/gst — NO tenant required)
GET  /api/v1/gst/lookup/:gstin     → Lookup GSTIN (central_gst_records cache first)
POST /api/v1/gst/scrape            → Force fresh Playwright GST scrape

# KYC routes
POST /api/v1/automation/kyc/initiate   → Start Aadhaar OTP flow
POST /api/v1/automation/kyc/verify     → Submit OTP + retrieve KYC data
GET  /api/v1/automation/kyc/status/:id → Poll BullMQ job status

# Automation management
GET  /api/v1/automation/...            → General automation routes
```

## ⚡ KEY IMPLEMENTATION FACTS

```
Queue:          BullMQ (Redis-backed) — started via startWorker() in server.js
OCR:            tesseract.js (Tesseract OCR) for CAPTCHA solving
                tesseract.js uses eng.traineddata (5MB, ships in /backend/)
Image proc:     jimp for pre-processing before OCR
QR decode:      jsqr for QR code reading (Aadhaar QR)
GST cache:      central_gst_records table — shared across ALL tenants
KYC cache:      central_kyc_records table — Aadhaar hash keyed, shared across ALL tenants
CAPTCHA:        See CAPTCHA_HANDLING.md in gst/ folder for detailed strategy
Stealth:        playwright-extra stealth plugin to avoid bot detection
```

---

## PAGES IN THIS DOCUMENT
```
1. Automation Center Dashboard
2. EPFO Portal Automation
3. ESIC Portal Automation
4. GST Search Automation (with caching)
5. Aadhaar KYC / Offline XML Download
6. LWF / PT Portal Automation
7. CAPTCHA Handling (OCR + Manual Solve)
8. Automation Logs & Monitoring
9. Portal Credentials Management
```

---
---

## 1. AUTOMATION CENTER DASHBOARD
**URL:** `/automation`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/automation/dashboard | | |
| | Fetch recent automation runs | READ: automation_logs ORDER BY created_at DESC LIMIT 20 |
| | Fetch pending manual CAPTCHA tasks | READ: automation_tasks WHERE status = awaiting_captcha |
| | Fetch scheduled automation jobs | READ: automation_schedules |
| **Available Automations panel:** | | |
| 🔵 EPFO — ECR Upload | | |
| 🔵 EPFO — UAN Fetch | | |
| 🔵 ESIC — Challan Upload | | |
| 🔵 GST — Company Search | | |
| 🔵 Aadhaar — Offline Download | | |
| 🔵 LWF — Return Filing | | |
| Each with: Run Now / Schedule buttons | | |
| **Pending CAPTCHA section** (urgent): | | |
| If any automation waiting for CAPTCHA → | | |
| Red banner: "X tasks waiting for CAPTCHA solve" | | |
| Click → opens CAPTCHA solve window | | |
| **Recent Runs table:** | | |
| Task / Started At / Status / Duration / Download | | |
| Status: Running / Success / Failed / Awaiting CAPTCHA | | |

---
---

## 2. EPFO PORTAL AUTOMATION
**URL:** `/automation/epfo`

---

### Step 2.1 — ECR Upload via EPFO

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select Month/Year | | |
| Check ECR file generated? | GET /api/v1/compliance/pf/ecr-status | READ: compliance_files |
| If not generated → show Generate ECR first | | |
| If generated → Show file details | | |
| "Upload to EPFO" button | | |
| POST /api/v1/automation/epfo/upload-ecr | | |
| Send: { month, year } | | |
| | Fetch ECR file from MinIO | READ: compliance_files |
| | Create automation task | WRITE: automation_tasks { status: running } |
| | Launch Playwright (headless: false for CAPTCHA) | |
| | Open: https://unifiedportal-emp.epfindia.gov.in | |
| | Click Login | | |
| | Fill: Username (from credentials) | READ: automation_credentials WHERE portal = epfo |
| | Fill: Password (decrypt from storage) | READ: automation_credentials.password (decrypt) |
| | **CAPTCHA encountered:** | | |
| | Screenshot CAPTCHA image | |
| | Pause automation | WRITE: automation_tasks.status = awaiting_captcha |
| | Return CAPTCHA image to FE | |
| Show CAPTCHA image to HR | | |
| **Manual CAPTCHA solve window opens:** | | |
| CAPTCHA image shown large + clear | | |
| Text input for HR to type CAPTCHA | | |
| Submit CAPTCHA button | | |
| POST /api/v1/automation/captcha-solve | | |
| Send: { taskId, captchaText } | | |
| | Resume Playwright | |
| | Fill CAPTCHA field | |
| | Click Login | |
| | Navigate to ECR upload section | |
| | Upload ECR file | |
| | Submit | |
| | Screenshot confirmation page | |
| | Extract: acknowledgement number | |
| | Save acknowledgement | WRITE: compliance_filings.ack_number |
| | Update task status | WRITE: automation_tasks.status = success |
| Show success: "ECR uploaded. Ack: XXXXX" | | |
| Download confirmation screenshot button | | |

---

### Step 2.2 — UAN Bulk Fetch from EPFO

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select employees without UAN (list shown) | | |
| "Fetch UANs from EPFO" button | | |
| POST /api/v1/automation/epfo/fetch-uan | | |
| | Launch Playwright | |
| | Login to EPFO portal (with CAPTCHA flow) | |
| | Navigate to member search | |
| | For each employee: | |
| | → Search by PF member ID / Aadhaar | |
| | → Extract UAN from result | |
| | → Save UAN | WRITE: employees.uan_number |
| | Return: { fetched: X, failed: Y } | |
| Show results: X UANs fetched | | |
| Failed list shown with reason | | |

---
---

## 3. ESIC PORTAL AUTOMATION
**URL:** `/automation/esic`

---

### Step 3.1 — Challan Payment Upload

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select month/year | | |
| Check challan generated | | |
| "Upload to ESIC" button | | |
| POST /api/v1/automation/esic/upload-challan | | |
| | Launch Playwright | |
| | Open ESIC employer portal | |
| | Login with credentials + CAPTCHA flow | READ: automation_credentials WHERE portal = esic |
| | Navigate to challan payment section | |
| | Fill contribution details from generated challan | READ: compliance_files |
| | Submit | |
| | Extract challan number from confirmation | |
| | Save challan number | WRITE: compliance_filings.challan_number |
| | Screenshot confirmation | |
| | Update task status | WRITE: automation_tasks.status = success |
| Show challan number + confirmation | | |

---
---

## 4. GST SEARCH AUTOMATION
**URL:** Used during company setup & central library

---

### Step 4.1 — GST Number Search

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| User enters GST number anywhere in app | | |
| System first checks central library | POST /api/v1/compliance/gst/search | READ: central_gst_records + central_kyc_records WHERE identifier = gst_number AND data_type = gst |
| **If found in library (cache hit):** | | |
| | Return cached data instantly | |
| Auto-fill company details ✅ | | |
| Show: "Verified from Central Library" | | |
| **If not found (cache miss):** | | |
| Show: "Fetching from GST portal..." | | |
| | Launch Playwright | |
| | Open: https://www.gstsearch.in OR GST portal | |
| | Enter GST number in search field | |
| | Handle CAPTCHA if present (manual solve) | |
| | Click Search | |
| | Extract company data: | |
| | → Legal name | |
| | → Trade name | |
| | → Address | |
| | → Registration date | |
| | → GST status (active/cancelled) | |
| | → Business type | |
| | Save to central library | WRITE: central_gst_records { data_type: gst, identifier: gst_number, verified_data: JSON } |
| | Return company data | |
| Auto-fill all company fields with fetched data | | |
| Show: "Data fetched from GST Portal" | | |
| Non-editable after verification (GST-linked fields) | | |

---
---

## 5. AADHAAR OFFLINE XML DOWNLOAD
**URL:** Used during employee onboarding

---

### Step 5.1 — Aadhaar Verification & Download

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| HR enters employee Aadhaar number | | |
| **Central library check first:** | | |
| POST /api/v1/compliance/aadhaar/verify | | READ: central_gst_records + central_kyc_records WHERE identifier = aadhaar AND data_type = aadhaar |
| **If found in library:** | | |
| | Return cached verified data | |
| Auto-fill employee fields from library ✅ | | |
| Show: "Verified from Central Library — No re-verification needed" | | |
| **If not found:** | | |
| Show: "Will fetch from Aadhaar portal" | | |
| | Launch Playwright (visible browser) | |
| | Open: https://resident.uidai.gov.in | |
| | Click: Download Aadhaar | |
| | Enter Aadhaar number | |
| | **CAPTCHA encountered:** | |
| | Screenshot CAPTCHA | |
| | Pause: status = awaiting_captcha | WRITE: automation_tasks |
| Show CAPTCHA solve window to HR | | |
| HR types CAPTCHA → submit | | |
| | Fill CAPTCHA + continue | |
| | Click Send OTP | |
| OTP sent to employee's Aadhaar-linked mobile | | |
| Show: "OTP sent to XXXX mobile, enter below" | | |
| Employee / HR enters OTP | | |
| Submit OTP → POST /api/v1/automation/aadhaar/submit-otp | | |
| | Fill OTP in browser | |
| | Check "I agree" checkbox | |
| | Click Download | |
| | Wait for download | |
| | Retrieve downloaded ZIP file | |
| | Parse XML from ZIP | |
| | Decrypt XML (password = PIN set by employee, ask HR to enter) | |
| | Extract data from XML: | |
| | → Name (as per Aadhaar) | |
| | → DOB | |
| | → Gender | |
| | → Address | |
| | → Photo (Base64) | |
| | Save verified data to central library | WRITE: central_gst_records |
| | Save encrypted Aadhaar number | WRITE: employees.aadhar_number (AES-256 encrypted) |
| | Return extracted data | |
| Auto-fill all employee fields | | |
| Lock Aadhaar-linked fields (non-editable) | | |
| Photo auto-set as employee profile photo | | |

---
---

## 6. LWF / PT PORTAL AUTOMATION
**URL:** `/automation/lwf` `/automation/pt`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| Select state + period | | |
| "File Return" button | | |
| POST /api/v1/automation/lwf/file | | |
| | Launch Playwright | |
| | Open state LWF/PT portal | READ: portal_urls WHERE state = ? AND type = lwf |
| | Login with credentials + CAPTCHA flow | READ: automation_credentials |
| | Navigate to return filing | |
| | Fill employee details from payroll data | READ: payslips |
| | Upload return file if required | READ: compliance_files |
| | Submit | |
| | Extract acknowledgement | |
| | Save ack | WRITE: compliance_filings |
| Show success + ack number | | |

---
---

## 7. CAPTCHA HANDLING (MANUAL SOLVE)

### Flow Applicable To: All automation tasks

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| **When automation hits CAPTCHA:** | | |
| | Playwright takes screenshot of CAPTCHA area | |
| | Base64 encode screenshot | |
| | Pause automation | WRITE: automation_tasks.status = awaiting_captcha |
| | Store screenshot | WRITE: automation_tasks.captcha_image |
| | Push real-time notification to FE via SSE | |
| 🔔 Red notification: "CAPTCHA needed for [Task]" | | |
| Click notification → CAPTCHA modal opens | | |
| **CAPTCHA Modal:** | | |
| Task name shown | | |
| CAPTCHA image (large, clear) | | |
| Refresh CAPTCHA button (gets new CAPTCHA) | | |
| Text input: "Type characters shown" | | |
| Submit button | | |
| POST /api/v1/automation/captcha/:taskId/solve | | |
| Send: { captchaText } | | |
| | Resume Playwright | |
| | Type CAPTCHA text | |
| | Continue automation from pause point | |
| | If CAPTCHA wrong: | |
| | → Screenshot new CAPTCHA | WRITE: automation_tasks.captcha_image (updated) |
| | → Return: { wrongCaptcha: true } | |
| Show new CAPTCHA for retry | | |
| | If CAPTCHA correct: automation continues | |
| Modal auto-closes | | |
| Task status updates in real-time | | |

---
---

## 8. AUTOMATION LOGS & MONITORING
**URL:** `/automation/logs`

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| GET /api/v1/automation/logs | | READ: automation_logs ORDER BY created_at DESC |
| **Filters:** | | |
| Portal / Status / Date range | | |
| **Log table:** | | |
| Task / Portal / Started / Ended / Duration / Status / User | | |
| Status: ✅ Success / ❌ Failed / ⏸️ CAPTCHA / 🔄 Running | | |
| Click row → detail view | | |
| **Detail view:** | | |
| Step by step log of what automation did | | READ: automation_step_logs |
| Screenshots captured during run | | READ: automation_screenshots |
| Error message if failed | | |
| Downloaded files list | | |
| Retry button (for failed tasks) | | |
| **Real-time running tasks:** | | |
| Auto-refresh every 5 seconds | | |
| Progress indicator for running tasks | | |

---
---

## 9. PORTAL CREDENTIALS MANAGEMENT
**URL:** `/automation/credentials`
**Access:** Super Admin / HR Admin only

---

| FE (Frontend) | BE (Backend) | DB (Database) |
|--------------|-------------|--------------|
| List configured portals | GET /api/v1/automation/credentials | READ: automation_credentials (masked) |
| **Per portal:** | | |
| EPFO / ESIC / GST / PT / LWF | | |
| Status: Configured ✅ / Not configured ⚠️ | | |
| Last used / Last success date | | |
| Edit credentials button | | |
| **Edit form:** | | |
| Portal name (shown, locked) | | |
| Username / User ID | | |
| Password (masked, show/hide toggle) | | |
| Additional fields per portal (e.g. company code) | | |
| Save → PUT /api/v1/automation/credentials/:portal | | |
| | Encrypt password (AES-256) before save | |
| | Store encrypted | WRITE: automation_credentials { username, password_encrypted, iv } |
| **Test Credentials button:** | | |
| | Launch Playwright | |
| | Attempt login to portal | |
| | Return: { success: true/false, message } | |
| Show: "✅ Login successful" or "❌ Invalid credentials" | | |

---

## DB TABLES USED IN AUTOMATION FLOWS

```
automation_tasks         → individual automation runs
automation_logs          → summary log per run
automation_step_logs     → detailed steps per run
automation_screenshots   → captured screenshots
automation_credentials   → portal login credentials (encrypted)
automation_schedules     → recurring automation jobs
central_kyc_records → Aadhaar cache  /  central_gst_records → GST cache
compliance_filings       → updated after successful filing
compliance_files         → ECR/challan files used in automation
```

---

## ⚠️ SECURITY NOTES

```
Portal credentials:
→ Stored AES-256 encrypted
→ Never logged in plain text
→ Never returned in API response (masked only)
→ Only decrypted in memory during automation run
→ Access limited to Super Admin / HR Admin role

Aadhaar data:
→ Number stored AES-256 encrypted
→ Displayed masked: XXXX-XXXX-1234
→ Full reveal requires HR Admin role + audit log entry
→ XML file deleted after parsing
→ Only parsed data retained
```

---

## 🔗 Related Documents
- Compliance flows → [16_COMPLIANCE_FLOWS.md](./16_COMPLIANCE_FLOWS.md)
- Employee flows (Aadhaar during onboarding) → [12_EMPLOYEE_FLOWS.md](./12_EMPLOYEE_FLOWS.md)
- Central library → [05_DATA_FLOW.md](./05_DATA_FLOW.md)
