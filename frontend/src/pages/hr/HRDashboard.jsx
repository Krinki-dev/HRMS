import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../../components/hr/HRLayout.css";

const RECENT_EMP = [
  { id: 1, name: "Aarav Singh",    dept: "Engineering",  joined: "Apr 14", status: "Active" },
  { id: 2, name: "Meera Nair",     dept: "Marketing",    joined: "Apr 10", status: "Active" },
  { id: 3, name: "Rohit Kapoor",   dept: "Finance",      joined: "Mar 30", status: "Active" },
  { id: 4, name: "Anjali Mehta",   dept: "HR",           joined: "Mar 25", status: "Active" },
];

const PENDING = [
  { name: "Ravi Kumar",  type: "Leave request",  date: "Apr 16", badge: "badge-pending" },
  { name: "Sneha Joshi", type: "Regularization", date: "Apr 15", badge: "badge-pending" },
  { name: "Karan Patel", type: "Expense claim",  date: "Apr 14", badge: "badge-pending" },
];

export default function HRDashboard() {
  const attRef = useRef(null);

  useEffect(() => {
    let chart;
    async function load() {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      if (!attRef.current) return;
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const gc = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      const tc = isDark ? "#94a3b8" : "#64748b";
      chart = new Chart(attRef.current, {
        type: "bar",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          datasets: [
            { label: "Present", data: [112, 108, 115, 110, 105, 42], backgroundColor: "#2563eb", borderRadius: 3 },
            { label: "Absent",  data: [8,   12,  5,   10,  15,  0],  backgroundColor: "#fee2e2", borderRadius: 3 },
            { label: "WFH",     data: [20,  20,  20,  20,  20,  0],  backgroundColor: "#dbeafe", borderRadius: 3 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 10 } } },
            y: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 10 } } },
          },
        },
      });
    }
    load();
    return () => chart?.destroy();
  }, []);

  return (
    <div>
      {}
      <div className="stats-grid-4">
        <div className="stat-card">
          <div className="stat-label">Total employees</div>
          <div className="stat-value">140</div>
          <div className="stat-hint stat-up">+4 this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present today</div>
          <div className="stat-value">112</div>
          <div className="stat-hint">80% attendance rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">On leave today</div>
          <div className="stat-value">8</div>
          <div className="stat-hint stat-warn">3 pending approvals</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Payroll this month</div>
          <div className="stat-value">₹28.4L</div>
          <div className="stat-hint">Due Apr 28</div>
        </div>
      </div>

      <div className="stats-grid-2" style={{ marginBottom: 16 }}>
        {}
        <div className="card card-p">
          <div style={{ marginBottom: 10 }}>
            <div className="card-title">This week's attendance</div>
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#2563eb", display: "inline-block" }} />Present</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#fee2e2", display: "inline-block" }} />Absent</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#dbeafe", display: "inline-block" }} />WFH</span>
            </div>
          </div>
          <div style={{ position: "relative", height: 190 }}>
            <canvas ref={attRef} role="img" aria-label="Stacked bar chart: weekly attendance by Present, Absent, WFH" />
          </div>
        </div>

        {/* Pending actions */}
        <div>
          {/* Pending approvals */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div className="card-title">Pending approvals</div>
              <span className="badge badge-pending">{PENDING.length}</span>
            </div>
            <div style={{ padding: "6px 0" }}>
              {PENDING.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: i < PENDING.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#0f172a" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{p.type} · {p.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-sm" style={{ color: "#16a34a", borderColor: "#16a34a" }}>✓</button>
                    <button className="btn-sm" style={{ color: "#dc2626", borderColor: "#dc2626" }}>✗</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card card-p">
            <div className="card-title" style={{ marginBottom: 10 }}>Quick actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Link to="/employees/add" className="btn-primary" style={{ textAlign: "center", padding: "8px" }}>+ Add employee</Link>
              <Link to="/attendance/mark" className="btn-sm" style={{ textAlign: "center", padding: "8px", fontSize: 11 }}>Mark attendance</Link>
              <Link to="/payroll/run" className="btn-sm" style={{ textAlign: "center", padding: "8px", fontSize: 11 }}>Run payroll</Link>
              <Link to="/leaves/requests" className="btn-sm" style={{ textAlign: "center", padding: "8px", fontSize: 11 }}>Leave requests</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent employees */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recently joined employees</div>
          <Link to="/employees" className="btn-sm">View all →</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Department</th><th>Joined</th><th>Status</th></tr>
          </thead>
          <tbody>
            {RECENT_EMP.map(e => (
              <tr key={e.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="emp-avatar">{e.name.split(" ").map(n => n[0]).join("")}</div>
                    <span style={{ fontWeight: 500, color: "#0f172a" }}>{e.name}</span>
                  </div>
                </td>
                <td>{e.dept}</td>
                <td>{e.joined}</td>
                <td><span className="badge badge-active">{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
