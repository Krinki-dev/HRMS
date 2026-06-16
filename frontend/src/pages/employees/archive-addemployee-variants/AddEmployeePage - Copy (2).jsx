import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams }  from 'react-router-dom';
import { useQuery, useQueryClient }      from '@tanstack/react-query';
import { toast }                         from 'react-hot-toast';
import { employeeApi }                   from '../../services/employeeApi';
import api                               from '../../services/api';
import { validators, formatAadhaar }     from '../../utils/validators';

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
  { num: 1,  label: 'Aadhaar',    icon: '🪪',  color: 'indigo' },
  { num: 2,  label: 'Personal',   icon: '👤',  color: 'purple' },
  { num: 3,  label: 'Contact',    icon: '📞',  color: 'sky'    },
  { num: 4,  label: 'Emergency',  icon: '🚨',  color: 'rose'   },
  { num: 5,  label: 'Employment', icon: '💼',  color: 'amber'  },
  { num: 6,  label: 'Address',    icon: '🏠',  color: 'green'  },
  { num: 7,  label: 'Education',  icon: '🎓',  color: 'violet' },
  { num: 8,  label: 'Family',     icon: '👨‍👩‍👧',  color: 'pink'   },
  { num: 9,  label: 'Experience', icon: '🏢',  color: 'orange' },
  { num: 10, label: 'Documents',  icon: '📄',  color: 'slate'  },
  { num: 11, label: 'Bank',       icon: '🏦',  color: 'teal'   },
  { num: 12, label: 'Login',      icon: '🔐',  color: 'blue'   },
];

const SKIPPABLE_STEPS = [7, 8, 9, 10, 11];
const TOTAL_STEPS = STEPS.length;

const EDU_LEVELS = [
  { value: '10th',          label: '10th / SSC' },
  { value: '12th',          label: '12th / HSC' },
  { value: 'iti',           label: 'ITI' },
  { value: 'diploma',       label: 'Diploma' },
  { value: 'graduate',      label: 'Graduate' },
  { value: 'post_graduate', label: 'Post Graduate' },
  { value: 'doctorate',     label: 'Doctorate (PhD)' },
  { value: 'professional',  label: 'Professional (CA/CS/LLB)' },
  { value: 'other',         label: 'Other' },
];

const RELATIONSHIPS = [
  'father','mother','spouse','son','daughter',
  'brother','sister','father_in_law','mother_in_law',
  'grandfather','grandmother','uncle','aunt','other',
].map(v => ({ value: v, label: v.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) }));

const GENDER_OPTS      = [{ value:'male',label:'Male' },{ value:'female',label:'Female' },{ value:'other',label:'Other' }];
const MARITAL_OPTS     = ['single','married','divorced','widowed'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }));
const BLOOD_OPTS       = ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v => ({ value: v, label: v }));
const EMP_OPTS         = [{ value:'full_time',label:'Full Time' },{ value:'part_time',label:'Part Time' },{ value:'contract',label:'Contract' },{ value:'intern',label:'Intern' }];
const STATUS_OPTS      = [{ value:'active',label:'Active' },{ value:'probation',label:'On Probation' }];
const LANGUAGE_OPTS    = ['Hindi','English','Bengali','Telugu','Marathi','Tamil','Gujarati','Kannada','Odia','Punjabi','Other'].map(v=>({value:v.toLowerCase(),label:v}));
const NATIONALITY_OPTS = [{ value:'indian',label:'Indian' },{ value:'nri',label:'NRI' },{ value:'other',label:'Other' }];
const DOC_TYPE_OPTS    = [
  { value:'aadhaar',label:'Aadhaar Card' },{ value:'pan',label:'PAN Card' },
  { value:'passport',label:'Passport' },{ value:'driving_license',label:'Driving License' },
  { value:'voter_id',label:'Voter ID' },{ value:'bank_passbook',label:'Bank Passbook / Cheque' },
  { value:'10th_marksheet',label:'10th Marksheet' },{ value:'12th_marksheet',label:'12th Marksheet' },
  { value:'degree_certificate',label:'Degree Certificate' },
  { value:'experience_letter',label:'Experience Letter' },{ value:'other',label:'Other' },
];

