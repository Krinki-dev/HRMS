
import React,{useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import api from "../../services/api";
import {useAuthStore} from "../../store/authStore";

export default function HRSettings(){
 const {user}=useAuthStore();
 const qc=useQueryClient();
 const [tab,setTab]=useState("company");
 const [company,setCompany]=useState({name:user?.company?.name||"",email:user?.company?.email||"",phone:"",address:""});
 const [dept,setDept]=useState("");
 const [desig,setDesig]=useState("");
 const [holiday,setHoliday]=useState({name:"",date:"",type:"national"});
 const depts=useQuery({queryKey:["departments"],queryFn:()=>api.get("/hr/departments").then(r=>r.data),retry:false});
 const desigs=useQuery({queryKey:["designations"],queryFn:()=>api.get("/hr/designations").then(r=>r.data),retry:false});
 const holidays=useQuery({queryKey:["holidays"],queryFn:()=>api.get("/hr/holidays").then(r=>r.data),retry:false});
 const addDept=useMutation({mutationFn:()=>api.post("/hr/departments",{name:dept}),onSuccess:()=>{qc.invalidateQueries(["departments"]);setDept("")}});
 const addDesig=useMutation({mutationFn:()=>api.post("/hr/designations",{name:desig}),onSuccess:()=>{qc.invalidateQueries(["designations"]);setDesig("")}});
 const addHoliday=useMutation({mutationFn:()=>api.post("/hr/holidays",holiday),onSuccess:()=>{qc.invalidateQueries(["holidays"]);setHoliday({name:"",date:"",type:"national"})}});
 const TABS=[{k:"company",label:"Company Profile"},{k:"departments",label:"Departments"},{k:"designations",label:"Designations"},{k:"holidays",label:"Holidays"},{k:"shifts",label:"Shifts"}];
 return(
 <div>
 <div className="page-header"><h1>⚙️ Settings</h1><p>Configure your company HR settings</p></div>
 <div className="card">
 <div className="tabs">{TABS.map(t=><button key={t.k} className={`tab-btn${tab===t.k?" active":""}`} onClick={()=>setTab(t.k)}>{t.label}</button>)}</div>
 {tab==="company"&&(
 <div>
 <h3 style={{marginBottom:16,color:"var(--text-primary)"}}>Company Profile</h3>
 <div className="form-row">
 <div className="form-group"><label className="form-label">Company Name</label><input className="form-control" value={company.name} onChange={e=>setCompany(c=>({...c,name:e.target.value}))} placeholder="Acme Corp"/></div>
 <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={company.email} onChange={e=>setCompany(c=>({...c,email:e.target.value}))} placeholder="hr@company.com"/></div>
 </div>
 <div className="form-row">
 <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={company.phone} onChange={e=>setCompany(c=>({...c,phone:e.target.value}))}/></div>
 <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={company.address} onChange={e=>setCompany(c=>({...c,address:e.target.value}))}/></div>
 </div>
 <button className="btn btn-primary">💾 Save Changes</button>
 </div>
 )}
 {tab==="departments"&&(
 <div>
 <h3 style={{marginBottom:16,color:"var(--text-primary)"}}>Departments</h3>
 <div style={{display:"flex",gap:8,marginBottom:16}}><input className="form-control" value={dept} onChange={e=>setDept(e.target.value)} placeholder="Department name" style={{maxWidth:300}}/><button className="btn btn-primary" onClick={()=>dept&&addDept.mutate()} disabled={addDept.isPending}>➕ Add</button></div>
 {depts.isError?<p style={{color:"var(--text-secondary)"}}>Connect backend to manage departments.</p>:<div style={{display:"flex",flexWrap:"wrap",gap:8"}}>{(depts.data||[]).map(d=><span key={d._id} className="badge badge-blue" style={{fontSize:13,padding:"6px 12px"}}>{d.name}</span>)}</div>}
 </div>
 )}
 {tab==="designations"&&(
 <div>
 <h3 style={{marginBottom:16,color:"var(--text-primary)"}}>Designations</h3>
 <div style={{display:"flex",gap:8,marginBottom:16}}><input className="form-control" value={desig} onChange={e=>setDesig(e.target.value)} placeholder="Designation name" style={{maxWidth:300}}/><button className="btn btn-primary" onClick={()=>desig&&addDesig.mutate()} disabled={addDesig.isPending}>➕ Add</button></div>
 {desigs.isError?<p style={{color:"var(--text-secondary)"}}>Connect backend to manage designations.</p>:<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{(desigs.data||[]).map(d=><span key={d._id} className="badge badge-green" style={{fontSize:13,padding:"6px 12px"}}>{d.name}</span>)}</div>}
 </div>
 )}
 {tab==="holidays"&&(
 <div>
 <h3 style={{marginBottom:16,color:"var(--text-primary)"}}>Holidays</h3>
 <div className="form-row" style={{marginBottom:12}}>
 <div className="form-group"><label className="form-label">Holiday Name</label><input className="form-control" value={holiday.name} onChange={e=>setHoliday(h=>({...h,name:e.target.value}))} placeholder="Diwali"/></div>
 <div className="form-group"><label className="form-label">Date</label><input className="form-control" type="date" value={holiday.date} onChange={e=>setHoliday(h=>({...h,date:e.target.value}))}/></div>
 </div>
 <div style={{display:"flex",gap:8,marginBottom:16}}><select className="form-control" style={{maxWidth:200}} value={holiday.type} onChange={e=>setHoliday(h=>({...h,type:e.target.value}))}><option value="national">National</option><option value="regional">Regional</option><option value="optional">Optional</option></select><button className="btn btn-primary" onClick={()=>holiday.name&&holiday.date&&addHoliday.mutate()} disabled={addHoliday.isPending}>➕ Add Holiday</button></div>
 {holidays.isError?<p style={{color:"var(--text-secondary)"}}>Connect backend to manage holidays.</p>:(<div className="table-wrap"><table><thead><tr><th>Holiday</th><th>Date</th><th>Type</th></tr></thead><tbody>{(holidays.data||[]).map(h=><tr key={h._id}><td>{h.name}</td><td>{new Date(h.date).toLocaleDateString("en-IN")}</td><td><span className="badge badge-blue">{h.type}</span></td></tr>)}</tbody></table></div>)}
 </div>
 )}
 {tab==="shifts"&&(
 <div>
 <h3 style={{marginBottom:16,color:"var(--text-primary)"}}>Shifts</h3>
 <div className="empty-state"><div className="icon">⏰</div><h3>Shift Management</h3><p>Connect backend to configure work shifts.</p></div>
 </div>
 )}
 </div>
 </div>
 );
}
