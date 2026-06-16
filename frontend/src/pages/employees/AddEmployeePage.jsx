/**
 * @file AddEmployeePage.jsx — Definitive Onboarding Wizard v10
 * @description 9-step employee onboarding. Merged best features from all archive variants.
 *
 * Improvements over previous version (v9 merge):
 *  - parseFullName() splits KYC full name into first/middle/last automatically
 *  - Pincode auto-lookup → fills state, district, city on blur
 *  - 5 Aadhaar states: ok / dup_draft / dup_emp / no_kyc / kyc_old — each with contextual action buttons
 *  - Employee DB record created at Step 3 (Employment) — not Step 1
 *  - Skippable steps (Education, Family, Experience, Bank, Documents)
 *  - skipLogin() — HR can add login credentials later
 *  - Emergency contact section
 *  - WhatsApp flag on mobile number
 *  - Bank verification status (pending / verified / manual)
 *  - Document expiry date + label
 *  - Statutory IDs (PAN, UAN, ESI) grouped in Bank step
 *  - validateAll() safety check at final submission
 *  - Live EPF nominee % counter
 *  - nomineeFor (all / epf / esi) per family member
 *  - Full address auto-fill from KYC (houseNo, street, district, pincode, state)
 *  - THEME.ICONS integrated throughout
 *  - sessionStorage guard prevents double-applying KYC on refresh
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams }        from 'react-router-dom';
import { useQuery, useQueryClient }            from '@tanstack/react-query';
import { toast }                               from 'react-hot-toast';
import { employeeApi }                         from '../../services/employeeApi';
import api                                     from '../../services/api';
import { validators, formatAadhaar }           from '../../utils/validators';
import { THEME }                               from '../../utils/uiConstants';

// ─── Utilities ──────────────────────────────────────────────────────────────

async function computeSha256Hex(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Splits "Rajan Kumar Sharma" → { firstName, middleName, lastName } */
function parseFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: '', middleName: '', lastName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
}

function isOlderThanOneYear(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  return !isNaN(d) && Date.now() - d.getTime() > 365 * 24 * 60 * 60 * 1000;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Identity',    icon: '🪪',  color: 'indigo', desc: 'Aadhaar & Name'         },
  { num: 2, label: 'Address',     icon: '🏠',  color: 'green',  desc: 'Location & Contact'      },
  { num: 3, label: 'Employment',  icon: '💼',  color: 'amber',  desc: 'Role & Dates'            },
  { num: 4, label: 'Education',   icon: '🎓',  color: 'violet', desc: 'Qualifications'          },
  { num: 5, label: 'Family',      icon: '👨‍👩‍👧',  color: 'pink',   desc: 'Nominees'               },
  { num: 6, label: 'Experience',  icon: '🏢',  color: 'orange', desc: 'Work History'            },
  { num: 7, label: 'Bank & IDs',  icon: '🏦',  color: 'teal',   desc: 'Payment & Statutory'    },
  { num: 8, label: 'Documents',   icon: '📄',  color: 'slate',  desc: 'Uploads'                 },
  { num: 9, label: 'Login',       icon: '🔐',  color: 'blue',   desc: 'Portal Access'          },
];
const SKIPPABLE_STEPS = new Set([4, 5, 6, 7, 8]);
const TOTAL_STEPS     = STEPS.length;

const EDU_LEVELS = [
  { value: '10th',          label: '10th / SSC / Matriculation'                    },
  { value: '12th',          label: '12th / HSC / Intermediate'                     },
  { value: 'iti',           label: 'ITI'                                            },
  { value: 'diploma',       label: 'Diploma / Polytechnic'                         },
  { value: 'graduate',      label: 'Graduate (B.Tech / BA / BCom / BCA / BSc)'    },
  { value: 'post_graduate', label: 'Post Graduate (MBA / M.Tech / MA / MCom)'     },
  { value: 'doctorate',     label: 'Doctorate (PhD)'                               },
  { value: 'professional',  label: 'Professional (CA / CS / LLB / MBBS)'          },
  { value: 'other',         label: 'Other'                                          },
];

const RELATIONSHIPS = [
  'father','mother','spouse','son','daughter','brother','sister',
  'father_in_law','mother_in_law','grandfather','grandmother','uncle','aunt','other',
].map(v => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));

const GENDER_OPTS   = [{ value:'male',label:'Male' },{ value:'female',label:'Female' },{ value:'other',label:'Other' }];
const MARITAL_OPTS  = ['single','married','divorced','widowed'].map(v => ({ value:v, label:v[0].toUpperCase()+v.slice(1) }));
const BLOOD_OPTS    = ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v => ({ value:v,label:v }));
const EMP_OPTS      = [{ value:'full_time',label:'Full Time' },{ value:'part_time',label:'Part Time' },{ value:'contract',label:'Contract' },{ value:'intern',label:'Intern' }];
const STATUS_OPTS   = [{ value:'active',label:'Active ✓' },{ value:'probation',label:'On Probation ⏳' }];
const LANGUAGE_OPTS = ['Hindi','English','Bengali','Telugu','Marathi','Tamil','Gujarati','Kannada','Odia','Punjabi','Other'].map(v => ({ value:v.toLowerCase(),label:v }));
const NAT_OPTS      = [{ value:'indian',label:'Indian 🇮🇳' },{ value:'nri',label:'NRI' },{ value:'other',label:'Other' }];
const DOC_TYPE_OPTS = [
  { value:'aadhaar',           label:'📛 Aadhaar Card'         },
  { value:'pan',               label:'🃏 PAN Card'             },
  { value:'passport',          label:'🛂 Passport'             },
  { value:'driving_license',   label:'🚗 Driving License'     },
  { value:'voter_id',          label:'🗳️ Voter ID'            },
  { value:'bank_passbook',     label:'🏦 Bank Passbook'        },
  { value:'10th_marksheet',    label:'📚 10th Marksheet'      },
  { value:'12th_marksheet',    label:'📚 12th Marksheet'      },
  { value:'degree_certificate',label:'🎓 Degree Certificate'  },
  { value:'experience_letter', label:'💼 Experience Letter'   },
  { value:'other',             label:'📄 Other'               },
];

// ─── Default State Factories ──────────────────────────────────────────────────

