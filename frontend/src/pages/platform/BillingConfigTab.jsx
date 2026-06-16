import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import F from '../../services/api'; // Your axios instance
import { toast } from 'react-hot-toast';

const formatPaise = (paise) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

const BillingConfigTab = ({ tenantId }) => {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState(null);
  const [preview, setPreview] = useState(null);
  const [modules, setModules] = useState([]);

  // 1. Fetch current config
  const { data: remoteData, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscription', tenantId],
    queryFn: () => F.get(`/platform/admin/subscription/${tenantId}`).then(res => res.data),
  });

  const { data: invoiceHistory } = useQuery({
    queryKey: ['admin-invoices', tenantId],
    queryFn: () => F.get(`/platform/admin/subscription/${tenantId}/invoices`).then(res => res.data),
  });

  const { data: moduleData } = useQuery({
    queryKey: ['admin-tenant-modules', tenantId],
    queryFn: () => F.get(`/platform/admin/tenants/${tenantId}/modules`).then(res => res.data),
  });

  useEffect(() => {
    if (remoteData?.config) {
      setLocalConfig(remoteData.config);
      setPreview(remoteData.currentBillingPreview);
    }
  }, [remoteData]);

  useEffect(() => {
    if (moduleData?.modules) {
      setModules(moduleData.modules);
    }
  }, [moduleData]);

  // 2. Live Preview Mutation (debounced in a real app, but for now immediate)
  const previewMutation = useMutation({
    mutationFn: (config) => F.post('/platform/preview', {
      config,
      activeModules: remoteData.activeModules,
      employeeCount: remoteData.employeeCount
    }).then(res => res.data),
    onSuccess: (data) => setPreview(data)
  });

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (config) => {
      await F.patch(`/platform/admin/subscription/${tenantId}`, config);
      await F.put(`/platform/admin/tenants/${tenantId}/modules`, { modules });
    },
    onSuccess: () => {
      toast.success('Billing configuration updated');
      queryClient.invalidateQueries(['admin-subscription', tenantId]);
      refetch();
    }
  });

  const handleChange = (field, value) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    previewMutation.mutate(updated);
  };

  const handleModuleToggle = (index, field, value) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
    
    // Update preview with new active module list
    const activeModuleNames = updated.filter(m => m.isActive).map(m => ({
      module_name: m.name,
      custom_price_paise: m.customPricePaise
    }));
    previewMutation.mutate(localConfig, activeModuleNames);
  };

  const handlePayment = async (inv) => {
    try {
      const { data: orderData } = await F.post(`/platform/invoices/${inv.id}/pay`).then(res => res.data);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.companyName,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        handler: async (response) => {
          try {
            await F.post(`/platform/invoices/${inv.id}/verify`, {
              ...response,
              invoiceId: inv.id
            });
            toast.success('Payment successful!');
            queryClient.invalidateQueries(['admin-invoices', tenantId]);
          } catch (e) {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#2563EB' },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => { new window.Razorpay(options).open(); };
        document.head.appendChild(script);
      }
    } catch (err) {
      toast.error('Failed to initiate payment');
    }
  };

  if (isLoading || !localConfig) return <div className="p-10 text-center text-gray-400">Loading billing engine...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Module Management Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            🧩 Module Management & Custom Pricing
          </h3>
          <div className="space-y-3">
            {modules.map((mod, idx) => (
              <div key={mod.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={mod.isActive} 
                    onChange={(e) => handleModuleToggle(idx, 'isActive', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-gray-700 capitalize">{mod.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Custom Price (Paise)</label>
                  <input 
                    type="number"
                    placeholder="Default"
                    value={mod.customPricePaise || ''}
                    onChange={(e) => handleModuleToggle(idx, 'customPricePaise', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            ⚙️ Base Plan & Capacity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Base Price (Paise)</label>
              <input 
                type="number" 
                value={localConfig.base_price_paise} 
                onChange={(e) => handleChange('base_price_paise', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">₹1,499 = 149900 paise</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Employee Cap</label>
              <input 
                type="number" 
                value={localConfig.employee_cap || ''} 
                placeholder="Unlimited"
                onChange={(e) => handleChange('employee_cap', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎁 Discounts & Offers
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Base Plan Discount (%)</label>
              <input 
                type="range" min="0" max="100" 
                value={localConfig.discount_base_pct} 
                onChange={(e) => handleChange('discount_base_pct', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-blue-600 font-bold">
                <span>0%</span> <span>{localConfig.discount_base_pct}%</span> <span>100%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bundle Discount (%)</label>
                <input 
                  type="number" 
                  value={localConfig.discount_bundle_pct} 
                  onChange={(e) => handleChange('discount_bundle_pct', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bundle Trigger (Modules)</label>
                <input 
                  type="number" 
                  value={localConfig.bundle_trigger_count} 
                  onChange={(e) => handleChange('bundle_trigger_count', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input 
                type="checkbox" 
                checked={localConfig.is_stackable} 
                onChange={(e) => handleChange('is_stackable', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Allow stacking of Bundle + Tenure discounts</span>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button 
            onClick={() => saveMutation.mutate(localConfig)}
            disabled={saveMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            {saveMutation.isPending ? 'Saving...' : 'Apply Billing Changes'}
          </button>
        </div>
      </div>

      {/* Preview Column */}
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl sticky top-20">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Estimated Monthly Invoice</h3>
          
          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Base Plan</span>
              <span>{formatPaise(preview?.breakDown?.base?.original)}</span>
            </div>
            {preview?.breakDown?.base?.discount > 0 && (
              <div className="flex justify-between text-xs text-green-400">
                <span>Base Discount ({preview.breakDown.base.discount}%)</span>
                <span>-{formatPaise(preview.breakDown.base.original - preview.breakDown.base.final)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Modules ({preview?.breakDown?.modules?.list?.length})</span>
              <span>{formatPaise(preview?.breakDown?.modules?.total)}</span>
            </div>
            {preview?.breakDown?.discounts?.amount > 0 && (
              <div className="flex justify-between text-xs text-green-400">
                <span>Global Savings ({preview.breakDown.discounts.percentage}%)</span>
                <span>-{formatPaise(preview.breakDown.discounts.amount)}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Total Payable</p>
              <p className="text-3xl font-black text-blue-400">{formatPaise(preview?.finalPrice)}</p>
            </div>
            <div className="text-right text-[10px] text-gray-500">
              <p>Current Headcount: {remoteData.employeeCount}</p>
              <p>Currency: INR</p>
            </div>
          </div>
        </div>
        
        <p className="text-[11px] text-gray-500 px-2 italic">
          * Estimates based on current active modules. Final invoice may vary based on exact billing date and taxes.
        </p>
      </div>

      {/* Invoice History Section */}
      <div className="lg:col-span-3">
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">📄 Invoice History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceHistory?.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">{inv.invoice_no}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold">{formatPaise(inv.total_paise)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {inv.status === 'unpaid' && (
                        <button 
                          onClick={() => handlePayment(inv)}
                          className="text-indigo-600 font-bold hover:underline"
                        >
                          Pay Now
                        </button>
                      )}
                      <button className="text-blue-600 font-bold hover:underline">View PDF</button>
                    </td>
                  </tr>
                ))}
                {(!invoiceHistory || invoiceHistory.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-gray-400 italic">No invoices generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BillingConfigTab;

