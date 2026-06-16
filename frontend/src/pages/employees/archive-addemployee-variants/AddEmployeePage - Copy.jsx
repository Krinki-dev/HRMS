import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams }  from 'react-router-dom';
import { useQuery, useQueryClient }      from '@tanstack/react-query';
import { toast }                         from 'react-hot-toast';
import { employeeApi }                   from '../../services/employeeApi';
import api                               from '../../services/api';
import { validators, formatAadhaar }     from '../../utils/validators';
import { THEME }                         from '../../utils/uiConstants';

/**
 * @file AddEmployeePage.jsx (Onboarding Wizard)
 * @description Mac-style multi-step onboarding wizard for new employees.
 */

async function computeSha256Hex(value) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && data.success && Array.isArray(data.data)) return data.data;
  return [];
}

const STEPS = [
  { num: 1, label: 'Personal',   icon: THEME.ICONS.PERSONAL },
  { num: 2, label: 'Address',    icon: THEME.ICONS.ADDRESS },
  { num: 3, label: 'Education',  icon: THEME.ICONS.EDUCATION },
  { num: 4, label: 'Family',     icon: THEME.ICONS.FAMILY },
  { num: 5, label: 'Experience', icon: THEME.ICONS.EXPERIENCE },
  { num: 6, label: 'Documents',  icon: THEME.ICONS.DOCUMENTS },
  { num: 7, label: 'Bank',       icon: THEME.ICONS.BANK },
  { num: 8, label: 'Login',      icon: THEME.ICONS.LOGIN },
];

const EDU_LEVELS = [
  { value: '10th',          label: '10th / SSC / Matriculation' },
  { value: '12th',          label: '12th / HSC / Intermediate' },
  { value: 'iti',           label: 'ITI' },
  { value: 'diploma',       label: 'Diploma / Polytechnic' },
  { value: 'graduate',      label: 'Graduate (B.Tech / BA / BCom / BCA / BSc)' },
  { value: 'post_graduate', label: 'Post Graduate (MBA / M.Tech / MA / MCom)' },
  { value: 'doctorate',     label: 'Doctorate (PhD)' },
  { value: 'professional',  label: 'Professional (CA / CS / LLB / MBBS)' },
  { value: 'other',         label: 'Other' },
];

const RELATIONSHIPS = [
  'father','mother','spouse','son','daughter',
  'brother','sister','father_in_law','mother_in_law',
  'grandfather','grandmother','uncle','aunt','other',
].map(v => ({ value: v, label: v.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) }));

const GENDER_OPTS   = [{ value:'male',label:'Male' },{ value:'female',label:'Female' },{ value:'other',label:'Other' }];
const MARITAL_OPTS  = ['single','married','divorced','widowed'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }));
const BLOOD_OPTS    = ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v => ({ value: v, label: v }));
const EMP_OPTS      = [{ value:'full_time',label:'Full Time' },{ value:'part_time',label:'Part Time' },{ value:'contract',label:'Contract' },{ value:'intern',label:'Intern' }];
const STATUS_OPTS   = [{ value:'active',label:'Active' },{ value:'probation',label:'On Probation' }];
const DOC_TYPE_OPTS = [
  { value:'aadhaar',label:'Aadhaar Card' },{ value:'pan',label:'PAN Card' },
  { value:'passport',label:'Passport' },{ value:'driving_license',label:'Driving License' },
  { value:'voter_id',label:'Voter ID' },{ value:'bank_passbook',label:'Bank Passbook / Cheque' },
  { value:'10th_marksheet',label:'10th Marksheet' },{ value:'12th_marksheet',label:'12th Marksheet' },
  { value:'degree_certificate',label:'Degree Certificate' },
  { value:'experience_letter',label:'Experience Letter' },{ value:'other',label:'Other' },
];

function F({ label, req, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-gray-600">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const TI = React.forwardRef(function TI({ error, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`border rounded-xl px-4 py-2.5 text-sm w-full outline-none transition-all focus:ring-2 focus:ring-blue-400 ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-300'}`}
      {...rest}
    />
  );
});

