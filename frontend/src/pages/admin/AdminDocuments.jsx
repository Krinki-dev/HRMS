import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import '../admin/AdminLayout.css';

const LABELS = {
  gst_certificate: 'GST certificate',
  pan_card: 'PAN card',
  incorporation_certificate: 'Incorporation certificate',
  address_proof: 'Address proof',
  bank_proof: 'Bank proof',
  other: 'Other',
};
const NEXT = [
  { value: 'under_review', label: 'Mark under review' },
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
  { value: 'resubmission_required', label: 'Request resubmission' },
];

function prettyDate(value) {
  return value ? new Date(value).toLocaleString('en-IN') : '—';
}

export default function AdminDocuments() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-company-document-review-queue'],
    queryFn: adminApi.getCompanyDocumentReviewQueue,
    refetchInterval: 60_000,
  });
  // API responses use the standard { success, data } envelope. Accept both
  // enveloped and legacy direct arrays so the queue does not silently appear empty.
  const queuePayload = data?.data ?? data;
  const queue = Array.isArray(queuePayload) ? queuePayload : queuePayload?.documents || [];
  const history = useQuery({
    queryKey: ['admin-company-document-reviews', selected?.id],
    queryFn: () => adminApi.getCompanyDocumentReviews(selected.id),
    enabled: !!selected?.id,
  });
  const historyPayload = history.data?.data ?? history.data;
  const reviewHistory = Array.isArray(historyPayload) ? historyPayload : historyPayload?.reviews || [];

  const review = useMutation({
    mutationFn: ({ id, status, reviewerNote }) => adminApi.reviewCompanyDocument(id, { status, reviewerNote }),
    onSuccess: () => {
      toast.success('Document review saved');
      setSelected(null);
      setNote('');
      qc.invalidateQueries({ queryKey: ['admin-company-document-review-queue'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save review'),
  });

  async function openDocument(document) {
    try {
      const result = await adminApi.getCompanyDocumentReviewDownload(document.id);
      const url = result?.url || result?.data?.url;
      if (!url) throw new Error('No secure download link was returned');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not open document');
    }
  }

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>Company document review</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--admin-text-soft)', fontSize: 12 }}>Review submitted KYC and company documents. Secure links expire after five minutes.</p>
        </div>
        <button className="btn-sm" onClick={() => refetch()} disabled={isFetching}>↻ Refresh</button>
      </div>

      <div className="card">
        <div className="admin-table-scroll">
          <table className="data-table">
            <thead><tr><th>Company</th><th>Document</th><th>Submitted</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="admin-empty-state">Loading review queue…</td></tr>}
              {isError && <tr><td colSpan={5} className="admin-empty-state">Could not load the review queue. Check platform-admin access and try again.</td></tr>}
              {!isLoading && !isError && queue.length === 0 && <tr><td colSpan={5} className="admin-empty-state">No company documents are waiting for review.</td></tr>}
              {queue.map((doc) => (
                <tr key={doc.id}>
                  <td><div style={{ fontWeight: 600 }}>{doc.company_name || 'Company'}</div><div style={{ color: 'var(--admin-text-soft)', fontSize: 11 }}>{doc.subdomain || ''}</div></td>
                  <td><div>{LABELS[doc.document_type] || doc.document_type}</div><div style={{ color: 'var(--admin-text-soft)', fontSize: 11 }}>{doc.file_name} · {doc.mime_type}</div></td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{prettyDate(doc.created_at)}</td>
                  <td><span className="admin-pill admin-pill--accent">{String(doc.status || '').replaceAll('_', ' ')}</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-sm" onClick={() => openDocument(doc)}>View file</button>{' '}
                    <button className="btn-sm" onClick={() => { setSelected(doc); setNote(''); }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer"><span>{queue.length} pending document(s) · maximum 200 shown</span></div>
      </div>

      {selected && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="document-review-title" style={{ width: 560, maxWidth: '96vw' }}>
            <h3 id="document-review-title" style={{ marginTop: 0 }}>Review {LABELS[selected.document_type] || 'document'}</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-soft)' }}>{selected.company_name} · {selected.file_name}</p>
            <button className="btn-sm" onClick={() => openDocument(selected)}>Open secure document</button>
            <div style={{ marginTop: 18 }}>
              <label className="form-label" htmlFor="review-note">Reviewer note (optional, max 2,000 characters)</label>
              <textarea id="review-note" className="form-input" rows={4} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain the decision or what needs correction…" />
            </div>
            <div style={{ marginTop: 16, borderTop: '1px solid var(--admin-border)', paddingTop: 12 }}>
              <strong style={{ fontSize: 12 }}>Review history</strong>
              {history.isLoading && <p style={{ fontSize: 12 }}>Loading history…</p>}
              {history.isError && <p style={{ fontSize: 12 }}>Could not load review history.</p>}
              {reviewHistory.map((entry) => (
                <div key={entry.id} style={{ padding: '7px 0', borderBottom: '1px solid var(--admin-border)', fontSize: 11 }}>
                  <strong>{String(entry.from_status || 'new').replaceAll('_', ' ')} → {String(entry.to_status).replaceAll('_', ' ')}</strong>
                  <div style={{ color: 'var(--admin-text-soft)' }}>{prettyDate(entry.created_at)} · {entry.reviewer_note || 'No note'}</div>
                </div>
              ))}
              {!history.isLoading && !history.isError && reviewHistory.length === 0 && <p style={{ fontSize: 11, color: 'var(--admin-text-soft)' }}>No prior review actions.</p>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn-sm" onClick={() => setSelected(null)} disabled={review.isPending}>Close</button>
              {NEXT.filter((action) => {
                if (selected.status === 'submitted') return true;
                if (selected.status === 'under_review') return action.value !== 'under_review';
                return ['rejected', 'resubmission_required'].includes(selected.status) && action.value === 'under_review';
              }).map((action) => (
                <button key={action.value} className="btn-sm" disabled={review.isPending} onClick={() => review.mutate({ id: selected.id, status: action.value, reviewerNote: note })}>
                  {review.isPending ? 'Saving…' : action.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
