import { useState } from 'react';
import api from '../services/api';

const GstLookup = ({ onCompanyDataFetched, disabled = false }) => {
  const [gstin,   setGstin]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [source,  setSource]  = useState('');

  const validateGSTIN = (gst) => {
    const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;
    return regex.test(gst.toUpperCase());
  };

  const handleLookup = async () => {
    setError('');
    setSource('');
    const clean = gstin.trim().toUpperCase().replace(/\s/g, '');
    if (!validateGSTIN(clean)) {
      setError('Invalid GST format. Example: 27AABCU9603R1ZX');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/automation/gst/search', { gstin: clean });
      const d   = res.data?.data || {};
      setSource(res.data?.saved ? 'saved' : 'live');
      
      onCompanyDataFetched({
        gstin,
        companyName:            d.company_name || d.legalname || d.tradename || '',
        legalName:              d.legalname    || '',
        tradeName:              d.tradename    || '',
        pan:                    d.pan          || '',
        gstStatus:              d.status       || '',
        gstRegDate:             d.regdate      || '',
        taxpayerType:           d.type         || '',
        constitutionOfBusiness: d.constitutionofbusiness || '',
        state:                  d.state        || '',
        stateCode:              d.state_code   || '',
        pincode:                d.pincode      || '',
        district:               d.district     || '',
        address: [d.flat_no, d.street, d.district, d.state, d.pincode]
          .filter(Boolean).join(', '),
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch GST details. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            GSTIN
          </label>
          <input
            type="text"
            value={gstin}
            maxLength={15}
            disabled={disabled}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleLookup()}
            placeholder="e.g. 27AABCU9603R1ZX"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
          {error  && <p className="text-red-500 text-xs mt-1">{error}</p>}
          {source && (
            <p className={`text-xs mt-1 ${source === 'saved' ? 'text-green-600' : 'text-blue-600'}`}>
              {source === 'saved' ? '✓ Loaded from cache' : '✓ Fetched live from GST portal'}
            </p>
          )}
        </div>
        <button
          onClick={handleLookup}
          disabled={loading || !gstin || disabled}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
        >
          {loading ? 'Fetching…' : 'Fetch Details'}
        </button>
      </div>
    </div>
  );
};

export default GstLookup;
