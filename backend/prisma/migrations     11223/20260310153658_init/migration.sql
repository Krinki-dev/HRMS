BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[companies] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [legal_name] NVARCHAR(1000),
    [gstin] NVARCHAR(1000),
    [pan] NVARCHAR(1000),
    [cin] NVARCHAR(1000),
    [logo_url] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [pincode] NVARCHAR(1000),
    [country] NVARCHAR(1000) NOT NULL CONSTRAINT [companies_country_df] DEFAULT 'India',
    [phone] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [website] NVARCHAR(1000),
    [epf_number] NVARCHAR(1000),
    [esic_number] NVARCHAR(1000),
    [pt_number] NVARCHAR(1000),
    [lwf_number] NVARCHAR(1000),
    [sitemap_url] NVARCHAR(1000),
    [financial_year_start] INT NOT NULL CONSTRAINT [companies_financial_year_start_df] DEFAULT 4,
    [working_days_month] INT NOT NULL CONSTRAINT [companies_working_days_month_df] DEFAULT 26,
    [overtime_threshold] INT NOT NULL CONSTRAINT [companies_overtime_threshold_df] DEFAULT 8,
    [payslip_password_type] NVARCHAR(1000) NOT NULL CONSTRAINT [companies_payslip_password_type_df] DEFAULT 'dob',
    [is_active] BIT NOT NULL CONSTRAINT [companies_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [companies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [companies_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[branches] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [pincode] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [branches_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [branches_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [branches_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[departments] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [parent_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000),
    [head_id] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [departments_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [departments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [departments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[designations] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [level] INT,
    [is_active] BIT NOT NULL CONSTRAINT [designations_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [designations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [designations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employees] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [branch_id] NVARCHAR(1000),
    [department_id] NVARCHAR(1000),
    [designation_id] NVARCHAR(1000),
    [employee_code] NVARCHAR(1000) NOT NULL,
    [first_name] NVARCHAR(1000) NOT NULL,
    [last_name] NVARCHAR(1000) NOT NULL,
    [middle_name] NVARCHAR(1000),
    [date_of_birth] DATETIME2,
    [gender] NVARCHAR(1000),
    [marital_status] NVARCHAR(1000),
    [blood_group] NVARCHAR(1000),
    [personal_email] NVARCHAR(1000),
    [work_email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [emergency_contact_name] NVARCHAR(1000),
    [emergency_contact_phone] NVARCHAR(1000),
    [emergency_contact_rel] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [pincode] NVARCHAR(1000),
    [date_of_joining] DATETIME2,
    [date_of_leaving] DATETIME2,
    [employment_type] NVARCHAR(1000) NOT NULL CONSTRAINT [employees_employment_type_df] DEFAULT 'full_time',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [employees_status_df] DEFAULT 'active',
    [reporting_to] NVARCHAR(1000),
    [probation_end_date] DATETIME2,
    [confirmation_date] DATETIME2,
    [aadhaar_number] NVARCHAR(1000),
    [pan_number] NVARCHAR(1000),
    [uan_number] NVARCHAR(1000),
    [esi_ip_number] NVARCHAR(1000),
    [photo_url] NVARCHAR(1000),
    [is_user_created] BIT NOT NULL CONSTRAINT [employees_is_user_created_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employees_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [employees_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employee_documents] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [document_type] NVARCHAR(1000) NOT NULL,
    [document_name] NVARCHAR(1000) NOT NULL,
    [file_url] NVARCHAR(1000) NOT NULL,
    [expiry_date] DATETIME2,
    [is_verified] BIT NOT NULL CONSTRAINT [employee_documents_is_verified_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employee_documents_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [employee_documents_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employee_bank_accounts] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [bank_name] NVARCHAR(1000) NOT NULL,
    [account_number] NVARCHAR(1000) NOT NULL,
    [ifsc_code] NVARCHAR(1000) NOT NULL,
    [account_type] NVARCHAR(1000) NOT NULL CONSTRAINT [employee_bank_accounts_account_type_df] DEFAULT 'savings',
    [is_primary] BIT NOT NULL CONSTRAINT [employee_bank_accounts_is_primary_df] DEFAULT 1,
    [verified_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employee_bank_accounts_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [employee_bank_accounts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000),
    [role_id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [password_hash] NVARCHAR(1000) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [users_is_active_df] DEFAULT 1,
    [is_first_login] BIT NOT NULL CONSTRAINT [users_is_first_login_df] DEFAULT 1,
    [last_login_at] DATETIME2,
    [two_fa_enabled] BIT NOT NULL CONSTRAINT [users_two_fa_enabled_df] DEFAULT 0,
    [two_fa_secret] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_employee_id_key] UNIQUE NONCLUSTERED ([employee_id])
);

-- CreateTable
CREATE TABLE [dbo].[roles] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [permissions] NVARCHAR(1000) NOT NULL,
    [is_system] BIT NOT NULL CONSTRAINT [roles_is_system_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [roles_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[password_resets] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [token_hash] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [password_resets_type_df] DEFAULT 'reset',
    [expires_at] DATETIME2 NOT NULL,
    [used] BIT NOT NULL CONSTRAINT [password_resets_used_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [password_resets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [password_resets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[token_blacklist] (
    [id] NVARCHAR(1000) NOT NULL,
    [token_hash] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [token_blacklist_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [token_blacklist_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[otp_store] (
    [id] NVARCHAR(1000) NOT NULL,
    [identifier] NVARCHAR(1000) NOT NULL,
    [otp_hash] NVARCHAR(1000) NOT NULL,
    [purpose] NVARCHAR(1000) NOT NULL,
    [attempts] INT NOT NULL CONSTRAINT [otp_store_attempts_df] DEFAULT 0,
    [expires_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [otp_store_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [otp_store_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[temp_auth_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [token_hash] NVARCHAR(1000) NOT NULL,
    [purpose] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [used] BIT NOT NULL CONSTRAINT [temp_auth_tokens_used_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [temp_auth_tokens_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [temp_auth_tokens_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[shifts] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [start_time] NVARCHAR(1000) NOT NULL,
    [end_time] NVARCHAR(1000) NOT NULL,
    [late_grace_mins] INT NOT NULL CONSTRAINT [shifts_late_grace_mins_df] DEFAULT 15,
    [early_leave_mins] INT NOT NULL CONSTRAINT [shifts_early_leave_mins_df] DEFAULT 15,
    [total_hours] FLOAT(53) NOT NULL CONSTRAINT [shifts_total_hours_df] DEFAULT 9,
    [week_offs] NVARCHAR(1000) NOT NULL CONSTRAINT [shifts_week_offs_df] DEFAULT '[0,6]',
    [is_active] BIT NOT NULL CONSTRAINT [shifts_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [shifts_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [shifts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employee_shifts] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [shift_id] NVARCHAR(1000) NOT NULL,
    [effective_from] DATETIME2 NOT NULL,
    [effective_to] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employee_shifts_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [employee_shifts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[holidays] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [applicable_branches] NVARCHAR(1000) NOT NULL CONSTRAINT [holidays_applicable_branches_df] DEFAULT '[]',
    [recurring_yearly] BIT NOT NULL CONSTRAINT [holidays_recurring_yearly_df] DEFAULT 0,
    [year] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [holidays_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [holidays_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[attendance] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [check_in] DATETIME2,
    [check_out] DATETIME2,
    [working_hours] FLOAT(53),
    [overtime_hours] FLOAT(53),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [attendance_status_df] DEFAULT 'absent',
    [late_arrival] BIT NOT NULL CONSTRAINT [attendance_late_arrival_df] DEFAULT 0,
    [early_departure] BIT NOT NULL CONSTRAINT [attendance_early_departure_df] DEFAULT 0,
    [regularized] BIT NOT NULL CONSTRAINT [attendance_regularized_df] DEFAULT 0,
    [location_lat] FLOAT(53),
    [location_lng] FLOAT(53),
    [ip_address] NVARCHAR(1000),
    [ot_status] NVARCHAR(1000),
    [ot_type] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [attendance_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [attendance_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [attendance_employee_id_date_key] UNIQUE NONCLUSTERED ([employee_id],[date])
);

-- CreateTable
CREATE TABLE [dbo].[regularization_requests] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [requested_checkin] DATETIME2,
    [requested_checkout] DATETIME2,
    [reason] NVARCHAR(1000) NOT NULL,
    [document_url] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [regularization_requests_status_df] DEFAULT 'pending',
    [approved_by] NVARCHAR(1000),
    [approved_at] DATETIME2,
    [rejection_reason] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [regularization_requests_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [regularization_requests_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[compoff_records] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [worked_date] DATETIME2 NOT NULL,
    [earned_days] FLOAT(53) NOT NULL,
    [expiry_date] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [compoff_records_status_df] DEFAULT 'active',
    [granted_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [compoff_records_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [compoff_records_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[leave_types] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [is_paid] BIT NOT NULL CONSTRAINT [leave_types_is_paid_df] DEFAULT 1,
    [accrual_type] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_types_accrual_type_df] DEFAULT 'monthly',
    [accrual_days] FLOAT(53) NOT NULL CONSTRAINT [leave_types_accrual_days_df] DEFAULT 1,
    [accrual_from] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_types_accrual_from_df] DEFAULT 'joining',
    [prorate_first_month] BIT NOT NULL CONSTRAINT [leave_types_prorate_first_month_df] DEFAULT 1,
    [max_balance] FLOAT(53),
    [carry_forward] BIT NOT NULL CONSTRAINT [leave_types_carry_forward_df] DEFAULT 0,
    [max_carry_forward] FLOAT(53),
    [encashable] BIT NOT NULL CONSTRAINT [leave_types_encashable_df] DEFAULT 0,
    [min_days_per_app] FLOAT(53) NOT NULL CONSTRAINT [leave_types_min_days_per_app_df] DEFAULT 0.5,
    [max_days_per_app] FLOAT(53),
    [advance_notice_days] INT NOT NULL CONSTRAINT [leave_types_advance_notice_days_df] DEFAULT 0,
    [allow_past_date] BIT NOT NULL CONSTRAINT [leave_types_allow_past_date_df] DEFAULT 0,
    [gap_between_apps_days] INT NOT NULL CONSTRAINT [leave_types_gap_between_apps_days_df] DEFAULT 0,
    [half_day_allowed] BIT NOT NULL CONSTRAINT [leave_types_half_day_allowed_df] DEFAULT 1,
    [document_required] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_types_document_required_df] DEFAULT 'never',
    [document_after_days] INT,
    [gender_specific] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_types_gender_specific_df] DEFAULT 'all',
    [min_service_months] INT NOT NULL CONSTRAINT [leave_types_min_service_months_df] DEFAULT 0,
    [is_active] BIT NOT NULL CONSTRAINT [leave_types_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [leave_types_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [leave_types_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[leave_balances] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [leave_type_id] NVARCHAR(1000) NOT NULL,
    [year] INT NOT NULL,
    [opening] FLOAT(53) NOT NULL CONSTRAINT [leave_balances_opening_df] DEFAULT 0,
    [accrued] FLOAT(53) NOT NULL CONSTRAINT [leave_balances_accrued_df] DEFAULT 0,
    [used] FLOAT(53) NOT NULL CONSTRAINT [leave_balances_used_df] DEFAULT 0,
    [pending] FLOAT(53) NOT NULL CONSTRAINT [leave_balances_pending_df] DEFAULT 0,
    [lapsed] FLOAT(53) NOT NULL CONSTRAINT [leave_balances_lapsed_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [leave_balances_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [leave_balances_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [leave_balances_employee_id_leave_type_id_year_key] UNIQUE NONCLUSTERED ([employee_id],[leave_type_id],[year])
);

-- CreateTable
CREATE TABLE [dbo].[leave_applications] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [leave_type_id] NVARCHAR(1000) NOT NULL,
    [from_date] DATETIME2 NOT NULL,
    [to_date] DATETIME2 NOT NULL,
    [days] FLOAT(53) NOT NULL,
    [half_day] BIT NOT NULL CONSTRAINT [leave_applications_half_day_df] DEFAULT 0,
    [half_day_session] NVARCHAR(1000),
    [reason] NVARCHAR(1000),
    [document_url] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_applications_status_df] DEFAULT 'pending',
    [approved_by] NVARCHAR(1000),
    [approved_at] DATETIME2,
    [rejection_reason] NVARCHAR(1000),
    [cancelled_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [leave_applications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [leave_applications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[leave_encashments] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [leave_type_id] NVARCHAR(1000) NOT NULL,
    [days] FLOAT(53) NOT NULL,
    [per_day_value] INT NOT NULL,
    [total_amount] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_encashments_status_df] DEFAULT 'pending',
    [add_to_payroll] BIT NOT NULL CONSTRAINT [leave_encashments_add_to_payroll_df] DEFAULT 1,
    [payslip_id] NVARCHAR(1000),
    [approved_by] NVARCHAR(1000),
    [approved_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [leave_encashments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [leave_encashments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[salary_structures] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [components] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [salary_structures_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [salary_structures_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employee_salaries] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [salary_structure_id] NVARCHAR(1000) NOT NULL,
    [ctc_annual] INT NOT NULL,
    [basic] INT NOT NULL,
    [hra] INT NOT NULL,
    [da] INT,
    [ta] INT,
    [special_allowance] INT,
    [other_earnings] NVARCHAR(1000),
    [gross_monthly] INT NOT NULL,
    [pf_employee] INT,
    [pf_employer] INT,
    [esi_employee] INT,
    [esi_employer] INT,
    [pt_monthly] INT,
    [tds_monthly] INT,
    [net_monthly] INT NOT NULL,
    [effective_from] DATETIME2 NOT NULL,
    [effective_to] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employee_salaries_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [employee_salaries_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[payroll_runs] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [month] INT NOT NULL,
    [year] INT NOT NULL,
    [total_employees] INT NOT NULL CONSTRAINT [payroll_runs_total_employees_df] DEFAULT 0,
    [total_gross] INT NOT NULL CONSTRAINT [payroll_runs_total_gross_df] DEFAULT 0,
    [total_deductions] INT NOT NULL CONSTRAINT [payroll_runs_total_deductions_df] DEFAULT 0,
    [total_net] INT NOT NULL CONSTRAINT [payroll_runs_total_net_df] DEFAULT 0,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [payroll_runs_status_df] DEFAULT 'draft',
    [processed_at] DATETIME2,
    [locked_at] DATETIME2,
    [processed_by] NVARCHAR(1000),
    [locked_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [payroll_runs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [payroll_runs_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [payroll_runs_company_id_month_year_key] UNIQUE NONCLUSTERED ([company_id],[month],[year])
);

-- CreateTable
CREATE TABLE [dbo].[payslips] (
    [id] NVARCHAR(1000) NOT NULL,
    [payroll_run_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [month] INT NOT NULL,
    [year] INT NOT NULL,
    [working_days] INT NOT NULL,
    [present_days] FLOAT(53) NOT NULL,
    [lop_days] FLOAT(53) NOT NULL CONSTRAINT [payslips_lop_days_df] DEFAULT 0,
    [paid_days] FLOAT(53) NOT NULL,
    [gross] INT NOT NULL,
    [basic] INT NOT NULL,
    [hra] INT NOT NULL,
    [da] INT NOT NULL CONSTRAINT [payslips_da_df] DEFAULT 0,
    [ta] INT NOT NULL CONSTRAINT [payslips_ta_df] DEFAULT 0,
    [special_allowance] INT NOT NULL CONSTRAINT [payslips_special_allowance_df] DEFAULT 0,
    [other_earnings] INT NOT NULL CONSTRAINT [payslips_other_earnings_df] DEFAULT 0,
    [pf_employee] INT NOT NULL CONSTRAINT [payslips_pf_employee_df] DEFAULT 0,
    [pf_employer] INT NOT NULL CONSTRAINT [payslips_pf_employer_df] DEFAULT 0,
    [esi_employee] INT NOT NULL CONSTRAINT [payslips_esi_employee_df] DEFAULT 0,
    [esi_employer] INT NOT NULL CONSTRAINT [payslips_esi_employer_df] DEFAULT 0,
    [pt] INT NOT NULL CONSTRAINT [payslips_pt_df] DEFAULT 0,
    [tds] INT NOT NULL CONSTRAINT [payslips_tds_df] DEFAULT 0,
    [lwf_employee] INT NOT NULL CONSTRAINT [payslips_lwf_employee_df] DEFAULT 0,
    [lwf_employer] INT NOT NULL CONSTRAINT [payslips_lwf_employer_df] DEFAULT 0,
    [other_deductions] INT NOT NULL CONSTRAINT [payslips_other_deductions_df] DEFAULT 0,
    [total_deductions] INT NOT NULL,
    [net_salary] INT NOT NULL,
    [pdf_url] NVARCHAR(1000),
    [is_published] BIT NOT NULL CONSTRAINT [payslips_is_published_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [payslips_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [payslips_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [payslips_payroll_run_id_employee_id_key] UNIQUE NONCLUSTERED ([payroll_run_id],[employee_id])
);

-- CreateTable
CREATE TABLE [dbo].[payroll_bonuses] (
    [id] NVARCHAR(1000) NOT NULL,
    [payroll_run_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [bonus_type] NVARCHAR(1000) NOT NULL,
    [amount] INT NOT NULL,
    [taxable] BIT NOT NULL CONSTRAINT [payroll_bonuses_taxable_df] DEFAULT 1,
    [notes] NVARCHAR(1000),
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [payroll_bonuses_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [payroll_bonuses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employee_transfers] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [from_department] NVARCHAR(1000),
    [to_department] NVARCHAR(1000),
    [from_branch] NVARCHAR(1000),
    [to_branch] NVARCHAR(1000),
    [from_designation] NVARCHAR(1000),
    [to_designation] NVARCHAR(1000),
    [from_manager] NVARCHAR(1000),
    [to_manager] NVARCHAR(1000),
    [effective_date] DATETIME2 NOT NULL,
    [reason] NVARCHAR(1000),
    [letter_url] NVARCHAR(1000),
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employee_transfers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [employee_transfers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[employee_exits] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [separation_type] NVARCHAR(1000) NOT NULL,
    [last_working_date] DATETIME2,
    [notice_period_days] INT,
    [notice_served] NVARCHAR(1000),
    [reason] NVARCHAR(1000),
    [exit_interview_date] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [employee_exits_status_df] DEFAULT 'initiated',
    [fnf_processed] BIT NOT NULL CONSTRAINT [employee_exits_fnf_processed_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employee_exits_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [employee_exits_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[exit_checklist_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [exit_id] NVARCHAR(1000) NOT NULL,
    [item_name] NVARCHAR(1000) NOT NULL,
    [completed] BIT NOT NULL CONSTRAINT [exit_checklist_items_completed_df] DEFAULT 0,
    [completed_by] NVARCHAR(1000),
    [completed_at] DATETIME2,
    [notes] NVARCHAR(1000),
    CONSTRAINT [exit_checklist_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[fnf_settlements] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [exit_id] NVARCHAR(1000) NOT NULL,
    [salary_days] INT NOT NULL CONSTRAINT [fnf_settlements_salary_days_df] DEFAULT 0,
    [salary_amount] INT NOT NULL CONSTRAINT [fnf_settlements_salary_amount_df] DEFAULT 0,
    [leave_encashment] INT NOT NULL CONSTRAINT [fnf_settlements_leave_encashment_df] DEFAULT 0,
    [gratuity] INT NOT NULL CONSTRAINT [fnf_settlements_gratuity_df] DEFAULT 0,
    [reimbursements] INT NOT NULL CONSTRAINT [fnf_settlements_reimbursements_df] DEFAULT 0,
    [notice_recovery] INT NOT NULL CONSTRAINT [fnf_settlements_notice_recovery_df] DEFAULT 0,
    [loan_recovery] INT NOT NULL CONSTRAINT [fnf_settlements_loan_recovery_df] DEFAULT 0,
    [total_payable] INT NOT NULL,
    [payslip_id] NVARCHAR(1000),
    [processed_by] NVARCHAR(1000),
    [processed_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fnf_settlements_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [fnf_settlements_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tds_declarations] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [financial_year] NVARCHAR(1000) NOT NULL,
    [regime] NVARCHAR(1000) NOT NULL CONSTRAINT [tds_declarations_regime_df] DEFAULT 'new',
    [hra_rent] INT NOT NULL CONSTRAINT [tds_declarations_hra_rent_df] DEFAULT 0,
    [landlord_pan] NVARCHAR(1000),
    [section_80c] INT NOT NULL CONSTRAINT [tds_declarations_section_80c_df] DEFAULT 0,
    [section_80d] INT NOT NULL CONSTRAINT [tds_declarations_section_80d_df] DEFAULT 0,
    [section_80g] INT NOT NULL CONSTRAINT [tds_declarations_section_80g_df] DEFAULT 0,
    [home_loan_interest] INT NOT NULL CONSTRAINT [tds_declarations_home_loan_interest_df] DEFAULT 0,
    [lta] INT NOT NULL CONSTRAINT [tds_declarations_lta_df] DEFAULT 0,
    [other_deductions] NVARCHAR(1000),
    [estimated_tax] INT NOT NULL CONSTRAINT [tds_declarations_estimated_tax_df] DEFAULT 0,
    [monthly_tds] INT NOT NULL CONSTRAINT [tds_declarations_monthly_tds_df] DEFAULT 0,
    [submitted_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [tds_declarations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [tds_declarations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[compliance_filings] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [filing_type] NVARCHAR(1000) NOT NULL,
    [period_month] INT,
    [period_year] INT NOT NULL,
    [due_date] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [compliance_filings_status_df] DEFAULT 'pending',
    [ack_number] NVARCHAR(1000),
    [challan_number] NVARCHAR(1000),
    [filed_at] DATETIME2,
    [filed_by] NVARCHAR(1000),
    [file_url] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [compliance_filings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [compliance_filings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[compliance_files] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [filing_id] NVARCHAR(1000),
    [file_type] NVARCHAR(1000) NOT NULL,
    [file_url] NVARCHAR(1000) NOT NULL,
    [file_name] NVARCHAR(1000) NOT NULL,
    [period_month] INT,
    [period_year] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [compliance_files_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [compliance_files_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[pt_slabs] (
    [id] NVARCHAR(1000) NOT NULL,
    [state] NVARCHAR(1000) NOT NULL,
    [min_salary] INT NOT NULL,
    [max_salary] INT,
    [pt_amount] INT NOT NULL,
    [applicable_months] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [pt_slabs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [pt_slabs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[lwf_rules] (
    [id] NVARCHAR(1000) NOT NULL,
    [state] NVARCHAR(1000) NOT NULL,
    [employee_contribution] INT NOT NULL,
    [employer_contribution] INT NOT NULL,
    [frequency] NVARCHAR(1000) NOT NULL CONSTRAINT [lwf_rules_frequency_df] DEFAULT 'half_yearly',
    [deduction_months] NVARCHAR(1000) NOT NULL CONSTRAINT [lwf_rules_deduction_months_df] DEFAULT '[6,12]',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [lwf_rules_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [lwf_rules_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [lwf_rules_state_key] UNIQUE NONCLUSTERED ([state])
);

-- CreateTable
CREATE TABLE [dbo].[job_requisitions] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [job_title] NVARCHAR(1000) NOT NULL,
    [department_id] NVARCHAR(1000),
    [designation_id] NVARCHAR(1000),
    [positions] INT NOT NULL CONSTRAINT [job_requisitions_positions_df] DEFAULT 1,
    [employment_type] NVARCHAR(1000),
    [experience_min] INT,
    [experience_max] INT,
    [salary_min] INT,
    [salary_max] INT,
    [job_description] NVARCHAR(1000),
    [skills_required] NVARCHAR(1000) NOT NULL CONSTRAINT [job_requisitions_skills_required_df] DEFAULT '[]',
    [branch_id] NVARCHAR(1000),
    [target_date] DATETIME2,
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [job_requisitions_priority_df] DEFAULT 'medium',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [job_requisitions_status_df] DEFAULT 'pending_approval',
    [filled_count] INT NOT NULL CONSTRAINT [job_requisitions_filled_count_df] DEFAULT 0,
    [approved_by] NVARCHAR(1000),
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [job_requisitions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [job_requisitions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[job_postings] (
    [id] NVARCHAR(1000) NOT NULL,
    [requisition_id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [post_internal] BIT NOT NULL CONSTRAINT [job_postings_post_internal_df] DEFAULT 0,
    [post_career_page] BIT NOT NULL CONSTRAINT [job_postings_post_career_page_df] DEFAULT 0,
    [post_naukri] BIT NOT NULL CONSTRAINT [job_postings_post_naukri_df] DEFAULT 0,
    [post_linkedin] BIT NOT NULL CONSTRAINT [job_postings_post_linkedin_df] DEFAULT 0,
    [post_indeed] BIT NOT NULL CONSTRAINT [job_postings_post_indeed_df] DEFAULT 0,
    [deadline] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [job_postings_status_df] DEFAULT 'active',
    [external_ids] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [job_postings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [job_postings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[candidates] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [job_id] NVARCHAR(1000) NOT NULL,
    [first_name] NVARCHAR(1000) NOT NULL,
    [last_name] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [resume_url] NVARCHAR(1000),
    [experience_years] FLOAT(53),
    [current_ctc] INT,
    [expected_ctc] INT,
    [notice_period] INT,
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [candidates_source_df] DEFAULT 'other',
    [source_detail] NVARCHAR(1000),
    [stage] NVARCHAR(1000) NOT NULL CONSTRAINT [candidates_stage_df] DEFAULT 'applied',
    [is_duplicate] BIT NOT NULL CONSTRAINT [candidates_is_duplicate_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [candidates_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [candidates_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[candidate_stage_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [candidate_id] NVARCHAR(1000) NOT NULL,
    [from_stage] NVARCHAR(1000),
    [to_stage] NVARCHAR(1000) NOT NULL,
    [changed_by] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [changed_at] DATETIME2 NOT NULL CONSTRAINT [candidate_stage_history_changed_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [candidate_stage_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[interviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [candidate_id] NVARCHAR(1000) NOT NULL,
    [round_number] INT NOT NULL CONSTRAINT [interviews_round_number_df] DEFAULT 1,
    [interview_type] NVARCHAR(1000) NOT NULL CONSTRAINT [interviews_interview_type_df] DEFAULT 'in_person',
    [scheduled_at] DATETIME2 NOT NULL,
    [duration_mins] INT NOT NULL CONSTRAINT [interviews_duration_mins_df] DEFAULT 60,
    [interviewer_ids] NVARCHAR(1000) NOT NULL CONSTRAINT [interviews_interviewer_ids_df] DEFAULT '[]',
    [venue] NVARCHAR(1000),
    [meeting_link] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [interviews_status_df] DEFAULT 'scheduled',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [interviews_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [interviews_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[interview_feedback] (
    [id] NVARCHAR(1000) NOT NULL,
    [interview_id] NVARCHAR(1000) NOT NULL,
    [interviewer_id] NVARCHAR(1000) NOT NULL,
    [skill_ratings] NVARCHAR(1000),
    [overall_rating] INT,
    [recommendation] NVARCHAR(1000),
    [comments] NVARCHAR(1000),
    [submitted_at] DATETIME2 NOT NULL CONSTRAINT [interview_feedback_submitted_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [interview_feedback_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[offers] (
    [id] NVARCHAR(1000) NOT NULL,
    [candidate_id] NVARCHAR(1000) NOT NULL,
    [offered_ctc] INT,
    [joining_date] DATETIME2,
    [letter_url] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [offers_status_df] DEFAULT 'generated',
    [accepted_at] DATETIME2,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [offers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [offers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[appraisal_cycles] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [period_start] DATETIME2 NOT NULL,
    [period_end] DATETIME2 NOT NULL,
    [goal_setting_end] DATETIME2,
    [self_appraisal_start] DATETIME2,
    [self_appraisal_end] DATETIME2,
    [manager_review_end] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [appraisal_cycles_status_df] DEFAULT 'upcoming',
    [rating_scale] INT NOT NULL CONSTRAINT [appraisal_cycles_rating_scale_df] DEFAULT 5,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [appraisal_cycles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [appraisal_cycles_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[performance_goals] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [cycle_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [category] NVARCHAR(1000) NOT NULL CONSTRAINT [performance_goals_category_df] DEFAULT 'kra',
    [target] NVARCHAR(1000),
    [weightage] FLOAT(53) NOT NULL,
    [target_date] DATETIME2,
    [achievement] FLOAT(53),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [performance_goals_status_df] DEFAULT 'draft',
    [approved_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [performance_goals_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [performance_goals_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[appraisals] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [cycle_id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [goal_ratings] NVARCHAR(1000),
    [overall_rating] FLOAT(53),
    [comments] NVARCHAR(1000),
    [promotion_recommended] BIT NOT NULL CONSTRAINT [appraisals_promotion_recommended_df] DEFAULT 0,
    [increment_recommended] INT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [appraisals_status_df] DEFAULT 'draft',
    [submitted_at] DATETIME2,
    [submitted_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [appraisals_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [appraisals_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[trainings] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [trainings_type_df] DEFAULT 'internal',
    [trainer_name] NVARCHAR(1000),
    [trainer_type] NVARCHAR(1000) NOT NULL CONSTRAINT [trainings_trainer_type_df] DEFAULT 'external',
    [trainer_employee_id] NVARCHAR(1000),
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2,
    [duration_hours] FLOAT(53),
    [venue] NVARCHAR(1000),
    [platform] NVARCHAR(1000),
    [max_participants] INT,
    [target_dept_id] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [trainings_status_df] DEFAULT 'upcoming',
    [cost] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [trainings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [trainings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[training_nominations] (
    [id] NVARCHAR(1000) NOT NULL,
    [training_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [nominated_by] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [training_nominations_status_df] DEFAULT 'nominated',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [training_nominations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [training_nominations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[training_attendance] (
    [id] NVARCHAR(1000) NOT NULL,
    [training_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [attended] BIT NOT NULL CONSTRAINT [training_attendance_attended_df] DEFAULT 0,
    [hours_attended] FLOAT(53),
    [marked_by] NVARCHAR(1000),
    [marked_at] DATETIME2,
    CONSTRAINT [training_attendance_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[training_feedback] (
    [id] NVARCHAR(1000) NOT NULL,
    [training_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [content_rating] INT,
    [trainer_rating] INT,
    [venue_rating] INT,
    [overall_rating] INT,
    [comments] NVARCHAR(1000),
    [submitted_at] DATETIME2 NOT NULL CONSTRAINT [training_feedback_submitted_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [training_feedback_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[training_certificates] (
    [id] NVARCHAR(1000) NOT NULL,
    [training_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [issued_date] DATETIME2 NOT NULL CONSTRAINT [training_certificates_issued_date_df] DEFAULT CURRENT_TIMESTAMP,
    [certificate_url] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [training_certificates_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [training_certificates_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[assets] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [brand] NVARCHAR(1000),
    [model] NVARCHAR(1000),
    [serial_number] NVARCHAR(1000),
    [purchase_date] DATETIME2,
    [purchase_price] INT,
    [vendor_name] NVARCHAR(1000),
    [warranty_expiry] DATETIME2,
    [amc_expiry] DATETIME2,
    [branch_id] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [assets_status_df] DEFAULT 'available',
    [condition] NVARCHAR(1000) NOT NULL CONSTRAINT [assets_condition_df] DEFAULT 'good',
    [photo_url] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [assets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [assets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[asset_allocations] (
    [id] NVARCHAR(1000) NOT NULL,
    [asset_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [allocated_date] DATETIME2 NOT NULL,
    [condition_at_alloc] NVARCHAR(1000),
    [allocation_letter_url] NVARCHAR(1000),
    [returned_at] DATETIME2,
    [condition_at_return] NVARCHAR(1000),
    [damage_notes] NVARCHAR(1000),
    [deduct_from_fnf] BIT NOT NULL CONSTRAINT [asset_allocations_deduct_from_fnf_df] DEFAULT 0,
    [deduction_amount] INT,
    [allocated_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [asset_allocations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [asset_allocations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[expense_claims] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [claim_date] DATETIME2 NOT NULL CONSTRAINT [expense_claims_claim_date_df] DEFAULT CURRENT_TIMESTAMP,
    [total_amount] INT NOT NULL,
    [approved_amount] INT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [expense_claims_status_df] DEFAULT 'pending',
    [approved_by] NVARCHAR(1000),
    [approved_at] DATETIME2,
    [reimburse_in_payroll] BIT NOT NULL CONSTRAINT [expense_claims_reimburse_in_payroll_df] DEFAULT 1,
    [payslip_id] NVARCHAR(1000),
    [reimbursed_at] DATETIME2,
    [notes] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [expense_claims_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [expense_claims_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[expense_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [claim_id] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [expense_date] DATETIME2 NOT NULL,
    [amount] INT NOT NULL,
    [approved_amount] INT,
    [receipt_url] NVARCHAR(1000),
    [is_approved] BIT,
    [rejection_reason] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [expense_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [expense_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[expense_policies] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [max_amount] INT,
    [receipt_required_above] INT,
    [applicable_grades] NVARCHAR(1000) NOT NULL CONSTRAINT [expense_policies_applicable_grades_df] DEFAULT '[]',
    [is_active] BIT NOT NULL CONSTRAINT [expense_policies_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [expense_policies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [expense_policies_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[announcements] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [body] NVARCHAR(1000) NOT NULL,
    [attachment_url] NVARCHAR(1000),
    [audience_type] NVARCHAR(1000) NOT NULL CONSTRAINT [announcements_audience_type_df] DEFAULT 'all',
    [audience_ids] NVARCHAR(1000) NOT NULL CONSTRAINT [announcements_audience_ids_df] DEFAULT '[]',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [announcements_priority_df] DEFAULT 'normal',
    [is_pinned] BIT NOT NULL CONSTRAINT [announcements_is_pinned_df] DEFAULT 0,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [announcements_type_df] DEFAULT 'manual',
    [expiry_date] DATETIME2,
    [notify_email] BIT NOT NULL CONSTRAINT [announcements_notify_email_df] DEFAULT 0,
    [notify_whatsapp] BIT NOT NULL CONSTRAINT [announcements_notify_whatsapp_df] DEFAULT 0,
    [notify_inapp] BIT NOT NULL CONSTRAINT [announcements_notify_inapp_df] DEFAULT 1,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [announcements_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [announcements_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[announcement_reads] (
    [id] NVARCHAR(1000) NOT NULL,
    [announcement_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [read_at] DATETIME2 NOT NULL CONSTRAINT [announcement_reads_read_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [announcement_reads_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [announcement_reads_announcement_id_user_id_key] UNIQUE NONCLUSTERED ([announcement_id],[user_id])
);

-- CreateTable
CREATE TABLE [dbo].[surveys] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [is_anonymous] BIT NOT NULL CONSTRAINT [surveys_is_anonymous_df] DEFAULT 0,
    [audience_type] NVARCHAR(1000) NOT NULL CONSTRAINT [surveys_audience_type_df] DEFAULT 'all',
    [audience_ids] NVARCHAR(1000) NOT NULL CONSTRAINT [surveys_audience_ids_df] DEFAULT '[]',
    [deadline] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [surveys_status_df] DEFAULT 'draft',
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [surveys_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [surveys_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[survey_questions] (
    [id] NVARCHAR(1000) NOT NULL,
    [survey_id] NVARCHAR(1000) NOT NULL,
    [question_text] NVARCHAR(1000) NOT NULL,
    [question_type] NVARCHAR(1000) NOT NULL CONSTRAINT [survey_questions_question_type_df] DEFAULT 'text',
    [options] NVARCHAR(1000),
    [is_required] BIT NOT NULL CONSTRAINT [survey_questions_is_required_df] DEFAULT 1,
    [sort_order] INT NOT NULL CONSTRAINT [survey_questions_sort_order_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [survey_questions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [survey_questions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[survey_responses] (
    [id] NVARCHAR(1000) NOT NULL,
    [survey_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000),
    [answers] NVARCHAR(1000) NOT NULL,
    [submitted_at] DATETIME2 NOT NULL CONSTRAINT [survey_responses_submitted_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [survey_responses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[automation_tasks] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [task_type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [automation_tasks_status_df] DEFAULT 'running',
    [started_at] DATETIME2 NOT NULL CONSTRAINT [automation_tasks_started_at_df] DEFAULT CURRENT_TIMESTAMP,
    [completed_at] DATETIME2,
    [triggered_by] NVARCHAR(1000),
    [input_data] NVARCHAR(1000),
    [result_data] NVARCHAR(1000),
    [error_message] NVARCHAR(1000),
    [captcha_image] NVARCHAR(1000),
    [retry_count] INT NOT NULL CONSTRAINT [automation_tasks_retry_count_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [automation_tasks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [automation_tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[automation_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [task_id] NVARCHAR(1000) NOT NULL,
    [step_number] INT NOT NULL,
    [step_description] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [automation_logs_status_df] DEFAULT 'success',
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [automation_logs_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [error] NVARCHAR(1000),
    CONSTRAINT [automation_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[automation_screenshots] (
    [id] NVARCHAR(1000) NOT NULL,
    [task_id] NVARCHAR(1000) NOT NULL,
    [screenshot_url] NVARCHAR(1000) NOT NULL,
    [captured_at] DATETIME2 NOT NULL CONSTRAINT [automation_screenshots_captured_at_df] DEFAULT CURRENT_TIMESTAMP,
    [purpose] NVARCHAR(1000) NOT NULL CONSTRAINT [automation_screenshots_purpose_df] DEFAULT 'progress',
    CONSTRAINT [automation_screenshots_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[automation_credentials] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [portal] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password_encrypted] NVARCHAR(1000) NOT NULL,
    [iv] NVARCHAR(1000) NOT NULL,
    [additional_data] NVARCHAR(1000),
    [last_verified_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [automation_credentials_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [automation_credentials_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [automation_credentials_company_id_portal_key] UNIQUE NONCLUSTERED ([company_id],[portal])
);

-- CreateTable
CREATE TABLE [dbo].[automation_schedules] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [task_type] NVARCHAR(1000) NOT NULL,
    [frequency] NVARCHAR(1000) NOT NULL CONSTRAINT [automation_schedules_frequency_df] DEFAULT 'manual',
    [run_on_day] INT,
    [is_active] BIT NOT NULL CONSTRAINT [automation_schedules_is_active_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [automation_schedules_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [automation_schedules_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[portal_urls] (
    [id] NVARCHAR(1000) NOT NULL,
    [portal] NVARCHAR(1000) NOT NULL,
    [state] NVARCHAR(1000),
    [url] NVARCHAR(1000) NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [portal_urls_is_active_df] DEFAULT 1,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [portal_urls_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [portal_urls_portal_state_key] UNIQUE NONCLUSTERED ([portal],[state])
);

-- CreateTable
CREATE TABLE [dbo].[notification_config] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [email_provider] NVARCHAR(1000) NOT NULL CONSTRAINT [notification_config_email_provider_df] DEFAULT 'smtp',
    [email_host] NVARCHAR(1000),
    [email_port] INT,
    [email_user] NVARCHAR(1000),
    [email_pass_enc] NVARCHAR(1000),
    [email_ssl] BIT NOT NULL CONSTRAINT [notification_config_email_ssl_df] DEFAULT 0,
    [sms_provider] NVARCHAR(1000) NOT NULL CONSTRAINT [notification_config_sms_provider_df] DEFAULT 'none',
    [sms_api_key_enc] NVARCHAR(1000),
    [sms_sender_id] NVARCHAR(1000),
    [wa_provider] NVARCHAR(1000) NOT NULL CONSTRAINT [notification_config_wa_provider_df] DEFAULT 'none',
    [wa_api_key_enc] NVARCHAR(1000),
    [wa_phone_id] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [notification_config_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [notification_config_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [notification_config_company_id_key] UNIQUE NONCLUSTERED ([company_id])
);

-- CreateTable
CREATE TABLE [dbo].[accounting_integrations] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [software] NVARCHAR(1000) NOT NULL CONSTRAINT [accounting_integrations_software_df] DEFAULT 'generic',
    [account_mappings] NVARCHAR(1000) NOT NULL CONSTRAINT [accounting_integrations_account_mappings_df] DEFAULT '{}',
    [auto_export] BIT NOT NULL CONSTRAINT [accounting_integrations_auto_export_df] DEFAULT 0,
    [export_day] INT,
    [credentials_enc] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [accounting_integrations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [accounting_integrations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounting_integrations_company_id_key] UNIQUE NONCLUSTERED ([company_id])
);

-- CreateTable
CREATE TABLE [dbo].[sync_conflict_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [table_name] NVARCHAR(1000) NOT NULL,
    [record_id] NVARCHAR(1000) NOT NULL,
    [primary_value] NVARCHAR(1000) NOT NULL,
    [secondary_value] NVARCHAR(1000) NOT NULL,
    [resolved_at] DATETIME2 NOT NULL CONSTRAINT [sync_conflict_logs_resolved_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sync_conflict_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [sync_conflict_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[system_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [event_type] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [metadata] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [system_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [system_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[temp_exports] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [file_url] NVARCHAR(1000) NOT NULL,
    [file_name] NVARCHAR(1000) NOT NULL,
    [format] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [temp_exports_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [temp_exports_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000),
    [user_id] NVARCHAR(1000),
    [module] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [record_id] NVARCHAR(1000),
    [record_type] NVARCHAR(1000),
    [old_values] NVARCHAR(1000),
    [new_values] NVARCHAR(1000),
    [ip_address] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tenant_branding] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [logo_url] NVARCHAR(1000),
    [primary_color] NVARCHAR(1000) NOT NULL CONSTRAINT [tenant_branding_primary_color_df] DEFAULT '#1E40AF',
    [secondary_color] NVARCHAR(1000) NOT NULL CONSTRAINT [tenant_branding_secondary_color_df] DEFAULT '#7C3AED',
    [login_bg_url] NVARCHAR(1000),
    [login_welcome_msg] NVARCHAR(1000),
    [app_title] NVARCHAR(1000),
    [favicon_url] NVARCHAR(1000),
    [footer_text] NVARCHAR(1000),
    [email_header_logo] NVARCHAR(1000),
    [show_powered_by] BIT NOT NULL CONSTRAINT [tenant_branding_show_powered_by_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [tenant_branding_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [tenant_branding_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tenant_branding_company_id_key] UNIQUE NONCLUSTERED ([company_id])
);

-- CreateTable
CREATE TABLE [dbo].[tenant_db_config] (
    [id] NVARCHAR(1000) NOT NULL,
    [company_id] NVARCHAR(1000) NOT NULL,
    [db_mode] NVARCHAR(1000) NOT NULL CONSTRAINT [tenant_db_config_db_mode_df] DEFAULT 'cloud',
    [local_db_type] NVARCHAR(1000),
    [local_db_host] NVARCHAR(1000),
    [local_db_port] INT,
    [local_db_name] NVARCHAR(1000),
    [local_db_user] NVARCHAR(1000),
    [local_db_pass] NVARCHAR(1000),
    [cloud_db_url] NVARCHAR(1000),
    [sync_interval_min] INT NOT NULL CONSTRAINT [tenant_db_config_sync_interval_min_df] DEFAULT 5,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [tenant_db_config_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [tenant_db_config_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tenant_db_config_company_id_key] UNIQUE NONCLUSTERED ([company_id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
