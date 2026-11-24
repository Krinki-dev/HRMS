import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPES = [
  ['gst_certificate', 'GST registration certificate'],
  ['pan_card', 'Company PAN card'],
  ['incorporation_certificate', 'Certificate of incorporation'],
  ['address_proof', 'Registered office address proof'],
  ['bank_proof', 'Company bank proof'],
  ['other', 'Other company document'],
];

export default function CompanyDocumentsStep({ onNext, onSkip }) {
  const [documentType, setDocumentType] = useState('gst_certificate');
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const response = await api.get('/platform/company-documents');
      setDocuments(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load submitted documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function upload() {
    if (!file) return toast.error('Choose a PDF, JPEG, or PNG file first.');
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file);
    setSaving(true);
    try {
      await api.post('/platform/company-documents', form);
      setFile(null);
      toast.success('Document submitted for review.');
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Document upload failed');
    } finally {
      setSaving(false);
    }
  }

  async function continueSetup() {
    setSaving(true);
    try {
      await api.post('/platform/onboarding/save-step', { step: 'documents' });
      onNext?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save document step');
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    setSaving(true);
    try {
      await api.post('/platform/onboarding/save-step', { step: 'documents', skipped: true });
      onSkip?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save this step');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Company documents</div>
      <div style={{ fontSize: 13, color: '#90A4C8', marginBottom: 18 }}>
        Submit your GST certificate, company PAN, incorporation certificate, or other business proof for platform review. Files are private and scanned before storage.
      </div>
      <div style={{ padding: 16, border: '1px solid #1E3355', borderRadius: 10, marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: '#90A4C8' }}>DOCUMENT TYPE</label>
        <select value={documentType} onChange={e => setDocumentType(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, background: '#0D1A2D', color: '#E2E8F8', border: '1px solid #1E3355', borderRadius: 7 }}>
          {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'block', width: '100%', color: '#90A4C8', marginBottom: 12 }} />
        <div style={{ fontSize: 11, color: '#5A7090', marginBottom: 12 }}>PDF, JPEG or PNG · maximum 10 MB · malware scanning required</div>
        <button type="button" onClick={upload} disabled={saving || !file} style={{ padding: '9px 16px', background: '#2563EB', color: '#fff', border: 0, borderRadius: 7, opacity: saving || !file ? 0.55 : 1 }}>
          {saving ? 'Please wait…' : 'Upload document'}
        </button>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Submitted documents</div>
      {loading ? <div style={{ color: '#90A4C8', fontSize: 12 }}>Loading…</div> : documents.length === 0
        ? <div style={{ color: '#5A7090', fontSize: 12 }}>No documents submitted yet. You can skip and submit them later.</div>
        : <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {documents.map(doc => <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 10, background: '#0A1628', border: '1px solid #1E3355', borderRadius: 7 }}>
              <div><div style={{ fontSize: 12, fontWeight: 600 }}>{doc.file_name}</div><div style={{ fontSize: 10, color: '#90A4C8' }}>{TYPES.find(([v]) => v === doc.document_type)?.[1] || doc.document_type}</div></div>
              <span style={{ fontSize: 10, color: doc.status === 'approved' ? '#22C55E' : doc.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>{doc.status.replaceAll('_', ' ')}</span>
            </div>)}
          </div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="button" onClick={continueSetup} disabled={saving} style={{ padding: '10px 18px', background: '#2563EB', color: '#fff', border: 0, borderRadius: 7 }}>Continue</button>
        <button type="button" onClick={skip} disabled={saving} style={{ padding: '10px 18px', background: 'transparent', color: '#90A4C8', border: '1px solid #1E3355', borderRadius: 7 }}>Skip for now</button>
      </div>
    </div>
  );
}
