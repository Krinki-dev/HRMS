import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link }     from 'react-router-dom';
import { useMutation }           from '@tanstack/react-query';
import toast                     from 'react-hot-toast';
import api                       from '../../services/api';

const C = {
  bg:'#06101E', surface:'#0A1628', panel:'#0F1E35',
  border:'#1E3355', borderHi:'#2563EB',
  text:'#E2E8F8', label:'#90A4C8', muted:'#5A7090', faint:'#2A3F58',
  blue:'#2563EB', blueHi:'#1D4ED8',
  green:'#22C55E', amber:'#F59E0B', red:'#EF4444',
  cyan:'#06B6D4', sky:'#38BDF8', white:'#FFFFFF',
  lockBg:'#071520', lockBorder:'#0E4060', lockText:'#A8C8E0',
  editBg:'#131000', editBorder:'#5C3800',
};

const S = {
  page:    { minHeight:'100vh', background:C.bg, color:C.text, fontFamily:"'Plus Jakarta Sans','DM Sans',system-ui,sans-serif", display:'flex', flexDirection:'column' },
  nav:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4%', height:52, flexShrink:0, borderBottom:`1px solid ${C.border}` },
  logo:    { display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:C.white, textDecoration:'none' },
  mark:    { width:28, height:28, background:C.blue, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:C.white },
  body:    { display:'flex', flex:1, overflow:'hidden' },
  hero:    { width:280, flexShrink:0, background:'linear-gradient(160deg,#040C1A 0%,#071428 60%,#0A1D3A 100%)', borderRight:`1px solid ${C.border}`, padding:'40px 28px', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' },
  scroll:  { flex:1, overflowY:'auto', display:'flex', justifyContent:'center', padding:'32px 32px' },
  inner:   { width:'100%', maxWidth:960 },
  stepBar: { display:'flex', gap:6, marginBottom:28 },
  input:   { width:'100%', padding:'10px 13px', background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, outline:'none', transition:'border-color 0.15s', boxSizing:'border-box', fontFamily:'inherit' },
  inputRO: { width:'100%', padding:'10px 13px', background:C.lockBg, border:`1px solid ${C.lockBorder}`, borderRadius:8, color:C.lockText, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', cursor:'not-allowed' },
  inputED: { width:'100%', padding:'10px 13px', background:C.editBg, border:`1px solid ${C.editBorder}`, borderRadius:8, color:C.text, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  select:  { width:'100%', padding:'10px 13px', background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', cursor:'pointer' },
  field:   { marginBottom:14 },
  lbl:     { display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:C.label, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5, flexWrap:'wrap' },
  hint:    { fontSize:11, color:C.muted, marginTop:3 },
  row2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  row3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 },
  row4:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14 },
  btn:     { padding:'11px 20px', background:C.blue, color:C.white, border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', transition:'background 0.15s', fontFamily:'inherit' },
  btnOut:  { padding:'10px 20px', background:'transparent', color:'#94A3CE', border:`1px solid rgba(99,120,255,0.25)`, borderRadius:8, fontSize:14, cursor:'pointer', fontFamily:'inherit' },
  dbCard:  { padding:'14px 16px', background:C.panel, border:`2px solid ${C.border}`, borderRadius:10, cursor:'pointer', transition:'all 0.15s', marginBottom:10 },
  dbActive:{ padding:'14px 16px', background:'rgba(37,99,235,0.07)', border:`2px solid ${C.borderHi}`, borderRadius:10, cursor:'pointer', transition:'all 0.15s', marginBottom:10 },
  credBox: { padding:'18px', background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, marginTop:4, marginBottom:4 },
  errBox:  { padding:'10px 14px', background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, color:'#F87171', fontSize:13, marginBottom:16 },
  info:    { padding:'10px 14px', background:'rgba(37,99,235,0.07)', border:`1px solid rgba(37,99,235,0.2)`, borderRadius:8, color:'#93C5FD', fontSize:12, marginBottom:12 },
  ok:      { width:64, height:64, background:'rgba(34,197,94,0.12)', border:'2px solid rgba(34,197,94,0.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 20px' },
  statusBanner: { display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:'rgba(37,99,235,0.08)', border:`1px solid rgba(37,99,235,0.25)`, borderRadius:10, marginBottom:18 },
  secHead: { fontSize:11, fontWeight:700, color:C.sky, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:12, marginTop:6, display:'flex', alignItems:'center', gap:6 },
};

const sc    = v => (!v || typeof v !== 'string') ? '' : v.replace(/^[:\s]+/, '').trim();
const clean = v => { const s = sc(v); return s.length > 0 ? s : null; };

const fmt = {
  gstin: v => v.replace(/\s/g,'').toUpperCase().slice(0,15),
  pan:   v => v.replace(/\s/g,'').toUpperCase().slice(0,10),
  email: v => v.toLowerCase().trimStart(),
  phone: v => v.replace(/[^0-9+]/g,'').slice(0,13),
  trim:  v => v.trimStart(),
};

const STEPS = ['Company','Database','Admin','Done'];

const INDIA_STATES = [
  'Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar',
  'Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka',
  'Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

const DB_MODES = [
  { id:'cloud',          title:'Syntern Cloud (recommended)', desc:'We host your database. Zero setup, always accessible.',      badge:'Easiest',      badgeColor:C.green,   creds:null },
  { id:'local',          title:'On-premise / local server',   desc:'Your own PostgreSQL, MySQL or SQL Server on-site.',          badge:'Full control', badgeColor:C.amber,   creds:'local' },
  { id:'hybrid',         title:'Hybrid (local + cloud sync)', desc:'Local primary; cloud auto-syncs every 5 min as backup.',     badge:'Best of both', badgeColor:'#A78BFA', creds:'both' },
  { id:'external_cloud', title:'Bring your own cloud DB',     desc:'Supabase, Neon, PlanetScale, Railway, or any Postgres URL.', badge:'Advanced',     badgeColor:'#60A5FA', creds:'url' },
];

function Field({ label, required, hint, locked, editable, children }) {
  return (
    <div style={S.field}>
      <div style={S.lbl}>
        <span>{label}</span>
        {required && <span style={{color:C.red}}>*</span>}
        {locked   && <span style={{fontSize:'9px',color:C.sky,background:'#071F30',padding:'1px 5px',borderRadius:3}}>🔒 locked</span>}
        {editable && <span style={{fontSize:'9px',color:C.amber,background:'#1C1000',padding:'1px 5px',borderRadius:3}}>✏ fill</span>}
      </div>
      {children}
      {hint && <div style={S.hint}>{hint}</div>}
    </div>
  );
}

function SI({ value, onChange, placeholder, type='text', maxLength, locked, editable, mono, iref }) {
  const base = locked ? S.inputRO : editable ? S.inputED : S.input;
  return (
    <input ref={iref} type={type} value={value}
      onChange={e => !locked && onChange(e.target.value)}
      placeholder={locked ? '' : placeholder}
      maxLength={maxLength} readOnly={!!locked}
      style={{...base, ...(mono?{fontFamily:'monospace'}:{})}}
      onFocus={e => { if (!locked) e.target.style.borderColor = C.borderHi; }}
      onBlur={e  => { if (!locked) e.target.style.borderColor = editable ? C.editBorder : C.border; }}
    />
  );
}

function Input({ value, onChange, placeholder, type='text', maxLength, readOnly, mono, style:extra }) {
  return (
    <input type={type} value={value}
      onChange={e => !readOnly && onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength} readOnly={readOnly}
      style={readOnly ? {...S.inputRO,...(mono?{fontFamily:'monospace'}:{}),...extra} : {...S.input,...(mono?{fontFamily:'monospace'}:{}),...extra}}
      onFocus={e => !readOnly && (e.target.style.borderColor = C.borderHi)}
      onBlur={e  => !readOnly && (e.target.style.borderColor = C.border)}
    />
  );
}

function StateSelect({ value, onChange, locked, editable }) {
  if (locked) return <input value={value} readOnly style={S.inputRO}/>;
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={editable ? {...S.select, border:`1px solid ${C.editBorder}`, background:C.editBg} : S.select}>
      <option value="">Select state</option>
      {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function StepBar({ step }) {
  return (
    <div style={S.stepBar}>
      {STEPS.map((label,i) => {
        const n=i+1,active=step===n,done=step>n;
        return (
          <div key={label} style={{flex:1}}>
            <div style={{height:3,borderRadius:2,marginBottom:5,background:done?C.green:active?C.blue:'rgba(99,120,255,0.1)'}}/>
            <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.4px',color:done?C.green:active?'#60A5FA':C.faint}}>
              {done?'✓ ':''}{label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LocalDbFields({ localDb, setLocalDb }) {
  return (
    <div style={S.credBox}>
      <div style={{fontSize:12,fontWeight:700,color:'#94A3CE',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.4px'}}>Local database connection</div>
      <div style={{...S.row2,marginBottom:14}}>
        <Field label="Database type">
          <select value={localDb.type} onChange={e=>setLocalDb(d=>({...d,type:e.target.value,port:e.target.value==='mysql'?'3306':e.target.value==='mssql'?'1433':'5432'}))} style={S.select}>
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL / MariaDB</option>
            <option value="mssql">SQL Server (MSSQL)</option>
            <option value="sqlite">SQLite (dev only)</option>
          </select>
        </Field>
        <Field label="Port"><Input value={localDb.port} onChange={v=>setLocalDb(d=>({...d,port:v.replace(/\D/g,'')}))} placeholder="5432" maxLength={5}/></Field>
      </div>
      <Field label="Host / IP" required><Input value={localDb.host} onChange={v=>setLocalDb(d=>({...d,host:v.trim()}))} placeholder="192.168.1.10 or localhost"/></Field>
      <Field label="Database name" required><Input value={localDb.name} onChange={v=>setLocalDb(d=>({...d,name:v.trim()}))} placeholder="hrms_company"/></Field>
      <div style={S.row2}>
        <Field label="Username" required><Input value={localDb.user} onChange={v=>setLocalDb(d=>({...d,user:v.trim()}))} placeholder="postgres"/></Field>
        <Field label="Password"><Input value={localDb.pass} onChange={v=>setLocalDb(d=>({...d,pass:v}))} type="password" placeholder=""/></Field>
      </div>
    </div>
  );
}

function CloudUrlField({ value, onChange, label='Cloud database URL', placeholder='postgresql://user:pass@host:5432/dbname' }) {
  return (
    <div style={S.credBox}>
      <div style={{fontSize:12,fontWeight:700,color:'#94A3CE',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.4px'}}>{label}</div>
      <Field label="Connection URL" required hint="Works with Supabase, Neon, PlanetScale, Railway, or any PostgreSQL / MySQL URL.">
        <Input value={value} onChange={onChange} placeholder={placeholder}/>
      </Field>
    </div>
  );
}

const EMPTY_COMPANY = {
  name:'', legalName:'', gstin:'', pan:'', email:'', phone:'',
  city:'', state:'', stateCode:'', street:'', pincode:'',
  flatNo:'', branchNo:'', branchName:'', gstCoords:'',
  gstStatus:'', gstRegDate:'', cancelDate:'', taxpayerType:'',
  constitutionOfBusiness:'', businessNature:[], dealingIn:[],
  stateJuri:'', centerJuri:'', centerCode:'',
  gstFetched:false, gstFromCache:false, gstPartial:false,
  locked:{},
};

const suggestSubdomain = name =>
  name.toLowerCase()
    .replace(/private limited|pvt\.?\s*ltd\.?|ltd\.?|llp|inc\.?|enterprise(s)?/gi,'')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,20);

export default function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState('');
  const [company, setCompany] = useState(EMPTY_COMPANY);

  const [gstLoading,  setGstLoading]  = useState(false);
  const [gstSuccess,  setGstSuccess]  = useState(false);
  const [gstError,    setGstError]    = useState('');
  const [gstCardData, setGstCardData] = useState(null);
  const [gstInfo, setGstInfo] = useState('');
  const [gstRecordAgeDays, setGstRecordAgeDays] = useState(null);
  const [samePanTenant, setSamePanTenant] = useState(null);
  const [gstRegisteredTenant, setGstRegisteredTenant] = useState(null);
  const [branchLinkTenantId, setBranchLinkTenantId] = useState('');
  const [branchLinkLoading, setBranchLinkLoading] = useState(false);
  const [branchLinkMessage, setBranchLinkMessage] = useState('');
  const [refreshing,  setRefreshing]  = useState(false);

  const [autoTaskId, setAutoTaskId] = useState(null);
  const [autoStatus, setAutoStatus] = useState(null);
  const [autoStep,   setAutoStep]   = useState('');
  const pollIntervalRef = useRef(null);
  const emailRef        = useRef(null);

  const [dbMode,   setDbMode]   = useState('cloud');
  const [localDb,  setLocalDb]  = useState({type:'postgres',host:'',port:'5432',name:'',user:'',pass:''});
  const [cloudUrl, setCloudUrl] = useState('');

  const [admin,      setAdmin]      = useState({name:'',email:'',phone:'',password:''});
  const [subdomain,  setSubdomain]  = useState('');
  const [domainType, setDomainType] = useState('subdomain'); 
  const [customDomain, setCustomDomain] = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [consent,    setConsent]    = useState(false);
  const [result,     setResult]     = useState(null);

  const applyGstData = useCallback((d, partial=false) => {
    if (!d) return;

    const legalname  = clean(d.legalname  || d.legalName);
    const tradename  = clean(d.tradename  || d.tradeName);
    const status     = clean(d.status     || d.gstStatus);
    const regdate    = clean(d.regdate    || d.gstRegDate);
    const cancelDate = clean(d.canceldate || d.cancelDate);
    const type       = clean(d.type       || d.taxpayerType);
    const constit    = clean(d.constitutionofbusiness || d.constitutionOfBusiness);
    const stateJuri  = clean(d.statejuri  || d.stateJurisdiction);
    const stateCd    = clean(d.statecode  || d.stateCode   || d.state_code);
    const centerJuri = clean(d.centerjuri || d.centreJurisdiction || d.center_juri);
    const centerCode = clean(d.centercode || d.centreCode  || d.center_code);
    const district   = clean(d.district   || d.city);
    const gstCoords  = clean(d.location);
    const street     = clean(d.street);
    const flatNo     = clean(d.flatno     || d.flatNo   || d.flat_no);
    const branchNo   = clean(d.branchno   || d.branchNo || d.branch_no);
    const branchName = clean(d.branchname || d.branchName || d.branch_name);
    const pan        = clean(d.pan);
    const pincode    = clean(d.pincode);
    const rawState   = clean(d.state);
    const busNature  = d.businessnature || d.business_nature || d.businessNature || [];
    const dealingIn  = d.dealingin      || d.dealing_in      || d.dealingIn      || [];

    const matchedState = rawState
      ? (INDIA_STATES.find(s => s.toLowerCase() === rawState.toLowerCase()) || rawState)
      : null;

    const locked = {
      pan:        !!pan,
      legalName:  !!legalname,
      city:       !!district,
      state:      !!matchedState,
      stateCode:  !!stateCd,
      street:     !!street,
      pincode:    !!pincode,
      flatNo:     !!flatNo,
      branchNo:   !!branchNo,
      branchName: !!branchName,
      gstCoords:  !!gstCoords,
    };

    setCompany(c => ({
      ...c,
      gstin:   c.gstin,
      pan:     pan            || c.pan,
      name:    tradename      || legalname || c.name,
      legalName:  legalname   || c.legalName,
      city:    district       || c.city,
      state:   matchedState   || c.state,
      stateCode:  stateCd     || c.stateCode,
      street:  street         || c.street,
      pincode: pincode        || c.pincode,
      flatNo:  flatNo         || c.flatNo,
      branchNo:   branchNo    || c.branchNo,
      branchName: branchName  || c.branchName,
      gstCoords:  gstCoords   || c.gstCoords,
      gstStatus:  status      || c.gstStatus,
      gstRegDate: regdate     || c.gstRegDate,
      cancelDate: cancelDate  || c.cancelDate,
      taxpayerType: type      || c.taxpayerType,
      constitutionOfBusiness: constit || c.constitutionOfBusiness,
      businessNature: busNature.length ? busNature : c.businessNature,
      dealingIn:  dealingIn.length ? dealingIn : c.dealingIn,
      stateJuri:  stateJuri   || c.stateJuri,
      centerJuri: centerJuri  || c.centerJuri,
      centerCode: centerCode  || c.centerCode,
      gstFetched:   true,
      gstFromCache: d.fromCache ?? false,
      gstPartial:   partial,
      locked,
    }));

    setGstCardData({ gstin:d.gstin, pan, legalname, tradename, status, fromCache:d.fromCache??false, partial });

    if ((tradename || legalname) && !subdomain)
      setSubdomain(suggestSubdomain(tradename || legalname));

    setTimeout(() => emailRef.current?.focus(), 150);
  }, [subdomain]);

  const fetchFromCentralTable = useCallback(async gstin => {
    try {
      const res = await api.get(`/gst/central/${gstin}`);
      if (res.data?.success) return res.data;
      return null;
    } catch(err) { return null; }
  }, []);

  const checkGstinRegistration = useCallback(async gstin => {
    try {
      const res = await api.get(`/platform/gstin-check/${gstin}`);
      if (res.data?.success) return res.data;
      return null;
    } catch (err) {
      return null;
    }
  }, []);

  const requestBranchLink = useCallback(async (gstin, tenantId) => {
    if (!gstin || !tenantId) return;
    setBranchLinkLoading(true);
    setBranchLinkMessage('');
    try {
      const payload = {
        gstin,
        targetTenantId: tenantId,
        branchNo: company.branchNo || null,
        branchName: company.branchName || null,
        city: company.city || null,
        state: company.state || null,
        pincode: company.pincode || null,
      };
      const res = await api.post('/platform/link-branch', payload);
      if (res.data?.success) {
        setBranchLinkMessage('Branch link request submitted successfully. Support will review and approve it soon.');
      } else {
        setBranchLinkMessage(res.data?.message || 'Could not submit branch link request.');
      }
    } catch (err) {
      setBranchLinkMessage(err.response?.data?.message || 'Branch link request failed.');
    } finally {
      setBranchLinkLoading(false);
    }
  }, [company.branchNo, company.branchName, company.city, company.state, company.pincode]);

  const triggerAutomation = useCallback(async gstin => {
    const res = await api.post(`/gst/automation/trigger/${gstin}`);
    return res.data.taskId;
  }, []);

  const pollAutomationStatus = useCallback((taskId, gstin) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/gst/automation/status/${taskId}`);
        const { status, logs, error } = res.data;
        if (logs?.length) setAutoStep(logs[logs.length-1]?.message || '');

        if (status === 'completed') {
          clearInterval(pollIntervalRef.current); pollIntervalRef.current = null;
          setAutoStep('Saving data…');
          
          const centralData = await fetchFromCentralTable(gstin);
          if (centralData) {
            applyGstData(centralData.data, false);
            setGstSuccess(true);
            toast.success('✅ GST details fetched and auto-filled!');
          } else {
            setGstError('Automation completed but data not found. Fill manually.');
            toast.error('Automation done but no data found.');
          }
          setAutoTaskId(null); setAutoStatus(null); setAutoStep(''); setGstLoading(false);
        } else if (status === 'failed') {
          clearInterval(pollIntervalRef.current); pollIntervalRef.current = null;
          setGstError(`Automation failed: ${error||'Unknown error'}. Fill manually.`);
          toast.error(`GST automation failed: ${error||'Unknown error'}`);
          setAutoTaskId(null); setAutoStatus(null); setAutoStep(''); setGstLoading(false);
        }
      } catch(err) { console.error('GST Poll error', err.message); }
    }, 2000);
  }, [fetchFromCentralTable, applyGstData]);

  const handleGstinChange = useCallback(async (value, forceFresh = false) => {
    const formatted = fmt.gstin(value);
    setGstSuccess(false); setGstError(''); setGstInfo(''); setSamePanTenant(null); setGstRegisteredTenant(null); setGstRecordAgeDays(null);
    const pan = formatted.length >= 12 ? formatted.substring(2,12) : company.pan;
    setCompany(c => ({
      ...c, gstin:formatted, pan,
      ...(formatted.length === 15 ? {
        name:'', legalName:'', city:'', state:'', stateCode:'', street:'',
        pincode:'', flatNo:'', branchNo:'', branchName:'', gstCoords:'',
        gstStatus:'', gstFetched:false, locked:{},
      } : {}),
    }));
    if (formatted.length < 15) {
      setGstCardData(null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setAutoTaskId(null); setAutoStatus(null); setAutoStep('');
      return;
    }

    setGstLoading(true); setGstError('');
    try {
      const registration = await checkGstinRegistration(formatted);
      if (registration?.exists) {
        const exact = registration.exact;
        setGstRegisteredTenant(exact);
        setGstError(`GSTIN ${formatted} is already registered with ${exact.name || exact.legal_name} (${exact.subdomain}).`);
        setGstInfo('If this is a branch of the same business, contact support to link it to the existing account.');
        setGstLoading(false);
        return;
      }
      if (registration?.samePan?.length) {
        setSamePanTenant(registration.samePan);
        setGstInfo('This PAN is already registered with other company accounts. For a single account across multiple GSTINs, contact support to link the branches.');
      }

      const centralData = await fetchFromCentralTable(formatted);
      if (centralData) {
        const age = centralData.recordAgeDays ?? null;
        if (age !== null) {
          setGstRecordAgeDays(age);
        }

        if (age !== null && age >= 90) {
          setGstInfo(`GST details in central database are ${age} days old. Press Refresh to fetch latest data.`);
          if (!forceFresh) {
            setGstLoading(false);
            return;
          }
          setGstInfo('Fetching the latest GST data because the central record is older than 90 days...');
        }

        if (age !== null && age >= 90 && forceFresh) {
          const taskId = await triggerAutomation(formatted);
          setAutoTaskId(taskId); setAutoStatus('running'); setAutoStep('Opening gstsearch.in…');
          pollAutomationStatus(taskId, formatted);
          return;
        }

        applyGstData(centralData.data, false);
        setGstSuccess(true);
        toast.success('✅ GST details loaded from central database');
        setGstLoading(false);
        return;
      }

      const taskId = await triggerAutomation(formatted);
      setAutoTaskId(taskId); setAutoStatus('running'); setAutoStep('Opening gstsearch.in…');
      pollAutomationStatus(taskId, formatted);
    } catch(err) {
      setGstError('Failed to fetch GST details. Fill manually or try again.');
      toast.error(err.response?.data?.message || 'GST lookup failed');
      setGstLoading(false);
    }
  }, [company.pan, checkGstinRegistration, fetchFromCentralTable, applyGstData, triggerAutomation, pollAutomationStatus]);

  const handleRefresh = useCallback(async () => {
    if (!company.gstin || company.gstin.length !== 15) return;
    setRefreshing(true);
    await handleGstinChange(company.gstin, true);
    setRefreshing(false);
  }, [company.gstin, handleGstinChange]);

  useEffect(() => () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); }, []);

  useEffect(() => {
    if (samePanTenant?.length && !branchLinkTenantId) {
      setBranchLinkTenantId(samePanTenant[0].id);
    }
  }, [samePanTenant, branchLinkTenantId]);

  const lk = f => company.gstFetched && company.locked[f] === true;
  const ed = f => company.gstFetched && !company.locked[f];

  const validate = () => {
    setError('');
    if (step===1) {
      if (!company.name.trim())  { setError('Company name is required.');  return false; }
      if (!company.email.trim()) { setError('Company email is required.'); return false; }
      return true;
    }
    if (step===2) {
      const mode = DB_MODES.find(m=>m.id===dbMode);
      if (mode.creds==='local'||mode.creds==='both') {
        if (!localDb.host) { setError('Database host is required.'); return false; }
        if (!localDb.name) { setError('Database name is required.'); return false; }
        if (!localDb.user) { setError('Database username is required.'); return false; }
      }
      if (mode.creds==='both'&&!cloudUrl.trim()) { setError('Cloud sync URL is required for hybrid mode.'); return false; }
      if (mode.creds==='url' &&!cloudUrl.trim()) { setError('Database connection URL is required.'); return false; }
      return true;
    }
    if (step===3) {
      if (!admin.name.trim())  { setError('Admin name is required.'); return false; }
      if (!admin.email.trim()) { setError('Admin email is required.'); return false; }
      if (!subdomain.trim())   { setError('Subdomain is required.'); return false; }
      if (domainType === 'custom' && !customDomain.trim()) {
        setError('Custom domain is required for a dedicated portal address.');
        return false;
      }
      if (domainType === 'custom' && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(customDomain.trim().toLowerCase())) {
        setError('Enter a valid custom domain such as hrms.company.com.');
        return false;
      }
      if (!admin.password||admin.password.length<8) { setError('Password must be at least 8 characters.'); return false; }
      if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(admin.password)) { setError('Password needs uppercase, number & special character.'); return false; }
      if (!consent) { setError('Please accept the Privacy Policy to continue.'); return false; }
      return true;
    }
    return true;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company: {
          name:company.name, legalName:company.legalName, gstin:company.gstin, pan:company.pan,
          email:company.email, phone:company.phone,
          city:company.city, state:company.state, stateCode:company.stateCode,
          pincode:company.pincode, street:company.street, flatNo:company.flatNo,
          branchNo:company.branchNo, branchName:company.branchName,
          gstStatus:company.gstStatus, gstRegDate:company.gstRegDate, cancelDate:company.cancelDate,
          taxpayerType:company.taxpayerType, constitutionOfBusiness:company.constitutionOfBusiness,
          businessNature:company.businessNature, dealingIn:company.dealingIn,
          stateJuri:company.stateJuri, centerJuri:company.centerJuri, centerCode:company.centerCode,
          gstCoords:company.gstCoords,
        },
        subdomain,
        customDomain: domainType === 'custom' ? customDomain.trim().toLowerCase() : null,
        dbMode,
        localDb:        dbMode==='local'||dbMode==='hybrid' ? localDb : undefined,
        externalDbUrl:  dbMode==='external_cloud' ? cloudUrl : undefined,
        cloudBackupUrl: dbMode==='hybrid' ? cloudUrl : undefined,
        admin:{name:admin.name,email:admin.email,phone:admin.phone,password:admin.password},
        consent:true,
      };
      const res = await api.post('/platform/register', payload);
      return res.data;
    },
    onSuccess: data => { setResult(data.data); setStep(4); toast.success('Company registered successfully!'); },
    onError: err => {
      const data = err.response?.data;
      setError(data?.message||'Registration failed. Please try again.');
      if (data?.field==='subdomain'||data?.field==='email'||data?.field==='phone') setStep(3);
    },
  });

  const next = () => { if (validate()) { if (step===3) registerMutation.mutate(); else setStep(s=>s+1); } };
  const back = () => { setStep(s=>Math.max(1,s-1)); setError(''); };

  const heroContent = [
    {icon:'🏢',title:'Set up your company',  sub:'Takes about 3 minutes. All fields can be updated in Settings later.'},
    {icon:'🗄️',title:'Choose your database', sub:'Syntern Cloud is easiest — we manage everything. Local for on-premise control.'},
    {icon:'👤',title:'Create admin account', sub:'This will be the Super Admin. More users can be added after setup.'},
    {icon:'🎉',title:"You're all set!",       sub:'Your HRMS portal is ready. Login to start adding employees.'},
  ][step-1];

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#06101E} ::-webkit-scrollbar-thumb{background:#1E3355;border-radius:3px} select option{background:#0F1E35;color:#E2E8F8}`}</style>

      <nav style={S.nav}>
        <Link to="/" style={S.logo}><div style={S.mark}>S</div>Syntern HRMS</Link>
        <Link to="/login" style={{fontSize:13,color:C.faint,textDecoration:'none'}}>Already registered? Sign in →</Link>
      </nav>

      <div style={S.body}>
        <div style={S.hero}>
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
          <div style={{position:'relative',flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(37,99,235,0.14)',border:'1px solid rgba(37,99,235,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:20}}>{heroContent.icon}</div>
            <h2 style={{fontSize:20,fontWeight:800,color:C.white,letterSpacing:'-0.5px',margin:'0 0 10px',lineHeight:1.2}}>{heroContent.title}</h2>
            <p style={{fontSize:13,color:'#4B5563',lineHeight:1.6,margin:'0 0 32px'}}>{heroContent.sub}</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {STEPS.map((label,i) => {
                const n=i+1,active=step===n,done=step>n;
                return (
                  <div key={label} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:8,background:active?'rgba(37,99,235,0.1)':'transparent',border:active?'1px solid rgba(37,99,235,0.25)':'1px solid transparent'}}>
                    <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,background:done?'rgba(34,197,94,0.15)':active?'rgba(37,99,235,0.2)':'rgba(99,120,255,0.06)',border:`1px solid ${done?'rgba(34,197,94,0.4)':active?'rgba(37,99,235,0.4)':'rgba(99,120,255,0.12)'}`,color:done?'#4ADE80':active?'#60A5FA':C.faint}}>
                      {done?'✓':n}
                    </div>
                    <span style={{fontSize:12,fontWeight:active?600:400,color:done?'#4ADE80':active?C.text:C.faint}}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{position:'relative',paddingTop:20,borderTop:`1px solid ${C.border}`}}>
            <p style={{fontSize:11,color:C.faint,margin:0,lineHeight:1.5}}>🔒 256-bit encrypted · Data isolation per tenant · GDPR ready</p>
          </div>
        </div>

        <div style={S.scroll}>
          <div style={S.inner}>
            <StepBar step={step}/>
            {error && <div style={S.errBox}>{error}</div>}

            {}
            {step===1 && (
              <>
                <h2 style={{fontSize:22,fontWeight:700,color:C.white,margin:'0 0 4px'}}>Register your company</h2>
                <p style={{fontSize:13,color:C.muted,margin:'0 0 24px'}}>Enter your GSTIN — all company details fill automatically.</p>

                <Field label={
                  <span style={{display:'flex',alignItems:'center',gap:8}}>
                    GSTIN
                    {gstLoading && <span style={{color:'#60A5FA',fontSize:10,display:'flex',alignItems:'center',gap:4}}><span style={{display:'inline-block',width:10,height:10,border:'2px solid #60A5FA',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Looking up…</span>}
                    {gstSuccess && !gstLoading && <span style={{color:C.green,fontSize:10,fontWeight:600}}>✓ Auto-filled</span>}
                  </span>
                } hint="Enter your 15-digit GSTIN — all company details fill automatically">
                  <input value={company.gstin} onChange={e=>handleGstinChange(e.target.value)} placeholder="e.g. 09ABCDE1234H8ZY" maxLength={15}
                    style={{...S.input,fontFamily:'monospace',fontSize:15,letterSpacing:'0.08em',borderColor:gstSuccess?'rgba(34,197,94,0.5)':gstError?'rgba(239,68,68,0.4)':C.border}}
                    onFocus={e=>e.target.style.borderColor=C.borderHi}
                    onBlur={e=>e.target.style.borderColor=gstSuccess?'rgba(34,197,94,0.5)':gstError?'rgba(239,68,68,0.4)':C.border}/>
                  {gstError && <div style={{color:'#F87171',fontSize:11,marginTop:4}}>{gstError}</div>}
                  {gstInfo && !gstError && <div style={{color:'#93C5FD',fontSize:11,marginTop:4,display:'flex',alignItems:'center',gap:8}}>
                    <span>{gstInfo}</span>
                    {gstRecordAgeDays != null && <button onClick={handleRefresh} type="button" disabled={refreshing} style={{padding:'4px 10px',background:'rgba(37,99,235,0.16)',border:'1px solid rgba(37,99,235,0.35)',borderRadius:6,color:'#60A5FA',fontSize:11,cursor:refreshing?'not-allowed':'pointer',opacity:refreshing?0.6:1}}>Refresh</button>}
                  </div>}
                  {samePanTenant && samePanTenant.length > 0 && (
                    <div style={{color:'#FBBF24',fontSize:11,marginTop:4}}>
                      <div>This PAN is already registered with {samePanTenant.length} other account(s).</div>
                      <div>If this GSTIN belongs to a branch of one of those companies, request branch linking instead of creating a new tenant.</div>
                      <div style={{marginTop:8,display:'grid',gap:10}}>
                        {samePanTenant.map((tenant, index) => (
                          <label key={tenant.id} style={{display:'flex',alignItems:'center',gap:10,fontSize:11}}>
                            <input type="radio" name="branch-target" value={tenant.id}
                              checked={branchLinkTenantId === tenant.id}
                              onChange={() => setBranchLinkTenantId(tenant.id)} />
                            <span>{tenant.name || tenant.legal_name || tenant.subdomain} · {tenant.gstin || 'GSTIN unknown'}</span>
                          </label>
                        ))}
                        <button type="button" onClick={() => requestBranchLink(company.gstin, branchLinkTenantId || samePanTenant[0]?.id)}
                          disabled={branchLinkLoading || !(branchLinkTenantId || samePanTenant[0]?.id)}
                          style={{padding:'8px 12px',background:'#F59E0B',border:'none',borderRadius:8,color:'#0F172A',fontSize:12,cursor:branchLinkLoading?'not-allowed':'pointer'}}>
                          {branchLinkLoading ? 'Requesting…' : 'Request branch link'}
                        </button>
                        {branchLinkMessage && <div style={{color:'#93C5FD',fontSize:11}}>{branchLinkMessage}</div>}
                      </div>
                    </div>
                  )}
                </Field>

                {autoTaskId && autoStatus==='running' && (
                  <div style={S.statusBanner}>
                    <span style={{display:'inline-block',width:18,height:18,border:'2px solid #60A5FA',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:C.white,marginBottom:2}}>Fetching GST details…</div>
                      <div style={{fontSize:11,color:C.muted}}>{autoStep||'Automation running on gstsearch.in — this takes 15–30 seconds.'}</div>
                    </div>
                    {company.gstin && <span style={{marginLeft:'auto',fontSize:10,fontFamily:'monospace',color:'#60A5FA',background:'rgba(37,99,235,0.1)',padding:'3px 8px',borderRadius:6}}>{company.gstin}</span>}
                  </div>
                )}

                {gstSuccess && company.gstFetched && (
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:10,marginBottom:18}}>
                    <span style={{fontSize:16}}>✅</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:C.green,marginBottom:1}}>GST data auto-filled</div>
                      <div style={{fontSize:11,color:C.muted}}>{company.legalName} · {company.gstStatus} · {company.gstFromCache?'From cache':'Fresh'}</div>
                    </div>
                    <button onClick={handleRefresh} disabled={refreshing} style={{marginLeft:'auto',padding:'5px 12px',fontSize:11,fontWeight:600,background:'rgba(37,99,235,0.15)',border:`1px solid ${C.borderHi}`,borderRadius:6,color:'#60A5FA',cursor:refreshing?'not-allowed':'pointer',opacity:refreshing?0.5:1,fontFamily:'inherit'}}>
                      {refreshing?'…':'↺ Refresh'}
                    </button>
                  </div>
                )}

                <div style={S.secHead}>🏷 Company Identity</div>
                <div style={S.row3}>
                  <Field label="Company / Trade name" required>
                    <SI value={company.name} onChange={v=>setCompany(c=>({...c,name:fmt.trim(v)}))} placeholder="ABC Pvt Ltd"/>
                  </Field>
                  <Field label="PAN" hint="Auto-extracted from GSTIN" locked={lk('pan')} editable={ed('pan')}>
                    <SI value={company.pan} onChange={v=>setCompany(c=>({...c,pan:fmt.pan(v)}))} placeholder="ABCDE1234F" maxLength={10} mono locked={lk('pan')} editable={ed('pan')}/>
                  </Field>
                  <Field label="Legal name (GST / MCA)" locked={lk('legalName')} editable={ed('legalName')}>
                    <SI value={company.legalName} onChange={v=>setCompany(c=>({...c,legalName:fmt.trim(v)}))} placeholder="ABC PRIVATE LIMITED" locked={lk('legalName')} editable={ed('legalName')}/>
                  </Field>
                </div>

                <div style={S.secHead}>
                  📍 Registered Address
                  {company.gstFetched && <span style={{fontSize:10,color:C.sky,fontWeight:400,textTransform:'none'}}>— 🔒 locked = from GST · ✏ fill = not in GST data</span>}
                </div>
                <div style={S.row4}>
                  <Field label="Flat No / Building" locked={lk('flatNo')} editable={ed('flatNo')}>
                    <SI value={company.flatNo} onChange={v=>setCompany(c=>({...c,flatNo:v}))} placeholder="Ground floor" locked={lk('flatNo')} editable={ed('flatNo')}/>
                  </Field>
                  <Field label="Branch No" locked={lk('branchNo')} editable={ed('branchNo')}>
                    <SI value={company.branchNo} onChange={v=>setCompany(c=>({...c,branchNo:v}))} placeholder="e.g.53" locked={lk('branchNo')} editable={ed('branchNo')}/>
                  </Field>
                  <Field label="Branch / Colony" locked={lk('branchName')} editable={ed('branchName')}>
                    <SI value={company.branchName} onChange={v=>setCompany(c=>({...c,branchName:v}))} placeholder="Xyz Colony" locked={lk('branchName')} editable={ed('branchName')}/>
                  </Field>
                  <Field label="Street" locked={lk('street')} editable={ed('street')}>
                    <SI value={company.street} onChange={v=>setCompany(c=>({...c,street:v}))} placeholder="Abc Road" locked={lk('street')} editable={ed('street')}/>
                  </Field>
                </div>
                <div style={S.row3}>
                  <Field label="City / District" required locked={lk('city')} editable={ed('city')}>
                    <SI value={company.city} onChange={v=>setCompany(c=>({...c,city:v}))} placeholder="Faridabad" locked={lk('city')} editable={ed('city')}/>
                  </Field>
                  <Field label="State" required locked={lk('state')} editable={ed('state')}>
                    <StateSelect value={company.state} onChange={v=>setCompany(c=>({...c,state:v}))} locked={lk('state')} editable={ed('state')}/>
                  </Field>
                  <Field label="Pincode" locked={lk('pincode')} editable={ed('pincode')}>
                    <SI value={company.pincode} onChange={v=>setCompany(c=>({...c,pincode:v.replace(/\D/g,'').slice(0,6)}))} placeholder="123456" maxLength={6} mono locked={lk('pincode')} editable={ed('pincode')}/>
                  </Field>
                </div>

                <div style={S.secHead}>📧 Contact Details</div>
                <div style={S.row2}>
                  <Field label="Company email" required>
                    <SI iref={emailRef} value={company.email} onChange={v=>setCompany(c=>({...c,email:fmt.email(v)}))} type="email" placeholder="hr@company.com"/>
                  </Field>
                  <Field label="Phone">
                    <SI value={company.phone} onChange={v=>setCompany(c=>({...c,phone:fmt.phone(v)}))} type="tel" placeholder="9876543210" maxLength={13}/>
                  </Field>
                </div>

                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <button style={{...S.btn,paddingLeft:32,paddingRight:32}} onClick={next}
                    onMouseEnter={e=>e.target.style.background=C.blueHi} onMouseLeave={e=>e.target.style.background=C.blue}>
                    Continue →
                  </button>
                </div>
              </>
            )}

            {}
            {step===2 && (
              <>
                <h2 style={{fontSize:22,fontWeight:700,color:C.white,margin:'0 0 4px'}}>Where should we store your data?</h2>
                <p style={{fontSize:13,color:C.muted,margin:'0 0 20px'}}>Each company has its own isolated database. You can change this later in Settings.</p>
                {DB_MODES.map(mode => (
                  <div key={mode.id} style={dbMode===mode.id?S.dbActive:S.dbCard} onClick={()=>setDbMode(mode.id)}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:18,height:18,borderRadius:'50%',flexShrink:0,border:`2px solid ${dbMode===mode.id?C.blue:'rgba(99,120,255,0.3)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {dbMode===mode.id&&<div style={{width:8,height:8,borderRadius:'50%',background:C.blue}}/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <span style={{fontSize:14,fontWeight:600,color:C.white}}>{mode.title}</span>
                          <span style={{fontSize:10,fontWeight:700,color:mode.badgeColor,background:`${mode.badgeColor}18`,padding:'1px 7px',borderRadius:10,textTransform:'uppercase'}}>{mode.badge}</span>
                        </div>
                        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{mode.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {DB_MODES.find(m=>m.id===dbMode)?.creds===null && <div style={S.info}>✓ Syntern provisions a dedicated database automatically. Nothing to configure here.</div>}
                {(DB_MODES.find(m=>m.id===dbMode)?.creds==='local'||DB_MODES.find(m=>m.id===dbMode)?.creds==='both') && <LocalDbFields localDb={localDb} setLocalDb={setLocalDb}/>}
                {DB_MODES.find(m=>m.id===dbMode)?.creds==='both' && <CloudUrlField value={cloudUrl} onChange={v=>setCloudUrl(v.trim())} label="Cloud sync URL (backup)" placeholder="postgresql://user:pass@db.supabase.co:5432/postgres"/>}
                {DB_MODES.find(m=>m.id===dbMode)?.creds==='url' && <CloudUrlField value={cloudUrl} onChange={v=>setCloudUrl(v.trim())}/>}
                <div style={{display:'flex',gap:12,marginTop:8}}>
                  <button style={S.btnOut} onClick={back}>← Back</button>
                  <button style={{...S.btn,flex:1}} onClick={next} onMouseEnter={e=>e.target.style.background=C.blueHi} onMouseLeave={e=>e.target.style.background=C.blue}>Continue →</button>
                </div>
              </>
            )}

            {}
            {step===3 && (
              <>
                <h2 style={{fontSize:22,fontWeight:700,color:C.white,margin:'0 0 4px'}}>Create admin account</h2>
                <p style={{fontSize:13,color:C.muted,margin:'0 0 24px'}}>This will be the Super Admin login for your company portal.</p>
                <div style={S.row2}>
                  <Field label="Full name" required><Input value={admin.name} onChange={v=>setAdmin(a=>({...a,name:fmt.trim(v)}))} placeholder="Krishan Kumar"/></Field>
                  <Field label="Admin email" required hint="Lowercase only"><Input value={admin.email} onChange={v=>setAdmin(a=>({...a,email:fmt.email(v)}))} type="email" placeholder="admin@company.com"/></Field>
                </div>
                <div style={S.row2}>
                  <Field label="Phone"><Input value={admin.phone} onChange={v=>setAdmin(a=>({...a,phone:fmt.phone(v)}))} type="tel" placeholder="9876543210" maxLength={13}/></Field>
                  <Field label="Password" required>
                    <div style={{position:'relative'}}>
                      <input type={showPass?'text':'password'} value={admin.password} onChange={e=>setAdmin(a=>({...a,password:e.target.value}))} placeholder="Min 8 chars"
                        style={{...S.input,paddingRight:48}} onFocus={e=>e.target.style.borderColor=C.borderHi} onBlur={e=>e.target.style.borderColor=C.border}/>
                      <button type="button" onClick={()=>setShowPass(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#4B5563',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>
                        {showPass?'Hide':'Show'}
                      </button>
                    </div>
                    <div style={{display:'flex',gap:6,marginTop:5,flexWrap:'wrap'}}>
                      {[['8+ chars',admin.password.length>=8],['A–Z',/[A-Z]/.test(admin.password)],['0–9',/[0-9]/.test(admin.password)],['!@#',/[^A-Za-z0-9]/.test(admin.password)]].map(([l,ok])=>(
                        <span key={l} style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:10,background:ok?'rgba(34,197,94,0.12)':'rgba(99,120,255,0.07)',color:ok?'#4ADE80':C.faint}}>{ok?'✓ ':''}{l}</span>
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label="Access URL" required hint="Choose how your team will reach this HRMS portal.">
                  <div style={{display:'flex',gap:12,marginBottom:14}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:C.text}}>
                      <input type="radio" name="domainType" value="subdomain" checked={domainType==='subdomain'}
                        onChange={() => setDomainType('subdomain')} />
                      <span>Syntern subdomain</span>
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:C.text}}>
                      <input type="radio" name="domainType" value="custom" checked={domainType==='custom'}
                        onChange={() => setDomainType('custom')} />
                      <span>Dedicated domain</span>
                    </label>
                  </div>

                  <Field label="Internal tenant slug" required hint="This is your unique portal identifier inside Syntern.">
                    <div style={{display:'flex',alignItems:'center'}}>
                      <input value={subdomain} onChange={e=>setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,20))} placeholder="yourcompany"
                        style={{...S.input,borderRadius:'8px 0 0 8px',flex:1}} onFocus={e=>e.target.style.borderColor=C.borderHi} onBlur={e=>e.target.style.borderColor=C.border}/>
                      <div style={{padding:'10px 13px',background:C.bg,border:`1px solid ${C.border}`,borderLeft:'none',borderRadius:'0 8px 8px 0',color:'#4B5563',fontSize:13,whiteSpace:'nowrap'}}>.syntern.in</div>
                    </div>
                    {subdomain && <div style={{fontSize:11,color:C.green,marginTop:3}}>Internal portal slug: https://{subdomain}.syntern.in</div>}
                  </Field>

                  {domainType === 'custom' && (
                    <Field label="Dedicated domain" required hint="Example: hrms.yourcompany.com. DNS setup will be required later.">
                      <Input value={customDomain} onChange={v=>setCustomDomain(v.trim().toLowerCase())} placeholder="hrms.yourcompany.com"/>
                      {customDomain && <div style={{fontSize:11,color:C.green,marginTop:3}}>Portal URL: https://{customDomain}</div>}
                    </Field>
                  )}

                  <div style={{fontSize:11,color:C.muted,marginTop:8}}>
                    Dedicated domains are optional. If selected, your users can use the custom URL once DNS is configured. Your internal tenant slug is still required.
                  </div>
                </Field>
                <div onClick={()=>setConsent(c=>!c)} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',background:consent?'rgba(34,197,94,0.06)':'rgba(99,120,255,0.04)',border:`1px solid ${consent?'rgba(34,197,94,0.3)':'rgba(99,120,255,0.15)'}`,borderRadius:8,cursor:'pointer',marginTop:4,marginBottom:4,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,flexShrink:0,marginTop:1,border:`2px solid ${consent?C.green:'rgba(99,120,255,0.4)'}`,background:consent?C.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                    {consent && <span style={{color:C.white,fontSize:11,fontWeight:700,lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:12,color:'#94A3CE',lineHeight:1.5}}>
                    I agree to the{' '}
                    <a href="https://syntern.in/privacy" target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:C.blue,textDecoration:'underline'}}>Privacy Policy</a>
                    {' '}and{' '}
                    <a href="https://syntern.in/terms" target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:C.blue,textDecoration:'underline'}}>Terms of Service</a>.
                    By registering, I confirm I am authorised to create this company account.
                  </span>
                </div>
                <div style={{display:'flex',gap:12,marginTop:12}}>
                  <button style={S.btnOut} onClick={back}>← Back</button>
                  <button style={{...S.btn,flex:1,opacity:registerMutation.isPending?0.7:1}} onClick={next} disabled={registerMutation.isPending}
                    onMouseEnter={e=>!registerMutation.isPending&&(e.target.style.background=C.blueHi)} onMouseLeave={e=>e.target.style.background=C.blue}>
                    {registerMutation.isPending?'⟳ Setting up your account…':'Create account →'}
                  </button>
                </div>
              </>
            )}

            {}
            {step===4 && (
              <div style={{textAlign:'center',paddingTop:20}}>
                <div style={S.ok}>🎉</div>
                <h2 style={{fontSize:24,fontWeight:700,color:C.white,margin:'0 0 8px'}}>{company.name} is live!</h2>
                <p style={{fontSize:14,color:C.muted,margin:'0 0 28px',lineHeight:1.6}}>Your HRMS portal has been created. Log in with your admin credentials to start adding employees.</p>
                <div style={{background:C.bg,borderRadius:12,padding:20,marginBottom:24,textAlign:'left'}}>
                  {[
                    {label:'Portal URL',   value:customDomain ? `https://${customDomain}` : `https://${subdomain}.syntern.in`},
                    {label:'Admin email',  value:admin.email},
                    {label:'Database',     value:DB_MODES.find(m=>m.id===dbMode)?.title||dbMode},
                    {label:'GSTIN',        value:company.gstin},
                    {label:'PAN',          value:company.pan},
                    {label:'GST Status',   value:company.gstStatus},
                    {label:'Constitution', value:company.constitutionOfBusiness},
                    {label:'City',         value:company.city},
                    {label:'State',        value:company.state},
                  ].map(r => (
                    <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                      <span style={{color:C.muted}}>{r.label}</span>
                      <span style={{color:C.text,fontWeight:500}}>{r.value||'—'}</span>
                    </div>
                  ))}
                </div>
                <a href={`https://${subdomain}.syntern.in/login`} style={{...S.btn,display:'block',textDecoration:'none',marginBottom:10,textAlign:'center',width:'100%',boxSizing:'border-box'}}>Go to your portal →</a>
                <button style={{...S.btnOut,width:'100%'}} onClick={()=>navigate('/login')}>Sign in on syntern.in</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

