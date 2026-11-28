import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email,     setEmail]     = useState(searchParams.get('email') || '');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tenantChoices, setTenantChoices] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [companyChoices, setCompanyChoices] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      let tenantId = selectedTenantId || null;
      if (!tenantId) {
        const lookupResponse = await api.post('/auth/lookup', { email: email.toLowerCase().trim() });
        const lookup = lookupResponse.data?.data ?? lookupResponse.data;
        const choices = Array.isArray(lookup?.choices) && lookup.choices.length
          ? lookup.choices
          : (lookup?.tenantId ? [lookup] : []);

        if (choices.length > 1) {
          setTenantChoices(choices);
          toast('This email belongs to multiple workspaces. Select the correct workspace to continue.');
          return;
        }
        if (choices.length === 1) tenantId = choices[0].tenantId;
      }

      const companyLookupResponse = await api.post('/auth/lookup-companies', {
        email: email.toLowerCase().trim(),
        tenantId,
      });
      const companyLookup = companyLookupResponse.data?.data ?? companyLookupResponse.data;
      const availableCompanies = Array.isArray(companyLookup?.choices) ? companyLookup.choices : [];
      let companyId = selectedCompanyId || null;

      if (companyId && !availableCompanies.some((choice) => choice.companyId === companyId)) {
        companyId = null;
        setSelectedCompanyId('');
      }
      if (!companyId && availableCompanies.length > 1) {
        setCompanyChoices(availableCompanies);
        toast('This email belongs to more than one company in this workspace. Select the correct company.');
        return;
      }
      if (!companyId && availableCompanies.length === 1) {
        companyId = availableCompanies[0].companyId;
      }

      await api.post('/auth/forgot-password', {
        email: email.toLowerCase().trim(),
        tenantId,
        companyId,
      });
      setSubmitted(true);
    } catch {
      // Keep the same confirmation state to avoid disclosing whether an
      // account or workspace exists.
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <p className="text-gray-700 text-sm">
              If that email exists, a reset link has been sent.
              <br />Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="text-primary text-sm hover:underline block">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setTenantChoices([]); setSelectedTenantId(''); setCompanyChoices([]); setSelectedCompanyId(''); }}
                disabled={loading || !!searchParams.get('email')} // Disable if loading or pre-filled from URL
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" // The disabled attribute is already handled above
              />
            </div>
            {tenantChoices.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Workspace</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => { setSelectedTenantId(e.target.value); setCompanyChoices([]); setSelectedCompanyId(''); }}
                  disabled={loading}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select your workspace</option>
                  {tenantChoices.map((choice) => (
                    <option key={choice.tenantId} value={choice.tenantId}>
                      {choice.companyName || choice.subdomain || 'Company workspace'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {companyChoices.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Company</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select your company</option>
                  {companyChoices.map((choice) => (
                    <option key={choice.companyId} value={choice.companyId}>
                      {choice.companyName || 'Company'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-primary">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
