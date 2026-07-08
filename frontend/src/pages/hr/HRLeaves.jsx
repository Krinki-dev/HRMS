
import React,{useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import api from "../../services/api";

export default function HRLeaves(){
 const qc=useQueryClient();
 const [tab,setTab]=useState("pending");
 const leaves=useQuery({queryKey:["leaves"],queryFn:()=>api.get("/hr/leaves").then(r=>r.data),retry:false});
 const all=leaves.data||[];
 const filtered=tab==="all"?all:all.filter(l=>l.status===tab);
 const approve=useMutation({mutationFn:id=>api.patch(`/hr/leaves/${id}/approve`),onSuccess:()=>qc.invalidateQueries(["leaves"])});
 const reject=useMutation({mutationFn:id=>api.patch(`/hr/leaves/${id}/reject`),onSuccess:()=>qc.invalidateQueries(["leaves"])});
 const statusBadge=s=>s==="approved"?"badge-green":s==="rejected"?"badge-red":"badge-yellow";
 return(
 <div>
 <div className="page-header"><h1>🏖️ Leave Management</h1><p>Review and approve employee leave requests</p></div>
 <div className="stats-row">
 {[{label:"Total Requests",value:all.length,icon:"🗒️",color:"blue"},{label:"Pending",value:all.filter(l=>l.status==="pending").length,icon:"⏳",color:"yellow"},{label:"Approved",value:all.filter(l=>l.status==="approved").length,icon:"✅",color:"green"},{label:"Rejected",value:all.filter(l=>l.status==="rejected").length,icon:"❌",color:"red"}].map(c=>(
 <div key={c.label} className="stat-card"><div className={`stat-icon ${c.color}`}>{c.icon}</div><div className="stat-info"><div className="label">{c.label}</div><div className="value">{c.value}</div></div></div>
 ))}
 </div>
 <div className="card">
 <div className="tabs">
 {["pending","approved","rejected","all"].map(t=>(
 <button key={t} className={`tab-btn${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
 ))}
 </div>
 {leaves.isLoading&&<p style={{textAlign:"center",color:"var(--text-secondary)"}}>Loading...</p>}
 {leaves.isError&&<div className="empty-state"><div className="icon">🔗</div><h3>Backend not connected</h3><p>Connect backend to manage leaves.</p></div>}
 {!leaves.isLoading&&!leaves.isError&&(filtered.length===0?(
 <div className="empty-state"><div className="icon">🏖️</div><h3>No {tab} leave requests</h3><p>All clear!</p></div>
 ):(
 <div className="table-wrap">
 <table>
 <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
 <tbody>
 {filtered.map(l=>(
 <tr key={l._id}>
 <td><div style={{fontWeight:500}}>{l.employee?.name||l.employeeName||"Employee"}</div><div style={{fontSize:12,color:"var(--text-secondary)"}}>{l.employee?.department||""}</div></td>
 <td>{l.leaveType||l.type||"Annual"}</td>
 <td>{l.startDate?new Date(l.startDate).toLocaleDateString("en-IN"):"-"}</td>
 <td>{l.endDate?new Date(l.endDate).toLocaleDateString("en-IN"):"-"}</td>
 <td>{l.days||1}</td>
 <td style={{maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.reason||""}</td>
 <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
 <td><div style={{display:"flex",gap:4"}}>{l.status==="pending"&&<><button className="btn btn-sm btn-success" onClick={()=>approve.mutate(l._id)}>✔</button><button className="btn btn-sm btn-danger" onClick={()=>reject.mutate(l._id)}>✖</button></>}</div></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ))}
 </div>
 </div>
 );
}
