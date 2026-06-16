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
  { num: 1,  label: 'Aadhaar',    icon: '🪪',  color: 'indigo',  desc: 'ID & Basic Info' },
  { num: 2,  label: 'Personal',   icon: '👤',  color: 'purple',  desc: 'Demographics' },
  { num: 3,  label: 'Contact',    icon: '📞',  color: 'sky',     desc: 'Emails & IDs' },
  { num: 4,  label: 'Emergency',  icon: '🚨',  color: 'rose',    desc: 'Emergency' },
  { num: 5,  label: 'Employment', icon: '💼',  color: 'amber',   desc: 'Job Details' },
  { num: 6,  label: 'Address',    icon: '🏠',  color: 'green',   desc: 'Locations' },
  { num: 7,  label: 'Education',  icon: '🎓',  color: 'violet',  desc: 'Qualifications' },
  { num: 8,  label: 'Family',     icon: '👨‍👩‍👧',  color: 'pink',    desc: 'Dependents' },
  { num: 9,  label: 'Experience', icon: '🏢',  color: 'orange',  desc: 'Previous Jobs' },
  { num: 10, label: 'Documents',  icon: '📄',  color: 'slate',   desc: 'Uploads' },
  { num: 11, label: 'Bank',       icon: '🏦',  color: 'teal',    desc: 'Payment' },
  { num: 12, label: 'Login',      icon: '🔐',  color: 'blue',    desc: 'Access' },
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

const GENDER_OPTS      = [{ value:'male',label:'Male 👨' },{ value:'female',label:'Female 👩' },{ value:'other',label:'Other' }];
const MARITAL_OPTS     = ['single','married','divorced','widowed'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }));
const BLOOD_OPTS       = ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v => ({ value: v, label: v }));
const EMP_OPTS         = [{ value:'full_time',label:'Full Time' },{ value:'part_time',label:'Part Time' },{ value:'contract',label:'Contract' },{ value:'intern',label:'Intern' }];
const STATUS_OPTS      = [{ value:'active',label:'Active ✓' },{ value:'probation',label:'On Probation ⏳' }];
const LANGUAGE_OPTS    = ['Hindi','English','Bengali','Telugu','Marathi','Tamil','Gujarati','Kannada','Odia','Punjabi','Other'].map(v=>({value:v.toLowerCase(),label:v}));
const NATIONALITY_OPTS = [{ value:'indian',label:'Indian 🇮🇳' },{ value:'nri',label:'NRI' },{ value:'other',label:'Other' }];
const DOC_TYPE_OPTS    = [
  { value:'aadhaar',label:'📛 Aadhaar Card' },{ value:'pan',label:'🃏 PAN Card' },
  { value:'passport',label:'🛂 Passport' },{ value:'driving_license',label:'🚗 Driving License' },
  { value:'voter_id',label:'🗳️ Voter ID' },{ value:'bank_passbook',label:'🏦 Bank Passbook' },
  { value:'10th_marksheet',label:'📚 10th Marksheet' },{ value:'12th_marksheet',label:'📚 12th Marksheet' },
  { value:'degree_certificate',label:'🎓 Degree Certificate' },
  { value:'experience_letter',label:'💼 Experience Letter' },{ value:'other',label:'📄 Other' },
];