function F({ label, req, error, children, col }) {
  return (
    <div className={`flex flex-col gap-0.5 ${col || ''}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}{req && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const TI = React.forwardRef(function TI({ error, className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`border rounded-lg px-2.5 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-blue-400 transition-all
        ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${rest.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
        ${className}`}
      {...rest}
    />
  );
});

function SI({ value, onChange, options, placeholder, error, disabled }) {
  return (
    <select
      value={value || ''} onChange={onChange} disabled={disabled}
      className={`border rounded-lg px-2.5 py-1.5 text-sm w-full outline-none focus:ring-2 focus:ring-blue-400 transition-all
        ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-gray-300'}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Section({ title, emoji, badge, children, action }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden mb-3 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-base leading-none">{emoji}</span>}
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</span>
          {badge && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {action}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

const STEP_HERO_STYLES = {
  indigo: 'from-indigo-50 to-blue-50   border-indigo-100',
  purple: 'from-purple-50 to-violet-50 border-purple-100',
  sky:    'from-sky-50 to-cyan-50      border-sky-100',
  rose:   'from-rose-50 to-pink-50     border-rose-100',
  amber:  'from-amber-50 to-yellow-50  border-amber-100',
  green:  'from-green-50 to-emerald-50 border-green-100',
  violet: 'from-violet-50 to-purple-50 border-violet-100',
  pink:   'from-pink-50 to-rose-50     border-pink-100',
  orange: 'from-orange-50 to-amber-50  border-orange-100',
  slate:  'from-slate-50 to-gray-50    border-slate-100',
  teal:   'from-teal-50 to-cyan-50     border-teal-100',
  blue:   'from-blue-50 to-indigo-50   border-blue-100',
};

function StepHero({ icon, title, subtitle, color }) {
  const cls = STEP_HERO_STYLES[color] || STEP_HERO_STYLES.blue;
  return (
    <div className={`flex items-center gap-3 mb-4 p-3 bg-gradient-to-r ${cls} rounded-xl border`}>
      <span className="text-3xl leading-none">{icon}</span>
      <div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function StepRail({ step, completed }) {
  return (
    <div
      className="flex items-center border-b border-gray-100 bg-white px-2 overflow-x-auto flex-shrink-0"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {STEPS.map((s, i) => {
        const done   = completed.includes(s.num);
        const active = step === s.num;
        return (
          <React.Fragment key={s.num}>
            <div
              className={`flex items-center gap-1 px-1.5 py-2 flex-shrink-0 border-b-2 transition-all duration-200
                ${active ? 'border-blue-600' : done ? 'border-green-500' : 'border-transparent'}`}
            >
              <span
                title={s.label}
                className={`text-sm leading-none flex-shrink-0 transition-opacity
                  ${done ? '' : active ? '' : 'opacity-30'}`}
              >
                {done ? '✅' : s.icon}
              </span>
              <span
                className={`text-xs whitespace-nowrap font-medium hidden lg:inline
                  ${active ? 'text-blue-700' : done ? 'text-green-700' : 'text-gray-400'}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="text-gray-200 text-xs flex-shrink-0 mx-0.5">›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function KycBadge({ state, msg }) {
  if (!msg && state === 'idle') return null;
  const styles = {
    ok:        'bg-green-50  border-green-200  text-green-800',
    checking:  'bg-blue-50   border-blue-200   text-blue-800',
    dup_emp:   'bg-amber-50  border-amber-200  text-amber-800',
    dup_draft: 'bg-orange-50 border-orange-200 text-orange-800',
    kyc_old:   'bg-yellow-50 border-yellow-200 text-yellow-800',
    no_kyc:    'bg-purple-50 border-purple-200 text-purple-800',
    error:     'bg-red-50    border-red-200    text-red-800',
  };
  return (
    <p className={`text-xs px-2.5 py-1.5 rounded-md border inline-flex items-center gap-1.5 ${styles[state] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      {state === 'checking' && <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />}
      {msg}
    </p>
  );
}

function TempModal({ open, password, email, onDone }) {
  const [copied, setCopied] = useState(false);
  const [noted,  setNoted]  = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-lg font-bold text-gray-900">Employee Created!</h2>
          <p className="text-xs text-gray-500 mt-1">Login credentials are ready</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center mb-4">
          <p className="text-sm text-gray-600 mb-1">📧 Email: <strong>{email}</strong></p>
          <div className="mt-3 p-3 bg-white border-2 border-dashed border-green-400 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">🔑 Temporary Password</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-gray-900">{password}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="mt-3 bg-green-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
            {copied ? '✓ Copied!' : '📋 Copy Password'}
          </button>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4">
          ⚠️ <strong>Shown only once.</strong> Employee must change this on first login.
        </div>
        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input type="checkbox" checked={noted} onChange={e => setNoted(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-700">Employee has noted / received this password</span>
        </label>
        <button onClick={onDone} disabled={!noted}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors">
          ✓ Done — View Employee
        </button>
      </div>
    </div>
  );
}

const emptyAddr  = () => ({ houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
const emptyEdu   = () => ({ eduLevel:'', courseType:'', streamSubject:'', courseName:'', institutionName:'', boardUniversity:'', passingYear:'', percentage:'', grade:'', isCurrent: false });
const emptyFamily= () => ({ name:'', relationship:'', gender:'', dateOfBirth:'', age:'', isDependent: false, isNominee: false, nomineePercentage:'', nomineeFor:'all', isMinor: false, guardianName:'', disabilityStatus: false });
const emptyDoc   = () => ({ documentType:'', documentName:'', documentNumber:'', fileName:'', fileUrl:'', expiryDate:'', ocrStatus:'idle' });
const emptyPrev  = () => ({ isFresher: false, organizationName:'', designation:'', joiningDate:'', leavingDate:'', lastCtcRupees:'', reasonForLeaving:'', referenceName:'', referencePhone:'' });

export default function AddEmployeePage() {
  const navigate     = useNavigate();
  const [sp]         = useSearchParams();
  const qc           = useQueryClient();
  const autoSaveRef  = useRef(null);
  const firstNameRef = useRef(null);
  const kycLinkedRef = useRef(false);

  const kycIdFromUrl = sp.get('kycId') || null;

  const [step,       setStep]       = useState(1);
  const [completed,  setCompleted]  = useState([]);
  const [draftId,    setDraftId]    = useState(sp.get('draftId') || null);
  const [kycId,      setKycId]      = useState(kycIdFromUrl || null);
  const [kycApplied, setKycApplied] = useState(() => {
    try { return sessionStorage.getItem(`kycApplied_${kycIdFromUrl}`) === 'yes'; } catch { return false; }
  });
  const [kycPhoto,    setKycPhoto]    = useState(null);
  const [empId,       setEmpId]       = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState({});
  const [tempModal,   setTempModal]   = useState({ open: false, password: '', email: '' });

  const [aadhaar,      setAadhaar]      = useState('');
  const [aadhaarState, setAadhaarState] = useState('idle');
  const [aadhaarMsg,   setAadhaarMsg]   = useState('');
  const [dupInfo,      setDupInfo]      = useState(null);
  const [kycStaleInfo, setKycStaleInfo] = useState(null);
  const [kycPrefilledFields, setKycPrefilledFields] = useState({ personal:{}, address:{} });

  const [p1, setP1] = useState({
    firstName:'', middleName:'', lastName:'',
    fatherName:'', motherName:'', spouseName:'',
    dateOfBirth:'', gender:'', maritalStatus:'',
    bloodGroup:'', disabilityStatus: false,
    personalEmail:'', workEmail:'', phone:'', workPhoneExtension:'',
    emergencyContactName:'', emergencyContactPhone:'', emergencyContactEmail:'', emergencyContactRel:'',
    panNumber:'', uanNumber:'', esiIpNumber:'',
    nationality:'indian', preferredLanguage:'', religion:'',
  });

  const [p1b, setP1b] = useState({
    employeeCode:'', branchId:'', departmentId:'', designationId:'',
    reportingTo:'', employmentType:'full_time', status:'active',
    dateOfJoining:'', probationEndDate:'', confirmationDate:'', dateOfLeaving:'',
  });

  const [localAddr, setLocalAddr] = useState(emptyAddr());
  const [permAddr,  setPermAddr]  = useState(emptyAddr());
  const [sameLocal, setSameLocal] = useState(false);
  const [pincodeLookupStatus, setPincodeLookupStatus] = useState('idle');

  const [edu, setEdu] = useState([emptyEdu()]);

  const [family, setFamily] = useState([emptyFamily()]);

  const [prev, setPrev] = useState([emptyPrev()]);

  const [docs, setDocs] = useState([emptyDoc()]);

  React.useEffect(() => {
    if (!p1.panNumber && !aadhaar) return;
    setDocs(prevDocs => {
      if (prevDocs.some(d => d.documentType)) return prevDocs;
      const prefilled = [];
      if (aadhaar)      prefilled.push({ ...emptyDoc(), documentType:'aadhaar', documentNumber: aadhaar.replace(/\s/g,'') });
      if (p1.panNumber) prefilled.push({ ...emptyDoc(), documentType:'pan',     documentNumber: p1.panNumber });
      return prefilled.length ? [...prefilled, emptyDoc()] : prevDocs;
    });
  }, [p1.panNumber, aadhaar]);

  const [bank, setBank] = useState({ bankName:'', accountNumber:'', ifscCode:'', accountType:'savings', bankVerificationStatus:'pending' });

  const [login, setLogin] = useState({ email:'', sendCredentials: true });

  const { data: dResRaw  } = useQuery({ queryKey:['departments'],  queryFn: employeeApi.getDepartments });
  const { data: dgResRaw } = useQuery({ queryKey:['designations'], queryFn: employeeApi.getDesignations });
  const { data: bResRaw  } = useQuery({ queryKey:['branches'],     queryFn: employeeApi.getBranches });
  const { data: mResRaw  } = useQuery({ queryKey:['managers'],     queryFn: employeeApi.getManagers });

  const dOpts  = extractArray(dResRaw).map(d => ({ value: d.id, label: d.name }));
  const dgOpts = extractArray(dgResRaw).map(d => ({ value: d.id, label: d.name }));
  const bOpts  = extractArray(bResRaw).map(b => ({ value: b.id, label: b.name }));
  const mOpts  = extractArray(mResRaw).map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName} (${m.employeeCode})` }));

  const kycLockPersonal = kycPrefilledFields.personal || {};
  const kycLockAddress  = kycPrefilledFields.address  || {};

  useEffect(() => {
    if (!kycIdFromUrl || kycApplied) return;
    api.get(`/automation/kyc/${kycIdFromUrl}`)
      .then(res => { const d = res.data?.data; if (d) applyKycRecord(kycIdFromUrl, d); })
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

      if (d.firstName || d.name)  prefilled.personal.firstName  = true;
      if (d.lastName  || d.name)  prefilled.personal.lastName   = true;
      if (d.middleName)           prefilled.personal.middleName  = true;
      if (d.fatherName)           prefilled.personal.fatherName  = true;
      if (d.dateOfBirth)          prefilled.personal.dateOfBirth = true;
      if (d.gender)               prefilled.personal.gender      = true;
      if (d.panNumber || d.pan)   prefilled.personal.panNumber   = true;

      setP1(prev => ({
        ...prev,
        firstName:     d.firstName || nameParts[0]                  || prev.firstName,
        lastName:      d.lastName  || nameParts[nameParts.length-1] || prev.lastName,
        middleName:    d.middleName    || prev.middleName,
        fatherName:    d.fatherName    || prev.fatherName,
        motherName:    d.motherName    || prev.motherName,
        spouseName:    d.spouseName    || prev.spouseName,
        dateOfBirth:   d.dateOfBirth   || prev.dateOfBirth,
        gender:        d.gender        || prev.gender,
        maritalStatus: d.maritalStatus || prev.maritalStatus,
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
      setAadhaarMsg('✓ Auto-filled from central KYC — mobile and email remain editable');
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

  async function checkAadhaar() {
    const raw = aadhaar.replace(/\s/g, '');
    if (raw.length !== 12 || !/^\d{12}$/.test(raw)) {
      setErrors(e => ({ ...e, aadhaar: 'Enter a valid 12-digit Aadhaar number' }));
      return;
    }
    setErrors(e => { const n = {...e}; delete n.aadhaar; return n; });
    setAadhaarState('checking');
    setAadhaarMsg('Checking Aadhaar…');

    try {
      const hash = await computeSha256Hex(raw);
      let d;
      try {
        const res = await api.post('/employees/check-aadhaar', { aadhaarHash: hash });
        d = res.data;
      } catch (apiErr) {
        console.warn('[Aadhaar] API unavailable', apiErr.message);
        setAadhaarState('ok');
        setAadhaarMsg('Check Aadhaar format valid');
        return;
      }

      if (d.status === 'exists') {
        setAadhaarState('dup_emp');
        setDupInfo(d);
        setAadhaarMsg(`⚠ Already registered — Employee ${d.existing?.employeeCode || ''}`);
        return;
      }
      if (d.status === 'draft') {
        setAadhaarState('dup_draft');
        setDupInfo(d);
        setAadhaarMsg(`⚠ Incomplete entry found — resume draft?`);
        return;
      }
      if (d.status === 'kyc_available') {
        const stale = isOlderThanOneYear(d.kycRecord?.createdAt);
        if (stale) {
          setAadhaarState('kyc_old');
          setKycStaleInfo(d.kycRecord);
          setAadhaarMsg(`KYC data is over a year old — use existing or refresh?`);
        } else {
          await applyKycRecord(d.kycRecord.id, d.kycRecord);
        }
        return;
      }
      if (d.status === 'no_kyc') {
        setAadhaarState('no_kyc');
        setAadhaarMsg('No KYC found — start eKYC automation to auto-fill, or fill manually');
        setDraftId(d.draftId || draftId);
        return;
      }
      setAadhaarState('ok');
      setAadhaarMsg('✓ Aadhaar verified — no duplicates found');
    } catch (err) {
      setAadhaarState('error');
      setAadhaarMsg(err.response?.data?.message || 'Verification failed — check connection');
    }
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
        if (s.aadhaarRaw) { setAadhaar(s.aadhaarRaw); setAadhaarState('ok'); setAadhaarMsg('✓ Restored from draft'); }
        if (s.personal && Object.keys(s.personal).length) setP1(s.personal);
      }

      const professional = d.step5?.professional || d.step1?.professional || {};
      if (Object.keys(professional).length) setP1b(professional);

      const addrData = d.step6 || d.step2;
      if (addrData) {
        setLocalAddr(addrData.local    || emptyAddr());
        setPermAddr(addrData.permanent || emptyAddr());
        setSameLocal(addrData.sameLocal || false);
      }

      if ((d.step7 || d.step3)?.length)  setEdu(d.step7    || d.step3);
      if ((d.step8 || d.step4)?.length)  setFamily(d.step8 || d.step4);
      if ((d.step9 || d.step5)?.length)  setPrev(d.step9   || d.step5);

      const bankData = d.step11 || d.step7;
      if (bankData) setBank(bankData);

      const loginData = d.step12 || d.step8;
      if (loginData) setLogin(loginData);

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
    switch (s) {
      case 1:  return { aadhaarRaw: aadhaar, personal: p1 };
      case 2:  return { personal: p1 };
      case 3:  return { personal: p1 };
      case 4:  return { personal: p1 };
      case 5:  return { professional: p1b };
      case 6:  return { local: localAddr, permanent: sameLocal ? localAddr : permAddr, sameLocal };
      case 7:  return edu;
      case 8:  return family;
      case 9:  return prev;
      case 10: return docs.map(d => ({ documentType: d.documentType, documentNumber: d.documentNumber }));
      case 11: return bank;
      case 12: return login;
      default: return null;
    }
  }

  async function saveDraftStep(show = true) {
    if (!draftId) return;
    try {
      await employeeApi.saveDraftStep(draftId, step, getStepPayload(step), empId);
      if (show) toast.success('Draft saved', { id: 'ds' });
    } catch {}
  }

  async function handleLocalPincodeBlur() {
    const pin = (localAddr.pincode || '').replace(/\D/g, '');
    if (pin.length !== 6) return;
    setPincodeLookupStatus('loading');
    setErrors(prev => { const n = {...prev}; delete n.localPincode; return n; });
    try {
      const res = await api.get(`/utils/pincode/${pin}`);
      const d   = res.data?.data || res.data;
      if (d?.state || d?.district || d?.city) {
        setLocalAddr(prev => ({
          ...prev,
          state:       d.state    || prev.state,
          district:    d.district || prev.district,
          villageCity: d.city     || prev.villageCity,
        }));
        setPincodeLookupStatus('success');
        setTimeout(() => setPincodeLookupStatus('idle'), 3000);
      } else {
        setPincodeLookupStatus('failed');
        setTimeout(() => setPincodeLookupStatus('idle'), 3000);
      }
    } catch {
      setPincodeLookupStatus('failed');
      setTimeout(() => setPincodeLookupStatus('idle'), 3000);
    }
  }

  function validate() {
    const e = {};

    if (step === 1) {
      if (aadhaarState !== 'ok' && aadhaarState !== 'dup_draft') e.aadhaar = 'Verify Aadhaar before continuing';
      if (!p1.firstName.trim())  e.firstName = 'Required';
      if (!p1.lastName.trim())   e.lastName  = 'Required';
    }
    if (step === 2) {
      if (!p1.dateOfBirth) e.dateOfBirth = 'Required';
      if (!p1.gender)      e.gender      = 'Required';
    }
    if (step === 3) {
      if (!p1.personalEmail && !p1.workEmail) e.personalEmail = 'At least one email is required';
      if (p1.personalEmail) { const err = validators.email(p1.personalEmail); if (err) e.personalEmail = err; }
      if (p1.workEmail)     { const err = validators.email(p1.workEmail);     if (err) e.workEmail     = err; }
      if (p1.phone)         { const err = validators.mobile(p1.phone);        if (err) e.phone         = err; }
    }
    if (step === 5) {
      if (!p1b.dateOfJoining) e.dateOfJoining = 'Required';
    }
    if (step === 8) {
      const epfNominees = family.filter(f => f.isNominee && f.nomineeFor !== 'esi');
      const epfTotal    = epfNominees.reduce((s, f) => s + parseFloat(f.nomineePercentage || 0), 0);
      if (epfNominees.length && Math.abs(epfTotal - 100) > 0.01)
        e.nomineeTotal = `EPF nominees must total 100% (currently ${Math.round(epfTotal * 100) / 100}%)`;
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

      if (step === 5 && !empId) {
        const res = await employeeApi.create({
          ...p1, ...p1b,
          aadhaarNumber: aadhaar.replace(/\s/g, ''),
          kycId:    kycId    || undefined,
          kycPhoto: kycPhoto || undefined,
        });
        id = res?.id;
        if (!id) throw new Error('Server did not return employee ID — check server logs');
        setEmpId(id);

        if (kycId && !kycLinkedRef.current) {
          kycLinkedRef.current = true;
          try { await api.post(`/automation/kyc/${kycId}/link`, { employeeId: id }); }
          catch (linkErr) { console.warn('[KYC] link failed (non-fatal):', linkErr.message); }
        }
      }

      if (step === 6 && id) {
        await employeeApi.upsertAddress(id, 'local',     localAddr);
        await employeeApi.upsertAddress(id, 'permanent', sameLocal ? localAddr : permAddr);
      }
      if (step === 7 && id) {
        const validEdu = edu.filter(e => e.eduLevel);
        if (validEdu.length) await employeeApi.bulkEducation(id, validEdu);
      }
      if (step === 8  && id && family.length) await employeeApi.bulkFamily(id, family);
      if (step === 9  && id)                  await employeeApi.bulkPrevEmp(id, prev);
      if (step === 11 && id && bank.bankName) await employeeApi.addBankAccount(id, bank);

      if (draftId) await employeeApi.saveDraftStep(draftId, step, getStepPayload(step), id);

      setCompleted(c => c.includes(step) ? c : [...c, step].sort((a, b) => a - b));
      setStep(s => s + 1);
      setErrors({});
      window.scrollTo(0, 0);
    } catch (err) {
      const apiMsg  = err.response?.data?.message || err.response?.data?.error;
      const httpMsg = err.response?.status ? `Server error ${err.response.status}` : null;
      const netMsg  = !err.response ? 'Cannot reach server — check connection' : null;
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
    if (!email) { setErrors({ loginEmail: 'Email required' }); return; }
    const emailErr = validators.email(email);
    if (emailErr) { setErrors({ loginEmail: emailErr }); return; }
    if (!empId) { toast.error('Employee record missing'); return; }
    setSaving(true);
    try {
      const res = await employeeApi.createLogin(empId, { email, sendCredentials: login.sendCredentials });
      if (draftId) await employeeApi.completeDraft(draftId).catch(() => {});
      qc.invalidateQueries({ queryKey: ['employees'] });
      setTempModal({ open: true, password: res?.tempPassword, email: res?.email });
    } catch (err) {
      const apiMsg  = err.response?.data?.message || err.response?.data?.error;
      const httpMsg = err.response?.status ? `Server error ${err.response.status}` : null;
      const netMsg  = !err.response ? 'Cannot reach server — check connection' : null;
      const errMsg  = apiMsg || httpMsg || netMsg || err.message || 'Login creation failed';
      toast.error(errMsg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _loginError: errMsg }));
    } finally {
      setSaving(false);
    }
  }

  async function skipLogin() {
    if (draftId) await employeeApi.completeDraft(draftId).catch(() => {});
    qc.invalidateQueries({ queryKey: ['employees'] });
    toast.success('Employee added successfully');
    navigate('/employees');
  }

  const nomineeTotal = Math.round(
    family.filter(f => f.isNominee).reduce((s, f) => s + parseFloat(f.nomineePercentage || 0), 0) * 100
  ) / 100;

  const currentStep = STEPS[step - 1];

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)', minHeight: '500px' }}>

      {}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="text-gray-400 hover:text-gray-700 text-sm font-medium flex items-center gap-1 transition-colors">
            ← List
          </button>
          <span className="text-gray-200">|</span>
          <span className="text-base">{currentStep.icon}</span>
          <h1 className="text-sm font-bold text-gray-800">Add Employee</h1>
          {draftId && <span className="text-xs text-gray-400 hidden sm:inline">· Auto-saved every 30 s</span>}
        </div>
        <div className="flex items-center gap-2">
          {draftId && (
            <button
              onClick={() => saveDraftStep(true)}
              className="text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors">
              💾 Save Draft
            </button>
          )}
        </div>
      </div>

      {}
      <StepRail step={step} completed={completed} />

      {}
      <div className="flex-1 overflow-y-auto px-4 py-3">

        {}
        {errors._saveError && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <span className="text-red-500 text-sm flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-700">Save failed</p>
              <p className="text-xs text-red-600 mt-0.5">{errors._saveError}</p>
            </div>
            <button onClick={() => setErrors(e => ({ ...e, _saveError: null }))}
              className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
          </div>
        )}

        {}
        {step === 1 && (
          <div>
            <StepHero
              icon="🪪" color="indigo"
              title="Aadhaar & Identity"
              subtitle="Verify Aadhaar and enter the employee's full legal name"
            />

            {}
            <Section title="Aadhaar Verification" emoji="🔍" badge="KYC Entry Point">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[180px] max-w-[260px]">
                  <F label="Aadhaar Number" req error={errors.aadhaar}>
                    <TI
                      type="text" placeholder="XXXX XXXX XXXX"
                      value={aadhaar}
                      onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                      maxLength={14}
                      disabled={aadhaarState === 'checking' || aadhaarState === 'ok'}
                    />
                  </F>
                </div>
                <button
                  onClick={checkAadhaar}
                  disabled={aadhaarState === 'checking' || aadhaarState === 'ok'}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap h-[34px]">
                  {aadhaarState === 'checking' ? 'Checking…' : aadhaarState === 'ok' ? '✓ Verified' : 'Verify Aadhaar'}
                </button>
                {aadhaarState === 'ok' && (
                  <button onClick={() => { setAadhaarState('idle'); setAadhaarMsg(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1.5 rounded-lg h-[34px]">
                    Change
                  </button>
                )}
                {aadhaarState === 'dup_draft' && dupInfo && (
                  <button onClick={() => navigate(`/employees/add?draftId=${dupInfo.draftId}`)}
                    className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-700 h-[34px]">
                    📋 Resume Draft
                  </button>
                )}
                {aadhaarState === 'dup_emp' && dupInfo && (
                  <button onClick={() => navigate(`/employees/${dupInfo.existing?.id}`)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 h-[34px]">
                    View Employee
                  </button>
                )}
                {aadhaarState === 'no_kyc' && (
                  <button onClick={handleRedoKyc}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 h-[34px]">
                    🔄 Start eKYC
                  </button>
                )}
                {aadhaarState === 'kyc_old' && (
                  <>
                    <button onClick={handleUseExistingKyc}
                      className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-yellow-700 h-[34px]">
                      Use Existing
                    </button>
                    <button onClick={handleRedoKyc}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 h-[34px]">
                      Refresh KYC
                    </button>
                  </>
                )}
                <KycBadge state={aadhaarState} msg={aadhaarMsg} />
              </div>
            </Section>

            {}
            <Section title="Full Legal Name" emoji="📝">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="First Name" req error={errors.firstName}>
                  <TI ref={firstNameRef} placeholder="First name" value={p1.firstName}
                    onChange={e => setP1(p => ({ ...p, firstName: e.target.value }))}
                    disabled={kycLockPersonal.firstName} />
                </F>
                <F label="Middle Name" error={errors.middleName}>
                  <TI placeholder="Middle name (optional)" value={p1.middleName}
                    onChange={e => setP1(p => ({ ...p, middleName: e.target.value }))}
                    disabled={kycLockPersonal.middleName} />
                </F>
                <F label="Last Name" req error={errors.lastName}>
                  <TI placeholder="Last name" value={p1.lastName}
                    onChange={e => setP1(p => ({ ...p, lastName: e.target.value }))}
                    disabled={kycLockPersonal.lastName} />
                </F>
                <F label="Father's Name" error={errors.fatherName}>
                  <TI placeholder="Father's full name" value={p1.fatherName}
                    onChange={e => setP1(p => ({ ...p, fatherName: e.target.value }))}
                    disabled={kycLockPersonal.fatherName} />
                </F>
                <F label="Mother's Name" error={errors.motherName}>
                  <TI placeholder="Mother's full name" value={p1.motherName}
                    onChange={e => setP1(p => ({ ...p, motherName: e.target.value }))} />
                </F>
                <F label="Marital Status" error={errors.maritalStatus}>
                  <SI value={p1.maritalStatus} onChange={e => setP1(p => ({ ...p, maritalStatus: e.target.value }))}
                    options={MARITAL_OPTS} placeholder="Select status" />
                </F>
                {p1.maritalStatus === 'married' && (
                  <F label="Spouse Name" error={errors.spouseName}>
                    <TI placeholder="Spouse's full name" value={p1.spouseName}
                      onChange={e => setP1(p => ({ ...p, spouseName: e.target.value }))} />
                  </F>
                )}
              </div>
            </Section>
          </div>
        )}

        {}
        {step === 2 && (
          <div>
            <StepHero
              icon="👤" color="purple"
              title="Personal Details"
              subtitle="Date of birth, gender, demographics and cultural information"
            />

            <Section title="Core Demographics" emoji="📋">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Date of Birth" req error={errors.dateOfBirth}>
                  <TI type="date" value={p1.dateOfBirth}
                    onChange={e => setP1(p => ({ ...p, dateOfBirth: e.target.value }))}
                    disabled={kycLockPersonal.dateOfBirth} />
                </F>
                <F label="Gender" req error={errors.gender}>
                  <SI value={p1.gender} onChange={e => setP1(p => ({ ...p, gender: e.target.value }))}
                    options={GENDER_OPTS} placeholder="Select gender"
                    disabled={kycLockPersonal.gender} />
                </F>
                <F label="Blood Group" error={errors.bloodGroup}>
                  <SI value={p1.bloodGroup} onChange={e => setP1(p => ({ ...p, bloodGroup: e.target.value }))}
                    options={BLOOD_OPTS} placeholder="Select" />
                </F>
                <F label="Nationality" error={errors.nationality}>
                  <SI value={p1.nationality} onChange={e => setP1(p => ({ ...p, nationality: e.target.value }))}
                    options={NATIONALITY_OPTS} placeholder="Select" />
                </F>
                <F label="Preferred Language" error={errors.preferredLanguage}>
                  <SI value={p1.preferredLanguage} onChange={e => setP1(p => ({ ...p, preferredLanguage: e.target.value }))}
                    options={LANGUAGE_OPTS} placeholder="Select language" />
                </F>
                <F label="Religion (Optional)" error={errors.religion}>
                  <TI placeholder="e.g., Hindu, Muslim, Christian"
                    value={p1.religion} onChange={e => setP1(p => ({ ...p, religion: e.target.value }))} />
                </F>
                <F label="Disability" error={errors.disabilityStatus}>
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input type="checkbox" checked={p1.disabilityStatus}
                      onChange={e => setP1(p => ({ ...p, disabilityStatus: e.target.checked }))}
                      className="w-4 h-4" />
                    <span className="text-sm text-gray-700">Person with Disability (PwD)</span>
                  </label>
                </F>
              </div>
            </Section>
          </div>
        )}

        {}
        {step === 3 && (
          <div>
            <StepHero
              icon="📞" color="sky"
              title="Contact Information & KYC IDs"
              subtitle="Phone numbers, email addresses, and statutory compliance IDs"
            />

            <Section title="Phone & Email" emoji="✉️">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Personal Email" req={!p1.workEmail} error={errors.personalEmail}>
                  <TI type="email" placeholder="personal@email.com" value={p1.personalEmail}
                    onChange={e => setP1(p => ({ ...p, personalEmail: e.target.value }))} />
                </F>
                <F label="Work Email" req={!p1.personalEmail} error={errors.workEmail}>
                  <TI type="email" placeholder="name@company.com" value={p1.workEmail}
                    onChange={e => setP1(p => ({ ...p, workEmail: e.target.value }))} />
                </F>
                <F label="Mobile Phone" error={errors.phone}>
                  <TI type="tel" placeholder="10-digit mobile" value={p1.phone}
                    onChange={e => setP1(p => ({ ...p, phone: e.target.value }))} />
                </F>
                <F label="Work Phone Extension" error={errors.workPhoneExtension}>
                  <TI placeholder="e.g., 201" value={p1.workPhoneExtension}
                    onChange={e => setP1(p => ({ ...p, workPhoneExtension: e.target.value }))} />
                </F>
              </div>
            </Section>

            <Section title="KYC & Compliance IDs" emoji="🪪">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="PAN Number" error={errors.panNumber}>
                  <TI placeholder="ABCDE1234F" value={p1.panNumber}
                    onChange={e => setP1(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                    disabled={kycLockPersonal.panNumber} maxLength={10} />
                </F>
                <F label="UAN Number" error={errors.uanNumber}>
                  <TI placeholder="12-digit UAN" value={p1.uanNumber}
                    onChange={e => setP1(p => ({ ...p, uanNumber: e.target.value }))} />
                </F>
                <F label="ESI IP Number" error={errors.esiIpNumber}>
                  <TI placeholder="ESI IP number" value={p1.esiIpNumber}
                    onChange={e => setP1(p => ({ ...p, esiIpNumber: e.target.value }))} />
                </F>
              </div>
            </Section>
          </div>
        )}

        {}
        {step === 4 && (
          <div>
            <StepHero
              icon="🚨" color="rose"
              title="Emergency Contact"
              subtitle="Person to contact in case of emergency — can be updated later"
            />

            <Section title="Emergency Contact Details" emoji="📟">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Contact Name" error={errors.emergencyContactName}>
                  <TI placeholder="Full name" value={p1.emergencyContactName}
                    onChange={e => setP1(p => ({ ...p, emergencyContactName: e.target.value }))} />
                </F>
                <F label="Relationship" error={errors.emergencyContactRel}>
                  <TI placeholder="e.g., Spouse, Parent, Sibling" value={p1.emergencyContactRel}
                    onChange={e => setP1(p => ({ ...p, emergencyContactRel: e.target.value }))} />
                </F>
                <F label="Phone Number" error={errors.emergencyContactPhone}>
                  <TI type="tel" placeholder="Emergency contact phone" value={p1.emergencyContactPhone}
                    onChange={e => setP1(p => ({ ...p, emergencyContactPhone: e.target.value }))} />
                </F>
                <F label="Email (Optional)" error={errors.emergencyContactEmail}>
                  <TI type="email" placeholder="Emergency contact email" value={p1.emergencyContactEmail}
                    onChange={e => setP1(p => ({ ...p, emergencyContactEmail: e.target.value }))} />
                </F>
              </div>
            </Section>

            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
              ℹ️ Emergency contact details are optional but strongly recommended for workplace safety compliance.
              You can skip this step and add the contact later from the employee's profile.
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 5 — Employment & Role
        ══════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div>
            <StepHero
              icon="💼" color="amber"
              title="Employment & Role"
              subtitle="Job position, department, branch and employment dates — employee record is created at this step"
            />

            <Section title="Job Position" emoji="🏷️">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Employee Code" error={errors.employeeCode}>
                  <TI placeholder="Auto-generated if blank" value={p1b.employeeCode}
                    onChange={e => setP1b(p => ({ ...p, employeeCode: e.target.value }))} />
                </F>
                <F label="Branch" error={errors.branchId}>
                  <SI value={p1b.branchId} onChange={e => setP1b(p => ({ ...p, branchId: e.target.value }))}
                    options={bOpts} placeholder="Select branch" />
                </F>
                <F label="Department" error={errors.departmentId}>
                  <SI value={p1b.departmentId} onChange={e => setP1b(p => ({ ...p, departmentId: e.target.value }))}
                    options={dOpts} placeholder="Select department" />
                </F>
                <F label="Designation" error={errors.designationId}>
                  <SI value={p1b.designationId} onChange={e => setP1b(p => ({ ...p, designationId: e.target.value }))}
                    options={dgOpts} placeholder="Select designation" />
                </F>
                <F label="Reports To" error={errors.reportingTo}>
                  <SI value={p1b.reportingTo} onChange={e => setP1b(p => ({ ...p, reportingTo: e.target.value }))}
                    options={mOpts} placeholder="Select manager" />
                </F>
                <F label="Employment Type" error={errors.employmentType}>
                  <SI value={p1b.employmentType} onChange={e => setP1b(p => ({ ...p, employmentType: e.target.value }))}
                    options={EMP_OPTS} />
                </F>
                <F label="Status" error={errors.status}>
                  <SI value={p1b.status} onChange={e => setP1b(p => ({ ...p, status: e.target.value }))}
                    options={STATUS_OPTS} />
                </F>
              </div>
            </Section>

            <Section title="Employment Dates" emoji="📅">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Date of Joining" req error={errors.dateOfJoining}>
                  <TI type="date" value={p1b.dateOfJoining}
                    onChange={e => setP1b(p => ({ ...p, dateOfJoining: e.target.value }))} />
                </F>
                <F label="Probation End Date" error={errors.probationEndDate}>
                  <TI type="date" value={p1b.probationEndDate}
                    onChange={e => setP1b(p => ({ ...p, probationEndDate: e.target.value }))} />
                </F>
                <F label="Confirmation Date" error={errors.confirmationDate}>
                  <TI type="date" value={p1b.confirmationDate}
                    onChange={e => setP1b(p => ({ ...p, confirmationDate: e.target.value }))} />
                </F>
              </div>
            </Section>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
              💡 Clicking <strong>Next</strong> will create the employee record in the system using all the information entered so far.
              Subsequent steps will add additional details to the same record.
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 6 — Address
        ══════════════════════════════════════════════════════ */}
        {step === 6 && (
          <div>
            <StepHero
              icon="🏠" color="green"
              title="Address Details"
              subtitle="Local / current address and permanent address"
            />

            <Section title="Local / Current Address" emoji="📍">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <F label="House / Flat No" error={errors.localHouseNo}>
                  <TI placeholder="Flat / House no." value={localAddr.houseNo}
                    onChange={e => setLocalAddr(p => ({ ...p, houseNo: e.target.value }))}
                    disabled={kycLockAddress.houseNo} />
                </F>
                <F label="Street / Area" error={errors.localStreet}>
                  <TI placeholder="Street / area" value={localAddr.street}
                    onChange={e => setLocalAddr(p => ({ ...p, street: e.target.value }))}
                    disabled={kycLockAddress.street} />
                </F>
                <F label="Village / City" error={errors.localVillageCity}>
                  <TI placeholder="City / village" value={localAddr.villageCity}
                    onChange={e => setLocalAddr(p => ({ ...p, villageCity: e.target.value }))}
                    disabled={kycLockAddress.villageCity} />
                </F>
                <F label="District" error={errors.localDistrict}>
                  <TI placeholder="District" value={localAddr.district}
                    onChange={e => setLocalAddr(p => ({ ...p, district: e.target.value }))}
                    disabled={kycLockAddress.district} />
                </F>
                <F label="State" error={errors.localState}>
                  <TI placeholder="State" value={localAddr.state}
                    onChange={e => setLocalAddr(p => ({ ...p, state: e.target.value }))}
                    disabled={kycLockAddress.state} />
                </F>
                <F label="Country" error={errors.localCountry}>
                  <TI placeholder="Country" value={localAddr.country}
                    onChange={e => setLocalAddr(p => ({ ...p, country: e.target.value }))} />
                </F>
                <F label="Pincode" error={errors.localPincode}>
                  <div>
                    <TI placeholder="6-digit pincode" value={localAddr.pincode}
                      onChange={e => setLocalAddr(p => ({ ...p, pincode: e.target.value }))}
                      onBlur={handleLocalPincodeBlur}
                      disabled={kycLockAddress.pincode} />
                    {pincodeLookupStatus === 'loading' && <p className="text-xs text-blue-600 mt-0.5">🔍 Looking up…</p>}
                    {pincodeLookupStatus === 'success' && <p className="text-xs text-green-600 mt-0.5">✓ Location auto-filled</p>}
                    {pincodeLookupStatus === 'failed'  && <p className="text-xs text-red-500 mt-0.5">Invalid pincode</p>}
                  </div>
                </F>
              </div>
            </Section>

            <Section
              title="Permanent Address" emoji="🏡"
              action={
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={sameLocal}
                    onChange={e => { setSameLocal(e.target.checked); if (e.target.checked) setPermAddr(localAddr); }}
                    className="w-3.5 h-3.5" />
                  <span className="text-xs text-gray-600">Same as local</span>
                </label>
              }
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  ['House / Flat No', 'houseNo',     'permHouseNo',     'Flat / House no.'],
                  ['Street / Area',   'street',      'permStreet',      'Street / area'],
                  ['Village / City',  'villageCity', 'permVillageCity', 'City / village'],
                  ['District',        'district',    'permDistrict',    'District'],
                  ['State',           'state',       'permState',       'State'],
                  ['Country',         'country',     'permCountry',     'Country'],
                  ['Pincode',         'pincode',     'permPincode',     '6-digit pincode'],
                ].map(([label, key, errKey, ph]) => (
                  <F key={key} label={label} error={errors[errKey]}>
                    <TI placeholder={ph} value={permAddr[key]}
                      onChange={e => setPermAddr(p => ({ ...p, [key]: e.target.value }))}
                      disabled={sameLocal} />
                  </F>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 7 — Education
        ══════════════════════════════════════════════════════ */}
        {step === 7 && (
          <div>
            <StepHero
              icon="🎓" color="violet"
              title="Educational Qualifications"
              subtitle="Add academic qualifications from 10th onwards — you can skip this step"
            />

            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">All qualifications are optional</p>
              <button onClick={() => setEdu(p => [...p, emptyEdu()])}
                className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 font-semibold transition-colors">
                + Add Qualification
              </button>
            </div>

            {edu.map((ed, i) => (
              <Section
                key={i} emoji="📚"
                title={`Qualification ${i + 1}`}
                badge={ed.eduLevel || undefined}
                action={
                  <button onClick={() => setEdu(p => p.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <F label="Level" error={errors[`eduLevel_${i}`]}>
                    <SI value={ed.eduLevel}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, eduLevel: e.target.value } : x))}
                      options={EDU_LEVELS} placeholder="Select level" />
                  </F>
                  <F label="Course Type">
                    <TI placeholder="Regular / Distance" value={ed.courseType}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, courseType: e.target.value } : x))} />
                  </F>
                  <F label="Stream / Subject">
                    <TI placeholder="Science / Commerce" value={ed.streamSubject}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, streamSubject: e.target.value } : x))} />
                  </F>
                  <F label="Course Name">
                    <TI placeholder="e.g., B.Tech CSE" value={ed.courseName}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, courseName: e.target.value } : x))} />
                  </F>
                  <F label="Institution">
                    <TI placeholder="School / College" value={ed.institutionName}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, institutionName: e.target.value } : x))} />
                  </F>
                  <F label="Board / University">
                    <TI placeholder="Board or University" value={ed.boardUniversity}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, boardUniversity: e.target.value } : x))} />
                  </F>
                  <F label="Passing Year">
                    <TI placeholder="YYYY" value={ed.passingYear}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, passingYear: e.target.value } : x))} />
                  </F>
                  <F label="Percentage / CGPA">
                    <TI placeholder="e.g., 75.5" value={ed.percentage}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, percentage: e.target.value } : x))} />
                  </F>
                  <F label="Grade">
                    <TI placeholder="e.g., A+" value={ed.grade}
                      onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, grade: e.target.value } : x))} />
                  </F>
                  <F label="Currently Pursuing">
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input type="checkbox" checked={ed.isCurrent}
                        onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, isCurrent: e.target.checked } : x))}
                        className="w-4 h-4" />
                      <span className="text-sm text-gray-700">Still studying</span>
                    </label>
                  </F>
                </div>
              </Section>
            ))}
            {edu.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                🎓 No qualifications added yet — click "+ Add Qualification" above
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 8 — Family & Nominees
        ══════════════════════════════════════════════════════ */}
        {step === 8 && (
          <div>
            <StepHero
              icon="👨‍👩‍👧" color="pink"
              title="Family Members & Nominees"
              subtitle="Dependents, EPF/ESI nominees — EPF nominee percentages must total 100%"
            />

            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">
                {family.filter(f => f.isNominee).length > 0 && (
                  <span className={`font-semibold ${Math.abs(nomineeTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                    EPF nominee total: {nomineeTotal}% {Math.abs(nomineeTotal - 100) < 0.01 ? '✓' : '(must reach 100%)'}
                  </span>
                )}
              </p>
              <button onClick={() => setFamily(p => [...p, emptyFamily()])}
                className="text-xs bg-pink-600 text-white px-3 py-1.5 rounded-lg hover:bg-pink-700 font-semibold transition-colors">
                + Add Member
              </button>
            </div>
            {errors.nomineeTotal && (
              <p className="text-xs text-red-500 mb-3 p-2.5 bg-red-50 rounded-xl">⚠️ {errors.nomineeTotal}</p>
            )}

            {family.map((fm, i) => (
              <Section
                key={i} emoji="👤"
                title={fm.name ? fm.name : `Member ${i + 1}`}
                badge={fm.relationship || undefined}
                action={
                  <button onClick={() => setFamily(p => p.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <F label="Full Name">
                    <TI placeholder="Full name" value={fm.name}
                      onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                  </F>
                  <F label="Relationship">
                    <SI value={fm.relationship}
                      onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, relationship: e.target.value } : x))}
                      options={RELATIONSHIPS} placeholder="Select" />
                  </F>
                  <F label="Gender">
                    <SI value={fm.gender}
                      onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, gender: e.target.value } : x))}
                      options={GENDER_OPTS} placeholder="Select" />
                  </F>
                  <F label="Date of Birth">
                    <TI type="date" value={fm.dateOfBirth}
                      onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, dateOfBirth: e.target.value } : x))} />
                  </F>
                  <F label="Age">
                    <TI type="number" placeholder="Age" value={fm.age}
                      onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, age: e.target.value } : x))} />
                  </F>
                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flags</label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {[
                        ['isDependent','isDependent', 'Dependent'],
                        ['isNominee',  'isNominee',   'Nominee'],
                        ['isMinor',    'isMinor',     'Minor'],
                        ['disabilityStatus','disabilityStatus','Disability'],
                      ].map(([id, key, lbl]) => (
                        <label key={key} className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={fm[key]}
                            onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, [key]: e.target.checked } : x))}
                            className="w-3.5 h-3.5" />
                          <span className="text-xs text-gray-700">{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {fm.isNominee && (
                    <>
                      <F label="Nominee %">
                        <TI type="number" placeholder="e.g., 50" value={fm.nomineePercentage}
                          onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, nomineePercentage: e.target.value } : x))} />
                      </F>
                      <F label="Nominee For">
                        <SI value={fm.nomineeFor}
                          onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, nomineeFor: e.target.value } : x))}
                          options={[{ value:'all',label:'All' },{ value:'epf',label:'EPF Only' },{ value:'esi',label:'ESI Only' }]} />
                      </F>
                    </>
                  )}
                  {fm.isMinor && (
                    <F label="Guardian Name">
                      <TI placeholder="Guardian full name" value={fm.guardianName}
                        onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, guardianName: e.target.value } : x))} />
                    </F>
                  )}
                </div>
              </Section>
            ))}
            {family.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                👨‍👩‍👧 No family members added yet
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 9 — Previous Experience
        ══════════════════════════════════════════════════════ */}
        {step === 9 && (
          <div>
            <StepHero
              icon="🏢" color="orange"
              title="Previous Employment"
              subtitle="Work history and reference contacts — skip if this is the employee's first job"
            />

            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">Skip this step if the employee is a fresher</p>
              <button onClick={() => setPrev(p => [...p, emptyPrev()])}
                className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 font-semibold transition-colors">
                + Add Employment
              </button>
            </div>

            {prev.map((pv, i) => (
              <Section
                key={i} emoji="🏢"
                title={pv.organizationName || `Employment ${i + 1}`}
                badge={pv.designation || undefined}
                action={
                  <button onClick={() => setPrev(p => p.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
                }
              >
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pv.isFresher}
                      onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, isFresher: e.target.checked } : x))}
                      className="w-4 h-4" />
                    <span className="text-sm text-gray-700 font-medium">🌱 Fresher — no prior employment</span>
                  </label>
                </div>
                {!pv.isFresher && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <F label="Organization">
                      <TI placeholder="Company name" value={pv.organizationName}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, organizationName: e.target.value } : x))} />
                    </F>
                    <F label="Designation">
                      <TI placeholder="Job title" value={pv.designation}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, designation: e.target.value } : x))} />
                    </F>
                    <F label="Joining Date">
                      <TI type="date" value={pv.joiningDate}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, joiningDate: e.target.value } : x))} />
                    </F>
                    <F label="Leaving Date">
                      <TI type="date" value={pv.leavingDate}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, leavingDate: e.target.value } : x))} />
                    </F>
                    <F label="Last CTC (₹/yr)">
                      <TI type="number" placeholder="Annual CTC" value={pv.lastCtcRupees}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, lastCtcRupees: e.target.value } : x))} />
                    </F>
                    <F label="Reason for Leaving">
                      <TI placeholder="Brief reason" value={pv.reasonForLeaving}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, reasonForLeaving: e.target.value } : x))} />
                    </F>
                    <F label="Reference Name">
                      <TI placeholder="Reference person" value={pv.referenceName}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, referenceName: e.target.value } : x))} />
                    </F>
                    <F label="Reference Phone">
                      <TI type="tel" placeholder="Reference contact" value={pv.referencePhone}
                        onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, referencePhone: e.target.value } : x))} />
                    </F>
                  </div>
                )}
              </Section>
            ))}
            {prev.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                🏢 No prior employment added yet
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 10 — Documents
        ══════════════════════════════════════════════════════ */}
        {step === 10 && (
          <div>
            <StepHero
              icon="📄" color="slate"
              title="Documents"
              subtitle="Upload identity proofs, certificates and compliance documents"
            />

            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">Aadhaar and PAN are pre-filled if verified earlier</p>
              <button onClick={() => setDocs(p => [...p, emptyDoc()])}
                className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 font-semibold transition-colors">
                + Add Document
              </button>
            </div>

            {docs.map((doc, i) => (
              <Section
                key={i} emoji="📋"
                title={DOC_TYPE_OPTS.find(o => o.value === doc.documentType)?.label || `Document ${i + 1}`}
                badge={doc.ocrStatus !== 'idle' ? doc.ocrStatus : undefined}
                action={
                  <button onClick={() => setDocs(p => p.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <F label="Document Type" error={errors[`docType_${i}`]}>
                    <SI value={doc.documentType}
                      onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, documentType: e.target.value } : x))}
                      options={DOC_TYPE_OPTS} placeholder="Select type" />
                  </F>
                  <F label="Document Number">
                    <TI placeholder="Document number" value={doc.documentNumber}
                      onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, documentNumber: e.target.value } : x))} />
                  </F>
                  <F label="Document Name / Label">
                    <TI placeholder="e.g., PAN Card" value={doc.documentName}
                      onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, documentName: e.target.value } : x))} />
                  </F>
                  <F label="Expiry Date">
                    <TI type="date" value={doc.expiryDate}
                      onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, expiryDate: e.target.value } : x))} />
                  </F>
                  <F label="Upload File">
                    <TI type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, fileName: e.target.files?.[0]?.name || '' } : x))} />
                  </F>
                </div>
              </Section>
            ))}
            {docs.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                📄 No documents added yet
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 11 — Bank Account
        ══════════════════════════════════════════════════════ */}
        {step === 11 && (
          <div>
            <StepHero
              icon="🏦" color="teal"
              title="Bank Account"
              subtitle="Salary disbursement bank account details"
            />

            <Section title="Salary Bank Account" emoji="💳">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Bank Name" error={errors.bankName}>
                  <TI placeholder="e.g., State Bank of India" value={bank.bankName}
                    onChange={e => setBank(p => ({ ...p, bankName: e.target.value }))} />
                </F>
                <F label="Account Number" error={errors.accountNumber}>
                  <TI placeholder="Account number" value={bank.accountNumber}
                    onChange={e => setBank(p => ({ ...p, accountNumber: e.target.value }))} />
                </F>
                <F label="IFSC Code" error={errors.ifscCode}>
                  <TI placeholder="e.g., SBIN0001234" value={bank.ifscCode}
                    onChange={e => setBank(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} maxLength={11} />
                </F>
                <F label="Account Type" error={errors.accountType}>
                  <SI value={bank.accountType}
                    onChange={e => setBank(p => ({ ...p, accountType: e.target.value }))}
                    options={[
                      { value:'savings', label:'💰 Savings' },
                      { value:'current', label:'🔄 Current' },
                      { value:'salary',  label:'💼 Salary' },
                    ]} />
                </F>
                <F label="Verification Status" error={errors.bankVerificationStatus}>
                  <SI value={bank.bankVerificationStatus}
                    onChange={e => setBank(p => ({ ...p, bankVerificationStatus: e.target.value }))}
                    options={[
                      { value:'pending',  label:'⏳ Pending Verification' },
                      { value:'verified', label:'✅ Verified (Penny Drop)' },
                      { value:'manual',   label:'👁️ Manually Verified' },
                    ]} />
                </F>
                <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={true} readOnly className="w-4 h-4" />
                    <span className="text-sm text-gray-700">✅ Primary / Salary Account</span>
                  </label>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 12 — Login Setup
        ══════════════════════════════════════════════════════ */}
        {step === 12 && (
          <div>
            <StepHero
              icon="🔐" color="blue"
              title="Login Setup"
              subtitle="Create employee portal access — a temporary password will be generated"
            />

            <Section title="Employee Login Access" emoji="🔑">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <F label="Login Email" error={errors.loginEmail}>
                  <TI type="email"
                    placeholder={p1.workEmail || p1.personalEmail || 'employee@company.com'}
                    value={login.email}
                    onChange={e => setLogin(p => ({ ...p, email: e.target.value }))} />
                </F>
                <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={login.sendCredentials}
                      onChange={e => setLogin(p => ({ ...p, sendCredentials: e.target.checked }))}
                      className="w-4 h-4" />
                    <span className="text-sm text-gray-700">📧 Send credentials by email</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                <p className="font-semibold mb-1">ℹ️ About employee login</p>
                <p>A temporary password will be generated. The employee must change it on first login.</p>
                <p className="mt-1">Leave login email blank to auto-use the work or personal email entered in Step 3.</p>
              </div>

              {errors._loginError && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-700">❌ Login creation failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{errors._loginError}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button onClick={skipLogin}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                  Skip — add login later
                </button>
              </div>
            </Section>
          </div>
        )}

      </div>

      {/* ── Sticky Footer ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white">
        <button
          onClick={() => { setStep(s => Math.max(1, s - 1)); setErrors({}); }}
          disabled={step === 1}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-200 transition-colors min-w-[100px]">
          ← Previous
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">
            {currentStep.icon} Step {step} of {TOTAL_STEPS}
            <span className="text-gray-400 font-normal"> · {currentStep.label}</span>
          </p>
          {SKIPPABLE_STEPS.includes(step) && step < TOTAL_STEPS && (
            <button onClick={goNext}
              className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2 mt-0.5">
              Skip this step →
            </button>
          )}
        </div>

        {step < TOTAL_STEPS ? (
          <button
            onClick={goNext}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors min-w-[100px]">
            {saving ? 'Saving…' : 'Next →'}
          </button>
        ) : (
          <button
            onClick={createLogin}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors min-w-[130px]">
            {saving ? 'Creating…' : '✓ Create Employee'}
          </button>
        )}
      </div>

      <TempModal
        open={tempModal.open}
        password={tempModal.password}
        email={tempModal.email}
        onDone={() => { setTempModal({ open: false, password: '', email: '' }); navigate('/employees'); }}
      />
    </div>
  );
}

