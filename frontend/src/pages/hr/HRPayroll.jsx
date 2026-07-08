
import React,{useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import api from "../../services/api";

export default function HRPayroll(){
 const qc=useQueryClient();
 const now=new Date();
 const [month,setMonth]=useState(now.getMonth()+1);
 const [year,setYear]=useState(now.getFullYear());
 const payroll=useQuery({queryKey:["payroll",month,year],queryFn:()=>api.get(`/hr/payroll?month=${month}&year=${year}`).then(r=>r.data),retry:false});
 const records=payroll.data||[];
 const run=useMutation({mutationFn:()=>api.post("/hr/payroll/run",{month,year}),onSuccess:()=>qc.invalidateQueries(["payroll"])});
 const totalNet=records.reduce((s,r)=>s+(r.netSalary||0),0);
 const paid=records.filter(r=>r.status==="paid").length;
 const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 return(
 <div>
 <div className="page-header">
 <h1>💰 Payroll</h1>
 <p>Manage monthly payroll for all employees</p>
 <div className="page-actions">
 <select className="form-control" style={{width:"auto"}} value={month} onChange={e=>setMonth(+e.target.value)}>{months.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
 <select className="form-control" style={{width:"auto"}} value={year} onChange={e=>setYear(+e.target.value)}>{[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
 <button className="btn btn-primary" onClick={()=>run.mutate()} disabled={run.isPending}>{run.isPending?"Processing...":"🚀 Run Payroll"}</button>
 </div>
 </div>
 <div className="stats-row">
 <div className="stat-card"><div className="stat-icon blue">👥</div><div className="stat-info"><div className="label">Total Employees</div><div className="value">{records.length}</div></div></div>
 <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><div className="label">Paid</div><div className="value">{paid}</div></div></div>
 <div className="stat-card"><div className="stat-icon yellow">⏳</div><div className="stat-info"><div className="label">Pending</div><div className="value">{records.length-paid}</div></div></div>
 <div className="stat-card"><div className="stat-icon purple">💸</div><div className="stat-info"><div className="label">Total Net Payroll</div><div className="value">₹{totalNet.toLocaleString("en-IN")}</div></div></div>
 </div>
 {payroll.isError&&<div className="card"><div className="empty-state"><div className="icon">🔗</div><h3>Backend not connected</h3><p>Connect backend to process payroll.</p></div></div>}
 {!payroll.isLoading&&!payroll.isError&&(records.length===0?(
 <div className="card"><div className="empty-state"><div className="icon">💰</div><h3>No payroll records for {months[month-1]} {year}</h3><p>Click Run Payroll to generate this month payroll.</p><button className="btn btn-primary" onClick={()=>run.mutate()}>🚀 Run Payroll</button></div></div>
 ):(
 <div className="card" style={{padding:0}}>
 <div className="table-wrap">
 <table>
 <thead><tr><th>Employee</th><th>Department</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th></tr></thead>
 <tbody>
 {records.map(r=>(
 <tr key={r._id}>
 <td><div style={{fontWeight:500}}>{r.employee?.name||r.employeeName}</div></td>
 <td>{r.employee?.department||""}</td>
 <td>₹{(r.basicSalary||0).toLocaleString("en-IN")}</td>
 <td style={{color:"var(--success)"}}>₹{(r.totalAllowances||0).toLocaleString("en-IN")}</td>
 <td style={{color:"var(--danger)"}}>₹{(r.totalDeductions||0).toLocaleString("en-IN")}</td>
 <td style={{fontWeight:700}}>₹{(r.netSalary||0).toLocaleString("en-IN")}</td>
 <td><span className={`badge ${r.status==="paid"?"badge-green":"badge-yellow"}`}>{r.status||"pending"}</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ))}
 </div>
 );
}