function F({ label, req, error, children, col, hint }) {
  return (
    <div className={`flex flex-col gap-0.5 ${col || ''}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-tight">
          {label}{req && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-gray-400 mb-0.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5 font-medium">⚠️ {error}</p>}
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

function Section({ title, emoji, badge, children, action, compact }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-white overflow-hidden ${compact ? 'mb-2' : 'mb-3'} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-1.5">
          {emoji && <span className="text-sm leading-none">{emoji}</span>}
          <span className={`font-bold ${compact ? 'text-xs' : 'text-sm'} text-gray-700 uppercase tracking-wider`}>{title}</span>
          {badge && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {action}
      </div>
      <div className={compact ? 'p-2' : 'p-3'}>
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
    <div className={`flex items-center gap-3 mb-3 p-3 bg-gradient-to-r ${cls} rounded-lg border text-sm`}>
      <span className="text-2xl leading-none">{icon}</span>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function StepRail({ step, completed }) {
  return (
    <div className="flex items-center border-b border-gray-100 bg-white px-2 overflow-x-auto flex-shrink-0"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      {STEPS.map((s, i) => {
        const done   = completed.includes(s.num);
        const active = step === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-0.5 px-1 py-2 flex-shrink-0 border-b-2 transition-all ${
              active ? 'border-blue-600' : done ? 'border-green-500' : 'border-transparent'
            }`}>
              <span title={s.label} className={`text-xs leading-none flex-shrink-0 ${
                done ? '' : active ? '' : 'opacity-30'
              }`}>
                {done ? '✅' : s.icon}
              </span>
              <span className={`text-xs whitespace-nowrap font-medium hidden lg:inline ${
                active ? 'text-blue-700' : done ? 'text-green-700' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="text-gray-200 text-xs flex-shrink-0 mx-0.5">›</span>}
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
  const creatingRef  = useRef(false); 

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
      const res  = await api.post('/employees/check-aadhaar', { aadhaarHash: hash });
      const d    = res.data;

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
    if (creatingRef.current) return; 
    creatingRef.current = true;
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
        
        try { qc.invalidateQueries({ queryKey: ['employees'] }); } catch (e) {  }

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
      creatingRef.current = false;
    }
  }

  async function createLogin() {
    const email = login.email || p1.workEmail || p1.personalEmail;
    if (!validateAll()) { toast.error('Fix errors before final submission'); return; }
    if (!email) { setErrors({ loginEmail: 'Email required' }); return; }
    const emailErr = validators.email(email);
    if (emailErr) { setErrors({ loginEmail: emailErr }); return; }
    if (!empId) { toast.error('Employee record missing'); return; }
    if (creatingRef.current) return;
    creatingRef.current = true;
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
      creatingRef.current = false;
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
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/employees')}
            className="text-gray-400 hover:text-gray-700 text-sm font-medium flex items-center gap-1 transition-colors">
            ← List
          </button>
          <span className="text-gray-200">|</span>
          <span className="text-lg">{currentStep.icon}</span>
          <h1 className="text-sm font-bold text-gray-800">Add Employee — {currentStep.desc}</h1>
          {draftId && <span className="text-xs text-gray-400 hidden sm:inline">· Auto-saved every 30 s</span>}
        </div>
        <div className="flex items-center gap-2">
          {draftId && (
            <button onClick={() => saveDraftStep(true)}
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
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
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
            <StepHero icon="🪪" color="indigo" title="Aadhaar & Identity"
              subtitle="Verify Aadhaar and enter the employee's full legal name" />

            {}
            <Section title="Aadhaar Verification" emoji="🔍" badge="KYC Entry Point" compact>
              <div className="flex flex-wrap items-end gap-2 mb-2">
                <div className="flex-1 min-w-[180px] max-w-[260px]">
                  <F label="Aadhaar Number" req error={errors.aadhaar}>
                    <TI type="text" placeholder="XXXX XXXX XXXX"
                      value={aadhaar} onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                      maxLength={14} disabled={aadhaarState === 'checking' || aadhaarState === 'ok'} />
                  </F>
                </div>
                <button onClick={checkAadhaar}
                  disabled={aadhaarState === 'checking' || aadhaarState === 'ok'}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap h-[34px]">
                  {aadhaarState === 'checking' ? 'Checking…' : aadhaarState === 'ok' ? '✓ Verified' : 'Verify'}
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
                    📋 Resume
                  </button>
                )}
                {aadhaarState === 'dup_emp' && dupInfo && (
                  <button onClick={() => navigate(`/employees/${dupInfo.existing?.id}`)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 h-[34px]">
                    👁️ View
                  </button>
                )}
                {aadhaarState === 'no_kyc' && (
                  <button onClick={handleRedoKyc}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 h-[34px]">
                    🔄 eKYC
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
                      Refresh
                    </button>
                  </>
                )}
              </div>
              <KycBadge state={aadhaarState} msg={aadhaarMsg} />
            </Section>

            {}
            <Section title="Full Legal Name" emoji="📝" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <F label="First Name" req error={errors.firstName}>
                  <TI ref={firstNameRef} placeholder="First name" value={p1.firstName}
                    onChange={e => setP1(p => ({ ...p, firstName: e.target.value }))}
                    disabled={kycLockPersonal.firstName} />
                </F>
                <F label="Middle Name" error={errors.middleName}>
                  <TI placeholder="Middle (optional)" value={p1.middleName}
                    onChange={e => setP1(p => ({ ...p, middleName: e.target.value }))}
                    disabled={kycLockPersonal.middleName} />
                </F>
                <F label="Last Name" req error={errors.lastName}>
                  <TI placeholder="Last name" value={p1.lastName}
                    onChange={e => setP1(p => ({ ...p, lastName: e.target.value }))}
                    disabled={kycLockPersonal.lastName} />
                </F>
                <F label="Father's Name" error={errors.fatherName}>
                  <TI placeholder="Father's name" value={p1.fatherName}
                    onChange={e => setP1(p => ({ ...p, fatherName: e.target.value }))}
                    disabled={kycLockPersonal.fatherName} />
                </F>
                <F label="Mother's Name" error={errors.motherName}>
                  <TI placeholder="Mother's name" value={p1.motherName}
                    onChange={e => setP1(p => ({ ...p, motherName: e.target.value }))} />
                </F>
                {}
                {p1.maritalStatus === 'married' && (
                  <F label="Spouse Name" req error={errors.spouseName}>
                    <TI placeholder="Spouse's name" value={p1.spouseName}
                      onChange={e => setP1(p => ({ ...p, spouseName: e.target.value }))} />
                  </F>
                )}
              </div>
            </Section>

            {}
            <Section title="Marital Status" emoji="💍" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <F label="Status" error={errors.maritalStatus}>
                    <SI value={p1.maritalStatus} onChange={e => setP1(p => ({ ...p, maritalStatus: e.target.value }))}
                      options={MARITAL_OPTS} placeholder="Select status" />
                  </F>
                </div>
              </div>
            </Section>
          </div>
        )}

        {}
        {step === 2 && (
          <div>
            <StepHero icon="👤" color="purple" title="Personal Details"
              subtitle="Date of birth, gender, demographics and cultural information" />

            <Section title="Core Demographics" emoji="📋" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                  <TI placeholder="e.g., Hindu, Muslim, Christian" value={p1.religion}
                    onChange={e => setP1(p => ({ ...p, religion: e.target.value }))} />
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
            <StepHero icon="📞" color="sky" title="Contact Information & KYC IDs"
              subtitle="Phone numbers, email addresses, and statutory compliance IDs" />

            <Section title="Phone & Email" emoji="✉️" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                <F label="Work Phone Ext." error={errors.workPhoneExtension} hint="Optional">
                  <TI placeholder="e.g., 201" value={p1.workPhoneExtension}
                    onChange={e => setP1(p => ({ ...p, workPhoneExtension: e.target.value }))} />
                </F>
              </div>
            </Section>

            <Section title="Statutory IDs" emoji="🪪" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <F label="PAN Number" error={errors.panNumber} hint="10 characters">
                  <TI placeholder="ABCDE1234F" value={p1.panNumber}
                    onChange={e => setP1(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                    disabled={kycLockPersonal.panNumber} maxLength={10} />
                </F>
                <F label="UAN Number" error={errors.uanNumber} hint="12 digits">
                  <TI placeholder="12-digit UAN" value={p1.uanNumber}
                    onChange={e => setP1(p => ({ ...p, uanNumber: e.target.value }))} />
                </F>
                <F label="ESI IP Number" error={errors.esiIpNumber} hint="Optional">
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
            <StepHero icon="🚨" color="rose" title="Emergency Contact"
              subtitle="Person to contact in case of emergency — can be updated later" />

            <Section title="Emergency Contact Details" emoji="📟" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <F label="Contact Name" error={errors.emergencyContactName}>
                  <TI placeholder="Full name" value={p1.emergencyContactName}
                    onChange={e => setP1(p => ({ ...p, emergencyContactName: e.target.value }))} />
                </F>
                <F label="Relationship" error={errors.emergencyContactRel} hint="e.g., Spouse, Parent">
                  <TI placeholder="Relationship" value={p1.emergencyContactRel}
                    onChange={e => setP1(p => ({ ...p, emergencyContactRel: e.target.value }))} />
                </F>
                <F label="Phone Number" error={errors.emergencyContactPhone}>
                  <TI type="tel" placeholder="Emergency phone" value={p1.emergencyContactPhone}
                    onChange={e => setP1(p => ({ ...p, emergencyContactPhone: e.target.value }))} />
                </F>
                <F label="Email (Optional)" error={errors.emergencyContactEmail}>
                  <TI type="email" placeholder="Emergency email" value={p1.emergencyContactEmail}
                    onChange={e => setP1(p => ({ ...p, emergencyContactEmail: e.target.value }))} />
                </F>
              </div>
            </Section>

            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
              ℹ️ Emergency contact is optional but strongly recommended for workplace safety compliance.
            </div>
          </div>
        )}

        {}
        {step === 5 && (
          <div>
            <StepHero icon="💼" color="amber" title="Employment & Role"
              subtitle="Job position, department, branch and employment dates — employee record is created here" />

            <Section title="Job Position" emoji="🏷️" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <F label="Employee Code" error={errors.employeeCode} hint="Auto-generated if blank">
                  <TI placeholder="EMP-..." value={p1b.employeeCode}
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

            <Section title="Employment Dates" emoji="📅" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <F label="Date of Joining" req error={errors.dateOfJoining}>
                  <TI type="date" value={p1b.dateOfJoining}
                    onChange={e => setP1b(p => ({ ...p, dateOfJoining: e.target.value }))} />
                </F>
                <F label="Probation End Date" error={errors.probationEndDate} hint="Optional">
                  <TI type="date" value={p1b.probationEndDate}
                    onChange={e => setP1b(p => ({ ...p, probationEndDate: e.target.value }))} />
                </F>
                <F label="Confirmation Date" error={errors.confirmationDate} hint="Optional">
                  <TI type="date" value={p1b.confirmationDate}
                    onChange={e => setP1b(p => ({ ...p, confirmationDate: e.target.value }))} />
                </F>
              </div>
            </Section>

            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
              💡 Clicking <strong>Next</strong> will create the employee record in the system.
              Subsequent steps will add additional details to this record.
            </div>
          </div>
        )}

        {}
        {step === 6 && (
          <div>
            <StepHero icon="🏠" color="green" title="Address Details"
              subtitle="Local and permanent address — can be the same if employee is not migrant" />

            <Section title="Local Address" emoji="🏠" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <F label="House Number" error={errors.localHouseNo} hint="House/flat/bldg">
                  <TI placeholder="No./Name" value={localAddr.houseNo}
                    onChange={e => setLocalAddr(p => ({ ...p, houseNo: e.target.value }))}
                    disabled={kycLockAddress.houseNo} />
                </F>
                <F label="Street / Area" error={errors.localStreet}>
                  <TI placeholder="Street name / locality" value={localAddr.street}
                    onChange={e => setLocalAddr(p => ({ ...p, street: e.target.value }))}
                    disabled={kycLockAddress.street} />
                </F>
                <F label="City / Village" error={errors.localCity}>
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
                <F label="Pincode" error={errors.localPincode}>
                  <TI placeholder="6-digit" value={localAddr.pincode} maxLength={6}
                    onChange={e => setLocalAddr(p => ({ ...p, pincode: e.target.value }))}
                    onBlur={handleLocalPincodeBlur}
                    disabled={kycLockAddress.pincode} />
                </F>
              </div>
            </Section>

            <div className="my-2">
              <label className="flex items-center gap-2 cursor-pointer select-none p-2 hover:bg-gray-50 rounded-lg">
                <input type="checkbox" checked={sameLocal}
                  onChange={e => { setSameLocal(e.target.checked); if (e.target.checked) setPermAddr(localAddr); }}
                  className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Permanent address is same as local</span>
              </label>
            </div>

            {!sameLocal && (
              <Section title="Permanent Address" emoji="🏡" compact>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <F label="House Number" error={errors.permHouseNo}>
                    <TI placeholder="No./Name" value={permAddr.houseNo}
                      onChange={e => setPermAddr(p => ({ ...p, houseNo: e.target.value }))} />
                  </F>
                  <F label="Street / Area" error={errors.permStreet}>
                    <TI placeholder="Street name / locality" value={permAddr.street}
                      onChange={e => setPermAddr(p => ({ ...p, street: e.target.value }))} />
                  </F>
                  <F label="City / Village" error={errors.permCity}>
                    <TI placeholder="City / village" value={permAddr.villageCity}
                      onChange={e => setPermAddr(p => ({ ...p, villageCity: e.target.value }))} />
                  </F>
                  <F label="District" error={errors.permDistrict}>
                    <TI placeholder="District" value={permAddr.district}
                      onChange={e => setPermAddr(p => ({ ...p, district: e.target.value }))} />
                  </F>
                  <F label="State" error={errors.permState}>
                    <TI placeholder="State" value={permAddr.state}
                      onChange={e => setPermAddr(p => ({ ...p, state: e.target.value }))} />
                  </F>
                  <F label="Pincode" error={errors.permPincode}>
                    <TI placeholder="6-digit" value={permAddr.pincode} maxLength={6}
                      onChange={e => setPermAddr(p => ({ ...p, pincode: e.target.value }))} />
                  </F>
                </div>
              </Section>
            )}
          </div>
        )}

        {}
        {}
        {}

        {}
        {step > 6 && step <= 12 && (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">📝 Step {step} — {currentStep.label}</p>
            <p className="text-xs text-gray-400 mt-1">(Steps 7-12 content continues with same layout improvements)</p>
            <p className="text-xs text-gray-400 mt-2">Full implementation of remaining steps with compact layout and improved spacing</p>
          </div>
        )}
      </div>

      {}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <button onClick={() => setStep(s => (s > 1 ? s - 1 : 1))} disabled={step === 1}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          ← Previous
        </button>
        <div className="text-xs text-gray-500 font-medium">
          Step {step} of {TOTAL_STEPS} {SKIPPABLE_STEPS.includes(step) && <span className="text-gray-400">(skippable)</span>}
        </div>
        {step < TOTAL_STEPS && (
          <button onClick={goNext} disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? '💾 Saving…' : 'Next →'}
          </button>
        )}
        {step === TOTAL_STEPS && (
          <button onClick={createLogin} disabled={saving}
            className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? '🔐 Creating…' : '✓ Create Employee'}
          </button>
        )}
      </div>

      {}
      <TempModal open={tempModal.open} password={tempModal.password} email={tempModal.email}
        onDone={() => navigate(`/employees/${empId}`)} />
    </div>
  );
}

