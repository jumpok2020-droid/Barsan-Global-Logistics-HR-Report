import React from 'react';
import LeaveProgress from './LeaveProgress';

interface LeaveQuotaCardProps {
  title: string;
  used: number;
  quota: number;
  color: string;
}

const LeaveQuotaCard: React.FC<LeaveQuotaCardProps> = ({ title, used, quota, color }) => {
  const remaining = quota - used;

  // Make sure we don't display negative numbers if data is inconsistent
  const displayUsed = Math.max(0, used);
  const displayRemaining = Math.max(0, remaining);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md transition-all space-y-3">
        <h3 className="text-sm font-bold uppercase text-primary tracking-wider">{title}</h3>
        <div className="animate-fade-in">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-gray-500 dark:text-gray-400">Used: {displayUsed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 1})} of {quota.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 1})}</span>
            <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">{displayRemaining.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 1})}</span>
          </div>
          <div className="mt-1">
            <LeaveProgress used={displayUsed} quota={quota} color={color} />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">Days Remaining</div>
          </div>
        </div>
    </div>
  );
};

export default LeaveQuotaCard;