function SI({ value, onChange, options, placeholder, error, disabled }) {
  return (
    <select value={value||''} onChange={onChange} disabled={disabled}
      className={`border rounded-xl px-4 py-2.5 text-sm w-full outline-none transition-all focus:ring-2 focus:ring-blue-400 ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-300'} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {(options||[]).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Bar({ step, completed }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 flex-wrap">
      {STEPS.map((s, i) => {
        const done   = completed.includes(s.num);
        const active = step === s.num;
        return (
          <div key={s.num} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              active ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' :
              done   ? 'bg-green-50 border-green-200 text-green-700' :
                       'bg-white border-gray-100 text-gray-400'
            }`}>
              <span className="text-sm">{done ? THEME.ICONS.SUCCESS : s.icon}</span>
              <span className={`text-xs whitespace-nowrap font-semibold ${
                active ? 'text-white' : ''
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`text-xs mx-1 ${done ? 'text-green-400' : 'text-gray-200'}`}>—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TempModal({ open, password, email, onDone }) {
  const [copied, setCopied] = useState(false);
  const [noted,  setNoted]  = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-lg font-bold text-gray-900">Login Created!</h2>
        </div>
        <div className="p-5 bg-green-50 border border-green-200 rounded-2xl text-center mb-4">
          <p className="text-sm text-gray-600 mb-1">Email: <strong>{email}</strong></p>
          <div className="mt-3 p-4 bg-white border-2 border-dashed border-green-400 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Temporary Password</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-gray-900">{password}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
            className="mt-4 bg-green-600 text-white text-xs px-5 py-2 rounded-full hover:bg-green-700 shadow-sm">
            {copied ? '✓ Copied!' : 'Copy Password'}
          </button>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-5">
          <strong>Shown only once.</strong> Employee must change this on first login. Default hint: PAN in lowercase.
        </div>
        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input type="checkbox" checked={noted} onChange={e=>setNoted(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-700">Employee has noted / received this password</span>
        </label>
        <button onClick={onDone} disabled={!noted}
          className="w-full bg-blue-600 text-white rounded-2xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 shadow-lg">
          Done — View Employee
        </button>
      </div>
    </div>
  );
}

const extractData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
};

export default function AddEmployeePage() {
  const navigate       = useNavigate();
  const [sp]           = useSearchParams();
  const qc             = useQueryClient();
  const autoSaveRef    = useRef(null);
  const firstNameRef   = useRef(null);
  const kycLinkedRef   = useRef(false);

  const kycIdFromUrl = sp.get('kycId') || null;

  const [step,       setStep]       = useState(1);
  const [completed,  setCompleted]  = useState([]);
  const [draftId,    setDraftId]    = useState(sp.get('draftId') || null);
  const [kycId,      setKycId]      = useState(kycIdFromUrl || null);
  const [kycApplied, setKycApplied] = useState(() => {
    try { return sessionStorage.getItem(`kycApplied_${kycIdFromUrl}`) === 'yes'; } catch { return false; }
  });
  const [kycPhoto,   setKycPhoto]   = useState(null);
  const [empId,      setEmpId]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [tempModal,  setTempModal]  = useState({ open:false, password:'', email:'' });

  const [aadhaar,      setAadhaar]      = useState('');
  const [aadhaarState, setAadhaarState] = useState('idle');
  const [aadhaarMsg,   setAadhaarMsg]   = useState('');
  const [dupInfo,      setDupInfo]      = useState(null);
  const [kycStaleInfo, setKycStaleInfo] = useState(null);
  const [kycPrefilledFields, setKycPrefilledFields] = useState({ personal: {}, address: {} });

  const [p1, setP1] = useState({
    firstName:'', lastName:'', middleName:'', fatherName:'', motherName:'',
    dateOfBirth:'', gender:'', maritalStatus:'', spouseName:'',
    disabilityStatus: false, bloodGroup:'', phone:'', personalEmail:'',
    workEmail:'', panNumber:'', uanNumber:'', esiIpNumber:'',
  });

  const [p1b, setP1b] = useState({
    employeeCode:'', dateOfJoining:'', employmentType:'full_time', status:'active',
    departmentId:'', designationId:'', branchId:'', reportingTo:'', probationEndDate:'',
  });

  const [localAddr, setLocalAddr] = useState({ houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
  const [permAddr,  setPermAddr]  = useState({ houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
  const [sameLocal, setSameLocal] = useState(false);
  const [pincodeLookupStatus, setPincodeLookupStatus] = useState('idle');

  function emptyEdu() { return { eduLevel:'', courseType:'', streamSubject:'', courseName:'', institutionName:'', boardUniversity:'', passingYear:'', percentage:'', grade:'', isCurrent:false }; }
  const [edu, setEdu] = useState([emptyEdu()]);

  const [family, setFamily] = useState([]);
  function emptyFam() { return { name:'', relationship:'', gender:'', dateOfBirth:'', age:'', isDependent:false, isNominee:false, nomineePercentage:'', nomineeFor:'all', isMinor:false, guardianName:'', disabilityStatus:false }; }

  const [prev, setPrev] = useState([emptyPrev()]);
  function emptyPrev() { return { isFresher:true, organizationName:'', designation:'', joiningDate:'', leavingDate:'', lastCtcRupees:'', reasonForLeaving:'', referenceName:'', referencePhone:'' }; }

  const [docs, setDocs] = useState([{ documentType:'', documentNumber:'', fileName:'', ocrStatus:'idle' }]);

  React.useEffect(() => {
    if (!p1.panNumber && !aadhaar) return;
    setDocs(prevDocs => {
      if (prevDocs.some(d => d.documentType)) return prevDocs;
      const prefilled = [];
      if (aadhaar) prefilled.push({ documentType:'aadhaar', documentNumber: aadhaar.replace(/\s/g,''), fileName:'', ocrStatus:'idle' });
      if (p1.panNumber) prefilled.push({ documentType:'pan', documentNumber: p1.panNumber, fileName:'', ocrStatus:'idle' });
      return prefilled.length ? [...prefilled, { documentType:'', documentNumber:'', fileName:'', ocrStatus:'idle' }] : prevDocs;
    });
  }, [p1.panNumber, aadhaar]);

  const [bank, setBank] = useState({ bankName:'', accountNumber:'', ifscCode:'', accountType:'savings' });

  const [login, setLogin] = useState({ email:'', sendCredentials:true });

  const { data: dResRaw }  = useQuery({ queryKey:['departments'],  queryFn: employeeApi.getDepartments });
  const { data: dgResRaw } = useQuery({ queryKey:['designations'], queryFn: employeeApi.getDesignations });
  const { data: bResRaw }  = useQuery({ queryKey:['branches'],     queryFn: employeeApi.getBranches });
  const { data: mResRaw }  = useQuery({ queryKey:['managers'],     queryFn: employeeApi.getManagers });

  const dRes  = extractArray(dResRaw);
  const dgRes = extractArray(dgResRaw);
  const bRes  = extractArray(bResRaw);
  const mRes  = extractArray(mResRaw);

  const dOpts  = dRes.map(d => ({ value: d.id, label: d.name }));
  const dgOpts = dgRes.map(d => ({ value: d.id, label: d.name }));
  const bOpts  = bRes.map(b => ({ value: b.id, label: b.name }));
  const mOpts  = mRes.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName} (${m.employeeCode})` }));

  const kycLockPersonal = kycPrefilledFields.personal || {};
  const kycLockAddress  = kycPrefilledFields.address  || {};

  useEffect(() => {
    if (!kycIdFromUrl || kycApplied) return;
    api.get(`/automation/kyc/${kycIdFromUrl}`)
      .then(res => {
        const d = res.data?.data;
        if (d) applyKycRecord(kycIdFromUrl, d);
      })
      .catch(err => console.warn('[KYC] Load from URL failed', err));
  }, [kycIdFromUrl]); 

  useEffect(() => {
    const draftParam = sp.get('draftId');
    if (draftParam && !empId) loadDraft(draftParam);
  }, []); 

  function isOlderThanOneYear(dateValue) {
    if (!dateValue) return false;
    const created = new Date(dateValue);
    if (Number.isNaN(created.getTime())) return false;
    return Date.now() - created.getTime() > 365 * 24 * 60 * 60 * 1000;
  }

  async function applyKycRecord(resolvedKycId, record = null) {
    try {
      const d = record || (await api.get(`/automation/kyc/${resolvedKycId}`)).data?.data;
      if (!d) throw new Error('KYC record not available');

      const fullName  = d.fullName || d.name || '';
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

      const prefilled = { personal: {}, address: {} };
      if (d.firstName || d.name) prefilled.personal.firstName = true;
      if (d.lastName  || d.name) prefilled.personal.lastName  = true;
      if (d.middleName)          prefilled.personal.middleName = true;
      if (d.fatherName)          prefilled.personal.fatherName = true;
      if (d.dateOfBirth)         prefilled.personal.dateOfBirth = true;
      if (d.gender)              prefilled.personal.gender = true;
      if (d.panNumber || d.pan)  prefilled.personal.panNumber = true;

      setP1(prev => ({
        ...prev,
        firstName:     d.firstName || nameParts[0]                  || prev.firstName,
        lastName:      d.lastName  || nameParts[nameParts.length-1] || prev.lastName,
        middleName:    d.middleName   || prev.middleName,
        fatherName:    d.fatherName   || prev.fatherName,
        motherName:    d.motherName   || prev.motherName,
        spouseName:    d.spouseName   || prev.spouseName,
        dateOfBirth:   d.dateOfBirth  || prev.dateOfBirth,
        gender:        d.gender       || prev.gender,
        maritalStatus: d.maritalStatus|| prev.maritalStatus,
        phone:         d.mobile || d.phone || prev.phone,
        personalEmail: d.personalEmail || d.email || prev.personalEmail,
        workEmail:     d.workEmail     || prev.workEmail,
        panNumber:     d.panNumber || d.pan || prev.panNumber,
      }));

      const houseVal = d.houseNo || d.house || d.flatNumber || d.addressLine1 || '';
      const cityVal  = d.villageCity || d.city || d.vtc || d.town || '';
      const stateVal = d.state || '';
      const pcVal    = d.pincode || d.pc || '';
      const distVal  = d.district || d.dist || '';

      const hasAddress = houseVal || d.street || cityVal || distVal || stateVal || pcVal;
      if (hasAddress) {
        if (houseVal) prefilled.address.houseNo     = true;
        if (d.street) prefilled.address.street      = true;
        if (cityVal)  prefilled.address.villageCity = true;
        if (distVal)  prefilled.address.district    = true;
        if (stateVal) prefilled.address.state       = true;
        if (pcVal)    prefilled.address.pincode     = true;

        setLocalAddr(prev => ({
          ...prev,
          houseNo:     houseVal || prev.houseNo,
          street:      d.street || d.loc || prev.street,
          villageCity: cityVal  || prev.villageCity,
          district:    distVal  || prev.district,
          state:       stateVal || prev.state,
          country:     d.country || prev.country,
          pincode:     pcVal    || prev.pincode,
        }));
      }

      setKycPrefilledFields(prefilled);
      setKycId(resolvedKycId);
      setKycApplied(true);
      setKycStaleInfo(null);
      setAadhaarState('ok');
      setAadhaarMsg('✓ Auto-filled from central KYC data — mobile and email remain editable');

      if (d.photo) setKycPhoto(d.photo);

      try { sessionStorage.setItem(`kycApplied_${resolvedKycId}`, 'yes'); } catch {}

      if (!draftId) {
        try {
          const dr = await employeeApi.createDraft(aadhaar.replace(/\s/g,''));
          const activeDraftId = dr.data?.draftId || dr.draftId;
          if (activeDraftId) setDraftId(activeDraftId);
        } catch {}
      }
      toast.success('Form pre-filled from central KYC record ✓');
    } catch (e) {
      console.warn('[KYC] apply failed', e);
    }
  }

  function handleUseExistingKyc() {
    if (!kycStaleInfo?.kycId) return;
    applyKycRecord(kycStaleInfo.kycId);
  }

  function handleRedoKyc() {
    const params = new URLSearchParams();
    if (draftId) params.set('draftId', draftId);
    if (kycId)   params.set('kycId', kycId);
    const returnTo = `/employees/add?${params.toString()}`;
    navigate(`/automation?tab=ekyc&mode=referred&aadhaar=${encodeURIComponent(aadhaar.replace(/\s/g,''))}&returnTo=${encodeURIComponent(returnTo)}`);
  }

  async function loadDraft(id) {
    if (!id) return;
    try {
      const res = await employeeApi.getDraft(id);
      const d   = res;
      if (!d) { toast.error('Draft not found — it may have expired'); return; }

      setDraftId(id);
      setEmpId(d.empl || null);
      setStep(d.currentStep || 1);
      setErrors({});

      if (d.step1) {
        const s = d.step1;
        if (s.aadhaarRaw) {
          setAadhaar(s.aadhaarRaw);
          setAadhaarState('ok');
          setAadhaarMsg('✓ Restored from draft');
        }
        if (s.personal   && Object.keys(s.personal).length)   setP1(s.personal);
        if (s.professional && Object.keys(s.professional).length) setP1b(s.professional);
      }
      if (d.step2) {
        setLocalAddr(d.step2.local    || { houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
        setPermAddr(d.step2.permanent || { houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
        setSameLocal(d.step2.sameLocal || false);
      }
      if (d.step3?.length) setEdu(d.step3);
      if (d.step4?.length) setFamily(d.step4);
      if (d.step5?.length) setPrev(d.step5);
      if (d.step7) setBank(d.step7);
      if (d.step8) setLogin(d.step8);

      toast.success(`Draft resumed — continuing from Step ${d.currentStep}`);
      window.history.replaceState(null, '', `/employees/add?draftId=${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load draft');
    }
  }

  useEffect(() => {
    if (!draftId) return;
    autoSaveRef.current = setInterval(() => { saveDraftStep(false); }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [draftId, step, p1, p1b, localAddr, permAddr, edu, family, prev, bank]); 

  function getStepPayload(s) {
    switch(s) {
      case 1: return { aadhaarRaw: aadhaar, personal: p1, professional: p1b };
      case 2: return { local: localAddr, permanent: sameLocal ? localAddr : permAddr, sameLocal };
      case 3: return edu;
      case 4: return family;
      case 5: return prev;
      case 6: return docs.map(d => ({ documentType: d.documentType, documentNumber: d.documentNumber }));
      case 7: return bank;
      case 8: return login;
      default: return null;
    }
  }

  async function saveDraftStep(show = true) {
    if (!draftId) return;
    try {
      await employeeApi.saveDraftStep(draftId, step, getStepPayload(step), empId);
      if (show) toast.success('Draft saved', { id:'ds' });
    } catch {}
  }

  async function handleLocalPincodeBlur() {
    const pin = (localAddr.pincode || '').replace(/\D/g,'');
    if (pin.length !== 6) return;
    setPincodeLookupStatus('loading');
    setErrors(prev => ({ ...prev, localPin: null }));
    try {
      const res = await employeeApi.getPincode(pin);
      const geo = res;
      if (!geo || !geo.state) throw new Error('Invalid pincode');
      setLocalAddr(prev => ({
        ...prev,
        state: geo.state || prev.state,
        district: geo.district || prev.district,
        villageCity: geo.city || prev.villageCity,
      }));
      setPincodeLookupStatus('success');
      toast.success('Local address auto-filled from pincode');
      if (draftId) saveDraftStep(false);
    } catch {
      setPincodeLookupStatus('failed');
      setErrors(prev => ({ ...prev, localPin: 'Invalid pincode — cannot fetch location' }));
    }
  }

  async function checkAadhaar() {
    const clean = aadhaar.replace(/\s/g,'');
    if (clean.length !== 12) { toast.error('Aadhaar must be exactly 12 digits'); return; }
    setAadhaarState('checking');
    setAadhaarMsg('Checking local drafts and employee records...');
    setKycStaleInfo(null);
    try {
      const localRes = await employeeApi.checkDuplicate(clean);
      const local    = localRes;

      if (local.isDuplicate) {
        setDupInfo(local);
        if (local.source === 'draft') {
          setAadhaarState('dup_draft');
          setAadhaarMsg(`Incomplete form exists for this Aadhaar (Step ${local.currentStep}/8)`);
        } else {
          setAadhaarState('dup_emp');
          setAadhaarMsg(`Already exists: ${local.existing.name} (${local.existing.code})`);
        }
        return;
      }

      if (local.existingDraftId) {
        setDraftId(local.existingDraftId);
        setAadhaarMsg('Resuming an existing Aadhaar draft.');
      }

      setAadhaarMsg('Checking central KYC records...');
      const aadhaarHash = await computeSha256Hex(clean);
      let central = null;
      try {
        central = await api.post('/automation/kyc/check-duplicate', { aadhaarHash }).then(r => r.data);
      } catch (centralErr) {
        console.error('[KYC] Central check failed', centralErr);
        setAadhaarState('ok');
        setAadhaarMsg('✓ Aadhaar accepted (central KYC service unavailable — will check later)');
        return;
      }

      if (central.isDuplicate) {
        const stale = isOlderThanOneYear(central.createdAt);
        setKycId(central.kycId || null);
        setKycStaleInfo({
          kycId:       central.kycId,
          createdAt:   central.createdAt,
          method:      central.method,
          hasEmployee: central.hasEmployee,
        });

        if (stale) {
          setAadhaarState('kyc_old');
          setAadhaarMsg('Central KYC record is older than 1 year. Use existing data or redo KYC.');
          return;
        }

        await applyKycRecord(central.kycId);
        return;
      }

      let activeDraftId = draftId;
      if (!activeDraftId) {
        try {
          const dr = await employeeApi.createDraft(clean);
          activeDraftId = dr?.draftId;
          setDraftId(activeDraftId);
        } catch {}
      }
      if (activeDraftId) {
        await employeeApi.saveDraftStep(activeDraftId, 1, { aadhaarRaw: clean, personal: {}, professional: {} }, null)
          .catch(() => {});
      }

      setAadhaarState('ok');
      setAadhaarMsg('No central KYC record found. Redirecting to automation eKYC...');
      const returnTo = `/employees/add${activeDraftId ? `?draftId=${activeDraftId}` : ''}`;
      setTimeout(() => {
        navigate(`/automation?tab=ekyc&mode=referred&aadhaar=${encodeURIComponent(clean)}&returnTo=${encodeURIComponent(returnTo)}`);
      }, 200);

    } catch(err) {
      setAadhaarState('error');
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      const netMsg = !err.response ? 'Cannot reach server — check your connection' : null;
      const errMsg = apiMsg || netMsg || err.message || 'Verification failed — please try again';
      setAadhaarMsg(errMsg);
      toast.error(errMsg, { duration: 5000 });
    }
  }

  function validate() {
    const e = {};
    if (step === 1) {
      if (aadhaarState !== 'ok' && aadhaarState !== 'dup_draft') e.aadhaar = 'Verify Aadhaar before continuing';
      if (!p1.firstName.trim())  e.firstName     = 'Required';
      if (!p1.lastName.trim())   e.lastName      = 'Required';
      if (!p1.dateOfBirth)       e.dateOfBirth   = 'Date of birth required';
      if (!p1.gender)            e.gender        = 'Gender required';
      if (!p1b.dateOfJoining)    e.dateOfJoining = 'Required';
      if (!p1.personalEmail && !p1.workEmail) e.personalEmail = 'At least one email required';
      if (p1.personalEmail) { const err = validators.email(p1.personalEmail); if (err) e.personalEmail = err; }
      if (p1.workEmail)     { const err = validators.email(p1.workEmail);     if (err) e.workEmail     = err; }
      if (p1.phone)         { const err = validators.mobile(p1.phone);        if (err) e.phone         = err; }
    }
    if (step === 4) {
      const epfNominees = family.filter(f => f.isNominee && f.nomineeFor !== 'esi');
      const epfTotal    = epfNominees.reduce((s, f) => s + parseFloat(f.nomineePercentage || 0), 0);
      if (epfNominees.length && Math.abs(epfTotal - 100) > 0.01)
        e.nomineeTotal = `EPF nominees must total 100% (current ${Math.round(epfTotal*100)/100}%)`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateAll() {
    const e = {};
    if (aadhaarState !== 'ok' && aadhaarState !== 'dup_draft') e.aadhaar = 'Verify Aadhaar before continuing';
    if (!p1.firstName.trim())  e.firstName     = 'Required';
    if (!p1.lastName.trim())   e.lastName      = 'Required';
    if (!p1.dateOfBirth)       e.dateOfBirth   = 'Date of birth required';
    if (!p1.gender)            e.gender        = 'Gender required';
    if (!p1b.dateOfJoining)    e.dateOfJoining = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function goNext() {
    if (!validate()) { toast.error('Fix the errors first'); return; }
    setSaving(true);
    try {
      let id = empId;

      if (step === 1 && !empId) {
        const res = await employeeApi.create({
          ...p1, ...p1b,
          aadhaarNumber: aadhaar.replace(/\s/g,''),
          kycId:   kycId   || undefined,
          kycPhoto: kycPhoto || undefined,
        });
        id = res?.id;
        if (!id) throw new Error('Server did not return employee ID — check server logs');
        setEmpId(id);

        if (kycId && !kycLinkedRef.current) {
          kycLinkedRef.current = true;
          try {
            await api.post(`/automation/kyc/${kycId}/link`, { employeeId: id });
          } catch (linkErr) {
            console.warn('[KYC] link failed (non-fatal):', linkErr.message);
          }
        }
      }

      if (step === 2 && id) {
        await employeeApi.upsertAddress(id, 'local', localAddr);
        await employeeApi.upsertAddress(id, 'permanent', sameLocal ? localAddr : permAddr);
      }
      if (step === 3 && id) {
        const validEdu = edu.filter(e => e.eduLevel);
        if (validEdu.length) await employeeApi.bulkEducation(id, validEdu);
      }
      if (step === 4 && id && family.length) {
        await employeeApi.bulkFamily(id, family);
      }
      if (step === 5 && id) {
        await employeeApi.bulkPrevEmp(id, prev);
      }
      if (step === 7 && id && bank.bankName) {
        await employeeApi.addBankAccount(id, bank);
      }

      if (draftId) {
        await employeeApi.saveDraftStep(draftId, step, getStepPayload(step), id);
      }

      setCompleted(c => c.includes(step) ? c : [...c, step].sort((a,b)=>a-b));
      setStep(s => s + 1);
      setErrors({});
      window.scrollTo(0, 0);

    } catch(err) {
      const apiMsg  = err.response?.data?.message || err.response?.data?.error;
      const httpMsg = err.response?.status ? `Server error ${err.response.status}` : null;
      const netMsg  = !err.response ? 'Cannot reach server — check your connection' : null;
      const errMsg  = apiMsg || httpMsg || netMsg || err.message || 'Save failed — please try again';
      toast.error(errMsg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _saveError: errMsg }));
    } finally {
      setSaving(false);
    }
  }

  async function createLogin() {
    const email = login.email || p1.workEmail || p1.personalEmail;
    if (!validateAll()) { toast.error('Fix errors before final submission'); return; }
    if (!email) { setErrors({ loginEmail:'Email required' }); return; }
    const emailErr = validators.email(email);
    if (emailErr) { setErrors({ loginEmail: emailErr }); return; }
    if (!empId) { toast.error('Employee record missing'); return; }
    setSaving(true);
    try {
      const res = await employeeApi.createLogin(empId, { email, sendCredentials: login.sendCredentials });
      if (draftId) await employeeApi.completeDraft(draftId).catch(()=>{});
      qc.invalidateQueries({ queryKey:['employees'] });
      setTempModal({ open:true, password: res?.tempPassword, email: res?.email });
    } catch(err) {
      const apiMsg  = err.response?.data?.message || err.response?.data?.error;
      const httpMsg = err.response?.status ? `Server error ${err.response.status}` : null;
      const netMsg  = !err.response ? 'Cannot reach server — check your connection' : null;
      const errMsg  = apiMsg || httpMsg || netMsg || err.message || 'Login creation failed';
      toast.error(errMsg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _loginError: errMsg }));
    } finally {
    }
  }

  async function skipLogin() {
    if (draftId) await employeeApi.completeDraft(draftId).catch(()=>{});
    qc.invalidateQueries({ queryKey:['employees'] });
    toast.success('Employee added successfully');
    navigate('/employees');
  }

  const nomineeTotal = Math.round(
    family.filter(f=>f.isNominee).reduce((s,f)=>s+parseFloat(f.nomineePercentage||0),0) * 100
  ) / 100;

  const SKIPPABLE_STEPS = [3, 4, 5, 6, 7];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}>

      {}
      <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Employee</h1>
          <p className="text-xs text-gray-400 mt-0.5">Auto-saved every 30 seconds</p>
        </div>
        <div className="flex gap-2">
          {draftId && (
            <button onClick={() => saveDraftStep(true)}
              className="text-xs border border-blue-300 text-blue-600 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors">
              {THEME.ICONS.SAVE} Save Draft
            </button>
          )}
          <button onClick={() => navigate('/employees')}
            className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
            {THEME.ICONS.BACK} List
          </button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <Bar step={step} completed={completed} />
      </div>

      {}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl border border-gray-200 border-b-0 p-6 shadow-sm">

        {}
        {errors._saveError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-3">
            <span className="text-red-500 text-sm flex-shrink-0">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Save failed</p>
              <p className="text-xs text-red-600 mt-0.5">{errors._saveError}</p>
            </div>
            <button onClick={() => setErrors(e => ({...e, _saveError: null}))} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
          </div>
        )}

        {}
        {step === 1 && (
          <div className="space-y-6">
            {}
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">{THEME.ICONS.AADHAAR} Aadhaar Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Aadhaar Number" req error={errors.aadhaar}>
                  <TI
                    type="text"
                    placeholder="Enter 12-digit Aadhaar"
                    value={aadhaar}
                    onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                    maxLength={14}
                    disabled={aadhaarState === 'checking' || aadhaarState === 'ok'}
                  />
                </F>
                <div className="flex items-end gap-2">
                  <button
                    onClick={checkAadhaar}
                    disabled={aadhaarState === 'checking' || aadhaarState === 'ok'}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
                  >
                    {aadhaarState === 'checking' ? 'Checking...' : `${THEME.ICONS.CHECK} Verify Aadhaar`}
                  </button>
                  {aadhaarState === 'dup_draft' && dupInfo && (
                    <button
                      onClick={() => navigate(`/employees/add?draftId=${dupInfo.draftId}`)}
                      className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700"
                    >
                      Resume Draft
                    </button>
                  )}
                  {aadhaarState === 'dup_emp' && dupInfo && (
                    <button
                      onClick={() => navigate(`/employees/${dupInfo.existing.id}`)}
                      className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700"
                    >
                      View Employee
                    </button>
                  )}
                  {aadhaarState === 'kyc_old' && (
                    <button
                      onClick={handleUseExistingKyc}
                      className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700"
                    >
                      Use Existing
                    </button>
                  )}
                  {aadhaarState === 'kyc_old' && (
                    <button
                      onClick={handleRedoKyc}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                    >
                      Redo KYC
                    </button>
                  )}
                </div>
              </div>
              {aadhaarMsg && (
                <p className={`text-xs mt-2 ${aadhaarState === 'ok' ? 'text-green-600' : aadhaarState === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                  {aadhaarMsg}
                </p>
              )}
            </div>

            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <F label="First Name" req error={errors.firstName}>
                  <TI
                    placeholder="Enter first name"
                    value={p1.firstName}
                    onChange={e => setP1(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={kycLockPersonal.firstName}
                  />
                </F>
                <F label="Middle Name" error={errors.middleName}>
                  <TI
                    placeholder="Enter middle name"
                    value={p1.middleName}
                    onChange={e => setP1(prev => ({ ...prev, middleName: e.target.value }))}
                    disabled={kycLockPersonal.middleName}
                  />
                </F>
                <F label="Last Name" req error={errors.lastName}>
                  <TI
                    placeholder="Enter last name"
                    value={p1.lastName}
                    onChange={e => setP1(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={kycLockPersonal.lastName}
                  />
                </F>
                <F label="Father's Name" error={errors.fatherName}>
                  <TI
                    placeholder="Enter father's name"
                    value={p1.fatherName}
                    onChange={e => setP1(prev => ({ ...prev, fatherName: e.target.value }))}
                    disabled={kycLockPersonal.fatherName}
                  />
                </F>
                <F label="Mother's Name" error={errors.motherName}>
                  <TI
                    placeholder="Enter mother's name"
                    value={p1.motherName}
                    onChange={e => setP1(prev => ({ ...prev, motherName: e.target.value }))}
                  />
                </F>
                <F label="Spouse Name" error={errors.spouseName}>
                  <TI
                    placeholder="Enter spouse name"
                    value={p1.spouseName}
                    onChange={e => setP1(prev => ({ ...prev, spouseName: e.target.value }))}
                  />
                </F>
                <F label="Date of Birth" req error={errors.dateOfBirth}>
                  <TI
                    type="date"
                    value={p1.dateOfBirth}
                    onChange={e => setP1(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    disabled={kycLockPersonal.dateOfBirth}
                  />
                </F>
                <F label="Gender" req error={errors.gender}>
                  <SI
                    value={p1.gender}
                    onChange={e => setP1(prev => ({ ...prev, gender: e.target.value }))}
                    options={GENDER_OPTS}
                    placeholder="Select gender"
                    disabled={kycLockPersonal.gender}
                  />
                </F>
                <F label="Marital Status" error={errors.maritalStatus}>
                  <SI
                    value={p1.maritalStatus}
                    onChange={e => setP1(prev => ({ ...prev, maritalStatus: e.target.value }))}
                    options={MARITAL_OPTS}
                    placeholder="Select status"
                  />
                </F>
                <F label="Blood Group" error={errors.bloodGroup}>
                  <SI
                    value={p1.bloodGroup}
                    onChange={e => setP1(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    options={BLOOD_OPTS}
                    placeholder="Select blood group"
                  />
                </F>
                <F label="Disability Status" error={errors.disabilityStatus}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p1.disabilityStatus}
                      onChange={e => setP1(prev => ({ ...prev, disabilityStatus: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Person with Disability</span>
                  </label>
                </F>
              </div>
            </div>

            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Phone Number" error={errors.phone}>
                  <TI
                    type="tel"
                    placeholder="Enter phone number"
                    value={p1.phone}
                    onChange={e => setP1(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </F>
                <F label="Personal Email" error={errors.personalEmail}>
                  <TI
                    type="email"
                    placeholder="Enter personal email"
                    value={p1.personalEmail}
                    onChange={e => setP1(prev => ({ ...prev, personalEmail: e.target.value }))}
                  />
                </F>
                <F label="Work Email" error={errors.workEmail}>
                  <TI
                    type="email"
                    placeholder="Enter work email"
                    value={p1.workEmail}
                    onChange={e => setP1(prev => ({ ...prev, workEmail: e.target.value }))}
                  />
                </F>
                <F label="PAN Number" error={errors.panNumber}>
                  <TI
                    placeholder="Enter PAN number"
                    value={p1.panNumber}
                    onChange={e => setP1(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                    disabled={kycLockPersonal.panNumber}
                  />
                </F>
                <F label="UAN Number" error={errors.uanNumber}>
                  <TI
                    placeholder="Enter UAN number"
                    value={p1.uanNumber}
                    onChange={e => setP1(prev => ({ ...prev, uanNumber: e.target.value }))}
                  />
                </F>
                <F label="ESI IP Number" error={errors.esiIpNumber}>
                  <TI
                    placeholder="Enter ESI IP number"
                    value={p1.esiIpNumber}
                    onChange={e => setP1(prev => ({ ...prev, esiIpNumber: e.target.value }))}
                  />
                </F>
              </div>
            </div>

            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <F label="Employee Code" error={errors.employeeCode}>
                  <TI
                    placeholder="Enter employee code"
                    value={p1b.employeeCode}
                    onChange={e => setP1b(prev => ({ ...prev, employeeCode: e.target.value }))}
                  />
                </F>
                <F label="Date of Joining" req error={errors.dateOfJoining}>
                  <TI
                    type="date"
                    value={p1b.dateOfJoining}
                    onChange={e => setP1b(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                  />
                </F>
                <F label="Employment Type" error={errors.employmentType}>
                  <SI
                    value={p1b.employmentType}
                    onChange={e => setP1b(prev => ({ ...prev, employmentType: e.target.value }))}
                    options={EMP_OPTS}
                    placeholder="Select type"
                  />
                </F>
                <F label="Status" error={errors.status}>
                  <SI
                    value={p1b.status}
                    onChange={e => setP1b(prev => ({ ...prev, status: e.target.value }))}
                    options={STATUS_OPTS}
                    placeholder="Select status"
                  />
                </F>
                <F label="Department" error={errors.departmentId}>
                  <SI
                    value={p1b.departmentId}
                    onChange={e => setP1b(prev => ({ ...prev, departmentId: e.target.value }))}
                    options={dOpts}
                    placeholder="Select department"
                  />
                </F>
                <F label="Designation" error={errors.designationId}>
                  <SI
                    value={p1b.designationId}
                    onChange={e => setP1b(prev => ({ ...prev, designationId: e.target.value }))}
                    options={dgOpts}
                    placeholder="Select designation"
                  />
                </F>
                <F label="Branch" error={errors.branchId}>
                  <SI
                    value={p1b.branchId}
                    onChange={e => setP1b(prev => ({ ...prev, branchId: e.target.value }))}
                    options={bOpts}
                    placeholder="Select branch"
                  />
                </F>
                <F label="Reporting To" error={errors.reportingTo}>
                  <SI
                    value={p1b.reportingTo}
                    onChange={e => setP1b(prev => ({ ...prev, reportingTo: e.target.value }))}
                    options={mOpts}
                    placeholder="Select manager"
                  />
                </F>
                <F label="Probation End Date" error={errors.probationEndDate}>
                  <TI
                    type="date"
                    value={p1b.probationEndDate}
                    onChange={e => setP1b(prev => ({ ...prev, probationEndDate: e.target.value }))}
                  />
                </F>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Address Information</h3>
            
            {}
            <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Local Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="House No / Flat No" error={errors.localHouseNo}>
                  <TI
                    placeholder="Enter house/flat number"
                    value={localAddr.houseNo}
                    onChange={e => setLocalAddr(prev => ({ ...prev, houseNo: e.target.value }))}
                    disabled={kycLockAddress.houseNo}
                  />
                </F>
                <F label="Street / Area" error={errors.localStreet}>
                  <TI
                    placeholder="Enter street/area"
                    value={localAddr.street}
                    onChange={e => setLocalAddr(prev => ({ ...prev, street: e.target.value }))}
                    disabled={kycLockAddress.street}
                  />
                </F>
                <F label="Village / City" error={errors.localVillageCity}>
                  <TI
                    placeholder="Enter village/city"
                    value={localAddr.villageCity}
                    onChange={e => setLocalAddr(prev => ({ ...prev, villageCity: e.target.value }))}
                    disabled={kycLockAddress.villageCity}
                  />
                </F>
                <F label="District" error={errors.localDistrict}>
                  <TI
                    placeholder="Enter district"
                    value={localAddr.district}
                    onChange={e => setLocalAddr(prev => ({ ...prev, district: e.target.value }))}
                    disabled={kycLockAddress.district}
                  />
                </F>
                <F label="State" error={errors.localState}>
                  <TI
                    placeholder="Enter state"
                    value={localAddr.state}
                    onChange={e => setLocalAddr(prev => ({ ...prev, state: e.target.value }))}
                    disabled={kycLockAddress.state}
                  />
                </F>
                <F label="Pincode" error={errors.localPincode}>
                  <TI
                    placeholder="Enter pincode"
                    value={localAddr.pincode}
                    onChange={e => setLocalAddr(prev => ({ ...prev, pincode: e.target.value }))}
                    onBlur={handleLocalPincodeBlur}
                    disabled={kycLockAddress.pincode}
                  />
                  {pincodeLookupStatus === 'loading' && <p className="text-xs text-blue-600 mt-1">Looking up location...</p>}
                  {pincodeLookupStatus === 'success' && <p className="text-xs text-green-600 mt-1">Location auto-filled</p>}
                  {pincodeLookupStatus === 'failed' && <p className="text-xs text-red-600 mt-1">Invalid pincode</p>}
                </F>
                <F label="Country" error={errors.localCountry}>
                  <TI
                    placeholder="Enter country"
                    value={localAddr.country}
                    onChange={e => setLocalAddr(prev => ({ ...prev, country: e.target.value }))}
                  />
                </F>
              </div>
            </div>

            {}
            <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-800">Permanent Address</h4>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameLocal}
                    onChange={e => {
                      setSameLocal(e.target.checked);
                      if (e.target.checked) setPermAddr(localAddr);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Same as local address</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="House No / Flat No" error={errors.permHouseNo}>
                  <TI
                    placeholder="Enter house/flat number"
                    value={permAddr.houseNo}
                    onChange={e => setPermAddr(prev => ({ ...prev, houseNo: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
                <F label="Street / Area" error={errors.permStreet}>
                  <TI
                    placeholder="Enter street/area"
                    value={permAddr.street}
                    onChange={e => setPermAddr(prev => ({ ...prev, street: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
                <F label="Village / City" error={errors.permVillageCity}>
                  <TI
                    placeholder="Enter village/city"
                    value={permAddr.villageCity}
                    onChange={e => setPermAddr(prev => ({ ...prev, villageCity: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
                <F label="District" error={errors.permDistrict}>
                  <TI
                    placeholder="Enter district"
                    value={permAddr.district}
                    onChange={e => setPermAddr(prev => ({ ...prev, district: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
                <F label="State" error={errors.permState}>
                  <TI
                    placeholder="Enter state"
                    value={permAddr.state}
                    onChange={e => setPermAddr(prev => ({ ...prev, state: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
                <F label="Pincode" error={errors.permPincode}>
                  <TI
                    placeholder="Enter pincode"
                    value={permAddr.pincode}
                    onChange={e => setPermAddr(prev => ({ ...prev, pincode: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
                <F label="Country" error={errors.permCountry}>
                  <TI
                    placeholder="Enter country"
                    value={permAddr.country}
                    onChange={e => setPermAddr(prev => ({ ...prev, country: e.target.value }))}
                    disabled={sameLocal}
                  />
                </F>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Education Information</h3>
              <button
                onClick={() => setEdu(prev => [...prev, emptyEdu()])}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all"
              >
                + Add Education
              </button>
            </div>
            
            {edu.map((ed, i) => (
              <div key={i} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl relative">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-800">Level {i + 1}</h4>
                  <button
                    onClick={() => setEdu(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <F label="Education Level" error={errors[`eduLevel_${i}`]}>
                    <SI
                      value={ed.eduLevel}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, eduLevel: e.target.value } : item))}
                      options={EDU_LEVELS}
                      placeholder="Select level"
                    />
                  </F>
                  <F label="Course Type" error={errors[`courseType_${i}`]}>
                    <TI
                      placeholder="e.g., Regular, Distance"
                      value={ed.courseType}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, courseType: e.target.value } : item))}
                    />
                  </F>
                  <F label="Stream / Subject" error={errors[`streamSubject_${i}`]}>
                    <TI
                      placeholder="e.g., Science, Commerce"
                      value={ed.streamSubject}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, streamSubject: e.target.value } : item))}
                    />
                  </F>
                  <F label="Course Name" error={errors[`courseName_${i}`]}>
                    <TI
                      placeholder="e.g., B.Tech Computer Science"
                      value={ed.courseName}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, courseName: e.target.value } : item))}
                    />
                  </F>
                  <F label="Institution Name" error={errors[`institutionName_${i}`]}>
                    <TI
                      placeholder="Enter institution name"
                      value={ed.institutionName}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, institutionName: e.target.value } : item))}
                    />
                  </F>
                  <F label="Board / University" error={errors[`boardUniversity_${i}`]}>
                    <TI
                      placeholder="Enter board/university"
                      value={ed.boardUniversity}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, boardUniversity: e.target.value } : item))}
                    />
                  </F>
                  <F label="Passing Year" error={errors[`passingYear_${i}`]}>
                    <TI
                      placeholder="Enter passing year"
                      value={ed.passingYear}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, passingYear: e.target.value } : item))}
                    />
                  </F>
                  <F label="Percentage" error={errors[`percentage_${i}`]}>
                    <TI
                      placeholder="Enter percentage"
                      value={ed.percentage}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, percentage: e.target.value } : item))}
                    />
                  </F>
                  <F label="Grade" error={errors[`grade_${i}`]}>
                    <TI
                      placeholder="Enter grade"
                      value={ed.grade}
                      onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, grade: e.target.value } : item))}
                    />
                  </F>
                  <F label="Is Current" error={errors[`isCurrent_${i}`]}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ed.isCurrent}
                        onChange={e => setEdu(prev => prev.map((item, idx) => idx === i ? { ...item, isCurrent: e.target.checked } : item))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Currently pursuing</span>
                    </label>
                  </F>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Family Information</h3>
              <button
                onClick={() => setFamily(prev => [...prev, emptyFam()])}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                + Add Family Member
              </button>
            </div>
            
            {family.map((fam, i) => (
              <div key={i} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-800">Member {i + 1}</h4>
                  <button
                    onClick={() => setFamily(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <F label="Name" error={errors[`famName_${i}`]}>
                    <TI
                      placeholder="Enter name"
                      value={fam.name}
                      onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
                    />
                  </F>
                  <F label="Relationship" error={errors[`famRelationship_${i}`]}>
                    <SI
                      value={fam.relationship}
                      onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, relationship: e.target.value } : item))}
                      options={RELATIONSHIPS}
                      placeholder="Select relationship"
                    />
                  </F>
                  <F label="Gender" error={errors[`famGender_${i}`]}>
                    <SI
                      value={fam.gender}
                      onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, gender: e.target.value } : item))}
                      options={GENDER_OPTS}
                      placeholder="Select gender"
                    />
                  </F>
                  <F label="Date of Birth" error={errors[`famDateOfBirth_${i}`]}>
                    <TI
                      type="date"
                      value={fam.dateOfBirth}
                      onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, dateOfBirth: e.target.value } : item))}
                    />
                  </F>
                  <F label="Age" error={errors[`famAge_${i}`]}>
                    <TI
                      placeholder="Enter age"
                      value={fam.age}
                      onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, age: e.target.value } : item))}
                    />
                  </F>
                  <F label="Is Dependent" error={errors[`famIsDependent_${i}`]}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fam.isDependent}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, isDependent: e.target.checked } : item))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Dependent</span>
                    </label>
                  </F>
                  <F label="Is Nominee" error={errors[`famIsNominee_${i}`]}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fam.isNominee}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, isNominee: e.target.checked } : item))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Nominee</span>
                    </label>
                  </F>
                  {fam.isNominee && (
                    <F label="Nominee Percentage" error={errors[`famNomineePercentage_${i}`]}>
                      <TI
                        type="number"
                        placeholder="Enter percentage"
                        value={fam.nomineePercentage}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, nomineePercentage: e.target.value } : item))}
                      />
                    </F>
                  )}
                  {fam.isNominee && (
                    <F label="Nominee For" error={errors[`famNomineeFor_${i}`]}>
                      <SI
                        value={fam.nomineeFor}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, nomineeFor: e.target.value } : item))}
                        options={[
                          { value: 'all', label: 'All Benefits' },
                          { value: 'epf', label: 'EPF Only' },
                          { value: 'esi', label: 'ESI Only' }
                        ]}
                        placeholder="Select benefit"
                      />
                    </F>
                  )}
                  <F label="Is Minor" error={errors[`famIsMinor_${i}`]}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fam.isMinor}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, isMinor: e.target.checked } : item))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Minor</span>
                    </label>
                  </F>
                  {fam.isMinor && (
                    <F label="Guardian Name" error={errors[`famGuardianName_${i}`]}>
                      <TI
                        placeholder="Enter guardian name"
                        value={fam.guardianName}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, guardianName: e.target.value } : item))}
                      />
                    </F>
                  )}
                  <F label="Disability Status" error={errors[`famDisabilityStatus_${i}`]}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fam.disabilityStatus}
                        onChange={e => setFamily(prev => prev.map((item, idx) => idx === i ? { ...item, disabilityStatus: e.target.checked } : item))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Person with Disability</span>
                    </label>
                  </F>
                </div>
              </div>
            ))}
            {errors.nomineeTotal && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl">
                <p className="text-sm text-red-700">{THEME.ICONS.WARNING} {errors.nomineeTotal}</p>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Previous Employment</h3>
              <button
                onClick={() => setPrev(prev => [...prev, emptyPrev()])}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                + Add Employment
              </button>
            </div>
            
            {prev.map((pr, i) => (
              <div key={i} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-800">Company {i + 1}</h4>
                  <button
                    onClick={() => setPrev(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <F label="Is Fresher" error={errors[`prevIsFresher_${i}`]}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pr.isFresher}
                        onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, isFresher: e.target.checked } : item))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Fresher</span>
                    </label>
                  </F>
                  {!pr.isFresher && (
                    <>
                      <F label="Organization Name" error={errors[`prevOrganizationName_${i}`]}>
                        <TI
                          placeholder="Enter organization name"
                          value={pr.organizationName}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, organizationName: e.target.value } : item))}
                        />
                      </F>
                      <F label="Designation" error={errors[`prevDesignation_${i}`]}>
                        <TI
                          placeholder="Enter designation"
                          value={pr.designation}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, designation: e.target.value } : item))}
                        />
                      </F>
                      <F label="Joining Date" error={errors[`prevJoiningDate_${i}`]}>
                        <TI
                          type="date"
                          value={pr.joiningDate}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, joiningDate: e.target.value } : item))}
                        />
                      </F>
                      <F label="Leaving Date" error={errors[`prevLeavingDate_${i}`]}>
                        <TI
                          type="date"
                          value={pr.leavingDate}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, leavingDate: e.target.value } : item))}
                        />
                      </F>
                      <F label="Last CTC (₹)" error={errors[`prevLastCtcRupees_${i}`]}>
                        <TI
                          type="number"
                          placeholder="Enter last CTC"
                          value={pr.lastCtcRupees}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, lastCtcRupees: e.target.value } : item))}
                        />
                      </F>
                      <F label="Reason for Leaving" error={errors[`prevReasonForLeaving_${i}`]}>
                        <TI
                          placeholder="Enter reason"
                          value={pr.reasonForLeaving}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, reasonForLeaving: e.target.value } : item))}
                        />
                      </F>
                      <F label="Reference Name" error={errors[`prevReferenceName_${i}`]}>
                        <TI
                          placeholder="Enter reference name"
                          value={pr.referenceName}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, referenceName: e.target.value } : item))}
                        />
                      </F>
                      <F label="Reference Phone" error={errors[`prevReferencePhone_${i}`]}>
                        <TI
                          placeholder="Enter reference phone"
                          value={pr.referencePhone}
                          onChange={e => setPrev(prev => prev.map((item, idx) => idx === i ? { ...item, referencePhone: e.target.value } : item))}
                        />
                      </F>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <button
                onClick={() => setDocs(prev => [...prev, { documentType: '', documentNumber: '', fileName: '', ocrStatus: 'idle' }])}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                + Add Document
              </button>
            </div>
            
            {docs.map((doc, i) => (
              <div key={i} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-800">Document {i + 1}</h4>
                  <button
                    onClick={() => setDocs(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="Document Type" error={errors[`docType_${i}`]}>
                    <SI
                      value={doc.documentType}
                      onChange={e => setDocs(prev => prev.map((item, idx) => idx === i ? { ...item, documentType: e.target.value } : item))}
                      options={DOC_TYPE_OPTS}
                      placeholder="Select document type"
                    />
                  </F>
                  <F label="Document Number" error={errors[`docNumber_${i}`]}>
                    <TI
                      placeholder="Enter document number"
                      value={doc.documentNumber}
                      onChange={e => setDocs(prev => prev.map((item, idx) => idx === i ? { ...item, documentNumber: e.target.value } : item))}
                    />
                  </F>
                  <F label="File" error={errors[`docFile_${i}`]}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setDocs(prev => prev.map((item, idx) => idx === i ? { ...item, fileName: file.name, file } : item));
                        }
                      }}
                    className="border rounded-xl px-4 py-2.5 text-sm w-full bg-white"
                    />
                  </F>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Bank Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F label="Bank Name" error={errors.bankName}>
                <TI
                  placeholder="Enter bank name"
                  value={bank.bankName}
                  onChange={e => setBank(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </F>
              <F label="Account Number" error={errors.accountNumber}>
                <TI
                  placeholder="Enter account number"
                  value={bank.accountNumber}
                  onChange={e => setBank(prev => ({ ...prev, accountNumber: e.target.value }))}
                />
              </F>
              <F label="IFSC Code" error={errors.ifscCode}>
                <TI
                  placeholder="Enter IFSC code"
                  value={bank.ifscCode}
                  onChange={e => setBank(prev => ({ ...prev, ifscCode: e.target.value }))}
                />
              </F>
              <F label="Account Type" error={errors.accountType}>
                <SI
                  value={bank.accountType}
                  onChange={e => setBank(prev => ({ ...prev, accountType: e.target.value }))}
                  options={[
                    { value: 'savings', label: 'Savings' },
                    { value: 'current', label: 'Current' }
                  ]}
                  placeholder="Select account type"
                />
              </F>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F label="Email for Login" req error={errors.loginEmail}>
                <TI
                  type="email"
                  placeholder="Enter email for login"
                  value={login.email}
                  onChange={e => setLogin(prev => ({ ...prev, email: e.target.value }))}
                />
              </F>
              <F label="Send Credentials" error={errors.sendCredentials}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={login.sendCredentials}
                    onChange={e => setLogin(prev => ({ ...prev, sendCredentials: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Send login credentials via email</span>
                </label>
              </F>
            </div>
          </div>
        )}

      </div>

      {}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50/30 rounded-b-3xl">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="bg-gray-600 text-white px-8 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 hover:bg-gray-700 transition-all shadow-sm"
        >
          {THEME.ICONS.BACK} Previous
        </button>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Step {step} of {STEPS.length}
        </div>
        {step < 8 ? (
          <button
            onClick={goNext}
            disabled={saving}
            className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            {saving ? 'Saving...' : 'Next'}
          </button>
        ) : (
          <button
            onClick={createLogin}
            disabled={saving}
            className="bg-green-600 text-white px-10 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 hover:bg-green-700 transition-all shadow-lg active:scale-95"
          >
            {saving ? 'Creating...' : 'Create Employee'}
          </button>
        )}
      </div>

      {}
      <TempModal
        open={tempModal.open}
        password={tempModal.password}
        email={tempModal.email}
        onDone={() => {
          setTempModal({ open: false, password: '', email: '' });
          navigate('/employees');
        }}
      />

    </div>
  );
}

