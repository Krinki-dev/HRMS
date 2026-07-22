import { useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const gst = axios.create({ baseURL: API_BASE, timeout: 60_000 });
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

function valueOrDash(value) {
  const text = value == null ? '' : String(value).trim();
  return text || '—';
}

function buildPrincipalAddress(data) {
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

  if (parts.length) return parts.join(', ');
  return valueOrDash(data.address || data.address_line);
}

export default function GstPublicPage() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const [data, setData] = useState(null);

  const [assistedSessionId, setAssistedSessionId] = useState('');
  const [assistedCaptchaImage, setAssistedCaptchaImage] = useState('');
  const [assistedCaptchaText, setAssistedCaptchaText] = useState('');
  const [assistedSubmitting, setAssistedSubmitting] = useState(false);

  const inputRef = useRef(null);

  async function startAssistedLookup(gstin) {
    setPhase('checking');
    setErrMsg('');

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
      setErrMsg(e.response?.data?.message || 'Unable to start verification. Please retry.');
      setPhase('error');
    }
  }

  async function search() {
    const gstin = query.trim().toUpperCase().replace(/\s/g, '');
    if (!GSTIN_RE.test(gstin)) {
      setErrMsg('Invalid GSTIN format. Example: 27AABCU9603R1ZX');
      setPhase('error');
      return;
    }

    setPhase('checking');
    setErrMsg('');
    setData(null);

    try {
      const cacheRes = await gst.get(`/gst/central/${gstin}`);
      if (cacheRes.data?.success && cacheRes.data?.data) {
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

    await startAssistedLookup(gstin);
  }

  async function submitAssistedCaptcha() {
    if (!assistedSessionId) {
      setErrMsg('Session expired. Start verification again.');
      setPhase('error');
      return;
    }

    const captcha = assistedCaptchaText.trim();
    if (!captcha) {
      setErrMsg('Please enter captcha text.');
      return;
    }

    setAssistedSubmitting(true);
    setErrMsg('');

    try {
      const res = await gst.post(`/gst/automation/assisted/submit/${assistedSessionId}`, { captcha });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
        setAssistedSessionId('');
        setAssistedCaptchaImage('');
        setAssistedCaptchaText('');
        setPhase('done');
        return;
      }
      throw new Error('Verification failed');
    } catch (e) {
      const payload = e.response?.data;
      if (payload?.code === 'CAPTCHA_INVALID') {
        setErrMsg(payload?.message || 'Invalid captcha. Please try again.');
        if (payload?.captchaImageDataUrl) setAssistedCaptchaImage(payload.captchaImageDataUrl);
        setAssistedCaptchaText('');
        setPhase('assisted');
      } else if (payload?.code === 'ASSISTED_SESSION_EXPIRED') {
        setErrMsg(payload?.message || 'Session expired. Please start again.');
        setAssistedSessionId('');
        setAssistedCaptchaImage('');
        setAssistedCaptchaText('');
        setPhase('error');
      } else {
        setErrMsg(payload?.message || 'Could not complete verification.');
        setPhase('error');
      }
    } finally {
      setAssistedSubmitting(false);
    }
  }

  async function cancelAssistedSession() {
    if (assistedSessionId) {
      await gst.post(`/gst/automation/assisted/cancel/${assistedSessionId}`).catch(() => {});
    }
    setAssistedSessionId('');
    setAssistedCaptchaImage('');
    setAssistedCaptchaText('');
    setErrMsg('Verification canceled. Start a new search.');
    setPhase('error');
  }

  function reset() {
    if (assistedSessionId) {
      gst.post(`/gst/automation/assisted/cancel/${assistedSessionId}`).catch(() => {});
    }
    setPhase('idle');
    setData(null);
    setErrMsg('');
    setAssistedSessionId('');
    setAssistedCaptchaImage('');
    setAssistedCaptchaText('');
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const isBusy = phase === 'checking' || assistedSubmitting;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'DM Sans', sans-serif;
          color: #1f1a14;
          background: radial-gradient(1200px 500px at 50% -180px, #f6e2c3 0%, #f8f5ee 52%, #f6f3ec 100%);
        }

        .gst-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .gst-shell {
          width: min(1160px, 98vw);
          background: #fff;
          border: 1px solid #e7dfd1;
          border-radius: 18px;
          box-shadow: 0 16px 50px rgba(47, 34, 17, 0.12);
          overflow: hidden;
        }

        .gst-head {
          padding: 24px 24px 14px;
          border-bottom: 1px solid #efe8dc;
          background: linear-gradient(180deg, #fffdf8 0%, #fff 100%);
        }

        .gst-title {
          margin: 0 0 6px;
          font-family: 'Instrument Serif', serif;
          font-size: clamp(30px, 3.5vw, 48px);
          line-height: 1.08;
          font-weight: 400;
          letter-spacing: -0.7px;
          color: #20170e;
        }

        .gst-sub {
          margin: 0;
          font-size: 15px;
          color: #786c5c;
        }

        .gst-body {
          padding: 18px 24px 24px;
        }

        .gst-search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          margin-bottom: 12px;
        }

        .gst-input {
          height: 52px;
          border: 1px solid #d9cfbf;
          border-radius: 12px;
          padding: 0 14px;
          font-size: 18px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #20170e;
          outline: none;
        }

        .gst-input:focus {
          border-color: #b98639;
          box-shadow: 0 0 0 3px rgba(185, 134, 57, 0.18);
        }

        .gst-btn {
          height: 52px;
          border: 1px solid #1f1a14;
          background: #1f1a14;
          color: #fff;
          border-radius: 12px;
          padding: 0 18px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .gst-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .gst-hint {
          margin: 0 0 16px;
          font-size: 12px;
          color: #8d8070;
        }

        .gst-block {
          border: 1px solid #e8dfd2;
          border-radius: 14px;
          padding: 14px;
          background: #fffcf7;
        }

        .gst-block + .gst-block {
          margin-top: 12px;
        }

        .gst-info {
          font-size: 14px;
          color: #645948;
          margin: 0;
          line-height: 1.6;
        }

        .gst-error {
          border-color: #efc8c8;
          background: #fff5f5;
        }

        .gst-error p {
          color: #8b2d2d;
        }

        .gst-actions {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gst-secondary {
          height: 40px;
          border: 1px solid #d7ccbc;
          background: #fff;
          color: #5c5041;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .gst-captcha {
          max-width: 100%;
          border: 1px solid #dfd4c3;
          border-radius: 10px;
          margin: 10px 0;
          display: block;
        }

        .gst-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 4px;
        }

        .gst-cell {
          border: 1px solid #e5dbcb;
          background: #fff;
          border-radius: 12px;
          padding: 12px;
        }

        .gst-label {
          font-size: 12px;
          color: #8a7d6d;
          margin-bottom: 4px;
        }

        .gst-value {
          font-size: 23px;
          font-weight: 500;
          line-height: 1.4;
          color: #2b2017;
          word-break: break-word;
        }

        .gst-legal {
          margin: 0 0 8px;
          font-family: 'Instrument Serif', serif;
          font-size: clamp(30px, 2.3vw, 38px);
          font-weight: 400;
          letter-spacing: -0.25px;
          color: #20170e;
          text-wrap: balance;
        }

        .gst-foot {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .gst-note {
          margin: 0;
          font-size: 12px;
          color: #847665;
        }

        .gst-note a {
          color: #8a5a16;
          text-decoration: none;
          font-weight: 700;
        }

        @media (max-width: 860px) {
          .gst-page { padding: 10px; }
          .gst-head { padding: 18px 14px 12px; }
          .gst-body { padding: 12px 14px 14px; }
          .gst-search-row { grid-template-columns: 1fr; }
          .gst-grid { grid-template-columns: 1fr; }
          .gst-btn { width: 100%; }
        }
      `}</style>

      <main className="gst-page">
        <section className="gst-shell" aria-label="GST verification card">
          <header className="gst-head">
            <h1 className="gst-title">GST Verification</h1>
            <p className="gst-sub">
              Fast lookup with minimum steps. If not cached, one manual captcha is shown on this page.
            </p>
          </header>

          <div className="gst-body">
            <div className="gst-search-row">
              <input
                ref={inputRef}
                className="gst-input"
                type="text"
                value={query}
                maxLength={15}
                placeholder="Enter 15-digit GSTIN"
                onChange={(e) => setQuery(e.target.value.toUpperCase().replace(/\s/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && !isBusy && search()}
                autoFocus
              />
              <button className="gst-btn" onClick={search} disabled={isBusy}>
                {phase === 'checking' ? 'Checking...' : assistedSubmitting ? 'Submitting...' : 'Search GST'}
              </button>
            </div>

            <p className="gst-hint">Format example: 27AABCU9603R1ZX</p>

            {phase === 'checking' && (
              <div className="gst-block">
                <p className="gst-info">Checking records and preparing verification...</p>
              </div>
            )}

            {phase === 'error' && (
              <div className="gst-block gst-error">
                <p className="gst-info">{errMsg}</p>
                <div className="gst-actions">
                  <button className="gst-secondary" onClick={search} disabled={isBusy}>Retry</button>
                  <button className="gst-secondary" onClick={reset} disabled={isBusy}>New Search</button>
                </div>
              </div>
            )}

            {phase === 'assisted' && (
              <div className="gst-block">
                <p className="gst-info">Complete one captcha below to fetch official GST details.</p>
                {assistedCaptchaImage && <img className="gst-captcha" src={assistedCaptchaImage} alt="GST captcha" />}

                <div className="gst-search-row" style={{ marginBottom: 0 }}>
                  <input
                    className="gst-input"
                    type="text"
                    value={assistedCaptchaText}
                    placeholder="Enter captcha"
                    onChange={(e) => setAssistedCaptchaText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !assistedSubmitting && submitAssistedCaptcha()}
                  />
                  <button className="gst-btn" onClick={submitAssistedCaptcha} disabled={assistedSubmitting}>
                    Submit Captcha
                  </button>
                </div>

                <div className="gst-actions">
                  <button className="gst-secondary" onClick={() => startAssistedLookup(query.trim().toUpperCase())} disabled={assistedSubmitting}>
                    Refresh Captcha
                  </button>
                  <button className="gst-secondary" onClick={cancelAssistedSession} disabled={assistedSubmitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {phase === 'done' && data && (
              <div className="gst-block" style={{ background: '#fff' }}>
                <h2 className="gst-legal">{valueOrDash(data.legalname || data.company_name)}</h2>

                <div className="gst-grid">
                  <div className="gst-cell">
                    <div className="gst-label">GSTIN</div>
                    <div className="gst-value">{valueOrDash(data.gstin)}</div>
                  </div>
                  <div className="gst-cell">
                    <div className="gst-label">Business Name (Legal)</div>
                    <div className="gst-value">{valueOrDash(data.legalname || data.company_name)}</div>
                  </div>
                  <div className="gst-cell">
                    <div className="gst-label">Trade Name</div>
                    <div className="gst-value">{valueOrDash(data.tradename)}</div>
                  </div>
                  <div className="gst-cell">
                    <div className="gst-label">Registration Date</div>
                    <div className="gst-value">{valueOrDash(data.regdate)}</div>
                  </div>
                  <div className="gst-cell">
                    <div className="gst-label">Status</div>
                    <div className="gst-value">{valueOrDash(data.status)}</div>
                  </div>
                  <div className="gst-cell">
                    <div className="gst-label">Principal Address</div>
                    <div className="gst-value">{buildPrincipalAddress(data)}</div>
                  </div>
                </div>

                <div className="gst-foot">
                  <p className="gst-note">
                    Data sourced from official GST portal. Verify at <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer">gst.gov.in</a>.
                  </p>
                  <button className="gst-secondary" onClick={reset}>New Search</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
