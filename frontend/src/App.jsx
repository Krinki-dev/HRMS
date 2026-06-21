﻿import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import PricingManager from './pages/admin/PricingManager';

const hostname = window.location.hostname;
export const IS_PLATFORM_ROOT = (
  hostname === 'syntern.in'     ||
  hostname === 'www.syntern.in' ||
  hostname === 'localhost'      ||
  hostname === '127.0.0.1'      ||
  hostname === 'app.localhost'  ||
  hostname === 'app.syntern.in'
);
export const IS_TENANT_SUBDOMAIN = !IS_PLATFORM_ROOT && (
  hostname.endsWith('.syntern.in') ||
  hostname.endsWith('.localhost')
);
export const TENANT_SUBDOMAIN = IS_TENANT_SUBDOMAIN ? hostname.split('.')[0] : null;

import AdminLayout       from './components/admin/AdminLayout';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminClients      from './pages/admin/AdminClients';
import AdminClientDetail from './pages/admin/AdminClientDetail';
import AdminPlans        from './pages/admin/AdminPlans';
import AdminDomains      from './pages/admin/AdminDomains';
import AdminAnalytics    from './pages/admin/AdminAnalytics';
import AdminMarketing    from './pages/admin/AdminMarketing';
import AdminSettings     from './pages/admin/AdminSettings';

import LandingPage         from './pages/landing/LandingPage';
import SmartLoginPage      from './pages/auth/SmartLoginPage';
import CompanyRegisterPage from './pages/auth/CompanyRegisterPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import ChangePasswordPage  from './pages/auth/ChangePasswordPage';

import OnboardingWizard from './pages/onboarding/OnboardingWizard';

import HRLayout     from './components/hr/HRLayout';
import HRDashboard  from './pages/hr/HRDashboard';
import HREmployees  from './pages/hr/HREmployees';
import HRAttendance from './pages/hr/HRAttendance';
import HRLeaves     from './pages/hr/HRLeaves';
import HRPayroll    from './pages/hr/HRPayroll';
import HRSettings   from './pages/hr/HRSettings';
import BillingPage  from './pages/billing/BillingPage';

import ESSLayout   from './pages/ess/ESSLayout';
import { ESSDashboard, ESSLeaveApply, ESSPayslips } from './pages/ess/ESSPages';

import MainLayout               from './components/layout/MainLayout';
import DashboardPage            from './pages/dashboard/DashboardPage';
import EmployeeListPage         from './pages/employees/EmployeeListPage';
import AddEmployeePage          from './pages/employees/AddEmployeePage';
import EditEmployeePage         from './pages/employees/EditEmployeePage';
import EmployeeImportPage       from './pages/employees/EmployeeImportPage';
import EmployeeProfilePage      from './pages/employees/EmployeeProfilePage';
import AttendanceDashboardPage  from './pages/attendance/AttendanceDashboardPage';
import ShiftAssignmentPage      from './pages/attendance/ShiftAssignmentPage';
import AttendanceCorrectionPage from './pages/attendance/AttendanceCorrectionPage';
import LeaveDashboardPage       from './pages/leave/LeaveDashboardPage';
import ApplyLeavePage           from './pages/leave/ApplyLeavePage';
import LeaveApprovalsPage       from './pages/leave/LeaveApprovalsPage';
import LeaveBalancePage         from './pages/leave/LeaveBalancePage';
import PayrollDashboard         from './pages/payroll/PayrollDashboard';
import PayrollRunPage           from './pages/payroll/PayrollRunPage';
import SalarySetupPage          from './pages/payroll/SalarySetupPage';
import PayrollReportsPage       from './pages/payroll/PayrollReportsPage';
import ComplianceDashboard      from './pages/compliance/ComplianceDashboard';
import PFPage                   from './pages/compliance/PFPage';
import ESIPage                  from './pages/compliance/ESIPage';
import TDSPage                  from './pages/compliance/TDSPage';
import { PTPage, LWFPage, ComplianceCalendarPage } from './pages/compliance/PTLWFCalendarPages';
import RecruitmentDashboard     from './pages/recruitment/RecruitmentDashboard';
import RequisitionsPage         from './pages/recruitment/RequisitionsPage';
import CandidatePipelinePage    from './pages/recruitment/CandidatePipelinePage';
import CandidateDetailPage      from './pages/recruitment/CandidateDetailPage';
import { JobOpeningsPage, InterviewsPage } from './pages/recruitment/JobsInterviewsPages';
import PerformancePage          from './pages/performance/PerformancePage';
import TrainingPage             from './pages/training/TrainingPage';
import AssetsPage               from './pages/assets/AssetsPage';
import ExpensesPage             from './pages/expenses/ExpensesPage';
import SettingsPage             from './pages/settings/SettingsPage';
import RolesPage                from './pages/settings/RolesPage';
import AuditLogPage             from './pages/settings/AuditLogPage';
import AutomationPage           from './pages/automation/AutomationPage';
import GstPublicPage            from './pages/gst-public/GstPublicPage';

