import React from 'react';

const TrialBanner = ({ plan, expiresAt }) => {
  if (plan !== 'trial' || !expiresAt) return null;

  const daysLeft = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return null;

  return (
    <div className={`p-3 rounded-lg flex items-center justify-between mb-4 ${daysLeft < 15 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">⏳</span>
        <div>
          <p className="text-xs font-bold text-gray-800">{daysLeft} days left in trial</p>
          <p className="text-[10px] text-gray-500">Upgrade soon to avoid service interruption.</p>
        </div>
      </div>
      <button className="text-[10px] bg-gray-900 text-white px-2 py-1 rounded font-bold uppercase">Upgrade</button>
    </div>
  );
};

export default TrialBanner;

