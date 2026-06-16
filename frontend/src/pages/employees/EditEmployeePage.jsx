import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient }   from '@tanstack/react-query';
import { toast }                                    from 'react-hot-toast';
import { useAuthStore }                             from '../../store/authStore';
import { employeeApi }                              from '../../services/employeeApi';
import {
  Input, Select, Tabs, Button, Spinner, Alert, ConfirmModal,
} from '../../components/ui/Common';

const HR_ROLES = ['super_admin', 'admin', 'hr_admin', 'hr', 'Super Admin', 'Admin', 'HR'];

const EDIT_TABS = [
  { id: 'personal',     label: 'Personal',     icon: '👤' },
  { id: 'address',      label: 'Address',       icon: '🏠' },
  { id: 'education',    label: 'Education',     icon: '🎓' },
  { id: 'family',       label: 'Family',        icon: '👨‍👩‍👧' },
  { id: 'experience',   label: 'Experience',    icon: '💼' },
  { id: 'professional', label: 'Professional',  icon: '🏢' },
];

const GENDER_OPTS   = [{ value:'male',label:'Male' },{ value:'female',label:'Female' },{ value:'other',label:'Other' }];
const MARITAL_OPTS  = ['single','married','divorced','widowed'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}));
const BLOOD_OPTS    = ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(v=>({value:v,label:v}));
const EMP_TYPE_OPTS = [{ value:'full_time',label:'Full Time' },{ value:'part_time',label:'Part Time' },{ value:'contract',label:'Contract' },{ value:'intern',label:'Intern' }];
const STATUS_OPTS   = [{ value:'active',label:'Active' },{ value:'probation',label:'Probation' },{ value:'notice',label:'Notice Period' },{ value:'terminated',label:'Terminated' }];

const EDU_LEVELS = [
  { value:'10th',         label:'10th / SSC / Matriculation' },
  { value:'12th',         label:'12th / HSC / Intermediate' },
  { value:'iti',          label:'ITI' },
  { value:'diploma',      label:'Diploma / Polytechnic' },
  { value:'graduate',     label:'Graduate (B.Tech / BA / BCom / BCA / BSc)' },
  { value:'post_graduate',label:'Post Graduate (MBA / M.Tech / MA / MCom)' },
  { value:'doctorate',    label:'Doctorate (PhD)' },
  { value:'professional', label:'Professional (CA / CS / LLB / MBBS)' },
  { value:'other',        label:'Other' },
];

const RELATIONSHIPS = [
  'father','mother','spouse','son','daughter',
  'brother','sister','father_in_law','mother_in_law',
  'grandfather','grandmother','uncle','aunt','other',
].map(v=>({value:v,label:v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}));

