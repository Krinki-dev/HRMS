import HRLayout       from "../components/hr/HRLayout";
import HRDashboard    from "../pages/hr/HRDashboard";
import HREmployees    from "../pages/hr/HREmployees";
import HRAttendance   from "../pages/hr/HRAttendance";
import HRLeaves       from "../pages/hr/HRLeaves";
import HRPayroll      from "../pages/hr/HRPayroll";
import HRSettings     from "../pages/hr/HRSettings";

import ESSLayout      from "../pages/ess/ESSLayout";
import { ESSDashboard, ESSLeaveApply, ESSPayslips } from "../pages/ess/ESSPages";

export const hrRoutes = {
  path: "/",
  element: <HRLayout />,
  children: [
    { index: true,                element: <HRDashboard />  },
    { path: "dashboard",          element: <HRDashboard />  },
    { path: "employees",          element: <HREmployees />  },
    { path: "employees/add",      element: <HREmployees />  }, 
    { path: "employees/:id",      element: <HREmployees />  }, 
    { path: "attendance",         element: <HRAttendance /> },
    { path: "attendance/mark",    element: <HRAttendance /> },
    { path: "attendance/reports", element: <HRAttendance /> },
    { path: "leaves",             element: <HRLeaves />     },
    { path: "leaves/requests",    element: <HRLeaves />     },
    { path: "leaves/policy",      element: <HRLeaves />     },
    { path: "payroll",            element: <HRPayroll />    },
    { path: "payroll/run",        element: <HRPayroll />    },
    { path: "payroll/payslips",   element: <HRPayroll />    },
    { path: "settings",           element: <HRSettings />   },
    { path: "settings/company",   element: <HRSettings />   },
    { path: "settings/gst",       element: <HRSettings />   },
  ],
};

export const essRoutes = {
  path: "/ess",
  element: <ESSLayout />,
  children: [
    { index: true,                element: <ESSDashboard />  },
    { path: "dashboard",          element: <ESSDashboard />  },
    { path: "leave-apply",        element: <ESSLeaveApply /> },
    { path: "payslips",           element: <ESSPayslips />   },
    
  ],
};

