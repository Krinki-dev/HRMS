import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const automationApi = {
  start:       (empId)        => api.post(`/automation/aadhaar/${empId}/start`).then(r => r.data),
  getTask:     (taskId)       => api.get(`/automation/task/${taskId}`).then(r => r.data),
  submitCaptcha: (taskId, captcha) =>
    api.post(`/automation/task/${taskId}/captcha`, { captcha }).then(r => r.data),
  submitOtp:   (taskId, otp)  =>
    api.post(`/automation/task/${taskId}/otp`, { otp }).then(r => r.data),
  cancel:      (taskId)       =>
    api.post(`/automation/task/${taskId}/cancel`).then(r => r.data),
};

const POLL_MS = 2500;

function StepLog({ logs }) {
  if (!logs?.length) return null;
  return (
    <div className="mt-3 space-y-1 max-h-36 overflow-y-auto">
      {logs.map((l, i) => (
        <div key={i} className={`flex items-start gap-2 text-xs ${
          l.status === 'failed' ? 'text-red-600' : 'text-gray-500'
        }`}>
          <span className="flex-shrink-0 mt-0.5">
            {l.status === 'failed' ? '✗' : l.status === 'success' ? '✓' : '○'}
          </span>
          <span>{l.description}</span>
        </div>
      ))}
    </div>
  );
}

