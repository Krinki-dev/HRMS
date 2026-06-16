/**
 * @file AutomationPage.jsx
 * @description UI for Aadhaar eKYC and GST automation tasks.
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Spinner, Modal } from '../../components/ui/Common';

/**
 * API abstraction for automation tasks
 */
const A = {
  tasks:          p      => api.get('/automation/tasks',        { params: p }).then(r => r.data),
  task:           id     => api.get(`/automation/task/${id}`).then(r => r.data),
  captcha:        (id,v) => api.post(`/automation/task/${id}/captcha`,         { captcha: v }).then(r => r.data),
  refreshCaptcha: id     => api.post(`/automation/task/${id}/refresh-captcha`).then(r => r.data),
  otp:            (id,v) => api.post(`/automation/task/${id}/otp`,             { otp: v }).then(r => r.data),
  confirm:        (id, data={}) => api.post(`/automation/task/${id}/confirm`,  { confirm: 'YES', ...data }).then(r => r.data),
  cancel:         id     => api.post(`/automation/task/${id}/cancel`).then(r => r.data),
  checkDup:       d      => api.post('/automation/kyc/check-duplicate',        d).then(r => r.data),
  startOtp:       d      => api.post('/automation/kyc/start-otp',              d).then(r => r.data),
  uploadXml:      fd     => api.post('/automation/kyc/upload-xml', fd, { headers:{ 'Content-Type':'multipart/form-data' } }).then(r => r.data),
  saveReview:     d      => api.post('/automation/kyc/save-after-review',      d).then(r => r.data),
  // GST endpoints — mirroring CompanyRegisterPage
  centralGst:     gstin  => api.get(`/gst/central/${gstin}`).then(r => r.data),
  triggerAuto:    gstin  => api.post(`/gst/automation/trigger/${gstin}`).then(r => r.data),
  autoStatus:     taskId => api.get(`/gst/automation/status/${taskId}`).then(r => r.data),
};

/**
 * Helper: Format date for display
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * OTP Expiry Timer Component
 */
