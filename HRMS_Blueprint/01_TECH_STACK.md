# 01 — TECH STACK
> Part of HRMS Blueprint | [← Back to Index](./00_INDEX.md)
> Last Updated: June 2026 | Status: FROZEN ✅ (versions may patch-update)

---

## 🖥️ Frontend

| Tool | Purpose | Version | Licence | Cost |
|------|---------|---------|---------|------|
| **React** | UI Framework | 18+ | MIT | Free |
| **Vite** | Build Tool & Dev Server | Latest | MIT | Free |
| **Tailwind CSS** | Utility-First Styling | 3+ | MIT | Free |
| **React Router** | Page Routing | v6 | MIT | Free |
| **React Query** | Server-State / API Cache | v5 | MIT | Free |
| **Zustand** | Global Client State | Latest | MIT | Free |
| **React Hook Form** | Form Handling | Latest | MIT | Free |
| **Recharts** | Charts & Graphs | Latest | MIT | Free |
| **SheetJS (xlsx)** | Excel Export/Import | Latest | MIT | Free |
| **jsPDF / pdfkit** | PDF Generation (FE) | Latest | MIT | Free |
| **Axios** | HTTP Client | Latest | MIT | Free |

> **Frontend Dev Port:** `localhost:5173`
> **API proxy in dev:** Vite proxies `/api/v1` → `http://localhost:5001`

---

## 🖥️ Desktop App (Phase 2)

| Tool | Purpose | Licence | Cost | Notes |
|------|---------|---------|------|-------|
| **Tauri** | Desktop Wrapper | MIT | Free | ~5MB vs 150MB Electron |

> ⚠️ Tauri is **Phase 2** — Windows only target. Not yet implemented.

---

## ⚙️ Backend (Node.js)

### Runtime & Framework

| Package | Purpose | Version |
|---------|---------|---------|
| **Node.js** | Runtime | 18+ LTS |
| **Express** | Web Framework | `^4.18.2` |
| **helmet** | Security Headers | `^7.1.0` |
| **cors** | CORS Handling | `^2.8.5` |
| **cookie-parser** | Cookie Parsing | `^1.4.6` |
| **express-rate-limit** | Route Rate Limiting | `^7.2.0` |
| **express-async-handler** | Async Error Propagation | `^1.2.0` |

### Authentication & Security

| Package | Purpose | Version |
|---------|---------|---------|
| **jsonwebtoken** | JWT Access + Refresh Tokens | `^9.0.2` |
| **bcryptjs** | Password Hashing | `^2.4.3` |
| **uuid** | UUID Generation | `^14.0.0` |

### Database & ORM

| Package | Purpose | Version |
|---------|---------|---------|
| **@prisma/client** | ORM Client | `^6.19.3` |
| **prisma** (dev) | Schema & Migration CLI | `^6.19.3` |

> Two Prisma clients exist:
> - `@prisma/client` (default) → Tenant DB from `prisma/schema.prisma`
> - Custom client → Central DB from `prisma/central.prisma` → output: `shared/generated/central-client/`

### Queue & Scheduling

| Package | Purpose | Version |
|---------|---------|---------|
| **bullmq** | Job Queue (Automation Tasks) | `^5.71.0` |
| **ioredis** | Redis Client for BullMQ | `^5.3.2` |
| **redis** | Redis Client (general cache) | `^5.11.0` |
| **node-cron** | Billing Cron Scheduler | `^4.2.1` |

### File Handling

| Package | Purpose | Version |
|---------|---------|---------|
| **multer** | File Upload (multipart/form-data) | `^1.4.5-lts.1` |
| **minio** | MinIO / S3 File Storage Client | `^8.0.1` |
| **adm-zip** | ZIP Archive Handling | `^0.5.16` |

### Document Generation

| Package | Purpose | Version |
|---------|---------|---------|
| **pdfkit** | PDF Generation | `^0.18.0` |
| **json2csv** | CSV Export | `^6.0.0-alpha.2` |
| **fast-xml-parser** | XML Parsing (PF/ESI/Tally) | `^5.5.6` |

### Email & Notifications

| Package | Purpose | Version |
|---------|---------|---------|
| **nodemailer** | Transactional Email (SMTP) | `^8.0.3` |
| **ws** | WebSocket Server (real-time notifs) | `^8.17.0` |

### Browser Automation & OCR

| Package | Purpose | Version |
|---------|---------|---------|
| **playwright** | EPFO/ESIC/GST Browser Automation | `^1.58.2` |
| **playwright-extra** | Playwright Stealth Plugin | `^4.3.6` |
| **tesseract.js** | OCR (CAPTCHA + Aadhaar image) | `^7.0.0` |
| **jimp** | Image Pre-Processing for OCR | `^1.6.1` |
| **jsqr** | QR Code Decoding | `^1.4.0` |
| **cheerio** | HTML Scraping | `^1.2.0` |

### Payments & External APIs

| Package | Purpose | Version |
|---------|---------|---------|
| **razorpay** | Payment Gateway SDK | `^2.9.6` |
| **axios** | HTTP Client (external API calls) | `^1.13.6` |
| **form-data** | Multipart form for external APIs | `^4.0.5` |