function F({ label, req, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-gray-600">
          {label}{req && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TI({ error, disabled, ...rest }) {
  return (
    <input
      disabled={disabled}
      className={`border rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-400
        ${error    ? 'border-red-400 bg-red-50'  : 'border-gray-300'}
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      {...rest}
    />
  );
}

function SI({ value, onChange, options, placeholder, disabled }) {
  return (
    <select value={value||''} onChange={onChange} disabled={disabled}
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-400
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {(options||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SH({ title }) {
  return <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 mt-1">{title}</p>;
}

export default function EditEmployeePage() {
  const { id }        = useParams();
  const [sp]          = useSearchParams();
  const navigate      = useNavigate();
  const qc            = useQueryClient();
  const { user }      = useAuthStore();

  const isHR          = HR_ROLES.includes(user?.role);
  const isRequestMode = sp.get('mode') === 'request';
  const readOnly      = isRequestMode && !isHR; 

  const [tab,     setTab]     = useState('personal');
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [showConfirmRequest, setShowConfirmRequest] = useState(false);

  const [personal, setPersonal] = useState({
    firstName:'', lastName:'', middleName:'',
    fatherName:'', motherName:'', spouseName:'',
    disabilityStatus: false,
    dateOfBirth:'', gender:'', maritalStatus:'', bloodGroup:'',
    phone:'', personalEmail:'', workEmail:'',
    emergencyContactName:'', emergencyContactPhone:'', emergencyContactRel:'',
  });

  const [localAddr, setLocalAddr] = useState({ houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
  const [permAddr,  setPermAddr]  = useState({ houseNo:'', street:'', villageCity:'', district:'', state:'', country:'India', pincode:'' });
  const [sameAsLocal, setSameAsLocal] = useState(false);

  const [education, setEducation] = useState([]);
  const [family,    setFamily]    = useState([]);
  const [prevEmp,   setPrevEmp]   = useState([]);

  const [professional, setProfessional] = useState({
    employeeCode:'', dateOfJoining:'', employmentType:'full_time', status:'active',
    departmentId:'', designationId:'', branchId:'', reportingTo:'', probationEndDate:'',
    uanNumber:'', esiIpNumber:'',
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn:  () => employeeApi.getOne(id),
  });
  const { data: addrRes }  = useQuery({ queryKey:['employee-addr', id],  queryFn:() => employeeApi.getAddresses(id) });
  const { data: eduRes }   = useQuery({ queryKey:['employee-edu', id],   queryFn:() => employeeApi.listEducation(id) });
  const { data: famRes }   = useQuery({ queryKey:['employee-fam', id],   queryFn:() => employeeApi.listFamily(id) });
  const { data: expRes }   = useQuery({ queryKey:['employee-exp', id],   queryFn:() => employeeApi.listPrevEmp(id) });
  const { data: dRes }     = useQuery({ queryKey:['departments'],         queryFn:() => employeeApi.getDepartments() });
  const { data: dgRes }    = useQuery({ queryKey:['designations'],        queryFn:() => employeeApi.getDesignations() });
  const { data: bRes }     = useQuery({ queryKey:['branches'],            queryFn:() => employeeApi.getBranches() });
  const { data: mRes }     = useQuery({ queryKey:['managers'],            queryFn:() => employeeApi.getManagers() });

  const emp       = res?.data;
  const addresses = addrRes?.data || [];
  const dOpts     = (dRes?.data  ||[]).map(d=>({value:d.id,label:d.name}));
  const dgOpts    = (dgRes?.data ||[]).map(d=>({value:d.id,label:d.name}));
  const bOpts     = (bRes?.data  ||[]).map(b=>({value:b.id,label:b.name}));
  const mOpts     = (mRes?.data  ||[]).map(m=>({value:m.id,label:`${m.firstName} ${m.lastName} (${m.employeeCode})`}));

  useEffect(() => {
    if (!emp) return;

    setPersonal({
      firstName:             emp.firstName             || '',
      lastName:              emp.lastName              || '',
      middleName:            emp.middleName            || '',
      fatherName:            emp.fatherName            || '',
      motherName:            emp.motherName            || '',
      spouseName:            emp.spouseName            || '',
      disabilityStatus:      emp.disabilityStatus      || false,
      dateOfBirth:           emp.dateOfBirth           ? emp.dateOfBirth.split('T')[0] : '',
      gender:                emp.gender                || '',
      maritalStatus:         emp.maritalStatus         || '',
      bloodGroup:            emp.bloodGroup            || '',
      phone:                 emp.phone                 || '',
      personalEmail:         emp.personalEmail         || '',
      workEmail:             emp.workEmail             || '',
      emergencyContactName:  emp.emergencyContactName  || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      emergencyContactRel:   emp.emergencyContactRel   || '',
    });

    setProfessional({
      employeeCode:     emp.employeeCode          || '',
      dateOfJoining:    emp.dateOfJoining         ? emp.dateOfJoining.split('T')[0]     : '',
      employmentType:   emp.employmentType        || 'full_time',
      status:           emp.status               || 'active',
      departmentId:     emp.department?.id       || '',
      designationId:    emp.designation?.id      || '',
      branchId:         emp.branch?.id           || '',
      reportingTo:      emp.manager?.id          || '',
      probationEndDate: emp.probationEndDate      ? emp.probationEndDate.split('T')[0]  : '',
      uanNumber:        emp.uanNumber            || '',
      esiIpNumber:      emp.esiIpNumber          || '',
    });
  }, [emp]);

  useEffect(() => {
    const local = addresses.find(a => a.addressType === 'local');
    const perm  = addresses.find(a => a.addressType === 'permanent');
    if (local) setLocalAddr({ houseNo:local.houseNo||'', street:local.street||'', villageCity:local.villageCity||'', district:local.district||'', state:local.state||'', country:local.country||'India', pincode:local.pincode||'' });
    if (perm)  setPermAddr({ houseNo:perm.houseNo||'', street:perm.street||'', villageCity:perm.villageCity||'', district:perm.district||'', state:perm.state||'', country:perm.country||'India', pincode:perm.pincode||'' });
  }, [addrRes]);

  useEffect(() => {
    const rows = eduRes?.data || [];
    setEducation(rows.length > 0 ? rows : [emptyEdu()]);
  }, [eduRes]);

  useEffect(() => {
    setFamily(famRes?.data || []);
  }, [famRes]);

  useEffect(() => {
    const rows = expRes?.data || [];
    setPrevEmp(rows.length > 0 ? rows : [emptyPrev()]);
  }, [expRes]);

  function emptyEdu()  { return { eduLevel:'', courseType:'', streamSubject:'', courseName:'', institutionName:'', boardUniversity:'', passingYear:'', percentage:'', grade:'', isCurrent:false }; }
  function emptyPrev() { return { isFresher:false, organizationName:'', designation:'', department:'', joiningDate:'', leavingDate:'', lastCtcRupees:'', reasonForLeaving:'', referenceName:'', referencePhone:'' }; }

  const nomineeTotal = Math.round(
    family.filter(f=>f.isNominee).reduce((s,f)=>s+parseFloat(f.nomineePercentage||0),0) * 100
  ) / 100;

  function validate() {
    const e = {};
    if (!personal.firstName.trim()) e.firstName = 'Required';
    if (!personal.lastName.trim())  e.lastName  = 'Required';
    if (personal.phone && !/^[6-9]\d{9}$/.test(personal.phone))
      e.phone = 'Invalid mobile number';
    const nominees = family.filter(f => f.isNominee);
    if (nominees.length && Math.abs(nomineeTotal - 100) > 0.01)
      e.nomineeTotal = `Nominee total must be 100% (current: ${nomineeTotal}%)`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveDirectly() {
    if (!validate()) { toast.error('Fix the errors first'); return; }
    setSaving(true);
    try {
      
      await employeeApi.update(id, { ...personal, ...professional });

      await employeeApi.upsertAddress(id, 'local', localAddr);
      await employeeApi.upsertAddress(id, 'permanent', sameAsLocal ? localAddr : permAddr);

      const validEdu = education.filter(e => e.eduLevel);
      if (validEdu.length) await employeeApi.bulkEducation(id, validEdu);

      if (family.length) await employeeApi.bulkFamily(id, family);

      if (prevEmp.length) await employeeApi.bulkPrevEmp(id, prevEmp);

      toast.success('Employee updated successfully');
      qc.invalidateQueries({ queryKey: ['employee', id] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/employees/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      toast.error(msg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _saveError: msg }));
    } finally {
      setSaving(false);
    }
  }

  async function submitRequest() {
    if (!validate()) { toast.error('Fix the errors first'); return; }
    setSaving(true);
    try {
      await employeeApi.submitUpdateRequest(id, {
        personal, localAddr, permAddr: sameAsLocal ? localAddr : permAddr,
        education: education.filter(e => e.eduLevel),
        family,
        prevEmp,
        requestNote: 'Employee-initiated profile update request',
      });
      toast.success('Update request submitted — HR will review and approve');
      qc.invalidateQueries({ queryKey: ['employee', id] });
      navigate(`/employees/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed';
      toast.error(msg, { duration: 5000 });
      setErrors(prev => ({ ...prev, _saveError: msg }));
    } finally {
      setSaving(false);
      setShowConfirmRequest(false);
    }
  }

  if (isLoading || !emp) return (
    <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  );

  const ro = readOnly; 

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>

      {}
      <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isRequestMode ? '📝 Request Profile Update' : `Edit — ${emp.fullName}`}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isRequestMode
              ? 'Fill in your updated details and submit for HR approval'
              : 'Changes save directly to the employee record'}
          </p>
        </div>
        <button onClick={() => navigate(`/employees/${id}`)}
          className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
          ← Cancel
        </button>
      </div>

      {}
      {isRequestMode && (
        <div className="flex-shrink-0 mb-3">
          <Alert type="info">
            You are submitting a <strong>change request</strong>. Your HR team will review and approve
            before the changes take effect. Fields shown in the Professional tab are read-only.
          </Alert>
        </div>
      )}

      {}
      <div className="flex-shrink-0 bg-white rounded-t-xl border border-gray-200 border-b-0 px-5 pt-4">
        <Tabs tabs={EDIT_TABS} active={tab} onChange={setTab} />
      </div>

      {}
      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 border-t-0 px-5 pb-3">

        {}
        {errors._saveError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 mt-2">
            <span className="text-red-500 text-sm">⚠</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-700">Could not save</p>
              <p className="text-xs text-red-600 break-words">{errors._saveError}</p>
            </div>
            <button onClick={() => setErrors(e => ({...e, _saveError: null}))}
              className="text-red-400 text-xs font-bold hover:text-red-600">✕</button>
          </div>
        )}

        {}
        {tab === 'personal' && (
          <div className="space-y-5 pt-2">
            <div>
              <SH title="Name" />
              <div className="grid grid-cols-3 gap-3">
                <F label="First Name" req error={errors.firstName}>
                  <TI value={personal.firstName} error={errors.firstName}
                    onChange={e=>{setPersonal(p=>({...p,firstName:e.target.value}));setErrors(er=>({...er,firstName:null}));}} />
                </F>
                <F label="Middle Name">
                  <TI value={personal.middleName} onChange={e=>setPersonal(p=>({...p,middleName:e.target.value}))} />
                </F>
                <F label="Last Name" req error={errors.lastName}>
                  <TI value={personal.lastName} error={errors.lastName}
                    onChange={e=>{setPersonal(p=>({...p,lastName:e.target.value}));setErrors(er=>({...er,lastName:null}));}} />
                </F>
                <F label="Father's Name">
                  <TI value={personal.fatherName} onChange={e=>setPersonal(p=>({...p,fatherName:e.target.value}))} />
                </F>
                <F label="Mother's Name">
                  <TI value={personal.motherName} onChange={e=>setPersonal(p=>({...p,motherName:e.target.value}))} />
                </F>
                {personal.maritalStatus === 'married' && (
                  <F label="Spouse Name">
                    <TI value={personal.spouseName} onChange={e=>setPersonal(p=>({...p,spouseName:e.target.value}))} />
                  </F>
                )}
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm">
                <input type="checkbox" checked={personal.disabilityStatus}
                  onChange={e=>setPersonal(p=>({...p,disabilityStatus:e.target.checked}))}
                  className="w-4 h-4" />
                Person with disability
              </label>
            </div>

            <div>
              <SH title="Personal Details" />
              <div className="grid grid-cols-3 gap-3">
                <F label="Date of Birth">
                  <TI type="date" value={personal.dateOfBirth} onChange={e=>setPersonal(p=>({...p,dateOfBirth:e.target.value}))} />
                </F>
                <F label="Gender">
                  <SI options={GENDER_OPTS} value={personal.gender} onChange={e=>setPersonal(p=>({...p,gender:e.target.value}))} placeholder="Select" />
                </F>
                <F label="Marital Status">
                  <SI options={MARITAL_OPTS} value={personal.maritalStatus} onChange={e=>setPersonal(p=>({...p,maritalStatus:e.target.value}))} placeholder="Select" />
                </F>
                <F label="Blood Group">
                  <SI options={BLOOD_OPTS} value={personal.bloodGroup} onChange={e=>setPersonal(p=>({...p,bloodGroup:e.target.value}))} placeholder="Select" />
                </F>
                <F label="Mobile" error={errors.phone}>
                  <TI value={personal.phone} maxLength={10} error={errors.phone}
                    onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,10);setPersonal(p=>({...p,phone:v}));setErrors(er=>({...er,phone:null}));}} />
                </F>
                <F label="Personal Email">
                  <TI type="email" value={personal.personalEmail} onChange={e=>setPersonal(p=>({...p,personalEmail:e.target.value}))} />
                </F>
                <F label="Work Email">
                  <TI type="email" value={personal.workEmail} onChange={e=>setPersonal(p=>({...p,workEmail:e.target.value}))} />
                </F>
              </div>
            </div>

            <div>
              <SH title="Emergency Contact" />
              <div className="grid grid-cols-3 gap-3">
                <F label="Name">
                  <TI value={personal.emergencyContactName} onChange={e=>setPersonal(p=>({...p,emergencyContactName:e.target.value}))} />
                </F>
                <F label="Phone">
                  <TI value={personal.emergencyContactPhone} maxLength={10}
                    onChange={e=>setPersonal(p=>({...p,emergencyContactPhone:e.target.value.replace(/\D/g,'').slice(0,10)}))} />
                </F>
                <F label="Relationship">
                  <TI value={personal.emergencyContactRel} onChange={e=>setPersonal(p=>({...p,emergencyContactRel:e.target.value}))} />
                </F>
              </div>
            </div>
          </div>
        )}

        {}
        {tab === 'address' && (
          <div className="space-y-5 pt-2">
            <div>
              <SH title="Current / Local Address" />
              <div className="grid grid-cols-3 gap-3">
                <F label="House No / Flat"><TI value={localAddr.houseNo} onChange={e=>setLocalAddr(a=>({...a,houseNo:e.target.value}))} /></F>
                <F label="Street / Colony"><TI value={localAddr.street} onChange={e=>setLocalAddr(a=>({...a,street:e.target.value}))} /></F>
                <F label="Village / City"><TI value={localAddr.villageCity} onChange={e=>setLocalAddr(a=>({...a,villageCity:e.target.value}))} /></F>
                <F label="District"><TI value={localAddr.district} onChange={e=>setLocalAddr(a=>({...a,district:e.target.value}))} /></F>
                <F label="State"><TI value={localAddr.state} onChange={e=>setLocalAddr(a=>({...a,state:e.target.value}))} /></F>
                <F label="Pincode"><TI value={localAddr.pincode} maxLength={6} onChange={e=>setLocalAddr(a=>({...a,pincode:e.target.value.replace(/\D/g,'').slice(0,6)}))} /></F>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input type="checkbox" checked={sameAsLocal}
                onChange={e=>{setSameAsLocal(e.target.checked);if(e.target.checked)setPermAddr({...localAddr});}}
                className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">Permanent address same as current</span>
            </label>

            {!sameAsLocal && (
              <div>
                <SH title="Permanent Address" />
                <div className="grid grid-cols-3 gap-3">
                  <F label="House No / Flat"><TI value={permAddr.houseNo} onChange={e=>setPermAddr(a=>({...a,houseNo:e.target.value}))} /></F>
                  <F label="Street / Colony"><TI value={permAddr.street} onChange={e=>setPermAddr(a=>({...a,street:e.target.value}))} /></F>
                  <F label="Village / City"><TI value={permAddr.villageCity} onChange={e=>setPermAddr(a=>({...a,villageCity:e.target.value}))} /></F>
                  <F label="District"><TI value={permAddr.district} onChange={e=>setPermAddr(a=>({...a,district:e.target.value}))} /></F>
                  <F label="State"><TI value={permAddr.state} onChange={e=>setPermAddr(a=>({...a,state:e.target.value}))} /></F>
                  <F label="Pincode"><TI value={permAddr.pincode} maxLength={6} onChange={e=>setPermAddr(a=>({...a,pincode:e.target.value.replace(/\D/g,'').slice(0,6)}))} /></F>
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {tab === 'education' && (
          <div className="space-y-4 pt-2">
            {education.map((ed, i) => (
              <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">Qualification {i + 1}</p>
                  {education.length > 1 && (
                    <button onClick={() => setEducation(e=>e.filter((_,j)=>j!==i))}
                      className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Level" req>
                    <SI options={EDU_LEVELS} value={ed.eduLevel} placeholder="Select level"
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,eduLevel:e.target.value}:r))} />
                  </F>
                  <F label="Course / Degree Name">
                    <TI value={ed.courseName||''} placeholder="B.Tech, MBA, ITI..."
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,courseName:e.target.value}:r))} />
                  </F>
                  <F label="Stream / Subjects">
                    <TI value={ed.streamSubject||''} placeholder="PCM, CSE, Arts..."
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,streamSubject:e.target.value}:r))} />
                  </F>
                  <F label="Institution">
                    <TI value={ed.institutionName||''}
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,institutionName:e.target.value}:r))} />
                  </F>
                  <F label="Board / University">
                    <TI value={ed.boardUniversity||''}
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,boardUniversity:e.target.value}:r))} />
                  </F>
                  <F label="Passing Year">
                    <TI type="number" min="1960" max="2030" value={ed.passingYear||''}
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,passingYear:e.target.value}:r))} />
                  </F>
                  <F label="Percentage / CGPA">
                    <TI type="number" step="0.01" value={ed.percentage||''}
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,percentage:e.target.value}:r))} />
                  </F>
                  <F label="Grade / Division">
                    <TI value={ed.grade||''} placeholder="First Class / A+"
                      onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,grade:e.target.value}:r))} />
                  </F>
                </div>
                <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={ed.isCurrent||false} className="w-3.5 h-3.5"
                    onChange={e=>setEducation(x=>x.map((r,j)=>j===i?{...r,isCurrent:e.target.checked}:r))} />
                  Currently pursuing
                </label>
              </div>
            ))}
            <button
              onClick={() => setEducation(e=>[...e, emptyEdu()])}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600">
              + Add Qualification
            </button>
          </div>
        )}

        {}
        {tab === 'family' && (
          <div className="space-y-4 pt-2">
            {}
            {family.some(f=>f.isNominee) && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                Math.abs(nomineeTotal-100)<0.01
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span>{Math.abs(nomineeTotal-100)<0.01 ? '✓' : '⚠'}</span>
                <span>Nominee total: <strong>{nomineeTotal}%</strong>
                  {Math.abs(nomineeTotal-100)>0.01 && ' — must be 100% before saving'}
                </span>
              </div>
            )}
            {errors.nomineeTotal && <p className="text-xs text-red-500">{errors.nomineeTotal}</p>}

            {family.map((fm, i) => (
              <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">Member {i + 1}</p>
                  <button onClick={() => setFamily(f=>f.filter((_,j)=>j!==i))}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Full Name" req>
                    <TI value={fm.name||''} onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,name:e.target.value}:x))} />
                  </F>
                  <F label="Relationship" req>
                    <SI options={RELATIONSHIPS} value={fm.relationship||''} placeholder="Select"
                      onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,relationship:e.target.value}:x))} />
                  </F>
                  <F label="Gender">
                    <SI options={GENDER_OPTS} value={fm.gender||''} placeholder="Select"
                      onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,gender:e.target.value}:x))} />
                  </F>
                  <F label="Date of Birth">
                    <TI type="date" value={fm.dateOfBirth ? String(fm.dateOfBirth).split('T')[0] : ''}
                      onChange={e=>{const dob=e.target.value;const age=dob?Math.floor((new Date()-new Date(dob))/(365.25*24*3600*1000)):'';setFamily(f=>f.map((x,j)=>j===i?{...x,dateOfBirth:dob,age:String(age)}:x));}} />
                  </F>
                  <F label="Age">
                    <TI type="number" value={fm.age||''}
                      onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,age:e.target.value}:x))} />
                  </F>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={fm.isDependent||false} className="w-3.5 h-3.5"
                      onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,isDependent:e.target.checked}:x))} />
                    Dependent
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={fm.isNominee||false} className="w-3.5 h-3.5"
                      onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,isNominee:e.target.checked}:x))} />
                    Nominee
                  </label>
                  {fm.isNominee && (
                    <div className="flex items-center gap-2">
                      <TI type="number" min="0" max="100" step="0.01"
                        value={fm.nomineePercentage||''}
                        onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,nomineePercentage:e.target.value}:x))}
                        style={{width:'5rem'}} placeholder="%" />
                      <SI options={[{value:'all',label:'All'},{value:'pf',label:'PF'},{value:'gratuity',label:'Gratuity'},{value:'insurance',label:'Insurance'}]}
                        value={fm.nomineeFor||'all'}
                        onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,nomineeFor:e.target.value}:x))} />
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={fm.isMinor||false} className="w-3.5 h-3.5"
                      onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,isMinor:e.target.checked}:x))} />
                    Minor
                  </label>
                </div>
                {fm.isMinor && fm.isNominee && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <F label="Guardian Name" req>
                      <TI value={fm.guardianName||''} onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,guardianName:e.target.value}:x))} />
                    </F>
                    <F label="Guardian Relation">
                      <TI value={fm.guardianRelation||''} onChange={e=>setFamily(f=>f.map((x,j)=>j===i?{...x,guardianRelation:e.target.value}:x))} />
                    </F>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => setFamily(f=>[...f,{name:'',relationship:'',gender:'',dateOfBirth:'',age:'',isDependent:false,isNominee:false,nomineePercentage:'',nomineeFor:'all',isMinor:false,guardianName:'',guardianRelation:'',disabilityStatus:false}])}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600">
              + Add Family Member
            </button>
          </div>
        )}

        {}
        {tab === 'experience' && (
          <div className="space-y-4 pt-2">
            {prevEmp.map((pe, i) => (
              <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">Employment {i + 1}</p>
                  {i > 0 && (
                    <button onClick={() => setPrevEmp(p=>p.filter((_,j)=>j!==i))}
                      className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
                {i === 0 && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" checked={pe.isFresher||false} className="w-4 h-4"
                      onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,isFresher:e.target.checked}:x))} />
                    <span className="text-sm font-medium text-gray-700">Fresher — no prior experience</span>
                  </label>
                )}
                {!pe.isFresher && (
                  <div className="grid grid-cols-3 gap-3">
                    <F label="Organization"><TI value={pe.organizationName||''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,organizationName:e.target.value}:x))} /></F>
                    <F label="Designation"><TI value={pe.designation||''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,designation:e.target.value}:x))} /></F>
                    <F label="Department"><TI value={pe.department||''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,department:e.target.value}:x))} /></F>
                    <F label="Joining Date"><TI type="date" value={pe.joiningDate ? String(pe.joiningDate).split('T')[0] : ''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,joiningDate:e.target.value}:x))} /></F>
                    <F label="Last Working Date"><TI type="date" value={pe.leavingDate ? String(pe.leavingDate).split('T')[0] : ''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,leavingDate:e.target.value}:x))} /></F>
                    <F label="Last CTC (₹/year)" hint="Annual salary in rupees">
                      <TI type="number" value={pe.lastCtcRupees||''} placeholder="e.g. 300000"
                        onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,lastCtcRupees:e.target.value}:x))} />
                    </F>
                    <F label="Reason for Leaving">
                      <TI value={pe.reasonForLeaving||''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,reasonForLeaving:e.target.value}:x))} />
                    </F>
                    <F label="Reference Name">
                      <TI value={pe.referenceName||''} onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,referenceName:e.target.value}:x))} />
                    </F>
                    <F label="Reference Phone">
                      <TI value={pe.referencePhone||''} maxLength={10}
                        onChange={e=>setPrevEmp(p=>p.map((x,j)=>j===i?{...x,referencePhone:e.target.value.replace(/\D/g,'').slice(0,10)}:x))} />
                    </F>
                  </div>
                )}
              </div>
            ))}
            {!prevEmp[0]?.isFresher && (
              <button onClick={() => setPrevEmp(p=>[...p, emptyPrev()])}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600">
                + Add Another Employer
              </button>
            )}
          </div>
        )}

        {}
        {tab === 'professional' && (
          <div className="space-y-5 pt-2">
            {isRequestMode && (
              <Alert type="warning">
                Professional details (joining date, department, designation) can only be changed
                by HR. These fields are read-only in your request.
              </Alert>
            )}
            <div className="grid grid-cols-3 gap-3">
              <F label="Employee Code">
                <TI value={professional.employeeCode} disabled={ro}
                  onChange={e=>setProfessional(p=>({...p,employeeCode:e.target.value}))} />
              </F>
              <F label="Date of Joining">
                <TI type="date" value={professional.dateOfJoining} disabled={ro}
                  onChange={e=>setProfessional(p=>({...p,dateOfJoining:e.target.value}))} />
              </F>
              <F label="Employment Type">
                <SI options={EMP_TYPE_OPTS} value={professional.employmentType} disabled={ro}
                  onChange={e=>setProfessional(p=>({...p,employmentType:e.target.value}))} />
              </F>
              <F label="Status">
                <SI options={STATUS_OPTS} value={professional.status} disabled={ro}
                  onChange={e=>setProfessional(p=>({...p,status:e.target.value}))} />
              </F>
              <F label="Probation End Date">
                <TI type="date" value={professional.probationEndDate} disabled={ro}
                  onChange={e=>setProfessional(p=>({...p,probationEndDate:e.target.value}))} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Department">
                <SI options={dOpts} value={professional.departmentId} disabled={ro} placeholder="Select"
                  onChange={e=>setProfessional(p=>({...p,departmentId:e.target.value}))} />
              </F>
              <F label="Designation">
                <SI options={dgOpts} value={professional.designationId} disabled={ro} placeholder="Select"
                  onChange={e=>setProfessional(p=>({...p,designationId:e.target.value}))} />
              </F>
              <F label="Branch">
                <SI options={bOpts} value={professional.branchId} disabled={ro} placeholder="Select"
                  onChange={e=>setProfessional(p=>({...p,branchId:e.target.value}))} />
              </F>
              <F label="Reporting Manager">
                <SI options={mOpts} value={professional.reportingTo} disabled={ro} placeholder="Select"
                  onChange={e=>setProfessional(p=>({...p,reportingTo:e.target.value}))} />
              </F>
              <F label="UAN Number (PF)">
                <TI value={professional.uanNumber} disabled={ro} maxLength={12}
                  onChange={e=>setProfessional(p=>({...p,uanNumber:e.target.value.replace(/\D/g,'').slice(0,12)}))} />
              </F>
              <F label="ESI IP Number">
                <TI value={professional.esiIpNumber} disabled={ro}
                  onChange={e=>setProfessional(p=>({...p,esiIpNumber:e.target.value.replace(/\D/g,'')}))} />
              </F>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="flex-shrink-0 bg-white border border-gray-200 border-t-0 rounded-b-xl px-5 py-3 flex items-center justify-between">
        <button onClick={() => navigate(`/employees/${id}`)}
          className="px-5 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
          ← Cancel
        </button>

        {isRequestMode ? (
          <button
            onClick={() => { if (validate()) setShowConfirmRequest(true); else toast.error('Fix the errors first'); }}
            disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>}
            {saving ? 'Submitting…' : 'Submit Update Request →'}
          </button>
        ) : (
          <button
            onClick={saveDirectly}
            disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>}
            {saving ? 'Saving…' : 'Save All Changes ✓'}
          </button>
        )}
      </div>

      {}
      <ConfirmModal
        open={showConfirmRequest}
        onClose={() => setShowConfirmRequest(false)}
        onConfirm={submitRequest}
        loading={saving}
        title="Submit Update Request"
        confirmLabel="Submit Request"
        variant="primary"
        message="Your changes will be sent to HR for review. The update will take effect only after HR approves it."
      />
    </div>
  );
}