const emptyAddr   = () => ({ houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
const emptyEdu    = () => ({ eduLevel:'', courseType:'', streamSubject:'', courseName:'', institutionName:'', boardUniversity:'', passingYear:'', percentage:'', grade:'', isCurrent:false });
const emptyFamily = () => ({ name:'', relationship:'', gender:'', dateOfBirth:'', age:'', isDependent:false, isNominee:false, nomineePercentage:'', nomineeFor:'all', isMinor:false, guardianName:'', disabilityStatus:false });
const emptyDoc    = () => ({ documentType:'', documentName:'', documentNumber:'', fileName:'', expiryDate:'', ocrStatus:'idle' });
const emptyPrev   = () => ({ isFresher:false, organizationName:'', designation:'', joiningDate:'', leavingDate:'', lastCtcRupees:'', reasonForLeaving:'', referenceName:'', referencePhone:'' });

// ─── Atomic UI Components ─────────────────────────────────────────────────────

function F({ label, req, error, hint, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}{req && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-blue-500 -mt-0.5 mb-0.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{THEME.ICONS.WARNING} {error}</p>}
    </div>
  );
}

const TI = React.forwardRef(function TI({ error, className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`border ${THEME.RADIUS.INPUT} px-2.5 py-1.5 text-sm w-full outline-none
        focus:ring-2 focus:ring-blue-400 transition-all
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
      className={`border ${THEME.RADIUS.INPUT} px-2.5 py-1.5 text-sm w-full outline-none
        focus:ring-2 focus:ring-blue-400 transition-all
        ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-gray-300'}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const HERO_COLORS = {
  indigo: 'from-indigo-50 to-blue-50 border-indigo-100',
  green:  'from-green-50 to-emerald-50 border-green-100',
  amber:  'from-amber-50 to-yellow-50 border-amber-100',
  violet: 'from-violet-50 to-purple-50 border-violet-100',
  pink:   'from-pink-50 to-rose-50 border-pink-100',
  orange: 'from-orange-50 to-amber-50 border-orange-100',
  teal:   'from-teal-50 to-cyan-50 border-teal-100',
  slate:  'from-slate-50 to-gray-50 border-slate-100',
  blue:   'from-blue-50 to-indigo-50 border-blue-100',
};

function StepHero({ icon, title, subtitle, color = 'blue' }) {
  return (
    <div className={`flex items-center gap-3 mb-3 p-3 bg-gradient-to-r ${HERO_COLORS[color]} ${THEME.RADIUS.CARD} border`}>
      <span className="text-3xl leading-none">{icon}</span>
      <div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Section({ title, emoji, badge, children, action, compact = false }) {
  return (
    <div className={`${THEME.RADIUS.CARD} border border-gray-100 bg-white overflow-hidden ${compact ? 'mb-2' : 'mb-3'} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-sm">{emoji}</span>}
          <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">{title}</span>
          {badge && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        {action}
      </div>
      <div className={compact ? 'p-2' : 'p-3'}>{children}</div>
    </div>
  );
}

const KYC_BADGE_STYLES = {
  ok:        'bg-green-50 border-green-200 text-green-800',
  checking:  'bg-blue-50 border-blue-200 text-blue-800',
  dup_emp:   'bg-amber-50 border-amber-200 text-amber-800',
  dup_draft: 'bg-orange-50 border-orange-200 text-orange-800',
  kyc_old:   'bg-yellow-50 border-yellow-200 text-yellow-800',
  no_kyc:    'bg-purple-50 border-purple-200 text-purple-800',
  error:     'bg-red-50 border-red-200 text-red-800',
};

function KycBadge({ state, msg }) {
  if (!msg && state === 'idle') return null;
  return (
    <p className={`text-xs px-2.5 py-1.5 ${THEME.RADIUS.INPUT} border inline-flex items-center gap-1.5 mt-2
      ${KYC_BADGE_STYLES[state] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      {state === 'checking' && (
        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
      )}
      {msg}
    </p>
  );
}

function StepRail({ step, completed }) {
  return (
    <div className="flex items-center border-b border-gray-100 bg-white px-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
      {STEPS.map((s, i) => {
        const done   = completed.includes(s.num);
        const active = step === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-1 px-1.5 py-2 flex-shrink-0 border-b-2 transition-colors
              ${active ? 'border-blue-600' : done ? 'border-green-500' : 'border-transparent'}`}>
              <span title={s.label} className={`text-sm leading-none flex-shrink-0
                ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-30'}`}>
                {done ? THEME.ICONS.SUCCESS : s.icon}
              </span>
              <span className={`text-xs whitespace-nowrap font-medium hidden lg:inline
                ${active ? 'text-blue-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
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

function TempModal({ open, password, email, onDone }) {
  const [copied, setCopied] = useState(false);
  const [noted,  setNoted]  = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white ${THEME.RADIUS.MODAL} shadow-2xl w-full max-w-md p-8`}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-lg font-bold text-gray-900">Employee Created!</h2>
          <p className="text-xs text-gray-500 mt-1">Save these credentials before closing</p>
        </div>
        <div className={`p-5 bg-green-50 border border-green-200 ${THEME.RADIUS.CARD} text-center mb-4`}>
          <p className="text-sm text-gray-600 mb-1">{THEME.ICONS.LOGIN} Email: <strong>{email}</strong></p>
          <div className={`mt-3 p-4 bg-white border-2 border-dashed border-green-400 ${THEME.RADIUS.INPUT}`}>
            <p className="text-xs text-gray-500 mb-1">Temporary Password</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-gray-900">{password}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="mt-4 bg-green-600 text-white text-xs px-5 py-2 rounded-full hover:bg-green-700 shadow-sm transition-all active:scale-95"
          >
            {copied ? '✓ Copied!' : '📋 Copy Password'}
          </button>
        </div>
        <div className={`p-4 bg-amber-50 border border-amber-200 ${THEME.RADIUS.INPUT} text-xs text-amber-800 mb-5`}>
          {THEME.ICONS.WARNING} <strong>Shown only once.</strong> Employee must change this on first login.
        </div>
        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input type="checkbox" checked={noted} onChange={e => setNoted(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-700">Employee has noted / received this password</span>
        </label>
        <button
          onClick={onDone} disabled={!noted}
          className={`w-full bg-blue-600 text-white ${THEME.RADIUS.CARD} py-3 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 shadow-lg`}
        >
          {THEME.ICONS.SUCCESS} Done — View Employee
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddEmployeePage() {
  const navigate     = useNavigate();
  const [sp]         = useSearchParams();
  const qc           = useQueryClient();
  const autoSaveRef  = useRef(null);
  const kycLinkedRef = useRef(false);
  const kycIdFromUrl = sp.get('kycId') || null;

  // ── Wizard state ────────────────────────────────────────────────
  const [step,      setStep]      = useState(1);
  const [completed, setCompleted] = useState([]);
  const [draftId,   setDraftId]   = useState(sp.get('draftId') || null);
  const [empId,     setEmpId]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [tempModal, setTempModal] = useState({ open: false, password: '', email: '' });

  // ── Aadhaar / KYC state ─────────────────────────────────────────
  const [aadhaar,            setAadhaar]            = useState('');
  const [aadhaarState,       setAadhaarState]       = useState('idle');
  const [aadhaarMsg,         setAadhaarMsg]         = useState('');
  const [dupInfo,            setDupInfo]            = useState(null);
  const [kycStaleInfo,       setKycStaleInfo]       = useState(null);
  const [kycId,              setKycId]              = useState(kycIdFromUrl || null);
  const [kycPhoto,           setKycPhoto]           = useState(null);
  const [kycApplied,         setKycApplied]         = useState(() => {
    try { return sessionStorage.getItem(`kycApplied_${kycIdFromUrl}`) === 'yes'; } catch { return false; }
  });
  const [kycPrefilledFields, setKycPrefilledFields] = useState({ personal: {}, address: {} });

  // ── Address pincode lookup ───────────────────────────────────────
  const [pincodeLookupStatus, setPincodeLookupStatus] = useState('idle');

  // ── Form data ────────────────────────────────────────────────────
  const [p1, setP1] = useState({
    firstName: '', middleName: '', lastName: '',
    fatherName: '', motherName: '', spouseName: '', maritalStatus: '',
    dateOfBirth: '', gender: '', bloodGroup: '', disabilityStatus: false,
    nationality: 'indian', preferredLanguage: '', religion: '',
    phone: '', mobileWhatsapp: false, personalEmail: '', workEmail: '',
    linkedin: '', twitter: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactEmail: '', emergencyContactRel: '',
    panNumber: '', uanNumber: '', esiIpNumber: '',
  });

  const [p1b, setP1b] = useState({
    employeeCode: '', branchId: '', departmentId: '', designationId: '',
    reportingTo: '', employmentType: 'full_time', status: 'active',
    dateOfJoining: '', probationEndDate: '', confirmationDate: '', dateOfLeaving: '',
  });

  const [localAddr, setLocalAddr] = useState(emptyAddr());
  const [permAddr,  setPermAddr]  = useState(emptyAddr());
  const [sameLocal, setSameLocal] = useState(false);

  const [edu,    setEdu]    = useState([emptyEdu()]);
  const [family, setFamily] = useState([emptyFamily()]);
  const [prev,   setPrev]   = useState([emptyPrev()]);
  const [docs,   setDocs]   = useState([emptyDoc()]);
  const [bank,   setBank]   = useState({ bankName: '', accountNumber: '', ifscCode: '', accountType: 'savings', bankVerificationStatus: 'pending' });
  const [login,  setLogin]  = useState({ email: '', sendCredentials: true });

  // ── Queries ──────────────────────────────────────────────────────
  const { data: dRes  } = useQuery({ queryKey: ['departments'],  queryFn: employeeApi.getDepartments });
  const { data: dgRes } = useQuery({ queryKey: ['designations'], queryFn: employeeApi.getDesignations });
  const { data: bRes  } = useQuery({ queryKey: ['branches'],     queryFn: employeeApi.getBranches });
  const { data: mRes  } = useQuery({ queryKey: ['managers'],     queryFn: employeeApi.getManagers });

  const dOpts  = extractArray(dRes).map(d  => ({ value: d.id,  label: d.name }));
  const dgOpts = extractArray(dgRes).map(d => ({ value: d.id,  label: d.name }));
  const bOpts  = extractArray(bRes).map(b  => ({ value: b.id,  label: b.name }));
  const mOpts  = extractArray(mRes).map(m  => ({ value: m.id,  label: `${m.firstName} ${m.lastName} (${m.employeeCode})` }));

  // ── KYC from URL on mount ────────────────────────────────────────
  useEffect(() => {
    if (!kycIdFromUrl || kycApplied) return;
    api.get(`/automation/kyc/${kycIdFromUrl}`)
      .then(res => { const d = res.data?.data; if (d) applyKycRecord(kycIdFromUrl, d); })
      .catch(() => {});
  }, [kycIdFromUrl]); // eslint-disable-line

  // ── Draft resume on mount ────────────────────────────────────────
  useEffect(() => {
    const id = sp.get('draftId');
    if (id && !empId) loadDraft(id);
  }, []); // eslint-disable-line

  // ── Auto-save every 30s when a draft exists ──────────────────────
  useEffect(() => {
    if (!draftId) return;
    autoSaveRef.current = setInterval(() => saveDraftStep(false), 30_000);
    return () => clearInterval(autoSaveRef.current);
  }, [draftId, step, p1, p1b, localAddr, permAddr, edu, family, prev, bank]); // eslint-disable-line

  // ── Auto pre-fill doc slots from Aadhaar + PAN ──────────────────
  useEffect(() => {
    if (!p1.panNumber && !aadhaar) return;
    setDocs(prevDocs => {
      if (prevDocs.some(d => d.documentType)) return prevDocs;
      const pre = [];
      if (aadhaar)      pre.push({ ...emptyDoc(), documentType: 'aadhaar', documentNumber: aadhaar.replace(/\s/g, '') });
      if (p1.panNumber) pre.push({ ...emptyDoc(), documentType: 'pan',     documentNumber: p1.panNumber });
      return pre.length ? [...pre, emptyDoc()] : prevDocs;
    });
  }, [p1.panNumber, aadhaar]); // eslint-disable-line

  // ─── KYC Application ──────────────────────────────────────────────

  async function applyKycRecord(resolvedKycId, record = null) {
    try {
      const d = record || (await api.get(`/automation/kyc/${resolvedKycId}`)).data?.data;
      if (!d) throw new Error('KYC record unavailable');

      const fullName               = d.fullName || d.name || '';
      const { firstName, middleName, lastName } = parseFullName(fullName);

      const prefilled = { personal: {}, address: {} };
      if (firstName || fullName) prefilled.personal.firstName = true;
      if (lastName  || fullName) prefilled.personal.lastName  = true;
      if (middleName)            prefilled.personal.middleName = true;
      if (d.dateOfBirth)         prefilled.personal.dateOfBirth = true;
      if (d.gender)              prefilled.personal.gender = true;
      if (d.panNumber || d.pan)  prefilled.personal.panNumber = true;

      setP1(prev => ({
        ...prev,
        firstName:     firstName     || prev.firstName,
        middleName:    middleName    || prev.middleName,
        lastName:      lastName      || prev.lastName,
        fatherName:    d.fatherName  || prev.fatherName,
        motherName:    d.motherName  || prev.motherName,
        spouseName:    d.spouseName  || prev.spouseName,
        dateOfBirth:   d.dateOfBirth || prev.dateOfBirth,
        gender:        d.gender      || prev.gender,
        maritalStatus: d.maritalStatus || prev.maritalStatus,
        phone:         d.mobile || d.phone || prev.phone,
        personalEmail: d.personalEmail || d.email || prev.personalEmail,
        workEmail:     d.workEmail || prev.workEmail,
        panNumber:     d.panNumber || d.pan || prev.panNumber,
      }));

      const pincodeVal = d.pincode || d.pc || '';
      const stateVal   = d.state   || '';
      const distVal    = d.district || d.dist || '';
      const cityVal    = d.villageCity || d.city || d.vtc || '';
      const houseVal   = d.houseNo || d.house || d.addressLine1 || '';
      const streetVal  = d.street  || d.loc   || '';

      if (pincodeVal || stateVal || distVal || cityVal || houseVal || streetVal) {
        if (pincodeVal) prefilled.address.pincode     = true;
        if (stateVal)   prefilled.address.state       = true;
        if (distVal)    prefilled.address.district    = true;
        if (cityVal)    prefilled.address.villageCity = true;
        if (houseVal)   prefilled.address.houseNo     = true;
        if (streetVal)  prefilled.address.street      = true;
        setLocalAddr(prev => ({
          ...prev,
          houseNo:     houseVal   || prev.houseNo,
          street:      streetVal  || prev.street,
          villageCity: cityVal    || prev.villageCity,
          district:    distVal    || prev.district,
          state:       stateVal   || prev.state,
          country:     d.country  || prev.country,
          pincode:     pincodeVal || prev.pincode,
        }));
      }

      setKycPrefilledFields(prefilled);
      setKycId(resolvedKycId);
      setKycApplied(true);
      setKycStaleInfo(null);
      setAadhaarState('ok');
      setAadhaarMsg('✓ Auto-filled from KYC — locked fields shown with 🔒');
      if (d.photo) setKycPhoto(d.photo);
      try { sessionStorage.setItem(`kycApplied_${resolvedKycId}`, 'yes'); } catch {}
      if (!draftId) {
        try {
          const dr = await employeeApi.createDraft(aadhaar.replace(/\s/g, ''));
          const id = dr?.data?.draftId || dr?.draftId;
          if (id) setDraftId(id);
        } catch {}
      }
      toast.success('Form pre-filled from KYC ✓');
    } catch (e) {
      console.warn('[KYC] apply failed', e);
      toast.error('Could not load KYC data — please fill manually');
    }
  }

  function handleUseExistingKyc() {
    const id = kycStaleInfo?.kycId || kycStaleInfo?.id;
    if (id) applyKycRecord(id);
  }

  function handleRedoKyc() {
    const params = new URLSearchParams();
    if (draftId) params.set('draftId', draftId);
    if (kycId)   params.set('kycId', kycId);
    navigate(`/automation?tab=ekyc&mode=referred&aadhaar=${encodeURIComponent(aadhaar.replace(/\s/g, ''))}&returnTo=${encodeURIComponent(`/employees/add?${params.toString()}`)}`);
  }

  // ─── Aadhaar Check ────────────────────────────────────────────────

  async function checkAadhaar() {
    const raw = aadhaar.replace(/\s/g, '');
    if (raw.length !== 12 || !/^\d{12}$/.test(raw)) {
      setErrors(e => ({ ...e, aadhaar: 'Enter a valid 12-digit Aadhaar number' }));
      return;
    }
    setErrors(e => { const n = { ...e }; delete n.aadhaar; return n; });
    setAadhaarState('checking');
    setAadhaarMsg('Checking Aadhaar…');
    try {
      const hash = await computeSha256Hex(raw);
      const res  = await api.post('/employees/check-aadhaar', { aadhaarHash: hash });
      const d    = res.data;

      if (d.status === 'exists') {
        setAadhaarState('dup_emp');
        setDupInfo(d);
        setAadhaarMsg(`${THEME.ICONS.WARNING} Already registered — ${d.existing?.employeeCode || 'Employee exists'}`);
        return;
      }
      if (d.status === 'draft') {
        setAadhaarState('dup_draft');
        setDupInfo(d);
        setAadhaarMsg('Incomplete draft found — resume it?');
        return;
      }
      if (d.status === 'kyc_available') {
        if (isOlderThanOneYear(d.kycRecord?.createdAt)) {
          setAadhaarState('kyc_old');
          setKycStaleInfo(d.kycRecord);
          setAadhaarMsg('KYC data is over a year old — use existing or run a fresh eKYC?');
        } else {
          await applyKycRecord(d.kycRecord.id, d.kycRecord);
        }
        return;
      }
      if (d.status === 'no_kyc') {
        setAadhaarState('no_kyc');
        setAadhaarMsg('No KYC record — start eKYC to auto-fill, or fill manually');
        if (d.draftId) setDraftId(d.draftId);
        return;
      }
      setAadhaarState('ok');
      setAadhaarMsg(`${THEME.ICONS.SUCCESS} Aadhaar verified — no duplicates found`);
    } catch (err) {
      setAadhaarState('error');
      setAadhaarMsg(err.response?.data?.message || 'Verification failed — check connection');
    }
  }

  // ─── Pincode Auto-Lookup ──────────────────────────────────────────

  async function handleLocalPincodeBlur() {
    const pin = (localAddr.pincode || '').replace(/\D/g, '');
    if (pin.length !== 6) return;
    setPincodeLookupStatus('loading');
    try {
      const res = await api.get(`/platform/pincode/${pin}`);
      const d   = res.data?.data || res.data;
      if (d?.state || d?.district || d?.city) {
        setLocalAddr(prev => ({
          ...prev,
          state:       d.state    || prev.state,
          district:    d.district || prev.district,
          villageCity: d.city     || prev.villageCity,
        }));
        setPincodeLookupStatus('success');
        setTimeout(() => setPincodeLookupStatus('idle'), 3_000);
      } else {
        setPincodeLookupStatus('failed');
        setTimeout(() => setPincodeLookupStatus('idle'), 3_000);
      }
    } catch {
      setPincodeLookupStatus('failed');
      setTimeout(() => setPincodeLookupStatus('idle'), 3_000);
    }
  }

  // ─── Draft Load / Save ────────────────────────────────────────────

  async function loadDraft(id) {
    if (!id) return;
    try {
      const d = await employeeApi.getDraft(id);
      if (!d) { toast.error('Draft not found — may have expired'); return; }
      setDraftId(id);
      setEmpId(d.empl || null);
      setStep(d.currentStep || 1);
      setErrors({});
      if (d.step1) {
        if (d.step1.aadhaarRaw) { setAadhaar(d.step1.aadhaarRaw); setAadhaarState('ok'); setAadhaarMsg('✓ Restored from draft'); }
        if (d.step1.personal) setP1(d.step1.personal);
      }
      const professional = d.step3?.professional || d.step1?.professional || {};
      if (Object.keys(professional).length) setP1b(professional);
      const addrData = d.step2;
      if (addrData) { setLocalAddr(addrData.local || emptyAddr()); setPermAddr(addrData.permanent || emptyAddr()); setSameLocal(addrData.sameLocal || false); }
      if (d.step4?.length) setEdu(d.step4);
      if (d.step5?.length) setFamily(d.step5);
      if (d.step6?.length) setPrev(d.step6);
      if (d.step7) setBank(d.step7);
      if (d.step9) setLogin(d.step9);
      toast.success(`Draft resumed — continuing from Step ${d.currentStep}`);
      window.history.replaceState(null, '', `/employees/add?draftId=${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load draft');
    }
  }

  function getStepPayload(s) {
    switch (s) {
      case 1: return { aadhaarRaw: aadhaar, personal: p1 };
      case 2: return { local: localAddr, permanent: sameLocal ? localAddr : permAddr, sameLocal, personal: p1 };
      case 3: return { professional: p1b };
      case 4: return edu;
      case 5: return family;
      case 6: return prev;
      case 7: return bank;
      case 8: return docs.map(d => ({ documentType: d.documentType, documentNumber: d.documentNumber }));
      case 9: return login;
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

  // ─── Validation ───────────────────────────────────────────────────

  function validate() {
    const e = {};
    if (step === 1) {
      if (aadhaarState !== 'ok' && aadhaarState !== 'dup_draft') e.aadhaar = 'Verify Aadhaar before continuing';
      if (!p1.firstName.trim() && !p1.lastName.trim()) e.firstName = 'At least first or last name required';
    }
    if (step === 2) {
      if (!localAddr.pincode) e.localPincode = 'Pincode required';
      if (!p1.dateOfBirth)    e.dateOfBirth   = 'Date of birth required';
      if (!p1.gender)         e.gender        = 'Gender required';
      if (!p1.personalEmail && !p1.workEmail)  e.personalEmail = 'At least one email required';
      if (p1.personalEmail) { const err = validators.email(p1.personalEmail); if (err) e.personalEmail = err; }
      if (p1.workEmail)     { const err = validators.email(p1.workEmail);     if (err) e.workEmail = err; }
      if (p1.phone)         { const err = validators.mobile(p1.phone);        if (err) e.phone = err; }
    }
    if (step === 3) {
      if (!p1b.dateOfJoining) e.dateOfJoining = 'Date of joining is required';
    }
    if (step === 5) {
      const epf = family.filter(f => f.isNominee && f.nomineeFor !== 'esi');
      const tot = epf.reduce((s, f) => s + parseFloat(f.nomineePercentage || 0), 0);
      if (epf.length && Math.abs(tot - 100) > 0.01) {
        e.nomineeTotal = `EPF nominee percentages must total 100% (currently ${Math.round(tot * 100) / 100}%)`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateAll() {
    const e = {};
    if (aadhaarState !== 'ok' && aadhaarState !== 'dup_draft') e.aadhaar = 'Verify Aadhaar';
    if (!p1.firstName.trim() && !p1.lastName.trim()) e.firstName = 'Name required';
    if (!p1.dateOfBirth)    e.dateOfBirth   = 'Date of birth required';
    if (!p1.gender)         e.gender        = 'Gender required';
    if (!p1b.dateOfJoining) e.dateOfJoining = 'Joining date required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Navigation ───────────────────────────────────────────────────

  async function goNext() {
    if (!validate()) { toast.error('Fix the errors first'); return; }
    setSaving(true);
    try {
      let id = empId;

      // ── Employee record created at Step 3 (Employment) ──
      if (step === 3 && !empId) {
        const res = await employeeApi.create({
          ...p1, ...p1b,
          aadhaarNumber: aadhaar.replace(/\s/g, ''),
          kycId:    kycId    || undefined,
          kycPhoto: kycPhoto || undefined,
        });
        id = res?.id;
        if (!id) throw new Error('Server did not return employee ID');
        setEmpId(id);
        if (kycId && !kycLinkedRef.current) {
          kycLinkedRef.current = true;
          try { await api.post(`/automation/kyc/${kycId}/link`, { employeeId: id }); } catch {}
        }
      }

      if (step === 2 && id) {
        await employeeApi.upsertAddress(id, 'local',     localAddr).catch(() => {});
        await employeeApi.upsertAddress(id, 'permanent', sameLocal ? localAddr : permAddr).catch(() => {});
      }
      if (step === 4 && id) { const v = edu.filter(e => e.eduLevel); if (v.length) await employeeApi.bulkEducation(id, v); }
      if (step === 5 && id && family.length) await employeeApi.bulkFamily(id, family);
      if (step === 6 && id) await employeeApi.bulkPrevEmp(id, prev);
      if (step === 7 && id && bank.bankName) await employeeApi.addBankAccount(id, bank);

      if (draftId) await employeeApi.saveDraftStep(draftId, step, getStepPayload(step), id);
      setCompleted(c => c.includes(step) ? c : [...c, step].sort((a, b) => a - b));
      setStep(s => s + 1);
      setErrors({});
      window.scrollTo(0, 0);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error
        || (!err.response ? 'Cannot reach server — check connection' : `Server error ${err.response.status}`)
        || err.message || 'Save failed — please try again';
      toast.error(msg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _saveError: msg }));
    } finally {
      setSaving(false);
    }
  }

  async function createLogin() {
    if (!validateAll()) { toast.error('Fix errors before final submission'); return; }
    const email = login.email || p1.workEmail || p1.personalEmail;
    if (!email) { setErrors({ loginEmail: 'Email required' }); return; }
    const emailErr = validators.email(email);
    if (emailErr) { setErrors({ loginEmail: emailErr }); return; }
    if (!empId) { toast.error('Employee record is missing — go back to Step 3'); return; }
    setSaving(true);
    try {
      const res = await employeeApi.createLogin(empId, { email, sendCredentials: login.sendCredentials });
      if (draftId) await employeeApi.completeDraft(draftId).catch(() => {});
      qc.invalidateQueries({ queryKey: ['employees'] });
      setTempModal({ open: true, password: res?.tempPassword, email: res?.email });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login creation failed';
      toast.error(msg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _loginError: msg }));
    } finally {
      setSaving(false);
    }
  }

  async function skipLogin() {
    if (draftId) await employeeApi.completeDraft(draftId).catch(() => {});
    qc.invalidateQueries({ queryKey: ['employees'] });
    toast.success('Employee added successfully — login can be set up later');
    navigate('/employees');
  }

  // ─── Derived values ───────────────────────────────────────────────
  const nomineeTotal  = Math.round(family.filter(f => f.isNominee).reduce((s, f) => s + parseFloat(f.nomineePercentage || 0), 0) * 100) / 100;
  const currentStep   = STEPS[step - 1];
  const kycLockPerson = kycPrefilledFields.personal || {};
  const kycLockAddr   = kycPrefilledFields.address  || {};

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)', minHeight: '500px' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/employees')} className="text-gray-400 hover:text-gray-700 text-sm">
            {THEME.ICONS.BACK} List
          </button>
          <span className="text-gray-200">|</span>
          <span className="text-base">{currentStep.icon}</span>
          <h1 className="text-sm font-bold text-gray-800">Add Employee</h1>
          {draftId && <span className="text-xs text-gray-400 hidden sm:inline">· Auto-saved every 30s</span>}
        </div>
        {draftId && (
          <button onClick={() => saveDraftStep(true)}
            className={`text-xs border border-gray-200 text-gray-600 px-2.5 py-1 ${THEME.RADIUS.INPUT} hover:bg-gray-50`}>
            {THEME.ICONS.SAVE} Save Draft
          </button>
        )}
      </div>

      {/* Step Rail */}
      <StepRail step={step} completed={completed} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">

        {/* Save error banner */}
        {errors._saveError && (
          <div className={`mb-3 p-2.5 bg-red-50 border border-red-200 ${THEME.RADIUS.CARD} flex items-start gap-2`}>
            <span className="text-red-500 text-sm">{THEME.ICONS.ERROR}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-700">Save failed</p>
              <p className="text-xs text-red-600 mt-0.5">{errors._saveError}</p>
            </div>
            <button onClick={() => setErrors(e => ({ ...e, _saveError: null }))} className="text-red-400 text-xs">✕</button>
          </div>
        )}

        {/* ── STEP 1: Identity ─────────────────────────────────── */}
        {step === 1 && (
          <div>
            <StepHero icon="🪪" color="indigo" title="Aadhaar & Identity" subtitle="Verify Aadhaar — the form auto-fills from central KYC when available" />

            <Section title="Aadhaar Verification" emoji={THEME.ICONS.SEARCH} badge="KYC Entry Point" compact>
              <div className="flex flex-wrap items-end gap-2 mb-2">
                <div className="flex-1 min-w-[180px] max-w-[260px]">
                  <F label="Aadhaar Number" req error={errors.aadhaar}>
                    <TI placeholder="XXXX XXXX XXXX" value={aadhaar}
                      onChange={e => setAadhaar(formatAadhaar(e.target.value))} maxLength={14}
                      disabled={aadhaarState === 'checking' || aadhaarState === 'ok'} />
                  </F>
                </div>
                <button onClick={checkAadhaar} disabled={aadhaarState === 'checking' || aadhaarState === 'ok'}
                  className={`bg-indigo-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 h-[34px]`}>
                  {aadhaarState === 'checking' ? 'Checking…' : aadhaarState === 'ok' ? `${THEME.ICONS.SUCCESS} Verified` : 'Verify Aadhaar'}
                </button>
                {aadhaarState === 'ok' && (
                  <button onClick={() => { setAadhaarState('idle'); setAadhaarMsg(''); }}
                    className={`text-xs border border-gray-200 px-2 py-1.5 ${THEME.RADIUS.INPUT} h-[34px]`}>
                    Change
                  </button>
                )}
                {aadhaarState === 'dup_draft' && dupInfo && (
                  <button onClick={() => navigate(`/employees/add?draftId=${dupInfo.draftId}`)}
                    className={`bg-orange-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} text-xs h-[34px]`}>
                    📋 Resume Draft
                  </button>
                )}
                {aadhaarState === 'dup_emp' && dupInfo && (
                  <button onClick={() => navigate(`/employees/${dupInfo.existing?.id}`)}
                    className={`bg-green-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} text-xs h-[34px]`}>
                    👁 View Employee
                  </button>
                )}
                {aadhaarState === 'no_kyc' && (
                  <button onClick={handleRedoKyc}
                    className={`bg-purple-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} text-xs h-[34px]`}>
                    🔄 Start eKYC
                  </button>
                )}
                {aadhaarState === 'kyc_old' && (
                  <>
                    <button onClick={handleUseExistingKyc}
                      className={`bg-yellow-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} text-xs h-[34px]`}>
                      Use Existing
                    </button>
                    <button onClick={handleRedoKyc}
                      className={`bg-indigo-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} text-xs h-[34px]`}>
                      Refresh KYC
                    </button>
                  </>
                )}
              </div>
              <KycBadge state={aadhaarState} msg={aadhaarMsg} />
            </Section>

            <Section title="Full Legal Name" emoji="📝" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="First Name" error={errors.firstName} hint={kycLockPerson.firstName ? '🔒 From KYC' : ''}>
                  <TI placeholder="First name" value={p1.firstName} onChange={e => setP1(p => ({ ...p, firstName: e.target.value }))} disabled={kycLockPerson.firstName} />
                </F>
                <F label="Middle Name" hint={kycLockPerson.middleName ? '🔒 From KYC' : ''}>
                  <TI placeholder="Middle name (optional)" value={p1.middleName} onChange={e => setP1(p => ({ ...p, middleName: e.target.value }))} disabled={kycLockPerson.middleName} />
                </F>
                <F label="Last Name" hint={kycLockPerson.lastName ? '🔒 From KYC' : ''}>
                  <TI placeholder="Last name" value={p1.lastName} onChange={e => setP1(p => ({ ...p, lastName: e.target.value }))} disabled={kycLockPerson.lastName} />
                </F>
                <F label="Father's Name" hint="Editable even if from KYC">
                  <TI placeholder="Father's full name" value={p1.fatherName} onChange={e => setP1(p => ({ ...p, fatherName: e.target.value }))} />
                </F>
                <F label="Mother's Name">
                  <TI placeholder="Mother's full name" value={p1.motherName} onChange={e => setP1(p => ({ ...p, motherName: e.target.value }))} />
                </F>
                <F label="Marital Status">
                  <SI value={p1.maritalStatus} onChange={e => setP1(p => ({ ...p, maritalStatus: e.target.value }))} options={MARITAL_OPTS} placeholder="Select status" />
                </F>
                {p1.maritalStatus === 'married' && (
                  <F label="Spouse Name">
                    <TI placeholder="Spouse's full name" value={p1.spouseName} onChange={e => setP1(p => ({ ...p, spouseName: e.target.value }))} />
                  </F>
                )}
              </div>
            </Section>

            {aadhaarState === 'no_kyc' && (
              <div className={`p-3 bg-purple-50 border border-purple-200 ${THEME.RADIUS.CARD} text-xs text-purple-800`}>
                {THEME.ICONS.INFO} <strong>No KYC found</strong> — You can start eKYC to auto-fill, or continue filling manually. All fields remain editable.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Address & Contact ────────────────────────── */}
        {step === 2 && (
          <div>
            <StepHero icon="🏠" color="green" title="Address & Contact" subtitle="Addresses auto-filled from KYC — pincode lookup fills state and district" />

            <Section title="Local / Current Address" emoji="📍" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  ['House / Flat No', 'houseNo',     kycLockAddr.houseNo,     'Flat / House no.'],
                  ['Street / Area',   'street',      kycLockAddr.street,      'Street / area'],
                  ['Village / City',  'villageCity', kycLockAddr.villageCity, 'City / village'],
                  ['District',        'district',    kycLockAddr.district,    'District'],
                  ['State',           'state',       kycLockAddr.state,       'State'],
                  ['Country',         'country',     false,                   'Country'],
                ].map(([lbl, key, locked, ph]) => (
                  <F key={key} label={lbl} hint={locked ? '🔒 From KYC' : ''}>
                    <TI placeholder={ph} value={localAddr[key]} disabled={locked}
                      onChange={e => setLocalAddr(p => ({ ...p, [key]: e.target.value }))} />
                  </F>
                ))}
                <F label="Pincode" error={errors.localPincode} hint={kycLockAddr.pincode ? '🔒 From KYC' : ''}>
                  <TI placeholder="6-digit pincode" value={localAddr.pincode} maxLength={6}
                    disabled={kycLockAddr.pincode}
                    onChange={e => setLocalAddr(p => ({ ...p, pincode: e.target.value }))}
                    onBlur={handleLocalPincodeBlur} />
                  {pincodeLookupStatus === 'loading' && <p className="text-xs text-blue-600 mt-0.5">{THEME.ICONS.SEARCH} Looking up…</p>}
                  {pincodeLookupStatus === 'success' && <p className="text-xs text-green-600 mt-0.5">{THEME.ICONS.SUCCESS} Auto-filled</p>}
                  {pincodeLookupStatus === 'failed'  && <p className="text-xs text-red-500 mt-0.5">Invalid pincode</p>}
                </F>
              </div>
            </Section>

            <Section title="Permanent Address" emoji="🏡" compact action={
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={sameLocal} className="w-3.5 h-3.5"
                  onChange={e => { setSameLocal(e.target.checked); if (e.target.checked) setPermAddr(localAddr); }} />
                <span className="text-xs text-gray-600">Same as local</span>
              </label>
            }>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {['houseNo','street','villageCity','district','state','country','pincode'].map(key => (
                  <F key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
                    <TI placeholder={key} value={permAddr[key]} disabled={sameLocal}
                      onChange={e => setPermAddr(p => ({ ...p, [key]: e.target.value }))} />
                  </F>
                ))}
              </div>
            </Section>

            <Section title="Emergency Contact" emoji="🚨" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Contact Name"><TI placeholder="Full name" value={p1.emergencyContactName} onChange={e => setP1(p => ({ ...p, emergencyContactName: e.target.value }))} /></F>
                <F label="Relationship"><TI placeholder="e.g. Spouse, Parent" value={p1.emergencyContactRel} onChange={e => setP1(p => ({ ...p, emergencyContactRel: e.target.value }))} /></F>
                <F label="Phone Number" error={errors.emergencyContactPhone}><TI type="tel" placeholder="Emergency contact phone" value={p1.emergencyContactPhone} onChange={e => setP1(p => ({ ...p, emergencyContactPhone: e.target.value }))} /></F>
                <F label="Email (Optional)"><TI type="email" placeholder="Emergency contact email" value={p1.emergencyContactEmail} onChange={e => setP1(p => ({ ...p, emergencyContactEmail: e.target.value }))} /></F>
              </div>
            </Section>

            <Section title="Contact & Demographics" emoji="📞" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Mobile Phone" error={errors.phone}>
                  <TI type="tel" placeholder="10-digit mobile" value={p1.phone} onChange={e => setP1(p => ({ ...p, phone: e.target.value }))} />
                </F>
                <div className="flex items-center mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={p1.mobileWhatsapp} className="w-4 h-4"
                      onChange={e => setP1(p => ({ ...p, mobileWhatsapp: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Same as WhatsApp</span>
                  </label>
                </div>
                <F label="Personal Email" req={!p1.workEmail} error={errors.personalEmail}>
                  <TI type="email" placeholder="personal@email.com" value={p1.personalEmail} onChange={e => setP1(p => ({ ...p, personalEmail: e.target.value }))} />
                </F>
                <F label="Work Email" req={!p1.personalEmail} error={errors.workEmail}>
                  <TI type="email" placeholder="name@company.com" value={p1.workEmail} onChange={e => setP1(p => ({ ...p, workEmail: e.target.value }))} />
                </F>
                <F label="Date of Birth" req error={errors.dateOfBirth} hint={kycLockPerson.dateOfBirth ? '🔒 From KYC' : ''}>
                  <TI type="date" value={p1.dateOfBirth} disabled={kycLockPerson.dateOfBirth} onChange={e => setP1(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </F>
                <F label="Gender" req error={errors.gender} hint={kycLockPerson.gender ? '🔒 From KYC' : ''}>
                  <SI value={p1.gender} onChange={e => setP1(p => ({ ...p, gender: e.target.value }))} options={GENDER_OPTS} placeholder="Select gender" disabled={kycLockPerson.gender} />
                </F>
                <F label="Blood Group"><SI value={p1.bloodGroup} onChange={e => setP1(p => ({ ...p, bloodGroup: e.target.value }))} options={BLOOD_OPTS} placeholder="Select" /></F>
                <F label="Nationality"><SI value={p1.nationality} onChange={e => setP1(p => ({ ...p, nationality: e.target.value }))} options={NAT_OPTS} /></F>
                <F label="Preferred Language"><SI value={p1.preferredLanguage} onChange={e => setP1(p => ({ ...p, preferredLanguage: e.target.value }))} options={LANGUAGE_OPTS} placeholder="Select" /></F>
                <F label="LinkedIn (Optional)"><TI placeholder="linkedin.com/in/username" value={p1.linkedin} onChange={e => setP1(p => ({ ...p, linkedin: e.target.value }))} /></F>
                <F label="Disability">
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input type="checkbox" checked={p1.disabilityStatus} className="w-4 h-4"
                      onChange={e => setP1(p => ({ ...p, disabilityStatus: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Person with Disability (PwD)</span>
                  </label>
                </F>
              </div>
            </Section>
          </div>
        )}

        {/* ── STEP 3: Employment ───────────────────────────────── */}
        {step === 3 && (
          <div>
            <StepHero icon="💼" color="amber" title="Employment & Role" subtitle="Job details — the employee record is created in the database when you click Next" />
            <Section title="Job Position" emoji="🏷️" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Employee Code"><TI placeholder="Auto-generated if blank" value={p1b.employeeCode} onChange={e => setP1b(p => ({ ...p, employeeCode: e.target.value }))} /></F>
                <F label="Branch"><SI value={p1b.branchId} onChange={e => setP1b(p => ({ ...p, branchId: e.target.value }))} options={bOpts} placeholder="Select branch" /></F>
                <F label="Department"><SI value={p1b.departmentId} onChange={e => setP1b(p => ({ ...p, departmentId: e.target.value }))} options={dOpts} placeholder="Select department" /></F>
                <F label="Designation"><SI value={p1b.designationId} onChange={e => setP1b(p => ({ ...p, designationId: e.target.value }))} options={dgOpts} placeholder="Select designation" /></F>
                <F label="Reports To"><SI value={p1b.reportingTo} onChange={e => setP1b(p => ({ ...p, reportingTo: e.target.value }))} options={mOpts} placeholder="Select manager" /></F>
                <F label="Employment Type"><SI value={p1b.employmentType} onChange={e => setP1b(p => ({ ...p, employmentType: e.target.value }))} options={EMP_OPTS} /></F>
                <F label="Status"><SI value={p1b.status} onChange={e => setP1b(p => ({ ...p, status: e.target.value }))} options={STATUS_OPTS} /></F>
              </div>
            </Section>
            <Section title="Employment Dates" emoji="📅" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Date of Joining" req error={errors.dateOfJoining}><TI type="date" value={p1b.dateOfJoining} onChange={e => setP1b(p => ({ ...p, dateOfJoining: e.target.value }))} /></F>
                <F label="Probation End Date"><TI type="date" value={p1b.probationEndDate} onChange={e => setP1b(p => ({ ...p, probationEndDate: e.target.value }))} /></F>
                <F label="Confirmation Date"><TI type="date" value={p1b.confirmationDate} onChange={e => setP1b(p => ({ ...p, confirmationDate: e.target.value }))} /></F>
              </div>
            </Section>
            <div className={`p-3 bg-amber-50 border border-amber-100 ${THEME.RADIUS.CARD} text-xs text-amber-800`}>
              {THEME.ICONS.INFO} Clicking <strong>Next</strong> creates the employee record using all information from Steps 1–3.
            </div>
          </div>
        )}

        {/* ── STEP 4: Education ──────────────────────────────────── */}
        {step === 4 && (
          <div>
            <StepHero icon="🎓" color="violet" title="Educational Qualifications" subtitle="Add from 10th onwards — this step is optional" />
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">All qualifications are optional</p>
              <button onClick={() => setEdu(p => [...p, emptyEdu()])}
                className={`text-xs bg-violet-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} hover:bg-violet-700 font-semibold`}>
                + Add Qualification
              </button>
            </div>
            {edu.map((ed, i) => (
              <Section key={i} emoji="📚" title={`Qualification ${i + 1}`} badge={ed.eduLevel || undefined} compact
                action={<button onClick={() => setEdu(p => p.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <F label="Level"><SI value={ed.eduLevel} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, eduLevel: e.target.value } : x))} options={EDU_LEVELS} placeholder="Select level" /></F>
                  <F label="Course Type"><TI placeholder="Regular / Distance" value={ed.courseType} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, courseType: e.target.value } : x))} /></F>
                  <F label="Stream / Subject"><TI placeholder="Science / Commerce" value={ed.streamSubject} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, streamSubject: e.target.value } : x))} /></F>
                  <F label="Course Name"><TI placeholder="e.g., B.Tech CSE" value={ed.courseName} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, courseName: e.target.value } : x))} /></F>
                  <F label="Institution"><TI placeholder="School / College name" value={ed.institutionName} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, institutionName: e.target.value } : x))} /></F>
                  <F label="Board / University"><TI placeholder="Board or University" value={ed.boardUniversity} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, boardUniversity: e.target.value } : x))} /></F>
                  <F label="Passing Year"><TI placeholder="YYYY" value={ed.passingYear} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, passingYear: e.target.value } : x))} /></F>
                  <F label="Percentage / CGPA"><TI placeholder="e.g., 75.5" value={ed.percentage} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, percentage: e.target.value } : x))} /></F>
                  <F label="Grade"><TI placeholder="e.g., A+" value={ed.grade} onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, grade: e.target.value } : x))} /></F>
                  <F label="Currently Pursuing">
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input type="checkbox" checked={ed.isCurrent} className="w-4 h-4"
                        onChange={e => setEdu(p => p.map((x, idx) => idx === i ? { ...x, isCurrent: e.target.checked } : x))} />
                      <span className="text-sm text-gray-700">Still studying</span>
                    </label>
                  </F>
                </div>
              </Section>
            ))}
            {edu.length === 0 && <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">🎓 No qualifications added yet</div>}
          </div>
        )}

        {/* ── STEP 5: Family & Nominees ─────────────────────────── */}
        {step === 5 && (
          <div>
            <StepHero icon="👨‍👩‍👧" color="pink" title="Family Members & Nominees" subtitle="EPF nominee percentages must total 100% — ESI nominees are separate" />
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">
                {family.filter(f => f.isNominee).length > 0 && (
                  <span className={`font-semibold ${Math.abs(nomineeTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                    EPF total: {nomineeTotal}% {Math.abs(nomineeTotal - 100) < 0.01 ? THEME.ICONS.SUCCESS : '(must reach 100%)'}
                  </span>
                )}
              </p>
              <button onClick={() => setFamily(p => [...p, emptyFamily()])}
                className={`text-xs bg-pink-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} hover:bg-pink-700 font-semibold`}>
                + Add Member
              </button>
            </div>
            {errors.nomineeTotal && <p className={`text-xs text-red-500 mb-3 p-2.5 bg-red-50 ${THEME.RADIUS.CARD}`}>{THEME.ICONS.WARNING} {errors.nomineeTotal}</p>}
            {family.map((fm, i) => (
              <Section key={i} emoji="👤" title={fm.name || `Member ${i + 1}`} badge={fm.relationship || undefined} compact
                action={<button onClick={() => setFamily(p => p.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <F label="Full Name"><TI placeholder="Full name" value={fm.name} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} /></F>
                  <F label="Relationship"><SI value={fm.relationship} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, relationship: e.target.value } : x))} options={RELATIONSHIPS} placeholder="Select" /></F>
                  <F label="Gender"><SI value={fm.gender} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, gender: e.target.value } : x))} options={GENDER_OPTS} placeholder="Select" /></F>
                  <F label="Date of Birth"><TI type="date" value={fm.dateOfBirth} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, dateOfBirth: e.target.value } : x))} /></F>
                  <F label="Age"><TI type="number" placeholder="Age" value={fm.age} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, age: e.target.value } : x))} /></F>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flags</label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {[['isDependent','Dependent'],['isNominee','Nominee'],['isMinor','Minor'],['disabilityStatus','Disability']].map(([key, lbl]) => (
                        <label key={key} className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={fm[key]} className="w-3.5 h-3.5"
                            onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, [key]: e.target.checked } : x))} />
                          <span className="text-xs text-gray-700">{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {fm.isNominee && (
                    <>
                      <F label="Nominee %"><TI type="number" placeholder="e.g., 50" value={fm.nomineePercentage} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, nomineePercentage: e.target.value } : x))} /></F>
                      <F label="Nominee For"><SI value={fm.nomineeFor} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, nomineeFor: e.target.value } : x))} options={[{ value:'all',label:'All' },{ value:'epf',label:'EPF Only' },{ value:'esi',label:'ESI Only' }]} /></F>
                    </>
                  )}
                  {fm.isMinor && <F label="Guardian Name"><TI placeholder="Guardian full name" value={fm.guardianName} onChange={e => setFamily(p => p.map((x, idx) => idx === i ? { ...x, guardianName: e.target.value } : x))} /></F>}
                </div>
              </Section>
            ))}
            {family.length === 0 && <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">👨‍👩‍👧 No family members added yet</div>}
          </div>
        )}

        {/* ── STEP 6: Previous Employment ──────────────────────── */}
        {step === 6 && (
          <div>
            <StepHero icon="🏢" color="orange" title="Previous Employment" subtitle="Work history — skip this step entirely if the employee is a fresher" />
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">Leave empty or skip if first job</p>
              <button onClick={() => setPrev(p => [...p, emptyPrev()])}
                className={`text-xs bg-orange-600 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} hover:bg-orange-700 font-semibold`}>
                + Add Employment
              </button>
            </div>
            {prev.map((pv, i) => (
              <Section key={i} emoji="🏢" title={pv.organizationName || `Employment ${i + 1}`} badge={pv.designation || undefined} compact
                action={<button onClick={() => setPrev(p => p.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}>
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pv.isFresher} className="w-4 h-4"
                      onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, isFresher: e.target.checked } : x))} />
                    <span className="text-sm text-gray-700 font-medium">🌱 Fresher — no prior employment</span>
                  </label>
                </div>
                {!pv.isFresher && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <F label="Organization"><TI placeholder="Company name" value={pv.organizationName} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, organizationName: e.target.value } : x))} /></F>
                    <F label="Designation"><TI placeholder="Job title" value={pv.designation} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, designation: e.target.value } : x))} /></F>
                    <F label="Joining Date"><TI type="date" value={pv.joiningDate} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, joiningDate: e.target.value } : x))} /></F>
                    <F label="Leaving Date"><TI type="date" value={pv.leavingDate} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, leavingDate: e.target.value } : x))} /></F>
                    <F label="Last CTC (₹/yr)"><TI type="number" placeholder="Annual CTC in rupees" value={pv.lastCtcRupees} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, lastCtcRupees: e.target.value } : x))} /></F>
                    <F label="Reason for Leaving"><TI placeholder="Brief reason" value={pv.reasonForLeaving} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, reasonForLeaving: e.target.value } : x))} /></F>
                    <F label="Reference Name"><TI placeholder="Reference person" value={pv.referenceName} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, referenceName: e.target.value } : x))} /></F>
                    <F label="Reference Phone"><TI type="tel" placeholder="Reference contact" value={pv.referencePhone} onChange={e => setPrev(p => p.map((x, idx) => idx === i ? { ...x, referencePhone: e.target.value } : x))} /></F>
                  </div>
                )}
              </Section>
            ))}
            {prev.length === 0 && <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">🏢 No prior employment added yet</div>}
          </div>
        )}

        {/* ── STEP 7: Bank & Statutory IDs ─────────────────────── */}
        {step === 7 && (
          <div>
            <StepHero icon="🏦" color="teal" title="Bank Account & Statutory IDs" subtitle="Salary account, PAN, UAN and ESI IP — all in one place" />
            <Section title="Salary Bank Account" emoji="💳" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="Bank Name"><TI placeholder="e.g., State Bank of India" value={bank.bankName} onChange={e => setBank(p => ({ ...p, bankName: e.target.value }))} /></F>
                <F label="Account Number"><TI placeholder="Account number" value={bank.accountNumber} onChange={e => setBank(p => ({ ...p, accountNumber: e.target.value }))} /></F>
                <F label="IFSC Code"><TI placeholder="e.g., SBIN0001234" value={bank.ifscCode} maxLength={11} onChange={e => setBank(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} /></F>
                <F label="Account Type">
                  <SI value={bank.accountType} onChange={e => setBank(p => ({ ...p, accountType: e.target.value }))}
                    options={[{ value:'savings',label:'💰 Savings' },{ value:'current',label:'🔄 Current' },{ value:'salary',label:'💼 Salary Account' }]} />
                </F>
                <F label="Verification Status">
                  <SI value={bank.bankVerificationStatus} onChange={e => setBank(p => ({ ...p, bankVerificationStatus: e.target.value }))}
                    options={[{ value:'pending',label:'⏳ Pending' },{ value:'verified',label:'✅ Verified (Penny Drop)' },{ value:'manual',label:'👁 Manually Verified' }]} />
                </F>
              </div>
            </Section>
            <Section title="Statutory IDs" emoji="🪪" compact>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <F label="PAN Number" hint={kycLockPerson.panNumber ? '🔒 From KYC' : ''}>
                  <TI placeholder="ABCDE1234F" value={p1.panNumber} maxLength={10} disabled={kycLockPerson.panNumber}
                    onChange={e => setP1(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))} />
                </F>
                <F label="UAN Number"><TI placeholder="12-digit UAN" value={p1.uanNumber} onChange={e => setP1(p => ({ ...p, uanNumber: e.target.value }))} /></F>
                <F label="ESI IP Number"><TI placeholder="ESI IP number" value={p1.esiIpNumber} onChange={e => setP1(p => ({ ...p, esiIpNumber: e.target.value }))} /></F>
              </div>
            </Section>
          </div>
        )}

        {/* ── STEP 8: Documents ─────────────────────────────────── */}
        {step === 8 && (
          <div>
            <StepHero icon="📄" color="slate" title="Documents" subtitle="Identity proofs, certificates, compliance docs — Aadhaar & PAN pre-filled if verified" />
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">All uploads are optional at this stage</p>
              <button onClick={() => setDocs(p => [...p, emptyDoc()])}
                className={`text-xs bg-slate-700 text-white px-3 py-1.5 ${THEME.RADIUS.INPUT} hover:bg-slate-800 font-semibold`}>
                + Add Document
              </button>
            </div>
            {docs.map((doc, i) => (
              <Section key={i} emoji="📋" title={DOC_TYPE_OPTS.find(o => o.value === doc.documentType)?.label || `Document ${i + 1}`} compact
                action={<button onClick={() => setDocs(p => p.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <F label="Document Type"><SI value={doc.documentType} onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, documentType: e.target.value } : x))} options={DOC_TYPE_OPTS} placeholder="Select type" /></F>
                  <F label="Document Number"><TI placeholder="Document number" value={doc.documentNumber} onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, documentNumber: e.target.value } : x))} /></F>
                  <F label="Label / Name"><TI placeholder="e.g., PAN Card" value={doc.documentName} onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, documentName: e.target.value } : x))} /></F>
                  <F label="Expiry Date"><TI type="date" value={doc.expiryDate} onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, expiryDate: e.target.value } : x))} /></F>
                  <F label="Upload File">
                    <TI type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setDocs(p => p.map((x, idx) => idx === i ? { ...x, fileName: e.target.files?.[0]?.name || '' } : x))} />
                  </F>
                </div>
              </Section>
            ))}
            {docs.length === 0 && <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">📄 No documents added yet</div>}
          </div>
        )}

        {/* ── STEP 9: Login ─────────────────────────────────────── */}
        {step === 9 && (
          <div>
            <StepHero icon="🔐" color="blue" title="Login Setup" subtitle="Create portal access — a temporary password will be generated" />
            <Section title="Employee Login Access" emoji={THEME.ICONS.LOGIN}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <F label="Login Email" error={errors.loginEmail}>
                  <TI type="email"
                    placeholder={p1.workEmail || p1.personalEmail || 'employee@company.com'}
                    value={login.email}
                    onChange={e => setLogin(p => ({ ...p, email: e.target.value }))} />
                </F>
                <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={login.sendCredentials} className="w-4 h-4"
                      onChange={e => setLogin(p => ({ ...p, sendCredentials: e.target.checked }))} />
                    <span className="text-sm text-gray-700">📧 Email credentials to employee</span>
                  </label>
                </div>
              </div>
              <div className={`p-3 bg-blue-50 border border-blue-100 ${THEME.RADIUS.CARD} text-xs text-blue-800`}>
                <p className="font-semibold mb-1">{THEME.ICONS.INFO} About employee login</p>
                <p>A temporary password will be generated and shown once. The employee must change it on first login. Leave email blank to use the work/personal email from Step 2.</p>
              </div>
              {errors._loginError && (
                <div className={`mt-3 p-2.5 bg-red-50 border border-red-200 ${THEME.RADIUS.CARD}`}>
                  <p className="text-xs font-semibold text-red-700">{THEME.ICONS.ERROR} Login creation failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{errors._loginError}</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={skipLogin}
                  className={`text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 ${THEME.RADIUS.INPUT}`}>
                  Skip — add login later
                </button>
              </div>
            </Section>
          </div>
        )}

      </div>

      {/* ── Footer Navigation ───────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white">
        <button
          onClick={() => { setStep(s => Math.max(1, s - 1)); setErrors({}); }}
          disabled={step === 1}
          className={`bg-gray-100 text-gray-700 px-4 py-2 ${THEME.RADIUS.INPUT} text-sm font-semibold disabled:opacity-40 hover:bg-gray-200 min-w-[100px]`}
        >
          {THEME.ICONS.BACK} Previous
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">
            {currentStep.icon} Step {step} of {TOTAL_STEPS}
            <span className="text-gray-400 font-normal"> · {currentStep.label}</span>
          </p>
          {SKIPPABLE_STEPS.has(step) && step < TOTAL_STEPS && (
            <button onClick={goNext} className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2 mt-0.5">
              Skip this step →
            </button>
          )}
        </div>

        {step < TOTAL_STEPS ? (
          <button
            onClick={goNext} disabled={saving}
            className={`bg-blue-600 text-white px-4 py-2 ${THEME.RADIUS.INPUT} text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 min-w-[100px]`}
          >
            {saving ? 'Saving…' : 'Next →'}
          </button>
        ) : (
          <button
            onClick={createLogin} disabled={saving}
            className={`bg-green-600 text-white px-4 py-2 ${THEME.RADIUS.INPUT} text-sm font-semibold disabled:opacity-50 hover:bg-green-700 min-w-[130px]`}
          >
            {saving ? 'Creating…' : `${THEME.ICONS.SUCCESS} Create Employee`}
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