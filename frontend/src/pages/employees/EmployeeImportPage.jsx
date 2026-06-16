import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { employeeApi } from '../../services/employeeApi';
import { Button, Alert } from '../../components/ui/Common';

const COLUMNS = [
  
  { name:'firstName',             key:'firstName',             req:true,  group:'Name',
    label:'First Name' },
  { name:'lastName',              key:'lastName',              req:true,  group:'Name',
    label:'Last Name' },
  { name:'phone',                 key:'phone',                 req:true,  group:'Contact',
    label:'Mobile',
    validate: v => v && !/^[6-9]\d{9}$/.test(v) ? 'Must be 10 digits starting 6–9' : null },
  { name:'dateOfJoining',         key:'dateOfJoining',         req:true,  group:'Job',
    label:'Date of Joining',
    validate: v => v && !/^\d{4}-\d{2}-\d{2}$/.test(v) ? 'Use YYYY-MM-DD' : null },
  { name:'employmentType',        key:'employmentType',        req:true,  group:'Job',
    label:'Employment Type',
    validate: v => v && !['full_time','part_time','contract','intern'].includes(v)
      ? 'full_time / part_time / contract / intern' : null },
  { name:'status',                key:'status',                req:true,  group:'Job',
    label:'Status',
    validate: v => v && !['active','probation','notice','terminated'].includes(v)
      ? 'active / probation / notice / terminated' : null },

  { name:'employeeCode',          key:'employeeCode',          req:false, group:'Name',
    label:'Employee Code (auto if blank)' },
  { name:'middleName',            key:'middleName',            req:false, group:'Name',
    label:'Middle Name' },

  { name:'personalEmail',         key:'personalEmail',         req:false, group:'Contact',
    label:'Personal Email',
    validate: v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email' : null },
  { name:'workEmail',             key:'workEmail',             req:false, group:'Contact',
    label:'Work Email',
    validate: v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email' : null },

  { name:'dateOfBirth',           key:'dateOfBirth',           req:false, group:'Personal',
    label:'Date of Birth',
    validate: v => v && !/^\d{4}-\d{2}-\d{2}$/.test(v) ? 'Use YYYY-MM-DD' : null },
  { name:'gender',                key:'gender',                req:false, group:'Personal',
    label:'Gender',
    validate: v => v && !['male','female','other'].includes(v) ? 'male / female / other' : null },
  { name:'maritalStatus',         key:'maritalStatus',         req:false, group:'Personal',
    label:'Marital Status',
    validate: v => v && !['single','married','divorced','widowed'].includes(v)
      ? 'single / married / divorced / widowed' : null },
  { name:'bloodGroup',            key:'bloodGroup',            req:false, group:'Personal',
    label:'Blood Group',
    validate: v => v && !['A+','A-','B+','B-','O+','O-','AB+','AB-'].includes(v)
      ? 'A+ / A- / B+ / B- / O+ / O- / AB+ / AB-' : null },

  { name:'fatherName',            key:'fatherName',            req:false, group:'Family Names',
    label:"Father's Name" },
  { name:'motherName',            key:'motherName',            req:false, group:'Family Names',
    label:"Mother's Name" },
  { name:'spouseName',            key:'spouseName',            req:false, group:'Family Names',
    label:'Spouse Name' },
  { name:'disabilityStatus',      key:'disabilityStatus',      req:false, group:'Family Names',
    label:'Disability Status',
    validate: v => v && !['true','false','1','0','yes','no'].includes(v.toLowerCase())
      ? 'true / false' : null },

  { name:'emergencyContactName',  key:'emergencyContactName',  req:false, group:'Emergency',
    label:'Emergency Contact Name' },
  { name:'emergencyContactPhone', key:'emergencyContactPhone', req:false, group:'Emergency',
    label:'Emergency Contact Phone',
    validate: v => v && !/^[6-9]\d{9}$/.test(v) ? 'Must be 10 digits' : null },
  { name:'emergencyContactRel',   key:'emergencyContactRel',   req:false, group:'Emergency',
    label:'Emergency Contact Relation' },

  { name:'aadhaarNumber',         key:'aadhaarNumber',         req:false, group:'Statutory',
    label:'Aadhaar Number',
    validate: v => v && !/^\d{12}$/.test(v.replace(/\s/g,'')) ? 'Must be 12 digits' : null },
  { name:'panNumber',             key:'panNumber',             req:false, group:'Statutory',
    label:'PAN Number',
    validate: v => v && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase())
      ? 'Format: ABCDE1234F' : null },
  { name:'uanNumber',             key:'uanNumber',             req:false, group:'Statutory',
    label:'UAN Number (PF)' },
  { name:'esiIpNumber',           key:'esiIpNumber',           req:false, group:'Statutory',
    label:'ESI IP Number' },

  { name:'probationEndDate',      key:'probationEndDate',      req:false, group:'Job',
    label:'Probation End Date',
    validate: v => v && !/^\d{4}-\d{2}-\d{2}$/.test(v) ? 'Use YYYY-MM-DD' : null },

  { name:'department',            key:'departmentName',        req:false, group:'Organisation',
    label:'Department (exact name)' },
  { name:'designation',           key:'designationName',       req:false, group:'Organisation',
    label:'Designation (exact name)' },
  { name:'branch',                key:'branchName',            req:false, group:'Organisation',
    label:'Branch (exact name)' },
  { name:'managerCode',           key:'managerCode',           req:false, group:'Organisation',
    label:'Manager (Employee Code)' },
];

const REQUIRED_NAMES = COLUMNS.filter(c => c.req).map(c => c.name);
const GROUPS = [...new Set(COLUMNS.map(c => c.group))];
const PREVIEW_KEYS = ['firstName','lastName','phone','dateOfJoining','employmentType','status','departmentName','branchName'];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { error: 'File is empty or has no data rows.' };

  const parseLine = (line) => {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"' && !inQ)  { inQ = true;  continue; }
      if (line[i] === '"' && inQ)   { inQ = false; continue; }
      if (line[i] === ',' && !inQ)  { out.push(cur.trim()); cur = ''; continue; }
      cur += line[i];
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/\*/g,'').trim());
  const missing = REQUIRED_NAMES.filter(n => !headers.includes(n));
  if (missing.length)
    return { error: `Missing required columns: ${missing.join(', ')}` };

  const rows = lines.slice(1).map((line, idx) => {
    const vals = parseLine(line);
    const raw  = {};
    headers.forEach((h, i) => { raw[h] = vals[i]?.trim() || ''; });

    const mapped = { _rowNum: idx + 2 };
    COLUMNS.forEach(col => {
      mapped[col.key] = raw[col.name] || '';
    });
    return mapped;
  }).filter(row => Object.values(row).some((v, i) => i > 0 && v)); 

  return { headers, rows };
}

