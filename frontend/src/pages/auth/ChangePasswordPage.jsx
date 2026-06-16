import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { validators } from '../../utils/validators';

function StrengthMeter({ password }) {
  const checks = [
    { label: 'At least 8 characters',    ok: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)',    ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)',    ok: /[a-z]/.test(password) },
    { label: 'Number (0–9)',              ok: /[0-9]/.test(password) },
    { label: 'Special character (!@#$)',  ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor =
    score <= 1 ? 'bg-red-400' :
    score <= 2 ? 'bg-orange-400' :
    score <= 3 ? 'bg-yellow-400' :
    score === 4 ? 'bg-blue-400' : 'bg-green-500';
  const strengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? barColor : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score >= 5 ? 'text-green-600' : score >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
        Strength: {strengthLabel}
      </p>
      <div className="grid grid-cols-2 gap-y-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            <span className={`text-xs ${c.ok ? 'text-green-500' : 'text-gray-300'}`}>{c.ok ? '✓' : '○'}</span>
            <span className={`text-xs ${c.ok ? 'text-gray-700' : 'text-gray-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function ChangePasswordPage() {
  const navigate                   = useNavigate();
  const { user, clearFirstLogin }  = useAuthStore();
  const isFirstLogin               = user?.isFirstLogin === true;

  const [current,   setCurrent]   = useState('');
  const [newPass,   setNewPass]   = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showCurr,  setShowCurr]  = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [errors,    setErrors]    = useState({});

  const mutation = useMutation({
    mutationFn: (body) => api.post('/auth/change-password', body).then(r => r.data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      if (isFirstLogin) {
        clearFirstLogin(); // clear local store flag — backend already cleared DB flag
        navigate('/dashboard', { replace: true });
      } else {
        navigate(-1);
      }
    },
    onError: (e) => {
      const msg = e.response?.data?.message || '';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
        setErrors(p => ({ ...p, current: 'Current password is incorrect' }));
      } else {
        toast.error(msg || 'Failed to change password. Please try again.');
      }
    },
  });

  function validate() {
    const errs = {};
    if (!current.trim())      errs.current = 'Current password is required';
    const passErr = validators.password ? validators.password(newPass) : (newPass.length < 8 ? 'Min 8 characters' : null);
    if (passErr)              errs.newPass = passErr;
    if (!confirm)             errs.confirm = 'Please confirm your new password';
    else if (newPass !== confirm) errs.confirm = 'Passwords do not match';
    if (newPass && current && newPass === current)
      errs.newPass = 'New password must be different from current password';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({ currentPassword: current, newPassword: newPass });
  }

  // ── Shared form content ────────────────────────────────────────
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Current password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Current Password
          {isFirstLogin && (
            <span className="ml-2 text-xs font-normal text-amber-600">
              (PAN number in lowercase)
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type={showCurr ? 'text' : 'password'}
            value={current}
            onChange={e => { setCurrent(e.target.value); setErrors(p => ({ ...p, current: null })); }}
            placeholder={isFirstLogin ? 'e.g. abcde1234f  (PAN in lowercase)' : 'Enter current password'}
            className={`w-full border rounded-xl px-4 py-2.5 pr-14 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${
              errors.current ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          <button type="button" onClick={() => setShowCurr(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium">
            {showCurr ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.current && <p className="text-xs text-red-600 mt-1">{errors.current}</p>}
      </div>

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPass}
            onChange={e => { setNewPass(e.target.value); setErrors(p => ({ ...p, newPass: null })); }}
            placeholder="Create a strong password"
            className={`w-full border rounded-xl px-4 py-2.5 pr-14 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${
              errors.newPass ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          <button type="button" onClick={() => setShowNew(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium">
            {showNew ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.newPass && <p className="text-xs text-red-600 mt-1">{errors.newPass}</p>}
        <StrengthMeter password={newPass} />
      </div>

      {/* Confirm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: null })); }}
          placeholder="Type new password again"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${
            errors.confirm      ? 'border-red-400 bg-red-50' :
            confirm && confirm === newPass ? 'border-green-400' :
            'border-gray-300'
          }`}
        />
        {errors.confirm
          ? <p className="text-xs text-red-600 mt-1">{errors.confirm}</p>
          : confirm && confirm === newPass
            ? <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
            : null
        }
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {mutation.isPending && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
        )}
        {mutation.isPending ? 'Changing…' : 'Change Password'}
      </button>

      {/* Cancel — only in settings mode */}
      {!isFirstLogin && (
        <button type="button" onClick={() => navigate(-1)}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-1 text-center">
          Cancel
        </button>
      )}
    </form>
  );

  // ── MODE A: First-login — full-screen centred overlay ─────────
  // Renders over the app (sidebar still mounted behind) with a white
  // card in the middle. Uses bg-white/80 backdrop.
  if (isFirstLogin) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
        style={{ background: 'rgba(249,250,251,0.95)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
              🔐
            </div>
            <h1 className="text-xl font-bold text-gray-900">Set Your Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              You must set a new password before using the system.
            </p>
          </div>
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-1">What is my current password?</p>
            <p>Your default password is your <strong>PAN number in lowercase.</strong></p>
            <p className="mt-1 text-amber-600 text-xs">
              Example: PAN is ABCDE1234F → type{' '}
              <code className="font-mono bg-white px-1 rounded">abcde1234f</code>
            </p>
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  // ── MODE B: Settings — card inside app (sidebar visible) ──────
  // Matches the style of other settings pages: white card, no full-screen bg.
  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Change Password</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update your account password</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        {formContent}
      </div>
    </div>
  );
}

