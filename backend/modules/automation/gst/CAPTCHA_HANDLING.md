# GST Verification — Official Source and User-Assisted CAPTCHA

## Required registration behaviour

1. Prefer an authorised official GST-system API/integration where access is permitted.
2. If the official GST portal requires CAPTCHA and no authorised API is available, open the official portal session and display its CAPTCHA challenge in the registration flow.
3. The customer enters the CAPTCHA. The server submits that user-provided answer and extracts the official portal result.
4. Never bypass CAPTCHA, transcribe audio CAPTCHA automatically, run image OCR to solve CAPTCHA, or silently fall back to third-party lookup websites.
5. If official verification is unavailable, show a clear retry/manual-entry state. Do not label unverified manually entered information as verified.

## Current implementation notes

- `createAssistedCaptchaSession` opens the official GST portal and returns the CAPTCHA challenge to the frontend.
- `submitAssistedCaptchaSession` submits the user's entered CAPTCHA and extracts the official result.
- `scrapeGstSearchSite` is restricted to the official-source function; third-party fallback providers are not used by the registration lookup chain.
- The assisted session is short-lived. The user can restart if it expires.
- A cached GST record may be used only with its stored source and verification timestamp visible to the application. Stale records must be reverified before being represented as current.

## Not supported / prohibited

- Automated audio CAPTCHA solving or OCR CAPTCHA solving.
- CAPTCHA-solving services.
- Third-party lookup sites as automatic fallback or source of truth.
- Claims of unlimited/free/100% successful lookup.

## Remaining validation

Before production use, verify official portal terms and permitted automation/access methods, test the assisted CAPTCHA journey against the live portal, verify rate limits and data freshness, and confirm that source/verification metadata is preserved. No production readiness is implied by the presence of this code.
