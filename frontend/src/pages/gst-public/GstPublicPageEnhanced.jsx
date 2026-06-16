import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const gst = axios.create({ baseURL: API_BASE, timeout: 60_000 });
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

function GstPublicPageEnhanced() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle');
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [pct, setPct] = useState(0);
  const [cached, setCached] = useState(false);

  const pollRef = useRef(null);
  const inputRef = useRef(null);

  // Update page title and meta
  useEffect(() => {
    if (data) {
      const name = data.legal_name || data.tradename || data.legalname || data.gstin;
      document.title = `${name} — SearchGST | Syntern`;
    } else {
      document.title = 'SearchGST — Free GSTIN Lookup Tool | Syntern';
    }
  }, [data]);

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function search() {
    const gstin = query.trim().toUpperCase().replace(/\s/g, '');
    if (!GSTIN_RE.test(gstin)) {
      setErrMsg('Invalid GSTIN format. Example: 27AABCU9603R1ZX (15 characters)');
      setPhase('error');
      return;
    }

    setPhase('checking');
    setData(null);
    setLogs([]);
    setErrMsg('');
    setPct(10);
    setCached(false);

    try {
      // Check cache first
      const cacheRes = await gst.get(`/gst/central/${gstin}`);
      if (cacheRes.data?.success && cacheRes.data?.data) {
        setPct(100);
        setData(cacheRes.data);
        setCached(true);
        setPhase('done');
        return;
      }
    } catch (e) {
      if (e.response?.status !== 404) {
        setErrMsg('Server error. Please try again.');
        setPhase('error');
        return;
      }
    }

    // Not in cache — trigger live lookup
    setPhase('automating');
    setPct(20);
    setLogs(['Starting live lookup from GST portal...']);

    let taskId;
    try {
      const trigRes = await gst.post(`/gst/automation/trigger/${gstin}`);
      taskId = trigRes.data?.taskId;
      if (!taskId) throw new Error('No task ID');
    } catch {
      setErrMsg('Could not start GST lookup. Please try again.');
      setPhase('error');
      return;
    }

    // Poll for completion
    const start = Date.now();
    pollRef.current = setInterval(async () => {
      const elapsed = (Date.now() - start) / 1000;
      setPct(Math.min(20 + elapsed * 2, 90));

      if (elapsed > 90) {
        stopPoll();
        setErrMsg('Lookup timed out. The GST portal may be slow. Please try again.');
        setPhase('error');
        return;
      }

      try {
        const statusRes = await gst.get(`/gst/automation/status/${taskId}`);
        const task = statusRes.data;
        if (task.logs?.length) setLogs(task.logs.map(l => l.message));

        if (task.status === 'completed') {
          stopPoll();
          try {
            const finalRes = await gst.get(`/gst/central/${gstin}`);
            if (finalRes.data?.success && finalRes.data?.data) {
              setPct(100);
              setData(finalRes.data);
              setPhase('done');
            } else {
              setErrMsg('Automation completed but could not retrieve data. Try again.');
              setPhase('error');
            }
          } catch {
            setErrMsg('Failed to fetch results after completion.');
            setPhase('error');
          }
        }

        if (task.status === 'failed') {
          stopPoll();
          setErrMsg(task.error || 'Lookup failed. Please try again.');
          setPhase('error');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') search();
  }

  // ============================================================
  // RENDER: Display GST Result
  // ============================================================
  const renderResult = () => {
    if (!data || phase !== 'done') return null;

    const val = (v) => v ? String(v).trim() : '—';

    return (
      <div style={styles.resultCard}>
        <h2 style={styles.resultTitle}>
          {data.legal_name || data.legalname || 'GST Details'}
        </h2>

        {/* Status Badge */}
        <div style={styles.statusBadge}>
          <span style={{
            backgroundColor: data.gstin_status === 'Active' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {val(data.gstin_status || data.status)}
          </span>
        </div>

        {/* Core Details */}
        <section style={styles.section}>
          <h3>Registration Details</h3>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td><strong>GSTIN</strong></td>
                <td>{val(data.gstin)}</td>
              </tr>
              <tr>
                <td><strong>PAN</strong></td>
                <td>{val(data.pan)}</td>
              </tr>
              <tr>
                <td><strong>Legal Name</strong></td>
                <td>{val(data.legal_name || data.legalname)}</td>
              </tr>
              <tr>
                <td><strong>Trade Name</strong></td>
                <td>{val(data.trade_name || data.tradename)}</td>
              </tr>
              <tr>
                <td><strong>Registration Date</strong></td>
                <td>{val(data.registration_date || data.regdate)}</td>
              </tr>
              <tr>
                <td><strong>Constitution</strong></td>
                <td>{val(data.constitution || data.constitutionofbusiness)}</td>
              </tr>
              <tr>
                <td><strong>Taxpayer Type</strong></td>
                <td>{val(data.taxpayer_type || data.type)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Business Details */}
        <section style={styles.section}>
          <h3>Business Information</h3>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td><strong>Core Business Activity</strong></td>
                <td>{val(data.core_business_activity || data.businesstype)}</td>
              </tr>
              <tr>
                <td><strong>Nature of Business</strong></td>
                <td>
                  {Array.isArray(data.business_nature) && data.business_nature.length > 0
                    ? data.business_nature.map((b, i) => <div key={i}>• {b}</div>)
                    : val(data.business_nature)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Address Details */}
        <section style={styles.section}>
          <h3>Address Details</h3>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td><strong>Address</strong></td>
                <td>{val(data.address_line || data.address)}</td>
              </tr>
              <tr>
                <td><strong>State</strong></td>
                <td>{val(data.state)}</td>
              </tr>
              <tr>
                <td><strong>District</strong></td>
                <td>{val(data.district)}</td>
              </tr>
              <tr>
                <td><strong>Pincode</strong></td>
                <td>{val(data.pincode)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Jurisdiction */}
        {(data.state_juri || data.center_juri) && (
          <section style={styles.section}>
            <h3>Jurisdiction</h3>
            <table style={styles.table}>
              <tbody>
                {data.state_juri && (
                  <tr>
                    <td><strong>State Jurisdiction</strong></td>
                    <td>{val(data.state_juri)}</td>
                  </tr>
                )}
                {data.center_juri && (
                  <tr>
                    <td><strong>Centre Jurisdiction</strong></td>
                    <td>{val(data.center_juri)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* HSN/SAC Codes */}
        {data.dealing_in && Array.isArray(data.dealing_in) && data.dealing_in.length > 0 && (
          <section style={styles.section}>
            <h3>HSN/SAC Codes (Goods & Services)</h3>
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th>Type</th>
                  <th>HSN/SAC Code</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {data.dealing_in.map((item, i) => (
                  <tr key={i}>
                    <td>{item.type || '—'}</td>
                    <td style={{ fontWeight: 'bold' }}>{item.hsn_code || item.hsn || '—'}</td>
                    <td>{item.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* KYC Status */}
        {(data.aadhaar_authenticated || data.ekyc_verified) && (
          <section style={styles.section}>
            <h3>KYC Status</h3>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td><strong>Aadhaar Authenticated</strong></td>
                  <td>
                    {data.aadhaar_authenticated ? '✓ Yes' : '✗ No'}
                    {data.aadhaar_auth_date && ` (${data.aadhaar_auth_date})`}
                  </td>
                </tr>
                <tr>
                  <td><strong>e-KYC Verified</strong></td>
                  <td>{data.ekyc_verified ? '✓ Yes' : '✗ Not Verified'}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Data Source & Timestamp */}
        <section style={styles.footer}>
          <small>
            Source: {val(data.source)} | Last Verified: {data.last_verified_at
              ? new Date(data.last_verified_at).toLocaleString()
              : new Date(data.updated_at).toLocaleString()}
          </small>
        </section>
      </div>
    );
  };

  // ============================================================
  // RENDER: Loading/Progress
  // ============================================================
  const renderProgress = () => {
    if (phase !== 'automating' && phase !== 'checking') return null;
    return (
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${pct}%` }} />
        </div>
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          {pct}% Complete
        </p>
        <div style={styles.logsContainer}>
          {logs.map((log, i) => (
            <div key={i} style={styles.logLine}>
              ✓ {log}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: Main UI
  // ============================================================
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SearchGST</h1>
      <p style={styles.subtitle}>Free GSTIN Lookup Tool by Syntern</p>

      {/* Search Box */}
      <div style={styles.searchBox}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter GSTIN (e.g., 27AABCU9603R1ZX)"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
        <button onClick={search} style={styles.button} disabled={phase === 'automating'}>
          {phase === 'automating' ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {errMsg && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {errMsg}
        </div>
      )}

      {/* Cache Badge */}
      {cached && phase === 'done' && (
        <div style={styles.cacheBadge}>
          ⚡ Loaded from cache (verified within 30 days)
        </div>
      )}

      {/* Progress */}
      {renderProgress()}

      {/* Results */}
      {renderResult()}
    </div>
  );
}

// Inline Styles
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#1f2937',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '24px',
  },
  searchBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  button: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  progressContainer: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#dbeafe',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s ease',
  },
  logsContainer: {
    marginTop: '12px',
    fontSize: '13px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  logLine: {
    padding: '4px 0',
    color: '#666',
    borderBottom: '1px solid #e0e0e0',
  },
  errorBox: {
    padding: '16px',
    marginBottom: '24px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
  cacheBadge: {
    padding: '12px 16px',
    marginBottom: '16px',
    backgroundColor: '#dbeafe',
    color: '#0c4a6e',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  resultTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1f2937',
  },
  statusBadge: {
    marginBottom: '20px',
  },
  section: {
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
  },
  footer: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
    color: '#9ca3af',
  }
};

export default GstPublicPageEnhanced;
