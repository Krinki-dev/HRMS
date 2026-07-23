import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE        = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const ADSENSE_SLOT_ID = '';   // your ad slot
const ADSENSE_CLIENT  = '';   // your pub id
const gst = axios.create({ baseURL: API_BASE, timeout: 60_000 });
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

// ======== AdBanner (unchanged) ========
function AdBanner({ slot = ADSENSE_SLOT_ID }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!slot || !ADSENSE_CLIENT) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, [slot]);
  if (!slot || !ADSENSE_CLIENT) return null;
  return (
    <div ref={ref} style={{ textAlign: 'center', margin: '24px 0' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ======== Helper ========
function valueOrDash(value) {
  const text = value == null ? '' : String(value).trim();
  return text || '—';
}

function buildAddress(data) {
  const parts = [
    data.flat_no,
    data.branch_name,
    data.branch_no ? `Branch No. ${data.branch_no}` : '',
    data.street,
    data.location,
    data.district,
    data.state,
    data.pincode,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : valueOrDash(data.address || data.address_line);
}

export default function GstPublicPage() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | checking | automating | assisted | error | done
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [pct, setPct] = useState(0);

  // assisted captcha state
  const [assistedSessionId, setAssistedSessionId] = useState('');
  const [assistedCaptchaImage, setAssistedCaptchaImage] = useState('');
  const [assistedCaptchaText, setAssistedCaptchaText] = useState('');
  const [assistedSubmitting, setAssistedSubmitting] = useState(false);
  const [assistedWarning, setAssistedWarning] = useState('');

  const pollRef = useRef(null);
  const inputRef = useRef(null);

  // ========== Title & description ==========
  useEffect(() => {
    if (data) {
      const name = data.legalname || data.tradename || data.company_name || data.gstin;
      document.title = `${name} — GST Details | SearchGST by Syntern`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content',
        `GST details for ${name}. GSTIN: ${data.gstin}. Status: ${data.status || 'N/A'}. State: ${data.state || 'N/A'}. Free GST verification tool by Syntern HRMS.`
      );
    } else {
      document.title = 'SearchGST — Free GSTIN Lookup Tool | Syntern';
    }
  }, [data]);

  useEffect(() => () => stopPoll(), []);

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  // ========== Main search ==========
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
    stopPoll();
    setAssistedSessionId('');
    setAssistedCaptchaImage('');
    setAssistedCaptchaText('');
    setAssistedWarning('');

    // 1. Try cache
    try {
      const cacheRes = await gst.get(`/gst/central/${gstin}`);
      if (cacheRes.data?.success && cacheRes.data?.data) {
        setPct(100);
        setData(cacheRes.data.data);
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

    // 2. Start automation
    setPhase('automating');
    setPct(20);
    setLogs(['Starting live lookup from GST portal...']);

    let taskId;
    try {
      const trigRes = await gst.post(`/gst/automation/trigger/${gstin}`);
      taskId = trigRes.data?.taskId;
      if (!taskId) throw new Error('No task ID');
    } catch {
      setErrMsg('Could not start GST lookup. Please try again in a moment.');
      setPhase('error');
      return;
    }

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
              setData(finalRes.data.data);
              setPhase('done');
            } else {
              setErrMsg('Automation completed but could not retrieve data. Try again.');
              setPhase('error');
            }
          } catch {
            setErrMsg('Could not retrieve data after lookup. Try again.');
            setPhase('error');
          }
        } else if (task.status === 'failed') {
          stopPoll();
          setErrMsg(task.error || 'GST portal returned no data. The GSTIN may be invalid or cancelled.');
          setPhase('error');
        }
      } catch {}
    }, 2000);
  }

  // ========== Assisted (manual captcha) ==========
  async function startAssistedLookup() {
    const gstin = query.trim().toUpperCase().replace(/\s/g, '');
    if (!GSTIN_RE.test(gstin)) {
      setErrMsg('Invalid GSTIN format. Example: 27AABCU9603R1ZX (15 characters)');
      setPhase('error');
      return;
    }

    setPhase('checking');
    setErrMsg('');
    setAssistedWarning('');

    try {
      const res = await gst.post(`/gst/automation/assisted/start/${gstin}`);
      if (res.data?.cached && res.data?.data) {
        setData(res.data.data);
        setPhase('done');
        return;
      }

      if (!res.data?.sessionId || !res.data?.captchaImageDataUrl) {
        throw new Error('Could not start assisted verification session');
      }

      setAssistedSessionId(res.data.sessionId);
      setAssistedCaptchaImage(res.data.captchaImageDataUrl);
      setAssistedCaptchaText('');
      setPhase('assisted');
    } catch (e) {
      setErrMsg(e.response?.data?.message || 'Assisted verification is unavailable right now. Please retry.');
      setPhase('error');
    }
  }

  async function submitAssistedCaptcha() {
    if (!assistedSessionId) {
      setErrMsg('Assisted session expired. Start assisted verification again.');
      setPhase('error');
      return;
    }
    const captcha = assistedCaptchaText.trim();
    if (!captcha) {
      setErrMsg('Please enter the captcha text.');
      return;
    }

    setAssistedSubmitting(true);
    setErrMsg('');

    try {
      const res = await gst.post(`/gst/automation/assisted/submit/${assistedSessionId}`, { captcha });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
        setAssistedWarning(res.data?.warning || '');
        setAssistedSessionId('');
        setAssistedCaptchaImage('');
        setAssistedCaptchaText('');
        setPhase('done');
        return;
      }
      throw new Error('Assisted verification failed');
    } catch (e) {
      const payload = e.response?.data;
      if (payload?.code === 'CAPTCHA_INVALID') {
        setErrMsg(payload?.message || 'Invalid captcha. Please try again.');
        if (payload?.captchaImageDataUrl) setAssistedCaptchaImage(payload.captchaImageDataUrl);
        setAssistedCaptchaText('');
        setPhase('assisted');
      } else if (payload?.code === 'ASSISTED_SESSION_EXPIRED') {
        setErrMsg(payload?.message || 'Session expired. Start assisted verification again.');
        setAssistedSessionId('');
        setAssistedCaptchaImage('');
        setAssistedCaptchaText('');
        setPhase('error');
      } else {
        setErrMsg(payload?.message || 'Could not complete assisted verification.');
        setPhase('error');
      }
    } finally {
      setAssistedSubmitting(false);
    }
  }

  async function cancelAssistedSession() {
    if (!assistedSessionId) {
      setPhase('error');
      setErrMsg('Assisted session is no longer active.');
      return;
    }
    await gst.post(`/gst/automation/assisted/cancel/${assistedSessionId}`).catch(() => {});
    setAssistedSessionId('');
    setAssistedCaptchaImage('');
    setAssistedCaptchaText('');
    setPhase('error');
    setErrMsg('Assisted verification cancelled. You can start again anytime.');
  }

  function reset() {
    if (assistedSessionId) {
      gst.post(`/gst/automation/assisted/cancel/${assistedSessionId}`).catch(() => {});
    }
    stopPoll();
    setPhase('idle');
    setData(null);
    setLogs([]);
    setErrMsg('');
    setPct(0);
    setAssistedSessionId('');
    setAssistedCaptchaImage('');
    setAssistedCaptchaText('');
    setAssistedWarning('');
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isLoading = phase === 'checking' || phase === 'automating';

  // ========== UI ==========
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #F7F5F0;
          color: #1A1814;
          min-height: 100vh;
        }

        .sg-topbar {
          background: #1A1814;
          padding: 0 32px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .sg-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .sg-logo-mark {
          width: 28px; height: 28px;
          background: #E8A23A;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: #1A1814;
        }
        .sg-logo-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.2px;
        }
        .sg-logo-text span { color: #E8A23A; }
        .sg-topbar-cta {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sg-topbar-cta a {
          color: #E8A23A;
          text-decoration: none;
          font-weight: 500;
          font-size: 12px;
        }

        .sg-hero {
          padding: 72px 24px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .sg-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 600px 300px at 50% 0%, rgba(232,162,58,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .sg-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #E8A23A;
          margin-bottom: 16px;
        }
        .sg-headline {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 400;
          line-height: 1.1;
          color: #1A1814;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }
        .sg-headline em {
          font-style: italic;
          color: #8B5E2A;
        }
        .sg-sub {
          font-size: 16px;
          color: #6B6458;
          font-weight: 300;
          max-width: 480px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .sg-search-wrap {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }
        .sg-search-box {
          display: flex;
          background: #fff;
          border: 1.5px solid #DDD8CF;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sg-search-box:focus-within {
          border-color: #E8A23A;
          box-shadow: 0 4px 24px rgba(232,162,58,0.12), 0 0 0 3px rgba(232,162,58,0.1);
        }
        .sg-input {
          flex: 1;
          padding: 16px 20px;
          border: none;
          outline: none;
          font-family: 'DM Mono', monospace;
          font-size: 16px;
          color: #1A1814;
          background: transparent;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .sg-input::placeholder {
          color: #C4BFBA;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: none;
        }
        .sg-search-btn {
          background: #1A1814;
          color: #fff;
          border: none;
          padding: 0 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .sg-search-btn:hover:not(:disabled) { background: #2D2920; }
        .sg-search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .sg-hint {
          margin-top: 10px;
          font-size: 12px;
          color: #A09890;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.3px;
        }

        .sg-progress-wrap {
          max-width: 600px;
          margin: 24px auto 0;
          padding: 24px;
          background: #fff;
          border: 1px solid #E8E4DE;
          border-radius: 12px;
        }
        .sg-progress-label {
          font-size: 13px;
          font-weight: 500;
          color: #1A1814;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sg-spinner {
          width: 14px; height: 14px;
          border: 2px solid #E8E4DE;
          border-top-color: #E8A23A;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sg-bar-track {
          background: #F0EDE8;
          border-radius: 99px;
          height: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .sg-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #E8A23A, #C47B1A);
          border-radius: 99px;
          transition: width 1s ease;
        }
        .sg-log-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sg-log-item {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #8B7E6F;
          padding: 3px 0;
          border-bottom: 1px solid #F5F2EE;
        }
        .sg-log-item:last-child { color: #1A1814; font-weight: 500; border: none; }

        .sg-error {
          max-width: 600px;
          margin: 24px auto 0;
          background: #FFF5F5;
          border: 1px solid #FFCACA;
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .sg-error-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .sg-error-body { flex: 1; }
        .sg-error-title { font-size: 13px; font-weight: 600; color: #C0392B; margin-bottom: 4px; }
        .sg-error-msg   { font-size: 13px; color: #8B3A2B; line-height: 1.5; }
        .sg-retry-btn {
          margin-top: 10px;
          padding: 6px 16px;
          background: transparent;
          border: 1px solid #FFCACA;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #C0392B;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sg-retry-btn:hover { background: #FFECEC; }

        /* Inline result section */
        .sg-result-wrap {
          max-width: 860px;
          margin: 32px auto 0;
          padding: 0 24px;
        }
        .sg-result-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .sg-company-name {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(22px, 4vw, 32px);
          color: #1A1814;
          line-height: 1.2;
          font-weight: 400;
        }
        .sg-status-pill {
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sg-status-active   { background: #E8F8EE; color: #1A7A3A; border: 1px solid #B5E5C5; }
        .sg-status-inactive { background: #FEECEC; color: #B02A2A; border: 1px solid #F5C5C5; }
        .sg-status-unknown  { background: #F5F2EE; color: #7A6E60; border: 1px solid #DDD8CF; }

        .sg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .sg-card {
          background: #fff;
          border: 1px solid #E8E4DE;
          border-radius: 12px;
          padding: 20px 22px;
        }
        .sg-card-title {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #A09890;
          margin-bottom: 12px;
        }
        .sg-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 10px;
        }
        .sg-field:last-child { margin-bottom: 0; }
        .sg-field-label {
          font-size: 11px;
          color: #A09890;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
        .sg-field-value {
          font-size: 14px;
          color: #1A1814;
          font-weight: 500;
          word-break: break-word;
        }
        .sg-field-empty { color: #C4BFBA; font-style: italic; font-weight: 400; }
        .sg-card-full { grid-column: 1 / -1; }
        .sg-address-text {
          font-size: 14px;
          color: #1A1814;
          line-height: 1.7;
        }

        .sg-cache-note {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #A09890;
          background: #F5F2EE;
          padding: 4px 10px;
          border-radius: 99px;
          margin-bottom: 16px;
        }

        .sg-new-search {
          margin-top: 8px;
          padding: 8px 20px;
          background: transparent;
          border: 1.5px solid #DDD8CF;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #6B6458;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sg-new-search:hover { border-color: #1A1814; color: #1A1814; }

        /* SEO, ads, footer – unchanged */
        .sg-seo-wrap {
          max-width: 980px;
          margin: 40px auto 14px;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 16px;
        }
        .sg-seo-card,
        .sg-ad-card {
          background: #fff;
          border: 1px solid #E8E4DE;
          border-radius: 14px;
          padding: 18px 20px;
        }
        .sg-seo-title {
          font-family: 'Instrument Serif', serif;
          font-size: 24px;
          line-height: 1.2;
          margin-bottom: 8px;
          color: #1A1814;
        }
        .sg-seo-p {
          font-size: 14px;
          line-height: 1.65;
          color: #6B6458;
          margin-bottom: 10px;
        }
        .sg-seo-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sg-keyword {
          border: 1px solid #E8E4DE;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          color: #6B6458;
          background: #F9F8F6;
        }
        .sg-ad-title {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #A09890;
          margin-bottom: 10px;
        }
        .sg-ad-slot {
          min-height: 120px;
          border: 1px dashed #DDD8CF;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #A09890;
          font-size: 12px;
          background: #FCFBF9;
        }

        .sg-cta {
          max-width: 860px;
          margin: 40px auto;
          padding: 32px 36px;
          background: #1A1814;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .sg-cta-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #E8A23A;
          margin-bottom: 6px;
        }
        .sg-cta-headline {
          font-family: 'Instrument Serif', serif;
          font-size: 22px;
          color: #fff;
          font-weight: 400;
          line-height: 1.3;
        }
        .sg-cta-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin-top: 6px;
          line-height: 1.5;
        }
        .sg-cta-btn {
          padding: 12px 28px;
          background: #E8A23A;
          color: #1A1814;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, transform 0.15s;
        }
        .sg-cta-btn:hover { background: #F5B24A; transform: translateY(-1px); }

        .sg-footer {
          text-align: center;
          padding: 32px 24px 48px;
          font-size: 12px;
          color: #A09890;
          line-height: 1.7;
        }
        .sg-footer a { color: #8B7E6F; text-decoration: underline; }
        .sg-footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .sg-footer-links a { font-size: 12px; color: #A09890; text-decoration: none; }
        .sg-footer-links a:hover { color: #1A1814; }

        .sg-popular {
          max-width: 700px;
          margin: 28px auto 0;
          text-align: center;
        }
        .sg-popular-label {
          font-size: 11px;
          color: #A09890;
          margin-bottom: 10px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 1px;
        }
        .sg-state-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .sg-chip {
          padding: 5px 14px;
          background: #fff;
          border: 1px solid #E8E4DE;
          border-radius: 99px;
          font-size: 12px;
          color: #6B6458;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sg-chip:hover { border-color: #E8A23A; color: #8B5E2A; background: #FFF8EE; }

        @media (max-width: 600px) {
          .sg-hero { padding: 48px 16px 24px; }
          .sg-search-btn { padding: 0 16px; font-size: 13px; }
          .sg-result-wrap { padding: 0 16px; }
          .sg-topbar { padding: 0 16px; }
          .sg-seo-wrap { grid-template-columns: 1fr; padding: 0 16px; }
        }
      `}</style>

      {/* Topbar */}
      <nav className="sg-topbar">
        <a href="https://searchgst.syntern.in" className="sg-logo">
          <div className="sg-logo-mark">GST</div>
          <div className="sg-logo-text">Search<span>GST</span></div>
        </a>
        <div className="sg-topbar-cta">
          <span>Automate your HR & Payroll —</span>
          <a href="https://syntern.in/register">Try Syntern HRMS Free →</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="sg-hero">
        <div className="sg-eyebrow">Free GST Verification Tool</div>
        <h1 className="sg-headline">
          Search any <em>GSTIN</em><br />instantly
        </h1>
        <p className="sg-sub">
          Enter a 15‑digit GSTIN to get complete company details — trade name, legal name, address, status, and more. Free, no signup.
        </p>

        <div className="sg-search-wrap">
          <div className="sg-search-box">
            <input
              ref={inputRef}
              className="sg-input"
              type="text"
              maxLength={15}
              placeholder="e.g. 27AABCU9603R1ZX"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase().replace(/\s/g, ''))}
              onKeyDown={e => e.key === 'Enter' && !isLoading && search()}
              autoFocus
            />
            <button className="sg-search-btn" onClick={search} disabled={isLoading}>
              {isLoading ? <><div className="sg-spinner" style={{borderTopColor:'#fff'}} /> Searching</> : '→ Search'}
            </button>
          </div>
          <div className="sg-hint">Format: 2‑digit state code + 10‑digit PAN + 3 digits · 15 characters total</div>
        </div>
      </section>

      {/* AdSense banner */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        <AdBanner />
      </div>

      {/* Progress / error / assisted / results */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        {isLoading && (
          <div className="sg-progress-wrap">
            <div className="sg-progress-label">
              <div className="sg-spinner" />
              {phase === 'checking' ? 'Checking database cache…' : 'Live lookup from GST portal…'}
            </div>
            <div className="sg-bar-track">
              <div className="sg-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            {logs.length > 0 && (
              <div className="sg-log-list">
                {logs.slice(-5).map((l, i) => (
                  <div key={i} className="sg-log-item">{l}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'error' && (
          <div className="sg-error">
            <div className="sg-error-icon">⚠</div>
            <div className="sg-error-body">
              <div className="sg-error-title">Lookup failed</div>
              <div className="sg-error-msg">{errMsg}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="sg-retry-btn" onClick={startAssistedLookup}>Manual Captcha Verification (Official GST)</button>
                <button className="sg-retry-btn" onClick={reset}>Try another GSTIN</button>
              </div>
            </div>
          </div>
        )}

        {phase === 'assisted' && (
          <div className="sg-progress-wrap" style={{ marginTop: 24 }}>
            <div className="sg-progress-label">Manual Captcha Verification (Official GST)</div>
            {assistedCaptchaImage && (
              <img
                src={assistedCaptchaImage}
                alt="GST captcha"
                style={{ display: 'block', maxWidth: '100%', margin: '12px 0', border: '1px solid #E8E4DE', borderRadius: 8 }}
              />
            )}
            <div className="sg-search-box" style={{ marginTop: 8 }}>
              <input
                className="sg-input"
                type="text"
                placeholder="Enter captcha"
                value={assistedCaptchaText}
                onChange={e => setAssistedCaptchaText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !assistedSubmitting && submitAssistedCaptcha()}
              />
              <button className="sg-search-btn" onClick={submitAssistedCaptcha} disabled={assistedSubmitting}>
                {assistedSubmitting ? 'Submitting...' : 'Submit Captcha'}
              </button>
            </div>
            <div className="sg-hint" style={{ marginTop: 12 }}>
              Stay on this page. Enter captcha shown above, then we fetch and save GST details automatically.
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="sg-retry-btn" style={{ marginTop: 0 }} onClick={startAssistedLookup} disabled={assistedSubmitting}>Get New Challenge</button>
              <button className="sg-retry-btn" style={{ marginTop: 0 }} onClick={cancelAssistedSession} disabled={assistedSubmitting}>Cancel</button>
            </div>
            {!!errMsg && <div className="sg-error-msg" style={{ marginTop: 10 }}>{errMsg}</div>}
          </div>
        )}

        {/* INLINE RESULTS (no popup) */}
        {phase === 'done' && data && (
          <div className="sg-result-wrap" style={{ marginTop: 24 }}>
            <div className="sg-result-header">
              <div>
                <div className="sg-company-name">{data.legalname || data.company_name || data.tradename || data.gstin}</div>
                {data.tradename && data.legalname !== data.tradename && (
                  <div style={{fontSize:14, color:'#8B7E6F', marginTop:4}}>{data.tradename}</div>
                )}
              </div>
              <span className={`sg-status-pill ${
                data.status === 'Active' ? 'sg-status-active' :
                data.status === 'Inactive' ? 'sg-status-inactive' : 'sg-status-unknown'
              }`}>
                {data.status || 'Unknown'}
              </span>
            </div>

            <div className="sg-grid">
              <div className="sg-card">
                <div className="sg-card-title">GSTIN</div>
                <div className="sg-field-value">{data.gstin || '—'}</div>
              </div>
              <div className="sg-card">
                <div className="sg-card-title">Registration Date</div>
                <div className="sg-field-value">{data.regdate || '—'}</div>
              </div>
              <div className="sg-card sg-card-full">
                <div className="sg-card-title">Principal Address</div>
                <div className="sg-address-text">{buildAddress(data)}</div>
              </div>
            </div>

            {assistedWarning && (
              <div className="sg-cache-note">⚠ {assistedWarning}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#8B7E6F' }}>
                Data sourced from public GST portal. Verify official records at{' '}
                <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#8B5E2A' }}>gst.gov.in</a>.
              </p>
              <button className="sg-new-search" onClick={reset}>New Search</button>
            </div>
          </div>
        )}
      </div>

      {/* SEO + Ad section */}
      <section className="sg-seo-wrap">
        <article className="sg-seo-card">
          <h2 className="sg-seo-title">GSTIN Verification for Better Compliance and Faster Vendor Checks</h2>
          <p className="sg-seo-p">
            Use this free GST search tool to verify legal entity name, trade name, registration date, and principal place of business.
            It helps with vendor onboarding, invoice validation, payroll compliance workflows, and finance controls.
          </p>
          <div className="sg-seo-keywords">
            {['GSTIN lookup', 'GST verification', 'GST taxpayer search', 'vendor KYC', 'compliance automation', 'business registration check'].map(k => (
              <span key={k} className="sg-keyword">{k}</span>
            ))}
          </div>
        </article>
        <aside className="sg-ad-card">
          <div className="sg-ad-title">Sponsored & Product Spotlight</div>
          <div className="sg-ad-slot">Google Ads Slot (300x250 / Responsive)</div>
          <div style={{ marginTop: 12 }}>
            <AdBanner />
          </div>
        </aside>
      </section>

      {/* Syntern CTA */}
      <div className="sg-cta">
        <div>
          <div className="sg-cta-eyebrow">For Business Owners & HR Teams</div>
          <div className="sg-cta-headline">Automate payroll, attendance<br />& compliance — free to start</div>
          <div className="sg-cta-sub">
            Syntern HRMS handles GST‑linked company setup, PF/ESI filing,<br />
            salary processing, and employee management on your own subdomain.
          </div>
        </div>
        <a href="https://syntern.in/register" className="sg-cta-btn">Start Free Trial →</a>
      </div>

      {/* Footer */}
      <footer className="sg-footer">
        <div className="sg-footer-links">
          <a href="https://syntern.in">Syntern HRMS</a>
          <a href="https://syntern.in/register">Register Company</a>
          <a href="https://syntern.in/privacy">Privacy Policy</a>
          <a href="mailto:support@syntern.in">Contact</a>
        </div>
        <div>© {new Date().getFullYear()} Syntern Technologies · SearchGST is a free public tool</div>
        <div style={{marginTop:6}}>Data accuracy not guaranteed. Always verify from <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer">gst.gov.in</a></div>
      </footer>
    </>
  );
}