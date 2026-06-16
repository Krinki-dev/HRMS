import React, { useState } from 'react';
import AadhaarKycModal from '../../components/employees/AadhaarKycModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { employeeApi } from '../../services/employeeApi';
import {
  Badge, Avatar, Spinner, Tabs, Button, Modal,
  Input, Select, ConfirmModal, Alert,
} from '../../components/ui/Common';

const PROFILE_TABS = [
  { id: 'personal',    label: 'Personal',    icon: '👤' },
  { id: 'address',     label: 'Address',     icon: '🏠' },
  { id: 'education',   label: 'Education',   icon: '🎓' },
  { id: 'family',      label: 'Family',      icon: '👨‍👩‍👧' },
  { id: 'experience',  label: 'Experience',  icon: '💼' },
  { id: 'documents',   label: 'Documents',   icon: '📄' },
  { id: 'bank',        label: 'Bank',        icon: '🏦' },
  { id: 'login',       label: 'Login',       icon: '🔑' },
];

const HR_ROLES = ['super_admin', 'admin', 'hr_admin', 'hr', 'Super Admin', 'Admin', 'HR'];

const EDU_LEVEL_LABELS = {
  '10th': '10th / SSC', '12th': '12th / HSC', iti: 'ITI',
  diploma: 'Diploma', graduate: 'Graduate', post_graduate: 'Post Graduate',
  doctorate: 'Doctorate', professional: 'Professional', other: 'Other',
};

const DOC_TYPE_LABELS = {
  aadhaar: 'Aadhaar Card', pan: 'PAN Card', passport: 'Passport',
  driving_license: 'Driving License', voter_id: 'Voter ID',
  bank_passbook: 'Bank Passbook', '10th_marksheet': '10th Marksheet',
  '12th_marksheet': '12th Marksheet', degree_certificate: 'Degree Certificate',
  experience_letter: 'Experience Letter', relieving_letter: 'Relieving Letter',
  other: 'Other',
};