export default function AadhaarKycModal({ employeeId, empName, open, onClose, onVerified }) {

  const [taskId,      setTaskId]      = useState(null);
  const [taskStatus,  setTaskStatus]  = useState('idle');
  const [taskData,    setTaskData]    = useState(null);
  const [captcha,     setCaptcha]     = useState('');
  const [otp,         setOtp]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const pollRef = useRef(null);
  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const pollTask = useCallback(async (id) => {
    if (!id) return;
    try {
      const res  = await automationApi.getTask(id);
      const task = res?.data;
      if (!task) return;
      setTaskData(task);
      setTaskStatus(task.status);
      
      if (['completed', 'failed', 'cancelled'].includes(task.status)) {
        stopPoll();
        if (task.status === 'completed' && onVerified) {
          onVerified(task.resultData);
        }
      }
    } catch (e) {
      console.warn('[AadhaarKyc] poll error:', e.message);
    }
  }, [onVerified]);

  useEffect(() => {
    if (!taskId) return;
    stopPoll();
    pollTask(taskId); 
    pollRef.current = setInterval(() => pollTask(taskId), POLL_MS);
    return stopPoll;
  }, [taskId, pollTask]);

  useEffect(() => {
    if (!open) {
      stopPoll();
      setTaskId(null);
      setTaskStatus('idle');
      setTaskData(null);
      setCaptcha('');
      setOtp('');
      setSubmitting(false);
    }
  }, [open]);

  const startMutation = useMutation({
    mutationFn: () => automationApi.start(employeeId),
    onSuccess: (res) => {
      const tid = res?.data?.taskId;
      if (!tid) { toast.error('Failed to create task — no task ID returned'); return; }
      setTaskId(tid);
      setTaskStatus('running');
      if (res?.data?.alreadyRunning) {
        toast('Resuming existing verification task', { icon: '🔄' });
      }
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Failed to start verification');
    },
  });

  async function handleCaptchaSubmit() {
    if (!captcha.trim()) { toast.error('Enter the captcha text'); return; }
    setSubmitting(true);
    try {
      await automationApi.submitCaptcha(taskId, captcha.trim());
      setCaptcha('');
      setTaskStatus('running');
      toast.success('Captcha submitted — OTP will be sent to employee mobile');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit captcha');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit() {
    if (!/^\d{6}$/.test(otp.trim())) { toast.error('OTP must be exactly 6 digits'); return; }
    setSubmitting(true);
    try {
      await automationApi.submitOtp(taskId, otp.trim());
      setOtp('');
      setTaskStatus('running');
      toast.success('OTP submitted — verifying with UIDAI');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (taskId) {
      try {
        await automationApi.cancel(taskId);
      } catch (error) {
        // Ignore cancellation errors
      }
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔐</span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Aadhaar KYC Verification</h3>
              <p className="text-xs text-gray-500">{empName || 'Employee'}</p>
            </div>
          </div>
          <button onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            ✕
          </button>
        </div>

        {}
        <div className="px-6 py-5">

          {}
          {taskStatus === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                🪪
              </div>
              <div>
                <p className="font-semibold text-gray-800">Verify via UIDAI Portal</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Our system will open the official UIDAI Resident Portal, enter the
                  Aadhaar number, and guide you through captcha + OTP verification.
                  The employee must have access to their registered mobile number.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left space-y-1">
                <p className="font-semibold">Before you begin:</p>
                <p>• The employee must be reachable on their Aadhaar-registered mobile</p>
                <p>• Have the captcha ready — it expires in ~5 minutes</p>
                <p>• OTP expires in 10 minutes</p>
              </div>
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {startMutation.isPending && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                )}
                {startMutation.isPending ? 'Starting…' : 'Start Verification →'}
              </button>
            </div>
          )}

          {}
          {taskStatus === 'running' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Verification in progress…</p>
                  <p className="text-xs text-gray-500">Browser automation running on server</p>
                </div>
              </div>
              <StepLog logs={taskData?.logs} />
              <button onClick={handleCancel}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                Cancel
              </button>
            </div>
          )}

          {}
          {taskStatus === 'captcha_required' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="text-lg">🖼</span> Enter the captcha
              </div>
              <p className="text-xs text-gray-500">
                The UIDAI portal is showing this captcha. Type the characters you see below.
              </p>

              {}
              {taskData?.captchaImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center bg-gray-50">
                  <img
                    src={taskData.captchaImage}
                    alt="UIDAI captcha"
                    className="max-h-24 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                  Loading captcha image…
                </div>
              )}

              <input
                type="text"
                value={captcha}
                onChange={e => setCaptcha(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCaptchaSubmit()}
                placeholder="Type captcha text here"
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-center font-mono tracking-widest outline-none focus:ring-2 focus:ring-blue-400"
              />

              <StepLog logs={taskData?.logs} />

              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleCaptchaSubmit}
                  disabled={submitting || !captcha.trim()}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
                  {submitting ? 'Submitting…' : 'Submit Captcha →'}
                </button>
              </div>
            </div>
          )}

          {}
          {taskStatus === 'otp_required' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="text-lg">📱</span> Enter OTP from employee&apos;s phone
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">UIDAI has sent an OTP</p>
                <p>An OTP has been sent to the mobile number registered with this Aadhaar.</p>
                <p>Ask the employee for the 6-digit code.</p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleOtpSubmit()}
                placeholder="6-digit OTP"
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg text-center font-mono tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-400"
              />

              <StepLog logs={taskData?.logs} />

              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleOtpSubmit}
                  disabled={submitting || otp.length !== 6}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
                  {submitting ? 'Verifying…' : 'Verify OTP →'}
                </button>
              </div>
            </div>
          )}

          {/* COMPLETED */}
          {taskStatus === 'completed' && (
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Aadhaar Verified!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Verified via UIDAI on {taskData?.completedAt
                    ? new Date(taskData.completedAt).toLocaleString('en-IN') : 'just now'}
                </p>
              </div>
              {taskData?.resultData && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2 text-sm">
                  {taskData.resultData.ageBand && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age Band</span>
                      <span className="font-medium">{taskData.resultData.ageBand}</span>
                    </div>
                  )}
                  {taskData.resultData.gender && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender</span>
                      <span className="font-medium capitalize">{taskData.resultData.gender}</span>
                    </div>
                  )}
                  {taskData.resultData.state && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">State on Aadhaar</span>
                      <span className="font-medium">{taskData.resultData.state}</span>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700"
              >
                Done
              </button>
            </div>
          )}

          {/* FAILED */}
          {taskStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="text-5xl">❌</div>
              <div>
                <p className="font-bold text-gray-800">Verification Failed</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {taskData?.errorMessage || 'An error occurred during verification.'}
                </p>
              </div>
              <StepLog logs={taskData?.logs} />
              <div className="flex gap-2">
                <button onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50">
                  Close
                </button>
                <button
                  onClick={() => { setTaskId(null); setTaskStatus('idle'); setTaskData(null); }}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* CANCELLED */}
          {taskStatus === 'cancelled' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">🚫</div>
              <p className="text-sm text-gray-600">Verification was cancelled.</p>
              <button onClick={onClose}
                className="w-full border border-gray-300 text-gray-600 rounded-xl py-2 text-sm">
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

