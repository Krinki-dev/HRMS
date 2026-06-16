-- ============================================================
--  GST Data Storage Schema (PostgreSQL)
--  Tables for persisting GST lookups with caching & audit
-- ============================================================

-- GST Status Enum Type
CREATE TYPE gst_status_enum AS ENUM (
  'Active', 'Cancelled', 'Suspended', 'Provisionally Cancelled', 'Unknown'
);

-- Main GST records table for central database (Supabase PostgreSQL)
CREATE TABLE IF NOT EXISTS central_gst_records (
  id                    SERIAL PRIMARY KEY,

  -- GSTIN Identity
  gstin                 VARCHAR(15) NOT NULL UNIQUE COMMENT 'GST Identification Number (15 chars)',
  pan                   VARCHAR(10) COMMENT 'PAN extracted from GSTIN chars 3-12',

  -- Business Names (all field variations from scrapers)
  legalname             VARCHAR(255) COMMENT 'Legal registered name of business',
  company_name          VARCHAR(255) COMMENT 'Company name',
  tradename             VARCHAR(255) COMMENT 'Trade name / DBA',
  legal_name            VARCHAR(255) COMMENT 'Alternate legal name',
  trade_name            VARCHAR(255) COMMENT 'Alternate trade name',

  -- Registration Details
  regdate               DATE COMMENT 'GSTIN registration date (converted to YYYY-MM-DD)',
  registration_date     DATE COMMENT 'Alternate field for registration date',
  status                VARCHAR(50) COMMENT 'GSTIN Status (Active/Cancelled/Suspended/etc)',
  gstin_status          VARCHAR(50) COMMENT 'Normalized GST status',
  cancel_date           DATE COMMENT 'Cancellation date if applicable',
  
  type                  VARCHAR(50) COMMENT 'Regular, Composition, Provisional, etc.',
  taxpayer_type         VARCHAR(50),
  constitutionofbusiness VARCHAR(100) COMMENT 'Constitution type: Pvt Ltd, Proprietorship, HUF, Partnership, etc.',
  constitution          VARCHAR(100),

  -- Business Classification
  businesstype          VARCHAR(255),
  core_business_activity VARCHAR(255),
  business_nature       JSONB COMMENT 'Nature of business activities (JSON array)',
  dealing_in            JSONB COMMENT 'HSN codes dealt in (JSON array)',

  -- Address Fields (all variations from different scrapers)
  address               VARCHAR(500),
  address_line          VARCHAR(500),
  flat_no               VARCHAR(50),
  branch_no             VARCHAR(50),
  branch_name           VARCHAR(255),
  street                VARCHAR(200),
  location              VARCHAR(100),
  district              VARCHAR(100),
  city                  VARCHAR(100),

  -- State & Location
  state                 VARCHAR(100) COMMENT 'State name',
  state_code            VARCHAR(2) COMMENT 'State code (01-38, 97, 99)',
  statecode             VARCHAR(2),
  pincode               VARCHAR(6) COMMENT '6-digit postal code',

  -- Jurisdiction Information
  state_juri            VARCHAR(255) COMMENT 'State jurisdiction details',
  center_juri           VARCHAR(255) COMMENT 'Centre jurisdiction details',
  center_code           VARCHAR(10) COMMENT 'Centre code',

  -- KYC & Verification
  aadhaar_authenticated BOOLEAN DEFAULT FALSE COMMENT 'Aadhaar linked and authenticated',
  aadhaar_auth_date     DATE COMMENT 'Date of Aadhaar authentication',
  ekyc_verified         BOOLEAN DEFAULT FALSE COMMENT 'e-KYC status',

  -- Data Quality & Source
  source                VARCHAR(50) DEFAULT 'official' COMMENT 'official|gstsearch.in|knowyourgst|tally',
  raw_data              JSONB COMMENT 'Full unprocessed scrape response',
  
  -- Timestamps
  cached_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_verified_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for fast lookup
  CONSTRAINT gstin_format CHECK (gstin ~ '^\d{2}[A-Z]{5}\d{4}[A-Z0-9]{2}Z[A-Z0-9]$')
);

CREATE INDEX idx_pan ON central_gst_records(pan) WHERE pan IS NOT NULL;
CREATE INDEX idx_status ON central_gst_records(status);
CREATE INDEX idx_state ON central_gst_records(state);
CREATE INDEX idx_verified ON central_gst_records(last_verified_at);
CREATE INDEX idx_created ON central_gst_records(created_at);
CREATE INDEX idx_gstin ON central_gst_records(gstin);