function PlanBanner() {
  const { user } = useAuthStore();
  if (!user?.planExpiresAt) return null;

  const daysLeft = Math.ceil((new Date(user.planExpiresAt) - Date.now()) / 86400000);
  if (daysLeft > 14) return null;

  const isTrial = user.plan === 'trial';
  const expired = daysLeft <= 0;

  return (
    <div style={{
      padding: '8px 20px',
      background: expired ? '#fef2f2' : daysLeft <= 3 ? '#fff7ed' : '#fefce8',
      borderBottom: `1px solid ${expired ? '#fecaca' : daysLeft <= 3 ? '#fed7aa' : '#fef08a'}`,
      fontSize: 12,
      color: expired ? '#b91c1c' : '#92400e',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span>
        {expired
          ? `⚠ Your ${isTrial ? 'trial' : 'plan'} has expired. You are in read-only mode.`
          : `⏳ Your ${isTrial ? '14-day trial' : 'plan'} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`
        }
      </span>
      <a href="/billing" style={{ color: expired ? '#b91c1c' : '#b45309', fontWeight: 600, textDecoration: 'none' }}>
        {expired ? 'Reactivate →' : 'Upgrade now →'}
      </a>
    </div>
  );
}

function RequireAuth({ children }) {
  const { isLoggedIn } = useAuthStore();
    if (!isLoggedIn) { window.location.replace('/login'); return null; }
  return children;
}

function RequirePlatformAdmin({ children }) {
  const { isLoggedIn, user } = useAuthStore();
    if (!isLoggedIn) { window.location.replace('/login'); return null; }
  // Use is_platform_admin field, not role
    if (!user?.is_platform_admin) { window.location.replace('/login'); return null; }
  return children;
}

function RequirePlatformRoot({ children }) {
    if (!IS_PLATFORM_ROOT) { window.location.replace('/login'); return null; }
  return children;
}

function OnboardingRoute() {
  const navigate       = useNavigate();
  const { isLoggedIn, setSetupComplete } = useAuthStore();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <OnboardingWizard
      onComplete={() => {
        setSetupComplete();
        navigate('/dashboard', { replace: true });
      }}
    />
  );
}

function AppLayout() {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.isFirstLogin && !window.location.pathname.includes('change-password'))
    return <Navigate to="/change-password" replace />;
  // ← NEW: force onboarding if setup incomplete
  if (!user?.is_platform_admin && user?.isSetupComplete === false)
    return <Navigate to="/onboarding" replace />;
  return <MainLayout />;
}

function HRAppLayout() {
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (user?.isFirstLogin && !window.location.pathname.includes('change-password'))
    return <Navigate to="/change-password" replace />;

  // ← NEW: replace the old role-check block with this
  if (!user?.is_platform_admin && user?.isSetupComplete === false)
    return <Navigate to="/onboarding" replace />;

  return (
    <>
      <PlanBanner />
      <HRLayout />
    </>
  );
}