function Row({ label, value, mono }) {
  return (
    <div className="flex py-2 border-b border-gray-50 last:border-0 gap-2">
      <span className="w-44 text-xs text-gray-400 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-900 flex-1 ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const { user }  = useAuthStore();
  const isHR      = HR_ROLES.includes(user?.role);

  const [tab,         setTab]         = useState('personal');
  const [unmasked,    setUnmasked]    = useState(null);
  const [showDelete,  setShowDelete]  = useState(false);
  const [delDocId,    setDelDocId]    = useState(null);
  const [delBankId,   setDelBankId]   = useState(null);
  const [showAddDoc,  setShowAddDoc]  = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showCreateLogin, setShowCreateLogin] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [photoUploading, setPhotoUploading]   = useState(false);
  const photoInputRef = React.useRef(null);

  const [docForm,   setDocForm]  = useState({ documentType: '', documentName: '', fileUrl: '', documentNumber: '' });
  const [bankForm,  setBankForm] = useState({ bankName: '', accountNumber: '', ifscCode: '', accountType: 'savings' });
  const [loginEmail, setLoginEmail] = useState('');

  const inv = () => qc.invalidateQueries({ queryKey: ['employee', id] });

  const { data: res, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn:  () => employeeApi.getOne(id),
  });
  const emp = res?.data;

  const { data: addrRes } = useQuery({
    queryKey: ['employee-addr', id],
    queryFn:  () => employeeApi.getAddresses(id),
    enabled:  !!emp && tab === 'address',
  });
  const addresses = addrRes?.data || [];

  const { data: eduRes } = useQuery({
    queryKey: ['employee-edu', id],
    queryFn:  () => employeeApi.listEducation(id),
    enabled:  !!emp && tab === 'education',
  });
  const education = eduRes?.data || [];

  const { data: famRes } = useQuery({
    queryKey: ['employee-fam', id],
    queryFn:  () => employeeApi.listFamily(id),
    enabled:  !!emp && tab === 'family',
  });
  const family = famRes?.data || [];

  const { data: expRes } = useQuery({
    queryKey: ['employee-exp', id],
    queryFn:  () => employeeApi.listPrevEmp(id),
    enabled:  !!emp && tab === 'experience',
  });
  const experience = expRes?.data || [];

  const deleteMutation = useMutation({
    mutationFn: () => employeeApi.remove(id),
    onSuccess:  () => { toast.success('Employee removed.'); qc.invalidateQueries({ queryKey: ['employees'] }); navigate('/employees'); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to remove.'),
  });

  const unmaskMutation = useMutation({
    mutationFn: () => employeeApi.unmask(id),
    onSuccess:  (r) => setUnmasked(r.data),
    onError:    ()  => toast.error('Insufficient permissions.'),
  });

  const addDocMutation = useMutation({
    mutationFn: (d) => employeeApi.addDocument(id, d),
    onSuccess:  ()  => { toast.success('Document added.'); inv(); setShowAddDoc(false); setDocForm({ documentType:'', documentName:'', fileUrl:'', documentNumber:'' }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to add document.'),
  });

  const delDocMutation = useMutation({
    mutationFn: (did) => employeeApi.deleteDocument(id, did),
    onSuccess:  ()    => { toast.success('Document removed.'); inv(); setDelDocId(null); },
    onError:    (e)   => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const addBankMutation = useMutation({
    mutationFn: (d) => employeeApi.addBankAccount(id, d),
    onSuccess:  ()  => { toast.success('Bank account added.'); inv(); setShowAddBank(false); setBankForm({ bankName:'', accountNumber:'', ifscCode:'', accountType:'savings' }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const delBankMutation = useMutation({
    mutationFn: (bid) => employeeApi.deleteBankAccount(id, bid),
    onSuccess:  ()    => { toast.success('Bank account removed.'); inv(); setDelBankId(null); },
    onError:    (e)   => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const toggleLoginMutation = useMutation({
    mutationFn: () => employeeApi.toggleLogin(id),
    onSuccess:  (r) => { toast.success(`Login ${r.data?.isActive ? 'enabled' : 'disabled'}.`); inv(); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const createLoginMutation = useMutation({
    mutationFn: () => employeeApi.createLogin(id, { email: loginEmail, sendCredentials: true }),
    onSuccess:  (r) => {
      const pwd = r.data?.tempPassword;
      toast.success(`Login created! Temp password: ${pwd}`);
      inv();
      setShowCreateLogin(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create login.'),
  });

  const photoMutation = useMutation({
    mutationFn: (file) => employeeApi.uploadPhoto(id, file),
    onSuccess:  ()     => { toast.success('Photo updated.'); inv(); setPhotoUploading(false); },
    onError:    (e)    => { toast.error(e.response?.data?.message || 'Photo upload failed.'); setPhotoUploading(false); },
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  );
  if (!emp) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-4">Employee not found.</p>
      <Button variant="outline" onClick={() => navigate('/employees')}>← Back to List</Button>
    </div>
  );

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : null;
  const fmtMoney = (p) => p != null ? `₹${(p / 100).toLocaleString('en-IN')}` : null;

  return (
    <div className="space-y-4">

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {}
            <div className="relative group flex-shrink-0">
              <Avatar name={emp.fullName} photoUrl={emp.photoUrl} size="lg" />
              {isHR && (
                <>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoMutation.isPending}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Change photo">
                    <span className="text-white text-xs font-medium">
                      {photoMutation.isPending ? '…' : '📷'}
                    </span>
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
                      photoMutation.mutate(file);
                    }}
                  />
                </>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{emp.fullName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {emp.designation?.name || 'No designation'}
                {emp.department && ` · ${emp.department.name}`}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                  {emp.employeeCode}
                </span>
                <Badge value={emp.status} />
                <Badge value={emp.employmentType} />
                {emp.isUserCreated && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                    🔑 Has Login
                  </span>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="flex gap-2 flex-shrink-0">
            {isHR ? (
              <>
                <Button variant="outline" size="sm"
                  onClick={() => navigate(`/employees/${id}/edit`)}>
                  ✏ Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                  🗑 Remove
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm"
                onClick={() => navigate(`/employees/${id}/edit?mode=request`)}>
                📝 Request Edit
              </Button>
            )}
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Joined</p>
            <p className="text-sm font-medium">{fmt(emp.dateOfJoining) || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Branch</p>
            <p className="text-sm font-medium">{emp.branch?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Manager</p>
            <p className="text-sm font-medium">
              {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Work Email</p>
            <p className="text-sm font-medium truncate">{emp.workEmail || '—'}</p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Tabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />

        {}
        {tab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section title="Personal Information">
              <Row label="First Name"      value={emp.firstName} />
              <Row label="Middle Name"     value={emp.middleName} />
              <Row label="Last Name"       value={emp.lastName} />
              <Row label="Father's Name"   value={emp.fatherName} />
              <Row label="Mother's Name"   value={emp.motherName} />
              {emp.maritalStatus === 'married' && (
                <Row label="Spouse Name"   value={emp.spouseName} />
              )}
              <Row label="Date of Birth"   value={fmt(emp.dateOfBirth)} />
              <Row label="Gender"          value={emp.gender} />
              <Row label="Marital Status"  value={emp.maritalStatus} />
              <Row label="Blood Group"     value={emp.bloodGroup} />
              {emp.disabilityStatus && (
                <Row label="Disability"    value="Yes — Person with disability" />
              )}
              <Row label="Mobile"          value={emp.phone} />
              <Row label="Personal Email"  value={emp.personalEmail} />
              <Row label="Work Email"      value={emp.workEmail} />
            </Section>

            <div className="space-y-6">
              <Section title="Professional">
                <Row label="Employee Code"   value={emp.employeeCode} mono />
                <Row label="Joined"          value={fmt(emp.dateOfJoining)} />
                <Row label="Employment Type" value={emp.employmentType?.replace('_',' ')} />
                <Row label="Status"          value={emp.status} />
                <Row label="Probation Ends"  value={fmt(emp.probationEndDate)} />
                <Row label="Confirmed On"    value={fmt(emp.confirmationDate)} />
              </Section>

              <Section title="Emergency Contact">
                <Row label="Name"         value={emp.emergencyContactName} />
                <Row label="Phone"        value={emp.emergencyContactPhone} />
                <Row label="Relation"     value={emp.emergencyContactRel} />
              </Section>

              {}
              <Section title="Identity / Statutory">
                <div className="flex items-center justify-between mb-2">
                  <span />
                  {!unmasked
                    ? <div className="flex items-center gap-3">
                        <button onClick={() => unmaskMutation.mutate()}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          {unmaskMutation.isPending
                            ? <><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" /> Unlocking…</>
                            : '🔓 View Numbers'
                          }
                        </button>
                        {isHR && emp.aadhaarMasked && (
                          <button onClick={() => setKycOpen(true)}
                            className="text-xs text-purple-600 hover:underline">
                            🪪 Verify via UIDAI
                          </button>
                        )}
                      </div>
                    : <button onClick={() => setUnmasked(null)}
                        className="text-xs text-gray-400 hover:underline">Hide</button>
                  }
                </div>
                <Row label="Aadhaar" value={unmasked ? unmasked.aadhaarNumber : emp.aadhaarMasked} mono />
                <Row label="PAN"     value={unmasked ? unmasked.panNumber     : emp.panMasked}     mono />
                <Row label="UAN (PF)"  value={emp.uanNumber} mono />
                <Row label="ESI IP"    value={emp.esiIpNumber} mono />
                {unmasked && (
                  <p className="text-xs text-red-500 mt-1">⚠ This view is audit-logged.</p>
                )}
              </Section>
            </div>
          </div>
        )}

        {}
        {tab === 'address' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['local', 'permanent'].map(type => {
              const addr = addresses.find(a => a.addressType === type);
              return (
                <Section key={type} title={type === 'local' ? 'Current / Local Address' : 'Permanent Address'}>
                  {addr ? (
                    <>
                      <Row label="House / Flat"    value={addr.houseNo} />
                      <Row label="Street / Colony" value={addr.street} />
                      <Row label="Village / City"  value={addr.villageCity} />
                      <Row label="District"        value={addr.district} />
                      <Row label="State"           value={addr.state} />
                      <Row label="Country"         value={addr.country} />
                      <Row label="Pincode"         value={addr.pincode} mono />
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 py-4">Not filled</p>
                  )}
                </Section>
              );
            })}
          </div>
        )}

        {}
        {tab === 'education' && (
          <div className="space-y-4">
            {education.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">No education records.</p>
            ) : (
              education.map((ed, i) => (
                <div key={ed.id || i}
                  className="p-4 border border-gray-100 rounded-xl bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Level</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {EDU_LEVEL_LABELS[ed.eduLevel] || ed.eduLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Course / Degree</p>
                    <p className="text-sm">{ed.courseName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Stream / Subjects</p>
                    <p className="text-sm">{ed.streamSubject || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Institution</p>
                    <p className="text-sm">{ed.institutionName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Board / University</p>
                    <p className="text-sm">{ed.boardUniversity || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Passing Year</p>
                    <p className="text-sm">{ed.passingYear || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Percentage / CGPA</p>
                    <p className="text-sm">{ed.percentage != null ? `${ed.percentage}%` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Grade / Division</p>
                    <p className="text-sm">{ed.grade || '—'}</p>
                  </div>
                  {ed.isCurrent && (
                    <div className="col-span-full">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Currently Pursuing</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {}
        {tab === 'family' && (
          <div className="space-y-4">
            {family.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">No family members recorded.</p>
            ) : (
              <>
                {}
                {family.some(f => f.isNominee) && (() => {
                  const total = family
                    .filter(f => f.isNominee)
                    .reduce((s, f) => s + parseFloat(f.nomineePercentage || 0), 0);
                  const valid = Math.abs(total - 100) < 0.01;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      valid ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span>{valid ? '✓' : '⚠'}</span>
                      <span>Nominee total: <strong>{Math.round(total * 100) / 100}%</strong>
                        {!valid && ' — should be 100%'}
                      </span>
                    </div>
                  );
                })()}

                {family.map((fm, i) => (
                  <div key={fm.id || i}
                    className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{fm.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {fm.relationship?.replace(/_/g, ' ')}
                        </span>
                        {fm.isNominee && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            Nominee {fm.nomineePercentage}%
                            {fm.nomineeFor && fm.nomineeFor !== 'all' && ` (${fm.nomineeFor})`}
                          </span>
                        )}
                        {fm.isDependent && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Dependent</span>
                        )}
                        {fm.isMinor && (
                          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                            Minor — Guardian: {fm.guardianName || 'not set'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Gender</p>
                        <p>{fm.gender || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date of Birth</p>
                        <p>{fmt(fm.dateOfBirth) || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Age</p>
                        <p>{fm.age || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Aadhaar</p>
                        <p className="font-mono">{fm.aadhaarMasked || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {}
        {tab === 'experience' && (
          <div className="space-y-4">
            {experience.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">No employment history.</p>
            ) : experience[0]?.isFresher ? (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-2xl">🌱</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Fresher</p>
                  <p className="text-xs text-blue-600">No prior employment — first job</p>
                </div>
              </div>
            ) : (
              experience.map((pe, i) => (
                <div key={pe.id || i}
                  className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {pe.organizationName || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pe.designation || '—'}
                        {pe.department && ` · ${pe.department}`}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {fmt(pe.joiningDate)} – {fmt(pe.leavingDate) || 'Present'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Last CTC</p>
                      <p>{fmtMoney(pe.lastCtcRupees ? pe.lastCtcRupees * 100 : null) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Reason for Leaving</p>
                      <p>{pe.reasonForLeaving || '—'}</p>
                    </div>
                    {pe.referenceName && (
                      <div>
                        <p className="text-xs text-gray-400">Reference</p>
                        <p>{pe.referenceName} · {pe.referencePhone || '—'}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {pe.experienceLetterUrl && (
                      <a href={pe.experienceLetterUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">📄 Experience Letter</a>
                    )}
                    {pe.relievingLetterUrl && (
                      <a href={pe.relievingLetterUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">📄 Relieving Letter</a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {}
        {tab === 'documents' && (
          <div>
            {isHR && (
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddDoc(true)}>+ Add Document</Button>
              </div>
            )}
            {!(emp.documents?.length) ? (
              <p className="text-center py-12 text-gray-400 text-sm">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {emp.documents.map(doc => (
                  <div key={doc.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.documentName}
                        {doc.expiryDate && ` · Expires ${fmt(doc.expiryDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.isVerified && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">✓ Verified</span>
                      )}
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline">View</a>
                      )}
                      {isHR && (
                        <button onClick={() => setDelDocId(doc.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {tab === 'bank' && (
          <div>
            {isHR && (
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddBank(true)}>+ Add Bank Account</Button>
              </div>
            )}
            {!(emp.bankAccounts?.length) ? (
              <p className="text-center py-12 text-gray-400 text-sm">No bank accounts added.</p>
            ) : (
              <div className="space-y-3">
                {emp.bankAccounts.map(b => (
                  <div key={b.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{b.bankName}</p>
                        {b.isPrimary && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-mono mt-0.5">{b.accountMasked}</p>
                      <p className="text-xs text-gray-400">
                        IFSC: {b.ifscCode} · {b.accountType}
                      </p>
                    </div>
                    {isHR && (
                      <button onClick={() => setDelBankId(b.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {tab === 'login' && (
          <div>
            {emp.loginAccount ? (
              <div className="space-y-4">
                <div className="p-4 border border-gray-100 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.loginAccount.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last login: {emp.loginAccount.lastLoginAt
                        ? new Date(emp.loginAccount.lastLoginAt).toLocaleString('en-IN')
                        : 'Never logged in'}
                    </p>
                    {emp.loginAccount.isFirstLogin && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        ⚠ Has not changed default password yet
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge value={emp.loginAccount.isActive ? 'active' : 'inactive'} />
                    {isHR && (
                      <Button variant="outline" size="sm"
                        onClick={() => toggleLoginMutation.mutate()}
                        loading={toggleLoginMutation.isPending}>
                        {emp.loginAccount.isActive ? 'Disable Login' : 'Enable Login'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm mb-1">No login account for this employee.</p>
                <p className="text-xs text-gray-300 mb-4">
                  Creating a login lets them access payslips, apply leave, mark attendance.
                </p>
                {isHR && (
                  <Button onClick={() => {
                    setLoginEmail(emp.workEmail || emp.personalEmail || '');
                    setShowCreateLogin(true);
                  }}>
                    Create Login Account
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {}

      {}
      <ConfirmModal
        open={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Remove Employee" confirmLabel="Remove"
        message={`Remove ${emp.fullName}? This soft-deletes the record. Payroll history is kept.`}
      />

      {}
      <ConfirmModal
        open={!!delDocId} onClose={() => setDelDocId(null)}
        onConfirm={() => delDocMutation.mutate(delDocId)}
        loading={delDocMutation.isPending}
        title="Remove Document" confirmLabel="Remove"
        message="Remove this document? This cannot be undone."
      />

      {}
      <ConfirmModal
        open={!!delBankId} onClose={() => setDelBankId(null)}
        onConfirm={() => delBankMutation.mutate(delBankId)}
        loading={delBankMutation.isPending}
        title="Remove Bank Account" confirmLabel="Remove"
        message="Remove this bank account? Salary may be affected if this is the primary account."
        variant="danger"
      />

      {}
      <Modal open={showAddDoc} onClose={() => setShowAddDoc(false)} title="Add Document"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddDoc(false)}>Cancel</Button>
            <Button
              onClick={() => addDocMutation.mutate({
                documentType: docForm.documentType,
                documentName: docForm.documentName || DOC_TYPE_LABELS[docForm.documentType] || docForm.documentType,
                fileUrl:      docForm.fileUrl,
              })}
              loading={addDocMutation.isPending}
              disabled={!docForm.documentType}
            >
              Add Document
            </Button>
          </>
        }>
        <div className="space-y-4 py-2">
          <Select label="Document Type" required
            options={Object.entries(DOC_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            placeholder="Select type"
            value={docForm.documentType}
            onChange={e => setDocForm(d => ({ ...d, documentType: e.target.value }))}
          />
          <Input label="Document Name / Title"
            placeholder="e.g. Aadhaar Card — Ravi Sharma"
            value={docForm.documentName}
            onChange={e => setDocForm(d => ({ ...d, documentName: e.target.value }))}
          />
          <Input label="File URL"
            placeholder="Paste MinIO / S3 URL (upload separately)"
            value={docForm.fileUrl}
            onChange={e => setDocForm(d => ({ ...d, fileUrl: e.target.value }))}
          />
        </div>
      </Modal>

      {}
      <Modal open={showAddBank} onClose={() => setShowAddBank(false)} title="Add Bank Account"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddBank(false)}>Cancel</Button>
            <Button
              onClick={() => addBankMutation.mutate(bankForm)}
              loading={addBankMutation.isPending}
              disabled={!bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode}
            >
              Add Account
            </Button>
          </>
        }>
        <div className="space-y-4 py-2">
          <Input label="Bank Name" required placeholder="HDFC Bank, SBI, ICICI..."
            value={bankForm.bankName}
            onChange={e => setBankForm(b => ({ ...b, bankName: e.target.value }))}
          />
          <Input label="Account Number" required placeholder="9-18 digit account number"
            value={bankForm.accountNumber}
            onChange={e => setBankForm(b => ({ ...b, accountNumber: e.target.value.replace(/\D/g, '') }))}
          />
          <Input label="IFSC Code" required placeholder="HDFC0001234"
            value={bankForm.ifscCode}
            onChange={e => setBankForm(b => ({ ...b, ifscCode: e.target.value.toUpperCase() }))}
          />
          <Select label="Account Type"
            options={[{ value: 'savings', label: 'Savings' }, { value: 'current', label: 'Current' }]}
            value={bankForm.accountType}
            onChange={e => setBankForm(b => ({ ...b, accountType: e.target.value }))}
          />
        </div>
      </Modal>

      {}
      <Modal open={showCreateLogin} onClose={() => setShowCreateLogin(false)}
        title="Create Login Account"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateLogin(false)}>Cancel</Button>
            <Button
              onClick={() => createLoginMutation.mutate()}
              loading={createLoginMutation.isPending}
              disabled={!loginEmail.trim()}
            >
              Create Login
            </Button>
          </>
        }>
        <div className="space-y-4 py-2">
          <Alert type="info">
            The employee will use this email to log in. Their temporary password will be their
            PAN number in lowercase (if available), otherwise a random password.
            They must change it on first login.
          </Alert>
          <Input label="Login Email" required type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            placeholder={emp.workEmail || emp.personalEmail || 'employee@company.com'}
          />
        </div>
      </Modal>

      {}
      <AadhaarKycModal
        open={kycOpen}
        onClose={() => setKycOpen(false)}
        employeeId={id}
        empName={emp?.fullName}
        onVerified={() => { setKycOpen(false); inv(); toast.success('Aadhaar verified via UIDAI ✓'); }}
      />
    </div>
  );
}

