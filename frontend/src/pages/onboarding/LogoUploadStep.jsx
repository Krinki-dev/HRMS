import React, { useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LogoUploadStep({ onNext, onSkip }) {
  const { companyName, updateCompanyBrand } = useAuthStore();
  const [logoUrl, setLogoUrl]       = useState('');
  const [preview, setPreview]       = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  // ---- Upload file to backend (Supabase Storage via /assets/upload-logo) ----
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 2 * 1024 * 1024)   { setError('Logo must be under 2 MB.'); return; }
    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/assets/upload-logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(res.data?.url || '');
    } catch (err) {
      setError('Upload failed. You can paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  // ---- Save logo URL to tenant record ----
  const handleSave = async () => {
    if (!logoUrl.trim()) { onNext(); return; }
    setSaving(true);
    try {
      await api.post('/platform/onboarding/save-step', {
        step: 'branding',
        data: { logoUrl: logoUrl.trim() },
      });
      updateCompanyBrand(logoUrl.trim(), companyName);
      onNext();
    } catch (err) {
      setError('Could not save logo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (companyName || 'C')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('');

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Company Logo</h2>
      <p style={{ color: '#6b7280', marginBottom: 28 }}>
        Upload your company logo to personalise the HRMS dashboard and login page.
        You can skip this step and add it later from Settings.
      </p>

      {/* Preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 12,
          background: (preview || logoUrl) ? '#f3f4f6' : '#4f46e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', border: '2px dashed #d1d5db',
        }}>
          {(preview || logoUrl) ? (
            <img src={preview || logoUrl} alt="logo preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 24 }}>{initials}</span>
          )}
        </div>
        <div>
          <label style={{
            display: 'inline-block', padding: '8px 18px', background: '#4f46e5',
            color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}>
            {uploading ? 'Uploading...' : 'Choose Image'}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={handleFileChange} disabled={uploading} />
          </label>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>PNG, JPG, SVG (max 2 MB)</p>
        </div>
      </div>

      {/* URL input fallback */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600,
          color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Or paste image URL
        </label>
        <input
          type="url"
          placeholder="https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => { setLogoUrl(e.target.value); if (e.target.value) setPreview(null); }}
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
            borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button onClick={handleSave} disabled={saving}
          style={{
            flex: 1, padding: '11px 0', background: '#4f46e5', color: '#fff',
            borderRadius: 8, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer',
          }}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
        <button onClick={onSkip}
          style={{
            padding: '11px 22px', background: 'transparent', color: '#6b7280',
            borderRadius: 8, fontWeight: 500, fontSize: 15, border: '1px solid #d1d5db',
            cursor: 'pointer',
          }}>
          Skip
        </button>
      </div>
    </div>
  );
}