### Validation & Utilities

| Package | Purpose | Version |
|---------|---------|---------|
| **zod** | Schema Validation | `^3.22.4` |
| **winston** | Structured Logging | `^3.13.0` |
| **dotenv** | Environment Variables | `^16.4.0` |

### Dev Tools

| Package | Purpose | Version |
|---------|---------|---------|
| **nodemon** (dev) | Auto-Restart in Development | `^3.0.3` |

---

## 🗄️ Database

| Tool | Purpose | Notes |
|------|---------|-------|
| **PostgreSQL** | Primary DB (Central + All Tenant DBs) | Default |
| **MySQL** | Alternative Tenant DB | Client option via Prisma |
| **MSSQL** | Enterprise Tenant DB | Client option via Prisma |
| **SQLite** | Testing Only | Dev/test only |
| **Supabase** | Cloud PostgreSQL hosting | Self-hosted option |

> All DB access through Prisma — backend code never changes per DB type.
> Tenant schema isolation: append `?schema=<name>` to DB URL when `schema_name` is set on tenant.

---

## 📁 File Storage

| Tool | Purpose | Notes |
|------|---------|-------|
| **MinIO** | Self-Hosted Object Storage (S3-compatible) | `MINIO_*` env vars |

> File URLs are always signed (1-hour expiry) — no direct paths served.

---

## 💰 Payments

| Tool | SDK | Status |
|------|-----|--------|
| **Razorpay** | `razorpay ^2.9.6` | ✅ Integrated (primary) |
| **PhonePe** | HTTP API (`axios`) | ✅ Integrated (secondary) |
| **JioPay** | HTTP API (`axios`) | ✅ Integrated (env: `JIOPAY_*`) |

> Both `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and `PHONEPE_*` env vars active.

---

## 📧 Notifications

| Tool | Purpose | Cost | Config |
|------|---------|------|--------|
| **Nodemailer + SMTP** | Transactional Email | Free | Client sets own SMTP |
| **WebSocket (ws)** | Real-time In-App Notifs | Free | Built-in |
| **Fast2SMS** | SMS India | ₹0.15/SMS | Optional |
| **MSG91** | SMS India | ₹0.18/SMS | Optional |
| **WhatsApp Business API** | WhatsApp | 1000/month free | Optional |

---

## 🔐 Authentication & Session

```
Access Token:     JWT — signed with JWT_ACCESS_SECRET — 15 min default
Refresh Token:    JWT — httpOnly cookie — 7 days default
CSRF:             X-CSRF-Token header validated against _csrf cookie
                  Exempt paths: /api/csrf-token, /api/v1/auth/lookup,
                                /api/v1/auth/login, /api/v1/auth/refresh
Password Hashing: bcryptjs
Sensitive Data:   AES-256 via ENCRYPTION_KEY + MASTER_ENCRYPTION_KEY
```

---

## 🌐 Hosting & Infrastructure

| Option | Cost | RAM | CPU | Location |
|--------|------|-----|-----|----------|
| **Oracle Cloud Free** | Free | 24GB | 2-4 CPU | Mumbai ✅ (production) |
| Hetzner VPS (backup) | ~₹400/month | 4GB | 2 CPU | Germany |

---

## 🔍 Logging

| Tool | Purpose | Config |
|------|---------|--------|
| **Winston** | Structured JSON logging | LOG_LEVEL env var |
| **Winston File Transport** | `logs/combined.log` + `logs/error.log` | Automatic |
| **GlitchTip** (planned) | Error Tracking (self-hosted) | Optional |

---

## 🌍 Third-Party Integrations (Configured via .env)

| Service | Purpose | Env Vars |
|---------|---------|---------|
| **Google OAuth** | Login with Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| **Google Drive** | Cloud Backup | `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET` |
| **OneDrive** | Cloud Backup | `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET`, `ONEDRIVE_TENANT_ID` |
| **AssemblyAI** | Voice Transcription (AI) | `ASSEMBLYAI_API_KEY` |
| **Supabase Central** | Central DB hosting | `GLOBAL_SUPABASE_URL`, `GLOBAL_SUPABASE_SERVICE_ROLE_KEY` |
| **Supabase Client** | Tenant DB hosting | `CLIENT_SUPABASE_URL`, `CLIENT_SUPABASE_SERVICE_ROLE_KEY` |

---

## 📱 Mobile (Phase 2)

| Tool | Purpose | Notes |
|------|---------|-------|
| **React Native** | Mobile App | Same backend API — no backend changes needed |

---

## 🛠️ Dev Tools

| Tool | Purpose |
|------|---------|
| **GitHub** | Code Repository |
| **GitHub Actions** | CI/CD (2000 min/month free) |
| **ESLint + Prettier** | Code Quality |
| **VS Code** | Editor |

---

## 🔗 Related Documents
- Database schema details → [04_DATABASE.md](./04_DATABASE.md)
- Backend API details → [03_BACKEND.md](./03_BACKEND.md)
- Frontend structure → [02_FRONTEND.md](./02_FRONTEND.md)
