
import React from "react";
import {Link} from "react-router-dom";
import {useAuthStore} from "../../store/authStore";
import {useQuery} from "@tanstack/react-query";
import api from "../../services/api";

export default function HRDashboard(){
 const {user}=useAuthStore();
 const hr=useQuery({queryKey:["hr-stats"],queryFn:()=>api.get("/hr/stats").then(r=>r.data),retry:false});
 const stats=hr.data||{};
 const hour=new Date().getHours();
 const greet=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
 const cards=[
 {label:"Total Employees",value:stats.totalEmployees??0,icon:"👥",color:"blue",link:"/employees"},
 {label:"Present Today",value:stats.presentToday??0,icon:"✅",color:"green",link:"/attendance"},
 {label:"On Leave",value:stats.onLeave??0,icon:"🏖️",color:"yellow",link:"/leave"},
 {label:"Pending Approvals",value:stats.pendingLeaves??0,icon:"⏳",color:"red",link:"/leave"},
 {label:"This Month Payroll",value:stats.payrollMonth?"₹"+Number(stats.payrollMonth).toLocaleString("en-IN"):"₹0",icon:"💰",color:"purple",link:"/payroll"},
 ];
 return(
 <div>
 <div className="page-header">
 <h1>{greet}, {user?.name?.split(" ")[0]||"Admin"} 👋</h1>
 <p>Here is what is happening at your company today.</p>
 <div className="page-actions">
 <Link to="/employees/add" className="btn btn-primary">➕ Add Employee</Link>
 <Link to="/leave" className="btn btn-ghost">✔️ Approve Leaves</Link>
 <Link to="/payroll" className="btn btn-ghost">💳 Run Payroll</Link>
 <Link to="/attendance" className="btn btn-ghost">📋 Attendance</Link>
 </div>
 </div>
 <div className="stats-row">
 {cards.map(c=>(
 <Link to={c.link} key={c.label} className="stat-card" style={{textDecoration:"none"}}>
 <div className={`stat-icon ${c.color}`}>{c.icon}</div>
 <div className="stat-info">
 <div className="label">{c.label}</div>
 <div className="value">{c.value}</div>
 </div>
 </Link>
 ))}
 </div>
 {hr.isError&&<div className="card"><div className="empty-state"><div className="icon">🔗</div><h3>Backend not connected</h3><p>Start the backend server to see live data. The UI is fully functional.</p></div></div>}
 <div className="grid-2">
 <div className="card">
 <div className="card-header"><span className="card-title">🎂 Upcoming Birthdays</span></div>
 {(!stats.birthdays||stats.birthdays.length===0)?(<div className="empty-state" style={{padding:"20px"}}><p>No birthdays this week</p></div>):stats.birthdays.map(b=>(<div key={b._id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div className="avatar">{b.name[0]}</div><div><div style={{fontSize:14,fontWeight:500}}>{b.name}</div><div style={{fontSize:12,color:"var(--text-secondary)"}}>{b.department}</div></div></div>))}
 </div>
 <div className="card">
 <div className="card-header"><span className="card-title">📊 Quick Actions</span></div>
 <div style={{display:"flex",flexDirection:"column",gap:8}}>
 <Link to="/employees/add" className="btn btn-outline">➕ Add New Employee</Link>
 <Link to="/leave" className="btn btn-outline">🗒️ Manage Leave Requests</Link>
 <Link to="/payroll" className="btn btn-outline">💸 Process Payroll</Link>
 <Link to="/settings" className="btn btn-outline">⚙️ Company Settings</Link>
 </div>
 </div>
 </div>
 </div>
 );
}
