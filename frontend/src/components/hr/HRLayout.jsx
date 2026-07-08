
import React,{useState} from "react";
import {Outlet,NavLink,useNavigate} from "react-router-dom";
import {useAuthStore} from "../../store/authStore";
import "../../styles/hr-layout.css";

const NAV=[
 {to:"/dashboard",icon:"🏠",label:"Dashboard",section:"MAIN"},
 {to:"/employees",icon:"👥",label:"Employees",section:"MAIN"},
 {to:"/attendance",icon:"📋",label:"Attendance",section:"MAIN"},
 {to:"/leave",icon:"🏖️",label:"Leave",section:"MAIN"},
 {to:"/payroll",icon:"💰",label:"Payroll",section:"MAIN"},
 {to:"/recruitment",icon:"🔍",label:"Recruitment",section:"MAIN"},
 {to:"/performance",icon:"📈",label:"Performance",section:"HR"},
 {to:"/training",icon:"🎓",label:"Training",section:"HR"},
 {to:"/documents",icon:"📄",label:"Documents",section:"HR"},
 {to:"/announcements",icon:"📢",label:"Announcements",section:"HR"},
 {to:"/settings",icon:"⚙️",label:"Settings",section:"ADMIN"},
];

export default function HRLayout(){
 const [collapsed,setCollapsed]=useState(false);
 const {user,logout}=useAuthStore();
 const navigate=useNavigate();
 const initials=(user?.name||"U").split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2);
 const sections=[...new Set(NAV.map(n=>n.section))];
 const handleLogout=()=>{logout();navigate("/login");};
 return(
 <div className={`hr-shell${collapsed?" collapsed":""}`}>
 <aside className="hr-sidebar">
 <div className="hr-sidebar-logo">
 <div style={{width:36,height:36,borderRadius:8,background:"#4f46e5",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,flexShrink:0}}>H</div>
 <span>HRMS</span>
 </div>
 <nav className="hr-nav">
 {sections.map(sec=>(
 <div key={sec}>
 <div className="hr-nav-section">{sec}</div>
 {NAV.filter(n=>n.section===sec).map(n=>(
 <NavLink key={n.to} to={n.to} className={({isActive})=>`hr-nav-item${isActive?" active":""}`}>
 <span className="nav-icon">{n.icon}</span>
 <span className="nav-label">{n.label}</span>
 </NavLink>
 ))}
 </div>
 ))}
 </nav>
 <div style={{padding:"12px 8px",borderTop:"1px solid var(--border)"}}>
 <button onClick={handleLogout} className="hr-nav-item" style={{width:"100%",border:"none",background:"none",cursor:"pointer"}}>
 <span className="nav-icon">🚪</span>
 <span className="nav-label">Logout</span>
 </button>
 </div>
 </aside>
 <div className="hr-main">
 <header className="hr-topbar">
 <button className="hr-topbar-toggle" onClick={()=>setCollapsed(c=>!c)}>☰</button>
 <span className="hr-topbar-title">{user?.company?.name||"Company HR"}</span>
 <div className="hr-topbar-actions">
 <div className="hr-topbar-avatar" title={user?.name}>{initials}</div>
 </div>
 </header>
 <main className="hr-content">
 <Outlet/>
 </main>
 </div>
 </div>
 );
}
