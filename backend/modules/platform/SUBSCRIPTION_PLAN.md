# HRMS Subscription & Pricing Implementation Plan

## 1. Database Layer ✅
- [x] Create `tenant_pricing_configs` table in `hrms_central`.
- [x] Add triggers for `updated_at`.
- [x] Index `tenant_id` for fast lookups during billing cycles.

## 2. Backend Logic ✅
- [x] Update `registerTenant` to initialize pricing rules based on `dbMode`.
- [x] Set 90-day trial for Shared Cloud (Option 1).
- [x] Set 90-day trial for others (Options 2, 3, 4).
- [x] Create `shared/utils/subscriptionCalculator.js` to implement the pricing formula.

## 3. Module Management ✅
- [x] Define standard pricing (paise) for each module in a central config file.
- [x] Update `tenant_modules` to include a `custom_price_paise` override per tenant.
- [x] Create API for Admin to enable/disable modules and set per-module discounts.

## 4. Offers & Discounts Engine ✅
- [x] Implement logic for "Bundle Discounts" (e.g., 15% off if > 3 modules).
- [x] Implement "Tenure Discounts" logic for 6/12/24 month periods.
- [x] Add "Stackable" flag check in the calculator utility.

## 5. Admin Panel UI ✅
- [x] New "Billing Config" tab in the Super Admin dashboard (clients/:id).
- [x] Visual sliders/inputs for % discounts and flat deductions.
- [x] Real-time "Price Preview" for the admin while configuring a client.

## 6. Billing & Invoicing ✅
- [x] Design the `invoices` table schema.
- [x] Create core logic for monthly invoice generation.
- [x] Automated cron job to run generation on the 1st of every month.
- [x] Integration with Razorpay for automated recurring payments.
- [x] Razorpay Webhook handling for asynchronous payment updates.
- [x] PhonePe integration (order creation & webhook).
- [x] Automatic suspension for overdue invoices.
- [x] PDF Invoice generation using the computed dynamic price.
- [x] Tenant-Side Subscription Management Page.
- [x] Trial Expiry Banner.

## 7. Salary Disbursements (Payouts) ✅
- [x] Encrypted storage for Tenant Payout Credentials.
- [x] Standard NEFT/RTGS Bank File Generator (CSV).
- [x] Integrated Payout Gateway scaffolds (RazorpayX).
- [x] Pre-disbursement Bank Detail Validation.
- [x] Payout Transaction Status Tracking (Webhook).

---
**Note on Formula:**  
`Final = (Base + ModulesSum) * (1 - TotalDiscPct) - FlatOffer`  
*Calculated in PAISE (Integer) to avoid floating point errors.*

