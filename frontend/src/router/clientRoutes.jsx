
import React from "react";
import {Route} from "react-router-dom";
import HRLayout from "../components/hr/HRLayout";
import HRDashboard from "../pages/hr/HRDashboard";
import HREmployees from "../pages/hr/HREmployees";
import HRAttendance from "../pages/hr/HRAttendance";
import HRLeaves from "../pages/hr/HRLeaves";
import HRPayroll from "../pages/hr/HRPayroll";
import HRSettings from "../pages/hr/HRSettings";

const Placeholder=({title})=>(<div style={{padding:32}}><h2 style={{color:"var(--text-primary)"}}>{title}</h2><p style={{color:"var(--text-secondary)"}}>Coming soon...</p></div>);

export const clientRoutes=(
 <Route element={<HRLayout/>}>
 <Route path="/dashboard" element={<HRDashboard/>}/>
 <Route path="/employees" element={<HREmployees/>}/>
 <Route path="/employees/add" element={<HREmployees/>}/>
 <Route path="/attendance" element={<HRAttendance/>}/>
 <Route path="/leave" element={<HRLeaves/>}/>
 <Route path="/payroll" element={<HRPayroll/>}/>
 <Route path="/recruitment" element={<Placeholder title="Recruitment"/>}/>
 <Route path="/performance" element={<Placeholder title="Performance"/>}/>
 <Route path="/training" element={<Placeholder title="Training"/>}/>
 <Route path="/documents" element={<Placeholder title="Documents"/>}/>
 <Route path="/announcements" element={<Placeholder title="Announcements"/>}/>
 <Route path="/settings" element={<HRSettings/>}/>
 <Route path="/settings/*" element={<HRSettings/>}/>
 </Route>
);

export default clientRoutes;