export default function App() {
  if (window.location.hostname === 'searchgst.syntern.in') {
    return <GstPublicPage />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>

        {}
        {IS_PLATFORM_ROOT && (
          <>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/register" element={<RequirePlatformRoot><CompanyRegisterPage /></RequirePlatformRoot>} />

            <Route path="/admin" element={<RequirePlatformAdmin><AdminLayout /></RequirePlatformAdmin>}>
              <Route index              element={<AdminDashboard />} />
              <Route path="dashboard"   element={<AdminDashboard />} />
              <Route path="clients"     element={<AdminClients />} />
              <Route path="clients/new" element={<CompanyRegisterPage />} />
              <Route path="clients/:id" element={<AdminClientDetail />} />
              <Route path="plans"       element={<AdminPlans />} />
              <Route path="pricing"     element={<PricingManager />} /> 
              <Route path="domains"     element={<AdminDomains />} />
              <Route path="analytics"   element={<AdminAnalytics />} />
              <Route path="marketing"   element={<AdminMarketing />} />
              <Route path="settings"    element={<AdminSettings />} />
            </Route>

            <Route path="/platform"   element={<Navigate to="/admin" replace />} />
            <Route path="/platform/*" element={<Navigate to="/admin" replace />} />
          </>
        )}

        {}
        <Route path="/login"           element={<SmartLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
        {!IS_PLATFORM_ROOT && <Route path="/register" element={<Navigate to="/login" replace />} />}

        {}
        {}
        <Route path="/onboarding" element={<OnboardingRoute />} />

        {}
        {IS_TENANT_SUBDOMAIN && (
          <>
            <Route element={<HRAppLayout />}>
              <Route path="/dashboard"          element={<HRDashboard />} />
              <Route path="/employees"          element={<HREmployees />} />
              <Route path="/employees/add"      element={<AddEmployeePage />} />
              <Route path="/employees/import"   element={<EmployeeImportPage />} />
              <Route path="/employees/:id"      element={<EmployeeProfilePage />} />
              <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
              <Route path="/attendance"         element={<HRAttendance />} />
              <Route path="/leaves"             element={<HRLeaves />} />
              <Route path="/payroll"            element={<HRPayroll />} />
              <Route path="/settings"           element={<HRSettings />} />
              <Route path="/billing"            element={<BillingPage />} />
              <Route path="/compliance"             element={<ComplianceDashboard />} />
              <Route path="/compliance/pf"          element={<PFPage />} />
              <Route path="/compliance/esi"         element={<ESIPage />} />
              <Route path="/compliance/tds"         element={<TDSPage />} />
              <Route path="/compliance/pt"          element={<PTPage />} />
              <Route path="/compliance/lwf"         element={<LWFPage />} />
              <Route path="/compliance/calendar"    element={<ComplianceCalendarPage />} />
              <Route path="/recruitment"            element={<RecruitmentDashboard />} />
              <Route path="/recruitment/pipeline"   element={<CandidatePipelinePage />} />
              <Route path="/performance"            element={<PerformancePage />} />
              <Route path="/automation"             element={<AutomationPage />} />
              <Route path="/settings/roles"         element={<RolesPage />} />
              <Route path="/settings/audit"         element={<AuditLogPage />} />
            </Route>

            <Route path="/ess" element={<RequireAuth><ESSLayout /></RequireAuth>}>
              <Route index              element={<ESSDashboard />} />
              <Route path="dashboard"   element={<ESSDashboard />} />
              <Route path="leave-apply" element={<ESSLeaveApply />} />
              <Route path="payslips"    element={<ESSPayslips />} />
            </Route>
          </>
        )}

        {}
        {IS_PLATFORM_ROOT && (
          <Route element={<AppLayout />}>
            <Route path="/dashboard"                  element={<DashboardPage />} />
            <Route path="/employees"                  element={<EmployeeListPage />} />
            <Route path="/employees/add"              element={<AddEmployeePage />} />
            <Route path="/employees/import"           element={<EmployeeImportPage />} />
            <Route path="/employees/:id"              element={<EmployeeProfilePage />} />
            <Route path="/employees/:id/edit"         element={<EditEmployeePage />} />
            <Route path="/attendance"                 element={<AttendanceDashboardPage />} />
            <Route path="/attendance/shifts"          element={<ShiftAssignmentPage />} />
            <Route path="/attendance/corrections"     element={<AttendanceCorrectionPage />} />
            <Route path="/leave"                      element={<LeaveDashboardPage />} />
            <Route path="/leave/apply"                element={<ApplyLeavePage />} />
            <Route path="/leave/approvals"            element={<LeaveApprovalsPage />} />
            <Route path="/leave/balance"              element={<LeaveBalancePage />} />
            <Route path="/payroll"                    element={<PayrollDashboard />} />
            <Route path="/payroll/run"                element={<PayrollRunPage />} />
            <Route path="/payroll/salary-setup"       element={<SalarySetupPage />} />
            <Route path="/payroll/reports"            element={<PayrollReportsPage />} />
            <Route path="/compliance"                 element={<ComplianceDashboard />} />
            <Route path="/compliance/pf"              element={<PFPage />} />
            <Route path="/compliance/esi"             element={<ESIPage />} />
            <Route path="/compliance/tds"             element={<TDSPage />} />
            <Route path="/compliance/pt"              element={<PTPage />} />
            <Route path="/compliance/lwf"             element={<LWFPage />} />
            <Route path="/compliance/calendar"        element={<ComplianceCalendarPage />} />
            <Route path="/recruitment"                element={<RecruitmentDashboard />} />
            <Route path="/recruitment/requisitions"   element={<RequisitionsPage />} />
            <Route path="/recruitment/pipeline"       element={<CandidatePipelinePage />} />
            <Route path="/recruitment/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/recruitment/jobs"           element={<JobOpeningsPage />} />
            <Route path="/recruitment/interviews"     element={<InterviewsPage />} />
            <Route path="/performance"                element={<PerformancePage />} />
            <Route path="/training"                   element={<TrainingPage />} />
            <Route path="/assets"                     element={<AssetsPage />} />
            <Route path="/expenses"                   element={<ExpensesPage />} />
            <Route path="/automation"                 element={<AutomationPage />} />
            <Route path="/settings"                   element={<SettingsPage />} />
            <Route path="/settings/roles"             element={<RolesPage />} />
            <Route path="/settings/audit"             element={<AuditLogPage />} />
            <Route path="/billing"                    element={<BillingPage />} />
          </Route>
        )}

        {}
        {!IS_PLATFORM_ROOT && <Route path="/" element={<Navigate to="/login" replace />} />}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
