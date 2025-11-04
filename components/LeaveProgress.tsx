import React from 'react';

interface LeaveProgressProps {
  used: number;
  quota: number;
  color: string;
}

const LeaveProgress: React.FC<LeaveProgressProps> = ({ used, quota, color }) => {
  const percentage = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;

  return (
    <div 
        className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={quota}
        title={`Used ${used} of ${quota} days`}
    >
      <div 
        className={`${color} h-2 rounded-full transition-all duration-500 ease-out`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default LeaveProgress;
