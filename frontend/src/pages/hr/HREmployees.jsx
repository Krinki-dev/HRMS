
import React,{useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import api from "../../services/api";

export default function HREmployees(){
 const qc=useQueryClient();
 const [search,setSearch]=useState("");
 const [showAdd,setShowAdd]=useState(false);
 const [form,setForm]=useState({name:"",email:"",phone:"",department:"",designation:"",joiningDate:"",salary:""});
 const emp=useQuery({queryKey:["employees"],queryFn:()=>api.get("/hr/employees").then(r=>r.data),retry:false});
 const employees=emp.data||[];
 const filtered=employees.filter(e=>(e.name+e.email+e.department+e.designation).toLowerCase().includes(search.toLowerCase()));
 const add=useMutation({mutationFn:d=>api.post("/hr/employees",d),onSuccess:()=>{qc.invalidateQueries(["employees"]);setShowAdd(false);setForm({name:"",email:"",phone:"",department:"",designation:"",joiningDate:"",salary:""})}});
 const del=useMutation({mutationFn:id=>api.delete(`/hr/employees/${id}`),onSuccess:()=>qc.invalidateQueries(["employees"])});
 const fld=(k,v)=>setForm(f=>({...f,[k]:v}));
 return(
 <div>
 <div className="page-header">
 <h1>👥 Employees</h1>
 <p>Manage your company employees</p>
 <div className="page-actions">
 <div className="search-bar"><span>🔍</span><input placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
 <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>➕ Add Employee</button>
 </div>
 </div>
 {emp.isLoading&&<div className="card"><p style={{textAlign:"center",color:"var(--text-secondary)"}}>Loading...</p></div>}
 {emp.isError&&<div className="card"><div className="empty-state"><div className="icon">🔗</div><h3>Backend not connected</h3><p>Connect your backend to manage employees.</p></div></div>}
 {!emp.isLoading&&!emp.isError&&(
 filtered.length===0?(
 <div className="card"><div className="empty-state"><div className="icon">👥</div><h3>No employees yet</h3><p>Add your first employee to get started.</p><button className="btn btn-primary" onClick={()=>setShowAdd(true)}>➕ Add Employee</button></div></div>
 ):(
 <div className="card" style={{padding:0}}>
 <div className="table-wrap">
 <table>
 <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Joining Date</th><th>Status</th><th>Actions</th></tr></thead>
 <tbody>
 {filtered.map(e=>(
 <tr key={e._id}>
 <td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar">{e.name[0]}</div><div><div style={{fontWeight:500}}>{e.name}</div><div style={{fontSize:12,color:"var(--text-secondary)"}}>{e.email}</div></div></div></td>
 <td>{e.department}</td>
 <td>{e.designation}</td>
 <td>{e.joiningDate?new Date(e.joiningDate).toLocaleDateString("en-IN"):"-"}</td>
 <td><span className={`badge ${e.status==="active"?"badge-green":"badge-red"}`}>{e.status||"active"}</span></td>
 <td><button className="btn btn-sm btn-danger" onClick={()=>{if(confirm("Delete?"))del.mutate(e._id)}}>Delete</button></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )
 )}
 {showAdd&&(
 <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
 <div className="modal" onClick={e=>e.stopPropagation()}>
 <div className="modal-header"><span className="modal-title">➕ Add Employee</span><button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
 <div className="form-row"><div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.name} onChange={e=>fld("name",e.target.value)} placeholder="John Doe"/></div><div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e=>fld("email",e.target.value)} placeholder="john@company.com"/></div></div>
 <div className="form-row"><div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e=>fld("phone",e.target.value)}/></div><div className="form-group"><label className="form-label">Department</label><input className="form-control" value={form.department} onChange={e=>fld("department",e.target.value)} placeholder="Engineering"/></div></div>
 <div className="form-row"><div className="form-group"><label className="form-label">Designation</label><input className="form-control" value={form.designation} onChange={e=>fld("designation",e.target.value)} placeholder="Software Engineer"/></div><div className="form-group"><label className="form-label">Joining Date</label><input className="form-control" type="date" value={form.joiningDate} onChange={e=>fld("joiningDate",e.target.value)}/></div></div>
 <div className="form-group"><label className="form-label">Monthly Salary (₹)</label><input className="form-control" type="number" value={form.salary} onChange={e=>fld("salary",e.target.value)} placeholder="50000"/></div>
 <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
 <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
 <button className="btn btn-primary" onClick={()=>add.mutate(form)} disabled={add.isPending}>{add.isPending?"Saving...":"Add Employee"}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