function OtpTimer({ minutes = 10 }) {
  const [secs, setSecs] = useState(minutes * 60);
  useEffect(() => { const iv = setInterval(() => setSecs(s => Math.max(0, s-1)), 1000); return () => clearInterval(iv); }, []);
  const m = Math.floor(secs/60), s = secs % 60;
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${secs===0?'bg-red-100 text-red-600':'bg-purple-100 text-purple-700'}`}>
      {secs===0 ? '⏱ Expired' : `⏱ ${m}:${String(s).padStart(2,'0')}`}
    </span>
  );
}

/**
 * Helper: Mask sensitive values
 */
/**
 * Masks a string for privacy, leaving only the first 'n' characters visible.
 */
const maskVal = (v, n=3) => { 
  if (!v) return '—'; 
  const s = String(v); 
  return s.length <= n ? s : s.slice(0, n) + '•'.repeat(Math.min(s.length - n, 8)); 
};

/**
 * UI for reviewing extracted KYC data.
 * Includes manual verification of mobile/email against Aadhaar hashes.
 */
function ReviewCard({ data: d, taskId, onConfirmed, onCancel }) {
  const [masked,    setMasked]    = useState(true);
  const [confirmT,  setConfirmT]  = useState('');
  const [mobile,    setMobile]    = useState('');
  const [email,     setEmail]     = useState('');
  const [mobileRes, setMobileRes] = useState(null);
  const [emailRes,  setEmailRes]  = useState(null);
  const [verifying, setVerifying] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [skipVerify, setSkipVerify] = useState(false);

  const shareCode = d?.shareCode || '';
  const lastDigit = d?.aadhaarLastDigit || '';
  const show = v => masked ? maskVal(v) : (v||'—');
  const hasMobile = !!(d?.m || d?.hasMobileHash);
  const hasEmail  = !!(d?.e || d?.hasEmailHash);

  /**
   * Replicates UIDAI's iterated SHA-256 hashing for mobile/email verification.
   */
  async function uidaiHash(value, shareCode, lastDigit, debug = false) {
    const iteratedSha256 = async (input, n) => {
      let hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      let hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
      for (let i = 1; i < n; i++) {
        hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashHex));
        hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
      }
      return hashHex;
    };
    const n = Math.max(1, parseInt(lastDigit || '0', 10));
    const rawInput = (value || '').trim() + (shareCode || '');
    const computedHash = await iteratedSha256(rawInput, n);
    return { raw: computedHash, n };
  }

  async function verifyMobile() {
    const raw = mobile.replace(/\s/g,'');
    if (!/^\d{10}$/.test(raw)) { toast.error('Enter 10-digit mobile'); return; }
    if (!d?.m)       { toast.error('No mobile hash in XML'); return; }
    setVerifying('mobile');
    const h = await uidaiHash(raw, shareCode, lastDigit);
    const stored = d.m.toLowerCase();
    const ok = h.raw === stored;
    setMobileRes(ok);
    if (!ok) toast.error('Mobile does not match Aadhaar record');
    else toast.success('Mobile verified ✓');
    setVerifying('');
  }

  async function verifyEmail() {
    const raw = email.trim().toLowerCase();
    if (!raw.includes('@')) { toast.error('Enter valid email'); return; }
    if (!d?.e)       { toast.error('No email hash in XML'); return; }
    setVerifying('email');
    const h = await uidaiHash(raw, shareCode, lastDigit);
    const stored = d.e.toLowerCase();
    const ok = h.raw === stored;
    setEmailRes(ok);
    if (!ok) toast.error('Email does not match Aadhaar record');
    else toast.success('Email verified ✓');
    setVerifying('');
  }

  function handleSkip() {
    setSkipVerify(true); setMobileRes(true); setEmailRes(true);
    toast.success('Verification skipped. Data will be saved as entered.');
  }

  const needMobileVerify = hasMobile && mobile.length === 10 && !skipVerify;
  const needEmailVerify  = hasEmail  && email.includes('@') && !skipVerify;
  const canSaveXml = (!needMobileVerify || mobileRes === true) && (!needEmailVerify || emailRes === true);
  const saveLabel = taskId ? '✓ Confirm & Save' : '✓ Save to central database';

  async function doConfirm() {
    if (taskId) {
      if (confirmT !== 'CONFIRM') return;
      if (!mobile || !email) { toast.error('Mobile and email are required'); return; }
      if (!skipVerify && (mobileRes !== true || emailRes !== true)) { toast.error('Please verify mobile and email or click Skip'); return; }
      setSaving(true);
      try { await A.confirm(taskId, { mobile, email }); onConfirmed?.(); }
      catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
      finally { setSaving(false); }
      return;
    }
    if (!canSaveXml) { toast.error('Verify contact values first or click Skip to proceed'); return; }
    setSaving(true);
    try { onConfirmed?.({ mobile: mobile || null, email: email || null }); }
    catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  }

  const personalFields = [
    { k:'Full Name',      v: d?.name || d?.fullName },
    { k:"Father's Name", v: d?.fatherName || (d?.careof ? d?.careof.replace(/^(?:S\/O|D\/O|C\/O|W\/O)[:\s]*/i, '') : null) },
    { k:'Date of Birth',  v: d?.dob || d?.dateOfBirth },
    { k:'Gender',         v: d?.gender },
  ].filter(f => f.v);

  const addressFields = [
    { k:'House',       v: d?.house },
    { k:'Street',      v: d?.street },
    { k:'Landmark',    v: d?.loc },
    { k:'Village/Town',v: d?.vtc || d?.city },
    { k:'Post Office', v: d?.po },
    { k:'Tehsil',      v: d?.subdist },
    { k:'District',    v: d?.dist || d?.district },
    { k:'State',       v: d?.state },
    { k:'Pincode',     v: d?.pc || d?.pincode },
    { k:'Country',     v: d?.country || 'India' },
  ].filter(f => f.v);

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gray-800">👁 Review KYC Data</p>
        <button onClick={() => setMasked(m => !m)}
          className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          {masked ? '👁 Unmask' : '🙈 Mask'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
        {d?.photo && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <img src={d.photo} alt="Aadhaar photo"
              className={`w-24 h-24 rounded-xl object-cover border-2 border-white shadow ${masked?'blur-md':''}`}
              onError={e => { e.target.style.display='none'; }} />
            <div>
              <p className="text-xs font-semibold text-gray-700">Aadhaar Photo</p>
              <p className="text-xs text-gray-400">{masked ? 'Click Unmask to view' : 'From UIDAI XML'}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personalFields.map(f => (
            <div key={f.k} className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">{f.k}</p>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{show(f.v)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Address Details</p>
          <div className="grid grid-cols-1 gap-3">
            {addressFields.map(f => (
              <div key={f.k}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-0.5">{f.k}</p>
                <p className="text-sm font-medium text-gray-800">{show(f.v)}</p>
              </div>
            ))}
          </div>
        </div>

        {(hasMobile || hasEmail) && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">📞 Verify & Store Contact Details</p>
              <p className="text-xs text-gray-500">
                Enter the employee's actual mobile and email.{' '}
                {!skipVerify && ' They will be verified against Aadhaar hash.'}
                {skipVerify && <span className="text-amber-600 font-medium"> Verification skipped – saving as entered.</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <strong>Share code (reference):</strong> {shareCode || 'Not provided'} – used for hash.
              </p>
            </div>

            {hasMobile && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 block">Mobile Number</label>
                <div className="flex gap-2">
                  <input type="tel" value={mobile}
                    onChange={e=>{setMobile(e.target.value.replace(/\D/g,'').slice(0,10));setMobileRes(null);}}
                    placeholder="10-digit mobile"
                    className="flex-1 border border-gray-300 focus:border-blue-400 rounded-xl px-3 py-2 text-sm outline-none"/>
                  {!skipVerify && (
                    <button onClick={verifyMobile} disabled={verifying==='mobile'||mobile.length!==10}
                      className="px-3 bg-blue-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                      {verifying==='mobile'?'…':'Verify'}
                    </button>
                  )}
                </div>
                {mobileRes===true  && <p className="text-xs text-green-600 font-medium">✓ Verified (or skipped)</p>}
                {mobileRes===false && <p className="text-xs text-amber-700">✗ Does not match – check number or skip</p>}
              </div>
            )}

            {hasEmail && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 block">Email Address</label>
                <div className="flex gap-2">
                  <input type="email" value={email}
                    onChange={e=>{setEmail(e.target.value);setEmailRes(null);}}
                    placeholder="email@example.com"
                    className="flex-1 border border-gray-300 focus:border-blue-400 rounded-xl px-3 py-2 text-sm outline-none"/>
                  {!skipVerify && (
                    <button onClick={verifyEmail} disabled={verifying==='email'||!email.includes('@')}
                      className="px-3 bg-blue-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                      {verifying==='email'?'…':'Verify'}
                    </button>
                  )}
                </div>
                {emailRes===true  && <p className="text-xs text-green-600 font-medium">✓ Verified (or skipped)</p>}
                {emailRes===false && <p className="text-xs text-amber-700">✗ Does not match – check email or skip</p>}
              </div>
            )}
            {!skipVerify && (hasMobile || hasEmail) && (
              <button onClick={handleSkip} className="text-xs text-amber-600 underline hover:text-amber-800">
                Skip verification (save as entered without checking)
              </button>
            )}
          </div>
        )}
      </div>

      {!(hasMobile || hasEmail) && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-xs text-blue-700">
          No contact hashes were found in this XML. You can still save the record after review.
        </div>
      )}

      {debugInfo && (
        <div className="border border-red-300 rounded-2xl p-3 bg-red-50">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-red-700">🔍 Verification Debug Info</p>
            <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-red-600 underline">
              {showDebug ? 'Hide details' : 'Show details'}
            </button>
          </div>
          {showDebug && (
            <div className="text-xs font-mono space-y-1 text-gray-700 break-all">
              <p><span className="font-semibold">Type:</span> {debugInfo.type}</p>
              <p><span className="font-semibold">Value entered:</span> {debugInfo.value}</p>
              <p><span className="font-semibold">Share code:</span> {debugInfo.shareCode}</p>
              <p><span className="font-semibold">Last Aadhaar digit:</span> {debugInfo.lastDigit}</p>
              <p><span className="font-semibold">Iterations (n):</span> {debugInfo.iterations}</p>
              <p><span className="font-semibold">Computed hash:</span> {debugInfo.computedHash}</p>
              <p><span className="font-semibold">Stored hash (in XML):</span> {debugInfo.storedHash}</p>
              <p className="text-red-600 font-semibold mt-1">❌ Hashes do NOT match. Check share code or last digit.</p>
            </div>
          )}
        </div>
      )}

      <div className="border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50/40 space-y-3">
        {taskId ? (
          <p className="text-xs text-indigo-800">
            Type <span className="font-mono bg-white px-1.5 py-0.5 rounded border font-bold">CONFIRM</span> to save encrypted to database
          </p>
        ) : (
          <p className="text-xs text-indigo-800">Review the data and click save to persist the record.</p>
        )}
        {taskId && (
          <input type="text" autoFocus value={confirmT} onChange={e => setConfirmT(e.target.value)}
            placeholder="Type CONFIRM"
            className="w-full border-2 border-indigo-300 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm font-mono tracking-widest text-center outline-none bg-white"/>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={doConfirm} disabled={saving || (taskId ? confirmT!=='CONFIRM' : !canSaveXml)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {saving&&<span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>}
            {saveLabel}
          </button>
          <button onClick={onCancel} className="px-4 py-3 border border-gray-300 text-gray-600 rounded-2xl text-sm hover:bg-gray-50">✗ Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── GST Result Card — clean table/card display ───────────────────────────────
function GstResultCard({ data, ageDays, onRefresh, refreshing }) {
  if (!data) return null;
  const fields = [
    { label: 'GSTIN',               value: data.gstin },
    { label: 'Legal Name',          value: data.legalname   || data.legalName },
    { label: 'Trade Name',          value: data.tradename   || data.tradeName },
    { label: 'PAN',                 value: data.pan },
    { label: 'Status',              value: data.status      || data.gstStatus },
    { label: 'Registration Date',   value: formatDate(data.regdate      || data.gstRegDate) },
    { label: 'Cancel Date',         value: formatDate(data.canceldate   || data.cancelDate) },
    { label: 'Taxpayer Type',       value: data.type        || data.taxpayerType },
    { label: 'Constitution',        value: data.constitutionofbusiness  || data.constitutionOfBusiness },
    { label: 'State',               value: data.state },
    { label: 'State Code',          value: data.statecode   || data.stateCode },
    { label: 'District / City',     value: data.district    || data.city },
    { label: 'Pincode',             value: data.pincode },
    { label: 'Address',             value: [data.flatno||data.flatNo, data.branchno||data.branchNo, data.branchname||data.branchName, data.street].filter(Boolean).join(', ') || data.address || data.placeOfBusiness || '—' },
    { label: 'Centre Jurisdiction', value: data.centerjuri  || data.centreJurisdiction },
    { label: 'Centre Code',         value: data.centercode  || data.centreCode },
    { label: 'State Jurisdiction',  value: data.statejuri   || data.stateJurisdiction },
    { label: 'Nature of Business',  value: Array.isArray(data.businessNature) ? data.businessNature.join(', ') : (data.businessnature || data.businessNature) },
    { label: 'Dealing In',          value: Array.isArray(data.dealingIn) ? data.dealingIn.join(', ') : (data.dealingin || data.dealingIn) },
  ];

  const statusVal = data.status || data.gstStatus || '';
  const isActive  = /active/i.test(statusVal);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-4 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-start gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {data.legalname || data.legalName || data.tradename || data.tradeName || 'GST Company'}
          </p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{data.gstin}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusVal && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {isActive ? '● Active' : `● ${statusVal}`}
            </span>
          )}
          {ageDays !== undefined && ageDays !== null && (
            <span className={`text-xs px-2 py-1 rounded-full ${ageDays < 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {ageDays < 90 ? `✓ Fresh (${ageDays}d)` : `⚠ Stale (${ageDays}d)`}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl disabled:opacity-50 flex items-center gap-1"
            >
              {refreshing
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Refreshing…</>
                : '↺ Refresh'}
            </button>
          )}
        </div>
      </div>
      {/* Fields grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields
            .filter(f => f.value && f.value !== '—' && f.value !== '')
            .map(f => (
              <div key={f.label}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">{f.label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{f.value}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── GST Automation Progress Panel ────────────────────────────────────────────
function GstAutoPanel({ taskId, onComplete, onReset }) {
  const [stepMsg, setStepMsg] = useState('Automation running — this takes 15–30 seconds.');
  const [failed,  setFailed]  = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    const poll = async () => {
      try {
        const res = await A.autoStatus(taskId);
        const { status: s, logs, error } = res;
        if (Array.isArray(logs) && logs.length) {
          setStepMsg(logs[logs.length - 1]?.message || stepMsg);
        }
        if (s === 'completed') {
          clearInterval(pollRef.current);
          onComplete?.();
        } else if (s === 'failed') {
          clearInterval(pollRef.current);
          setFailed(true);
          toast.error(`GST automation failed: ${error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('[GstAutoPanel] poll error', err);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [taskId]);

  if (!taskId) return null;

  return (
    <div className={`mt-4 rounded-xl p-4 space-y-2 border ${failed ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center gap-2">
        {!failed && <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block flex-shrink-0"/>}
        {failed   && <span className="text-red-500 text-sm">✗</span>}
        <p className={`text-sm font-semibold ${failed ? 'text-red-800' : 'text-blue-800'}`}>
          {failed ? 'Automation failed' : 'Fetching GST details via automation…'}
        </p>
      </div>
      <p className={`text-xs ${failed ? 'text-red-700' : 'text-blue-700'}`}>{stepMsg}</p>
      <button onClick={onReset} className="text-xs text-gray-500 underline hover:text-gray-700">Cancel</button>
    </div>
  );
}

// ── TaskPanel (unchanged) ────────────────────────────────────────────────────
function TaskPanel({ taskId, urlMode, returnTo, onDone, onReset, onViewLogs }) {
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState('');
  const [otp,     setOtp]     = useState('');
  const [acting,  setActing]  = useState(false);
  const [live,    setLive]    = useState(null);
  const [fade,    setFade]    = useState('opacity-100');

  useEffect(() => {
    if (!taskId) { setLive(null); return; }
    let iv;
    const poll = async () => {
      try {
        const r = await A.task(taskId);
        const t = r?.data;
        if (!t) return;
        setLive(prev => {
          if (prev?.status === t.status && prev?.captchaImage === t.captchaImage) return prev;
          setFade('opacity-0');
          setTimeout(() => setFade('opacity-100'), 150);
          return t;
        });
        if (!['running','captcha_required','otp_required','review_required'].includes(t.status)) {
          clearInterval(iv);
          if (t.status==='completed') {
            if (urlMode==='referred'&&returnTo&&t.resultData?.kycId)
              setTimeout(()=>navigate(`${returnTo}${returnTo.includes('?')?'&':'?'}kycId=${t.resultData.kycId}`),1500);
            onDone?.();
          }
        }
      } catch {}
    };
    poll();
    iv = setInterval(poll, 2500);
    return () => clearInterval(iv);
  }, [taskId]);

  const s = live?.status || '';
  const liveMessage = live?.errorMessage ||
    (s==='running'           ? 'Automation is running. Please wait while the system completes the current step.' :
     s==='captcha_required'  ? 'Captcha is required. Enter the characters shown above.' :
     s==='otp_required'      ? 'OTP is required. Enter the code sent to the verified phone.' :
     s==='review_required'   ? 'Review the captured data and confirm to continue.' :
     s==='completed'         ? 'Automation complete. Data has been saved successfully.' :
     s==='failed'            ? 'Automation failed. Check logs and retry the task.' :
     s==='cancelled'         ? 'Automation cancelled.' : 'Starting automation...');

  async function submitCaptcha() {
    if (!captcha.trim()) return;
    setActing(true);
    try { await A.captcha(live.id, captcha.trim()); setCaptcha(''); setLive(l=>({...l,status:'running',captchaImage:null})); toast.success('Captcha submitted'); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setActing(false); }
  }
  async function submitOtp() {
    if (!/^\d{6}$/.test(otp)) return;
    setActing(true);
    try { await A.otp(live.id, otp.trim()); setOtp(''); setLive(l=>({...l,status:'running'})); toast.success('OTP submitted'); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); }
    finally { setActing(false); }
  }
  async function doCancel() {
    try { await A.cancel(live.id); setLive(l=>({...l,status:'cancelled'})); } catch {}
  }

  if (!live) return (
    <div className="min-h-[120px] flex flex-col items-center justify-center text-center space-y-1 py-4">
      <p className="text-sm font-semibold text-gray-600">Progress will appear here</p>
      <p className="text-xs text-gray-400">Start KYC from the left panel.</p>
    </div>
  );

  return (
    <div className={`space-y-4 transition-all duration-300 ${fade}`}>
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
        s==='captcha_required'?'bg-yellow-50 border border-yellow-300':
        s==='otp_required'    ?'bg-purple-50 border border-purple-300':
        s==='review_required' ?'bg-indigo-50 border border-indigo-300':
        s==='completed'       ?'bg-green-50  border border-green-300':
        s==='failed'          ?'bg-red-50    border border-red-300':
                               'bg-blue-50   border border-blue-300'
      }`}>
        <div className="flex items-center gap-2">
          {['running','captcha_required','otp_required','review_required'].includes(s) &&
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block"/>}
          <span className="text-sm font-semibold text-gray-800">
            {s==='running'?'Automation running…':s==='captcha_required'?'🖼 Enter Captcha':
             s==='otp_required'?'📱 Enter OTP':s==='review_required'?'👁 Review Data':
             s==='completed'?'✅ KYC Complete':s==='failed'?'✗ Failed':'Processing…'}
          </span>
        </div>
        {['running','captcha_required','otp_required'].includes(s) &&
          <button onClick={doCancel} className="text-xs text-gray-400 hover:text-red-500">Cancel</button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <p className="text-sm font-medium text-gray-600">Current automation status</p>
        <p className="mt-2 text-sm text-gray-700">{liveMessage}</p>
      </div>

      {s==='captcha_required' && (
        <div className="border-2 border-yellow-300 rounded-xl p-4 bg-yellow-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-yellow-800">🖼 Enter Captcha</p>
            <button onClick={()=>A.refreshCaptcha(live.id).then(()=>setLive(l=>({...l,captchaImage:null})))}
              className="text-xs border border-yellow-400 px-2 py-1 rounded-lg text-yellow-700 hover:bg-yellow-100">↻ Refresh</button>
          </div>
          {live.captchaImage
            ?<img src={live.captchaImage} alt="Captcha" className="w-full max-h-20 object-contain rounded border border-yellow-200 bg-white p-2" style={{imageRendering:'pixelated'}}/>
            :<div className="h-20 bg-white rounded border border-yellow-200 flex items-center justify-center"><span className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"/></div>
          }
          <div className="flex gap-2">
            <input autoFocus type="text" value={captcha} onChange={e=>setCaptcha(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submitCaptcha()}
              placeholder="Case-sensitive — type exactly as shown"
              className="flex-1 border-2 border-yellow-300 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm outline-none bg-white"/>
            <button onClick={submitCaptcha} disabled={acting||!captcha.trim()}
              className="px-4 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5">
              {acting&&<span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>}Submit
            </button>
          </div>
        </div>
      )}

      {s==='otp_required' && (
        <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-purple-800">📱 Enter OTP</p>
            <OtpTimer/>
          </div>
          <p className="text-xs text-purple-700 bg-white rounded-lg px-3 py-2 border border-purple-200">
            Ask the employee for the 6-digit code sent to their Aadhaar-registered mobile.
          </p>
          <div className="flex gap-2">
            <input autoFocus type="text" inputMode="numeric" maxLength={6}
              value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={e=>e.key==='Enter'&&submitOtp()}
              placeholder="• • • • • •"
              className="flex-1 border-2 border-purple-300 focus:border-purple-500 rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.5em] text-center outline-none bg-white"/>
            <button onClick={submitOtp} disabled={acting||otp.length!==6}
              className="px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5">
              {acting&&<span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>}Verify →
            </button>
          </div>
        </div>
      )}

      {s==='review_required' && live.reviewData && (
        <ReviewCard data={live.reviewData} taskId={live.id}
          onConfirmed={()=>{setLive(l=>({...l,status:'running'}));toast.success('Confirmed — saving…');}}
          onCancel={doCancel}/>
      )}

      {s==='completed' && live.resultData && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 space-y-3 animate-in fade-in duration-300">
          <p className="text-sm font-semibold text-green-700">✅ Saved to central database</p>
          {urlMode==='referred'&&returnTo&&<p className="text-xs text-blue-600">↩ Returning to employee form…</p>}
          <div className="flex items-start gap-3">
            {live.resultData.photo&&<img src={live.resultData.photo} alt="Photo" className="w-16 h-16 rounded-xl object-cover border-2 border-green-200 flex-shrink-0" onError={e=>{e.target.style.display='none';}}/>}
            <div className="grid grid-cols-2 gap-1.5 flex-1">
              {[['Name',live.resultData.name],['DOB',live.resultData.dob],
                ['Gender',live.resultData.gender],['State',live.resultData.state],
                ['Pincode',live.resultData.pc]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} className="bg-white rounded-lg px-2 py-1.5 border border-green-100">
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="text-xs font-semibold text-gray-800 capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onReset} className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-50">← Start Another KYC</button>
        </div>
      )}

      {s==='failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-semibold text-red-700">✗ {live.errorMessage || 'Automation failed. Please retry.'}</p>
          <p className="text-xs text-gray-500">If the problem persists, open task logs for the full error details.</p>
          {live.captchaImage && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Screenshot captured at failure:</p>
              <img src={live.captchaImage} alt="Screenshot" className="w-full rounded border border-red-200 max-h-48 object-contain bg-white"/>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={onReset} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-50">← Try Again</button>
            <button onClick={()=>onViewLogs?.(live)} className="flex-1 bg-white border border-red-300 text-red-700 py-2 rounded-xl text-xs hover:bg-red-50">View logs</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AutomationPage() {
  const navigate          = useNavigate();
  const [sp, setSp]       = useSearchParams();
  const urlMode    = sp.get('mode')    || 'direct';
  const urlAadhaar = sp.get('aadhaar') || '';
  const returnTo   = sp.get('returnTo')|| null;
  const urlTab     = sp.get('tab')     || 'ekyc';

  // ── eKYC state (unchanged) ──
  const [step,         setStep]         = useState('aadhaar');
  const [aadhaar,      setAadhaar]      = useState(urlAadhaar);
  const [shareCode,    setShareCode]    = useState('');
  const [dupInfo,      setDupInfo]      = useState(null);
  const [dupChecking,  setDupChecking]  = useState(false);
  const [file,         setFile]         = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [xmlReview,    setXmlReview]    = useState(null);
  const [xmlValidationError, setXmlValidationError] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [logTask,      setLogTask]      = useState(null);
  const fileRef       = useRef(null);
  const rightPanelRef = useRef(null);

  // ── GST state (enhanced) ──
  const [gstin,            setGstin]            = useState('');
  const [gstResult,        setGstResult]        = useState(null);
  const [gstLoading,       setGstLoading]       = useState(false);
  const [gstError,         setGstError]         = useState('');
  const [gstInfo,          setGstInfo]          = useState('');
  const [gstRecordAgeDays, setGstRecordAgeDays] = useState(null);
  const [gstAutoTaskId,    setGstAutoTaskId]    = useState(null);
  const [gstRefreshing,    setGstRefreshing]    = useState(false);

  const { data: tasksRes, refetch } = useQuery({
    queryKey: ['auto-tasks'],
    queryFn:  () => A.tasks({}),
    refetchInterval: 5000,
  });
  const allTasks = tasksRes?.data || [];
  const fmt = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';

  const defaultSC = String(new Date().getDate()).padStart(2,'0') + String(new Date().getMonth()+1).padStart(2,'0');
  const clean = aadhaar.replace(/\s/g,'');
  const aadhaarLastDigit = clean.length >= 12 ? clean[11] : '';
  const aadhaarFirst4    = clean.slice(0,4);
  const cleanGstin       = gstin.trim().replace(/\s/g,'').toUpperCase();

  // ── tab switch — resets GST state when switching to GST tab ──
  function setTab(tab) {
    const next = new URLSearchParams(sp);
    next.set('tab', tab);
    setSp(next);
    if (tab === 'gst') {
      setGstResult(null);
      setGstError('');
      setGstInfo('');
      setGstRecordAgeDays(null);
      setGstAutoTaskId(null);
      setGstRefreshing(false);
    }
  }

  // ── eKYC handlers (unchanged) ──
  function handleAadhaarChange(val) {
    if (urlMode === 'referred') return;
    const v = val.replace(/\D/g,'').slice(0,12).replace(/(\d{4})(\d{0,4})(\d{0,4})/,(_,a,b,c)=>[a,b,c].filter(Boolean).join(' '));
    setAadhaar(v);
  }

  async function handleAadhaarSubmit(e) {
    e.preventDefault();
    if (clean.length !== 12) { toast.error('Enter full 12-digit Aadhaar'); return; }
    setDupChecking(true);
    try {
      const r = await A.checkDup({ aadhaarNumber: clean });
      if (r?.data?.isDuplicate) { setDupInfo(r.data); return; }
    } catch (err) {
      console.warn('[Automation] duplicate check failed', err);
    } finally {
      setDupChecking(false);
    }
    setStep('method');
  }

  const startOtp = useMutation({
    mutationFn: d => A.startOtp(d),
    onSuccess:  r => { const tid=r?.data?.taskId; if(tid){setActiveTaskId(tid);refetch();toast.success('KYC started');} },
    onError:    e => toast.error(e.response?.data?.message||'Failed'),
  });

  const uploadXml = useMutation({
    mutationFn: fd => A.uploadXml(fd),
    onSuccess:  r  => {
      if(r?.data?.requiresReview){
        const xmlFirst4 = r.data?.kycData?.aadhaarFirst4 || r.data?.aadhaarFirst4;
        if (xmlFirst4 && aadhaarFirst4 && xmlFirst4 !== aadhaarFirst4) {
          setXmlValidationError(`XML's Aadhaar starts with ${xmlFirst4}, but entered Aadhaar starts with ${aadhaarFirst4}. Please use the correct XML.`);
          toast.error('Aadhaar mismatch with uploaded XML');
          return;
        }
        setXmlValidationError(null);
        setXmlReview(r.data);
        setStep('xml-review');
      }
    },
    onError: e => toast.error(e.response?.data?.message||'XML parsing failed'),
  });

  const saveReview = useMutation({
    mutationFn: d => A.saveReview(d),
    onSuccess:  (r) => {
      const kycId = r?.data?.kycId || r?.kycId;
      if (urlMode === 'referred' && returnTo && kycId) {
        navigate(`${returnTo}${returnTo.includes('?') ? '&' : '?'}kycId=${kycId}`);
      } else {
        setStep('done');
      }
    },
    onError: e => toast.error(e.response?.data?.message||'Save failed'),
  });

  function submitXml(e) {
    e.preventDefault();
    if (!file) { toast.error('Select a ZIP or XML file'); return; }
    const fd = new FormData();
    fd.append('kycFile', file);
    fd.append('mode', urlMode);
    fd.append('shareCode', shareCode.trim() || defaultSC);
    fd.append('aadhaarLastDigit', aadhaarLastDigit);
    fd.append('aadhaarFirst4', aadhaarFirst4);
    uploadXml.mutate(fd);
  }

  function reset() {
    setStep('aadhaar'); setAadhaar(urlMode === 'referred' ? urlAadhaar : ''); setShareCode('');
    setDupInfo(null); setFile(null); setXmlReview(null); setActiveTaskId(null); setXmlValidationError(null);
  }

  useEffect(() => {
    if (activeTaskId && rightPanelRef.current) {
      setTimeout(() => rightPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [activeTaskId]);

  // ── Enhanced GST Flow ─────────────────────────────────────────────────────

  function resetGstState() {
    setGstResult(null);
    setGstError('');
    setGstInfo('');
    setGstRecordAgeDays(null);
    setGstAutoTaskId(null);
    setGstRefreshing(false);
  }

  async function fetchCentralGst(gstinVal, forceFresh = false) {
    setGstLoading(true);
    setGstError('');
    setGstInfo('Checking central database...');
    setGstResult(null);
    setGstRecordAgeDays(null);
    try {
      const res = await A.centralGst(gstinVal);
      if (res?.success && res.data) {
        const age = res.recordAgeDays ?? null;
        setGstRecordAgeDays(age);

        if (age !== null && age >= 90 && !forceFresh) {
          // Stale — show data but offer refresh
          setGstResult(res.data);
          setGstInfo(`Data in central database is ${age} days old. Click "Refresh" in the card header to fetch latest.`);
          setGstLoading(false);
          return;
        }

        if (age !== null && age >= 90 && forceFresh) {
          setGstInfo('Central record is older than 90 days — triggering automation to fetch latest data…');
          await triggerGstAutomation(gstinVal);
          return; // loading stays true; GstAutoPanel takes over
        }

        // Fresh data
        setGstResult(res.data || res);
        toast.success('✅ GST details loaded from central database');
        setGstLoading(false);
        return;
      }
      // Not found in central — trigger automation
      setGstInfo('No record found in central database. Triggering live portal automation…');
      await triggerGstAutomation(gstinVal);
    } catch (err) {
      // 404 or network error → try automation
      setGstInfo('Central DB lookup failed. Starting automation to fetch live data…');
      await triggerGstAutomation(gstinVal);
    }
  }

  async function triggerGstAutomation(gstinVal) {
    try {
      const res = await A.triggerAuto(gstinVal);
      const taskId = res?.taskId || res?.data?.taskId;
      if (!taskId) throw new Error('No taskId returned');
      setGstAutoTaskId(taskId);
      setGstLoading(false); // GstAutoPanel handles its own loading indicator
    } catch (err) {
      setGstError(err.response?.data?.message || 'Failed to start GST automation. Please try again.');
      toast.error('Automation trigger failed');
      setGstLoading(false);
    }
  }

  async function onGstAutoComplete() {
    // Automation finished → fetch fresh data from central
    setGstAutoTaskId(null);
    await fetchCentralGst(cleanGstin, false);
  }

  function cancelGstAuto() {
    setGstAutoTaskId(null);
    setGstInfo('');
    setGstLoading(false);
  }

  async function handleGstRefresh() {
    if (cleanGstin.length !== 15) return;
    setGstRefreshing(true);
    await fetchCentralGst(cleanGstin, true);
    setGstRefreshing(false);
  }

  function handleGstSubmit(e) {
    e.preventDefault();
    if (cleanGstin.length !== 15) { setGstError('Enter a valid 15-character GSTIN'); return; }
    if (gstAutoTaskId) cancelGstAuto();
    fetchCentralGst(cleanGstin, false);
  }

  // ── render ────────────────────────────────────────────────────────────────
  const isLocked = urlMode === 'referred' && step === 'aadhaar';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Automation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automation tools for Aadhaar eKYC and GST company lookup</p>
        </div>
        {urlMode === 'referred' && (
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            ↩ Referred from <strong>Add Employee</strong> — data auto-fills after KYC
          </div>
        )}
      </div>

      <div className="inline-flex rounded-full bg-gray-100 p-1 border border-gray-200">
        <button onClick={() => setTab('ekyc')}
          className={`px-3 py-2 text-xs font-semibold rounded-full ${urlTab==='ekyc' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Aadhaar eKYC
        </button>
        <button onClick={() => setTab('gst')}
          className={`px-3 py-2 text-xs font-semibold rounded-full ${urlTab==='gst' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          GST Company Details
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className={`w-full ${activeTaskId ? 'md:w-[360px] flex-shrink-0' : 'md:w-full'} space-y-4`}>

          {/* ── GST TAB ── */}
          {urlTab === 'gst' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-800">Company Details by GST</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reads from central DB first. If missing or stale (&gt;90 days), triggers live automation automatically.
                </p>
              </div>

              <form onSubmit={handleGstSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-[0.2em]">GSTIN</label>
                  <input
                    type="text"
                    autoFocus
                    value={gstin}
                    onChange={e => {
                      setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,15));
                      setGstError('');
                      if (gstResult) resetGstState();
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-xl px-4 py-3 text-sm uppercase outline-none mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter the 15-character GSTIN to fetch company details.</p>
                  {gstError && <p className="text-xs text-red-600 mt-1">{gstError}</p>}
                  {gstInfo && !gstError && <p className="text-xs text-blue-600 mt-1">{gstInfo}</p>}
                </div>
                <button
                  type="submit"
                  disabled={gstLoading || cleanGstin.length !== 15 || gstAutoTaskId !== null}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {gstLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>
                  )}
                  {gstLoading ? 'Looking up…' : 'Lookup GST Company Details'}
                </button>
              </form>

              {/* Automation progress panel */}
              {gstAutoTaskId && (
                <GstAutoPanel
                  taskId={gstAutoTaskId}
                  onComplete={onGstAutoComplete}
                  onReset={cancelGstAuto}
                />
              )}

              {/* Result card */}
              {gstResult && !gstAutoTaskId && (
                <GstResultCard
                  data={gstResult}
                  ageDays={gstRecordAgeDays}
                  onRefresh={handleGstRefresh}
                  refreshing={gstRefreshing}
                />
              )}
            </div>
          )}

          {/* ── eKYC TAB (unchanged) ── */}
          {urlTab !== 'gst' && (
            <div className="space-y-4">
              {step === 'done' && (
                <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 text-center space-y-3">
                  <div className="text-4xl">✅</div>
                  <p className="font-bold text-green-800">KYC Complete</p>
                  {urlMode === 'direct' && (
                    <div className="flex gap-2">
                      <button onClick={reset} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm">← Another</button>
                      <button onClick={()=>navigate('/dashboard')} className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-sm font-semibold">Dashboard</button>
                    </div>
                  )}
                </div>
              )}

              {step === 'aadhaar' && (
                <form onSubmit={handleAadhaarSubmit} className="space-y-4">
                  <p className="text-sm font-bold text-gray-800">Enter Aadhaar Number</p>
                  <div className="relative">
                    <input type="text"
                      value={aadhaar}
                      onChange={handleAadhaarChange}
                      disabled={isLocked}
                      placeholder="1234 5678 9012" maxLength={14}
                      className={`w-full border-2 border-gray-300 focus:border-blue-500 rounded-xl px-4 py-3 text-xl font-mono tracking-widest text-center outline-none ${isLocked ? 'bg-gray-100 text-gray-500' : ''}`}/>
                    {isLocked && (
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">🔒</span>
                      </div>
                    )}
                  </div>
                  {aadhaarLastDigit && (
                    <p className="text-xs text-center text-gray-400">
                      Last digit: <span className="font-mono font-bold text-gray-600">{aadhaarLastDigit}</span>
                      <span className="text-gray-300 ml-1">(used for hash iterations)</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1.5"><span>🔒</span>Hash only stored — number never saved</p>
                  {dupInfo?.isDuplicate && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-semibold text-amber-800">⚠ KYC already exists</p>
                      <p className="text-xs text-amber-700">Done on {new Date(dupInfo.createdAt).toLocaleDateString('en-IN')} via {dupInfo.method?.replace(/_/g,' ')}.</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={()=>setStep('method')} className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg">Redo</button>
                        <button type="button" onClick={()=>setDupInfo(null)} className="text-xs px-3 py-1.5 border border-amber-400 text-amber-700 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={dupChecking||clean.length!==12}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    {dupChecking&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                    {dupChecking?'Checking…':'Continue →'}
                  </button>
                </form>
              )}

              {step === 'method' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setStep('aadhaar')} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
                    <span className="text-xs font-mono text-gray-500">{aadhaar.slice(0,5)}•••• ••••</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Choose Method</p>
                  <div className="space-y-3">
                    <button onClick={()=>startOtp.mutate({aadhaarNumber:clean,mode:urlMode})} disabled={startOtp.isPending}
                      className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-500 text-left disabled:opacity-60">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white text-lg flex items-center justify-center flex-shrink-0">🔐</div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-blue-900">OTP-Based</p>
                          <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Recommended</span>
                        </div>
                        <p className="text-xs text-blue-700">Browser automates UIDAI. Captcha + OTP. Full data + photo.</p>
                        {startOtp.isPending&&<p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block"/>Starting…</p>}
                      </div>
                    </button>
                    <button onClick={()=>setStep('xml-form')}
                      className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-400 text-left">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 text-lg flex items-center justify-center flex-shrink-0">📁</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-0.5">Upload Offline XML</p>
                        <p className="text-xs text-gray-500">Employee has ZIP from UIDAI.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === 'xml-form' && (
                <form onSubmit={submitXml} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={()=>setStep('method')} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
                    <p className="text-sm font-bold text-gray-800">📁 Upload XML / ZIP</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Share Code (Reference Code) <span className="text-gray-400 font-normal">(default: {defaultSC})</span>
                    </label>
                    <input type="password" value={shareCode} onChange={e=>setShareCode(e.target.value.replace(/\D/g,'').slice(0,4))}
                      placeholder="••••" maxLength={4}
                      className="w-28 border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono text-center outline-none focus:ring-2 focus:ring-blue-400"/>
                    <p className="text-xs text-gray-400 mt-1">The 4-digit code you set when downloading the XML from UIDAI.</p>
                  </div>
                  <div onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
                    onDrop={e=>{e.preventDefault();setDragging(false);setFile(e.dataTransfer.files[0]);setXmlValidationError(null);}}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging?'border-blue-500 bg-blue-50':file?'border-green-400 bg-green-50':'border-gray-300 hover:border-blue-400'}`}>
                    {file
                      ?<div><p className="text-sm font-semibold text-green-700">📄 {file.name}</p><p className="text-xs text-gray-400">{(file.size/1024).toFixed(1)} KB</p></div>
                      :<div><p className="text-2xl mb-2">📁</p><p className="text-sm text-gray-600">Click or drag .zip / .xml</p><p className="text-xs text-gray-400 mt-1">From UIDAI → myAadhaar → Offline eKYC</p></div>
                    }
                    <input ref={fileRef} type="file" accept=".zip,.xml" className="hidden" onChange={e=>{setFile(e.target.files[0]);setXmlValidationError(null);}}/>
                  </div>
                  {xmlValidationError && (
                    <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-xs text-red-700">
                      {xmlValidationError}
                    </div>
                  )}
                  <button type="submit" disabled={uploadXml.isPending||!file}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    {uploadXml.isPending&&<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                    {uploadXml.isPending?'Parsing…':'Extract & Review →'}
                  </button>
                </form>
              )}

              {step === 'xml-review' && xmlReview && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setStep('xml-form')} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
                    <p className="text-sm font-bold text-gray-800">Review XML Data</p>
                  </div>
                  <ReviewCard data={xmlReview.kycData} taskId={null}
                    onConfirmed={({ mobile, email }) => saveReview.mutate({
                      kycData: {
                        ...xmlReview.kycData,
                        mobile_encrypted: mobile || null,
                        email_encrypted:  email  || null,
                      },
                      aadhaarHash: xmlReview.kycHash || xmlReview.aadhaarHash,
                      method: 'xml_upload',
                      mode:   urlMode,
                      mobile,
                      email,
                    })}
                    onCancel={()=>setStep('xml-form')}/>
                  {saveReview.isPending&&<div className="flex items-center gap-2 text-xs text-indigo-600"><span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>Encrypting and saving…</div>}
                </div>
              )}

              {allTasks.length > 0 && !['xml-review','done'].includes(step) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allTasks.slice(0,4).map(t=>(
                      <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status==='completed'?'bg-green-500':t.status==='failed'?'bg-red-500':t.status==='cancelled'?'bg-gray-400':'bg-blue-500 animate-pulse'}`}/>
                          <span className="text-xs text-gray-600 capitalize">{t.status.replace(/_/g,' ')}</span>
                          <span className="text-xs font-mono text-gray-300">{t.id?.slice(0,6)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{fmt(t.startedAt)}</span>
                          <button onClick={()=>setLogTask(t)} className="text-xs text-blue-400 hover:underline">logs</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — TaskPanel for eKYC (unchanged) */}
        {activeTaskId && (
          <div ref={rightPanelRef} className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-5 overflow-y-auto">
            <TaskPanel taskId={activeTaskId} urlMode={urlMode} returnTo={returnTo}
              onDone={()=>{refetch();setStep('done');}} onReset={reset}
              onViewLogs={setLogTask}/>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-3">
        {activeTaskId
          ? 'KYC is running. Live updates appear in the right panel while the process continues.'
          : 'Select a method to begin KYC. The active process status will appear in a compact panel.'}
      </div>

      <Modal open={!!logTask} onClose={()=>setLogTask(null)} title="Task Audit Log" size="lg">
        {logTask && (
          <div className="max-h-96 overflow-y-auto py-1 space-y-0.5">
            {(logTask.logs||[]).filter(l =>
              l.status==='failed'||l.status==='warning'||
              l.description?.includes('✓')||l.description?.includes('saved')||
              l.description?.includes('Parsed:')||l.description?.includes('Hash:')||
              l.description?.includes('loaded')||l.description?.includes('Received')||
              l.description?.includes('complete')||l.description?.includes('Starting')||
              l.description?.includes('FAILED')
            ).map((l,i)=>(
              <div key={i} className={`flex gap-3 text-xs py-1.5 border-b border-gray-50 ${l.status==='failed'?'text-red-600':l.status==='warning'?'text-amber-600':'text-gray-600'}`}>
                <span className={`flex-shrink-0 ${l.status==='failed'?'text-red-400':l.status==='warning'?'text-amber-400':'text-green-400'}`}>
                  {l.status==='failed'?'✗':l.status==='warning'?'⚠':'✓'}
                </span>
                <span className="flex-1">{l.description}</span>
                <span className="text-gray-300 flex-shrink-0">{new Date(l.timestamp).toLocaleTimeString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

