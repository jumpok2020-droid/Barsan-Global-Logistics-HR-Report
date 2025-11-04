
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtext?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color = 'bg-blue-500', subtext }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center justify-between transition-transform transform hover:scale-105">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full text-white ${color}`}>
        {icon}
      </div>
    </div>
  );
};

export default DashboardCard;