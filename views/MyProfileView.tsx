import React, { useMemo } from 'react';
import { Employee, LeaveType } from '../types';
import { LeaveData } from '../hooks/useLeaveData';
import LeaveQuotaCard from '../components/LeaveQuotaCard';
import useLeaveTrackingData from '../hooks/useLeaveTrackingData';

interface MyProfileViewProps {
  currentUser: Employee;
  leaveData: LeaveData;
}

const MyProfileView: React.FC<MyProfileViewProps> = ({ currentUser, leaveData }) => {
  const { getDepartmentById, getEmployeeById } = leaveData;
  const { summaryData, isLoading: isTrackingLoading, error: trackingError } = useLeaveTrackingData();
  
  const userLeaveSummary = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return null;
    return summaryData.find(summary => summary.employeeName.toLowerCase() === currentUser.name.toLowerCase());
  }, [summaryData, currentUser.name]);

  const department = getDepartmentById(currentUser.departmentId);

  const approvingManagerName = useMemo(() => {
    // Priority 1: Use manager email from the fetched summary data (most up-to-date)
    if (userLeaveSummary?.managerEmail) {
      const email = userLeaveSummary.managerEmail.toLowerCase().trim();
      const managerByEmail = leaveData.employees.find(e => e.email.toLowerCase() === email);
      
      if (managerByEmail) {
        return managerByEmail.name;
      }
      
      if (email.includes('@')) {
        const namePart = email.split('@')[0];
        return namePart.split('.').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');
      }
      
      return userLeaveSummary.managerEmail; 
    }

    // Priority 2: Fallback to manager email from login data
    if (currentUser.managerEmail) {
      const email = currentUser.managerEmail.toLowerCase().trim();
      const managerByEmail = leaveData.employees.find(e => e.email.toLowerCase() === email);
      if (managerByEmail) {
        return managerByEmail.name;
      }
      if (email.includes('@')) {
        const namePart = email.split('@')[0];
        return namePart.split('.').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');
      }
      return currentUser.managerEmail;
    }

    // Priority 3: Fallback to the original logic using managerId
    const managerById = currentUser.managerId ? getEmployeeById(currentUser.managerId) : null;
    if (managerById) {
      return managerById.name;
    }

    // Default fallback
    return 'N/A';
  }, [userLeaveSummary, currentUser, getEmployeeById, leaveData.employees]);

  const renderQuotaCards = () => {
    if (isTrackingLoading) {
      return (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-300">Loading Quota Data...</p>
        </div>
      );
    }

    if (trackingError) {
      return <div className="p-4 text-center text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg">{trackingError}</div>;
    }

    if (userLeaveSummary) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LeaveQuotaCard
            title="ANNUAL LEAVE (พักร้อน)"
            used={userLeaveSummary.annualUsed}
            quota={userLeaveSummary.annualQuota}
            color="bg-blue-500"
          />
          <LeaveQuotaCard
            title="BUSINESS LEAVE (ลากิจ)"
            used={userLeaveSummary.businessUsed}
            quota={userLeaveSummary.businessQuota}
            color="bg-purple-500"
          />
          <LeaveQuotaCard
            title="SICK LEAVE (ลาป่วย)"
            used={userLeaveSummary.sickUsed}
            quota={userLeaveSummary.sickQuota}
            color="bg-red-500"
          />
        </div>
      );
    }
    
    return (
        <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-semibold">Leave Quota Data Not Available</p>
            <p className="text-sm mt-1">Your detailed leave information could not be found in the tracking report.</p>
       </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">My Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 border-b dark:border-gray-700 pb-8">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="font-semibold text-lg">{currentUser.name}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="font-semibold text-lg">{currentUser.email}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                    <p className="font-semibold text-lg">{department?.name || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Approving Manager</p>
                    <p className="font-semibold text-lg">{approvingManagerName}</p>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">My Leave Quotas</h3>
            {renderQuotaCards()}
        </div>
    </div>
  );
};

export default MyProfileView;