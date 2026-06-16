import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import F from '../../services/api';
import { toast } from 'react-hot-toast';

const formatPaise = (paise) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

const SubscriptionPage = () => {
  const queryClient = useQueryClient();
  const { data: subData, isLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => F.get('/platform/subscribe/my-subscription').then(res => res.data.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: () => F.get('/platform/subscribe/my-invoices').then(res => res.data.data),
  });

  const handlePay = async (invoiceId, method = 'jiopay') => {
    try {
      let endpoint = `/platform/subscribe/invoices/${invoiceId}/pay-jiopay`;
      if (method === 'phonepe') endpoint = `/platform/subscribe/invoices/${invoiceId}/pay-phonepe`;
      if (method === 'razorpay') endpoint = `/platform/subscribe/invoices/${invoiceId}/pay`;

      const { data: payData } = await F.post(endpoint).then(res => res.data.data);

      if (payData.redirectUrl) {
        window.location.href = payData.redirectUrl;
      } else if (payData.orderId) {
        // Handle Razorpay Modal specifically if needed
        toast.success('Redirecting to Razorpay...');
      }

    } catch (e) {
      toast.error('Payment initiation failed');
    }
  };

  if (isLoading) return <div className="p-8">Loading subscription...</div>;

  const handleBankFileDownload = (runId) => {
    window.open(`${import.meta.env.VITE_API_URL}/payroll/runs/${runId}/bank-file`, '_blank');
  };

  const handleDirectPayout = async (runId, employees) => {
    try {
      const res = await F.post('/payroll/payouts/initiate', { runId, employees });
      if (res.data.success) {
        toast.success("Payout process started! Tracking ID: " + res.data.data.batchId);
      }
    } catch (e) {
      toast.error("Payout initiation failed.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Existing Plan Info */}
      
      <section className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Salary Disbursement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl hover:border-blue-500 cursor-pointer transition-all" onClick={() => handleBankFileDownload(subData.currentRunId)}>
            <p className="text-xl mb-2">📁</p>
            <p className="font-bold text-gray-800">Manual Bank File</p>
            <p className="text-xs text-gray-500 mt-1">Download a CSV formatted for NEFT/RTGS bulk upload on your corporate banking portal.</p>
            <p className="text-blue-600 text-xs font-bold mt-3">Download CSV →</p>
          </div>
          
          <div className="p-4 border rounded-xl bg-indigo-50 border-indigo-100 hover:border-indigo-400 cursor-pointer transition-all" onClick={() => handleDirectPayout(subData.currentRunId, subData.employees)}>
            <p className="text-xl mb-2">⚡</p>
            <p className="font-bold text-indigo-900">Direct Payouts</p>
            <p className="text-xs text-indigo-700 mt-1">Distribute salaries instantly using RazorpayX or PhonePe Payouts. (Requires linked account)</p>
            <p className="text-indigo-600 text-xs font-bold mt-3">Initiate Transfer →</p>
          </div>
        </div>
      </section>
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plan</h1>
          <p className="text-gray-500">Current Plan: <span className="text-blue-600 font-bold uppercase">{subData.config.billing_cycle}</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Next Renewal</p>
          <p className="font-bold text-gray-800">{new Date(subData.config.offer_expiry_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Plan Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Base Fee</span><span>{formatPaise(subData.currentBillingPreview.breakDown.base.final)}</span></div>
            <div className="flex justify-between"><span>Employee Headcount</span><span>{subData.employeeCount}</span></div>
            <div className="flex justify-between"><span>Add-on Modules</span><span>{subData.activeModules.length}</span></div>
          </div>
        </div>

        <div className="bg-blue-600 rounded-xl p-5 text-white shadow-lg">
          <h3 className="text-sm font-bold text-blue-200 uppercase mb-4">Estimated Total</h3>
          <p className="text-4xl font-black">{formatPaise(subData.currentBillingPreview.finalPrice)}</p>
          <p className="text-xs text-blue-100 mt-2">Billed {subData.config.billing_cycle}</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Invoice History</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-400 uppercase text-[10px] font-bold">
              <th className="py-3">Invoice #</th>
              <th className="py-3">Period</th>
              <th className="py-3">Amount</th>
              <th className="py-3">Status</th>
              <th className="py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-mono">{inv.invoice_no}</td>
                <td className="py-3 text-gray-500">{new Date(inv.period_start).toLocaleDateString()}</td>
                <td className="py-3 font-bold">{formatPaise(inv.total_paise)}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {inv.status === 'unpaid' && (
                    <div className="flex flex-col items-end gap-1 mr-4">
                      <button onClick={() => handlePay(inv.id, 'jiopay')} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-blue-700">
                        Pay with JioPay (Best)
                      </button>
                      <button onClick={() => handlePay(inv.id, 'phonepe')} className="text-[10px] text-purple-600 font-medium hover:underline">
                        via PhonePe
                      </button>
                      <button onClick={() => handlePay(inv.id, 'razorpay')} className="text-[10px] text-gray-500 font-medium hover:underline">
                        via Razorpay
                      </button>
                    </div>
                  )}
                  <a href={`${import.meta.env.VITE_API_URL}/platform/subscribe/admin/subscription/${subData.config.tenant_id}/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-blue-600">PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default SubscriptionPage;