function validateRows(rows) {
  const errs = [];
  rows.forEach(row => {
    COLUMNS.forEach(col => {
      const v = row[col.key];
      if (col.req && !v)
        errs.push({ row: row._rowNum, col: col.label, msg: 'Required — must not be empty' });
      else if (col.validate && v) {
        const msg = col.validate(v);
        if (msg) errs.push({ row: row._rowNum, col: col.label, msg });
      }
    });
  });
  return errs;
}

export default function EmployeeImportPage() {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [dragging,   setDragging]   = useState(false);
  const [file,       setFile]       = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [rowErrors,  setRowErrors]  = useState([]);
  const [result,     setResult]     = useState(null);
  const [activeGroup, setActiveGroup] = useState('all');

  const importMutation = useMutation({
    mutationFn: (rows) => employeeApi.bulkImport(rows),
    onSuccess:  (res)  => {
      const d = res?.data || res;
      setResult(d);
      toast.success(`Import complete — ${d?.success || 0} added, ${d?.failed || 0} failed`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Import failed. Check file.'),
  });

  function processFile(f) {
    if (!f || !f.name.endsWith('.csv')) { setParseError('Please select a .csv file'); return; }
    setFile(f); setResult(null); setParseError(''); setRowErrors([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { error, rows } = parseCSV(ev.target.result);
      if (error) { setParseError(error); setParsedRows([]); return; }
      setRowErrors(validateRows(rows));
      setParsedRows(rows);
    };
    reader.readAsText(f);
  }

  const onFileInput = (e) => processFile(e.target.files[0]);
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]);
  }, []);

  function downloadTemplate() {
    
    const a = document.createElement('a');
    a.href = '/api/v1/employees/bulk-import/template';
    a.download = 'employee_import_template.csv';
    a.click();
  }

  function clearFile() {
    setFile(null); setParsedRows([]); setParseError(''); setRowErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  const canImport   = parsedRows.length > 0 && rowErrors.length === 0;
  const cleanRows   = parsedRows.map(({ _rowNum, ...rest }) => rest);

  const displayCols = activeGroup === 'all'
    ? COLUMNS
    : COLUMNS.filter(c => c.group === activeGroup);

  return (
    <div>
      {}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Import Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bulk-add employees via CSV — {COLUMNS.length} columns supported
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/employees')}>← Back</Button>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { n:1, icon:'⬇', title:'Download Template',
            body:'Get the CSV with all column headers pre-filled.',
            action: <button onClick={downloadTemplate}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
              Download employee_import_template.csv →
            </button> },
          { n:2, icon:'📝', title:'Fill Employee Data',
            body:'Required columns are marked *. Dates must be YYYY-MM-DD. Department / Designation / Branch must match exact names in the system.' },
          { n:3, icon:'⬆', title:'Upload & Import',
            body:'Upload the filled file. All errors are shown before import runs — nothing is saved until you confirm.' },
        ].map(s => (
          <div key={s.n} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {s.n}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{s.icon} {s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.body}</p>
              {s.action}
            </div>
          </div>
        ))}
      </div>

      {!result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors select-none ${
              dragging     ? 'border-blue-500 bg-blue-50' :
              file && !parseError ? 'border-blue-400 bg-blue-50' :
              parseError   ? 'border-red-300 bg-red-50'   :
                             'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <div className="text-4xl mb-3">{file ? '📄' : '📂'}</div>
            {file ? (
              <div>
                <p className="text-blue-700 font-semibold text-sm">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {parsedRows.length} data rows parsed
                  {rowErrors.length > 0 &&
                    <span className="text-red-500 ml-2">· {rowErrors.length} validation error{rowErrors.length > 1 ? 's' : ''}</span>}
                  {rowErrors.length === 0 && parsedRows.length > 0 &&
                    <span className="text-green-600 ml-2">· Ready to import</span>}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-gray-700 text-sm">Click to select or drag & drop a CSV file</p>
                <p className="text-xs text-gray-400 mt-1">.csv files only</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileInput} />
          </div>

          {}
          {parseError && <Alert type="error">{parseError}</Alert>}

          {}
          {rowErrors.length > 0 && (
            <div className="border border-red-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-2.5 border-b border-red-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-red-700">
                  {rowErrors.length} error{rowErrors.length > 1 ? 's' : ''} — fix in your CSV then re-upload
                </p>
                <span className="text-xs text-red-500">Nothing has been imported</span>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {rowErrors.slice(0, 30).map((e, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2 text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}`}>
                    <span className="font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs flex-shrink-0">
                      Row {e.row}
                    </span>
                    <span className="text-gray-500 font-medium flex-shrink-0 w-40">{e.col}</span>
                    <span className="text-red-600">{e.msg}</span>
                  </div>
                ))}
                {rowErrors.length > 30 && (
                  <div className="px-4 py-2 text-xs text-gray-400 text-center">
                    +{rowErrors.length - 30} more errors — fix the above first
                  </div>
                )}
              </div>
            </div>
          )}

          {}
          {parsedRows.length > 0 && rowErrors.length === 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  Preview — first {Math.min(parsedRows.length, 5)} of {parsedRows.length} rows
                </p>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  ✓ {parsedRows.length} valid rows
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">#</th>
                      {PREVIEW_KEYS.map(k => (
                        <th key={k} className="px-3 py-2 text-left text-gray-500 font-semibold capitalize">
                          {k.replace(/([A-Z])/g,' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parsedRows.slice(0,5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-300">{row._rowNum}</td>
                        {PREVIEW_KEYS.map(k => (
                          <td key={k} className="px-3 py-2 text-gray-700">{row[k] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {}
          <div className="flex items-center justify-between pt-1">
            <button onClick={clearFile}
              className={`text-sm text-gray-400 hover:text-gray-600 transition-colors ${!file ? 'invisible' : ''}`}>
              ✕ Remove file
            </button>
            <Button
              onClick={() => importMutation.mutate(cleanRows)}
              disabled={!canImport}
              loading={importMutation.isPending}
            >
              {importMutation.isPending
                ? `Importing ${parsedRows.length} employees…`
                : `Import ${parsedRows.length || ''} Employees`}
            </Button>
          </div>
        </div>
      ) : (
        
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{result.failed === 0 ? '✅' : '⚠️'}</div>
            <h2 className="text-xl font-bold text-gray-900">
              {result.failed === 0 ? 'All employees imported!' : 'Import finished with errors'}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label:'Imported',  val: result.success, color:'green' },
              { label:'Failed',    val: result.failed,  color: result.failed > 0 ? 'red' : 'gray' },
              { label:'Total',     val: (result.success||0)+(result.failed||0), color:'gray' },
            ].map(s => (
              <div key={s.label}
                className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-4 text-center`}>
                <p className={`text-3xl font-bold text-${s.color}-700`}>{s.val}</p>
                <p className={`text-sm text-${s.color}-600 mt-1`}>{s.label}</p>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <div className="border border-red-200 rounded-xl overflow-hidden mb-5">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                <p className="text-sm font-semibold text-red-700">Failed rows</p>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-red-50">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-4 py-2 text-xs flex gap-3 items-center">
                    <span className="text-gray-500 font-medium flex-shrink-0">{e.name || e.row}</span>
                    <span className="text-red-600">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/employees')}>View All Employees</Button>
            <Button variant="outline" onClick={() => { setResult(null); clearFile(); }}>
              Import More
            </Button>
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-sm font-semibold text-gray-700">
            All {COLUMNS.length} Supported Columns
          </p>
          <div className="flex gap-1 flex-wrap">
            {['all', ...GROUPS].map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeGroup === g
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                }`}>
                {g === 'all' ? 'All' : g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayCols.map(c => (
            <span key={c.name}
              className={`text-xs px-2 py-1 rounded font-mono border ${
                c.req
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}
              title={c.label + (c.validate ? ' — validation applied' : '')}
            >
              {c.name}{c.req ? '*' : ''}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span><span className="inline-block w-2.5 h-2.5 rounded bg-red-100 border border-red-200 mr-1"/>* Required</span>
          <span>Dates: YYYY-MM-DD</span>
          <span>Education / Family / Experience → use Add Employee wizard</span>
        </div>
      </div>
    </div>
  );
}

