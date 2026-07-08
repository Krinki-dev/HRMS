
import React,{useState} from "react";
import {useQuery} from "@tanstack/react-query";
import api from "../../services/api";

export default function HRAttendance(){
 const today=new Date().toISOString().split("T")[0];
 const [date,setDate]=useState(today);
 const att=useQuery({queryKey:["attendance",date],queryFn:()=>api.get(`/hr/attendance?date=${date}`).then(r=>r.data),retry:false});
 const records=att.data||[];
 const present=records.filter(r=>r.status==="present").length;
 const absent=records.filter(r=>r.status==="absent").length;
 const late=records.filter(r=>r.status==="late").length;
 return(
 <div>
 <div className="page-header">
 <h1>📋 Attendance</h1>
 <p>Track daily employee attendance</p>
 <div className="page-actions">
 <input type="date" className="form-control" style={{width:"auto"}} value={date} onChange={e=>setDate(e.target.value)} max={today}/>
 </div>
 </div>
 <div className="stats-row">
 <div className="stat-card"><div className="stat-icon blue">👥</div><div className="stat-info"><div className="label">Total</div><div className="value">{records.length}</div></div></div>
 <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><div className="label">Present</div><div className="value">{present}</div></div></div>
 <div className="stat-card"><div className="stat-icon red">❌</div><div className="stat-info"><div className="label">Absent</div><div className="value">{absent}</div></div></div>
 <div className="stat-card"><div className="stat-icon yellow">⏰</div><div className="stat-info"><div className="label">Late</div><div className="value">{late}</div></div></div>
 </div>
 {att.isError&&<div className="card"><div className="empty-state"><div className="icon">🔗</div><h3>Backend not connected</h3><p>Connect backend to track attendance.</p></div></div>}
 {!att.isLoading&&!att.isError&&(records.length===0?(
 <div className="card"><div className="empty-state"><div className="icon">📋</div><h3>No attendance records for {date}</h3><p>Attendance records will appear here once employees are marked.</p></div></div>
 ):(
 <div className="card" style={{padding:0}}>
 <div className="table-wrap">
 <table>
 <thead><tr><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
 <tbody>
 {records.map(r=>(
 <tr key={r._id}>
 <td><div style={{display:"flex",alignItems:"center",gap:8}}><div className="avatar">{(r.employee?.name||"E")[0]}</div><span style={{fontWeight:500}}>{r.employee?.name||"Employee"}</span></div></td>
 <td>{r.employee?.department||""}</td>
 <td>{r.checkIn||"--:--"}</td>
 <td>{r.checkOut||"--:--"}</td>
 <td>{r.totalHours||"0"}</td>
 <td><span className={`badge ${r.status==="present"?"badge-green":r.status==="late"?"badge-yellow":"badge-red"}`}>{r.status}</span></td>
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
