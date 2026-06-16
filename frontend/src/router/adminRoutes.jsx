import AdminLayout        from "../components/admin/AdminLayout";
import AdminDashboard     from "../pages/admin/AdminDashboard";
import AdminClients       from "../pages/admin/AdminClients";
import AdminClientDetail  from "../pages/admin/AdminClientDetail";
import CompanyRegisterPage from "../pages/auth/CompanyRegisterPage";
import AdminPlans         from "../pages/admin/AdminPlans";
import AdminDomains       from "../pages/admin/AdminDomains";
import AdminAnalytics     from "../pages/admin/AdminAnalytics";
import AdminMarketing     from "../pages/admin/AdminMarketing";
import AdminSettings      from "../pages/admin/AdminSettings";

export const adminRoutes = {
  path: "/admin",
  element: <AdminLayout />,
  children: [
    { index: true,               element: <AdminDashboard /> },   
    { path: "dashboard",         element: <AdminDashboard /> },   
    { path: "clients",           element: <AdminClients />   },   
    { path: "clients/new",       element: <CompanyRegisterPage /> },
    { path: "clients/:id",       element: <AdminClientDetail /> },
    { path: "plans",             element: <AdminPlans />     },   
    { path: "domains",           element: <AdminDomains />   },   
    { path: "analytics",         element: <AdminAnalytics /> },   
    { path: "marketing",         element: <AdminMarketing /> },   
    { path: "settings",          element: <AdminSettings />  },   
  ],
};

