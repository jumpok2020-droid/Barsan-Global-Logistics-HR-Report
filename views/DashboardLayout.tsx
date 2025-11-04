import React from 'react';
import { Employee } from '../types';
import { LogoutIcon } from '../components/icons';
import { LeaveData } from '../hooks/useLeaveData';
import ThemeSwitcher from '../components/ThemeSwitcher';

interface DashboardLayoutProps {
  currentUser: Employee;
  onLogout: () => void;
  children: React.ReactNode;
  leaveData: LeaveData;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentUser, onLogout, children, leaveData }) => {
  const department = leaveData.getDepartmentById(currentUser.departmentId);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Leave Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {currentUser.name} ({currentUser.role})</p>
            {department && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Department: {department.name}</p>}
            {currentUser.upToDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data as of: {currentUser.upToDate}</p>}
          </div>
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;