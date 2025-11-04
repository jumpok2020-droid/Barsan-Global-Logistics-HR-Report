import React, { useState, useMemo } from 'react';
import { Employee, LeaveRequest, LeaveStatus } from '../types';
import { LeaveData } from '../hooks/useLeaveData';
import DashboardLayout from './DashboardLayout';
import Calendar from '../components/Calendar';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { PlusCircleIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../components/icons';
import { format } from 'date-fns';
import { OrgCoverageData } from '../services/leaveService';
import MyProfileView from './MyProfileView';

interface EmployeeDashboardProps {
  currentUser: Employee;
  leaveData: LeaveData;
  onLogout: () => void;
}

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center space-x-1";
    switch (status) {
        case LeaveStatus.APPROVED:
            return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}><CheckCircleIcon className="w-3 h-3"/><span>Approved</span></span>;
        case LeaveStatus.PENDING:
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`}><ClockIcon className="w-3 h-3"/><span>Pending</span></span>;
        case LeaveStatus.REJECTED:
            return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}><XCircleIcon className="w-3 h-3"/><span>Rejected</span></span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ currentUser, leaveData, onLogout }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('myProfile');
  const myRequests = leaveData.leaveRequests.filter(req => req.employeeId === currentUser.id);

  const orgCoverage: OrgCoverageData = useMemo(() => 
    leaveData.generateOrgCoverage(currentUser),
    [leaveData, currentUser]
  );
  
  const myCoverage: OrgCoverageData = useMemo(() => {
    const newCoverage: OrgCoverageData = {};
    const myDeptName = leaveData.getDepartmentById(currentUser.departmentId)?.name || 'Unknown';

    for (const date in orgCoverage) {
        const dayData = orgCoverage[date];
        if (!dayData) continue;

        const myLeaveEvents = dayData.onLeave.filter(event => event.id === currentUser.id);
        const onApprovedLeave = myLeaveEvents.some(event => event.status === LeaveStatus.APPROVED);

        // A personal calendar has a population of 1 (the user).
        const totalOnLeave = onApprovedLeave ? 1 : 0;
        const totalWorking = 1 - totalOnLeave;

        const working = onApprovedLeave ? [] : [{
            id: currentUser.id,
            name: currentUser.name,
            department: myDeptName
        }];
        
        newCoverage[date] = {
            ...dayData,
            onLeave: myLeaveEvents,
            working: working,
            totalWorking,
            totalOnLeave,
        };
    }
    return newCoverage;
  }, [orgCoverage, currentUser, leaveData]);


  const handleSubmitRequest = (request: Omit<LeaveRequest, 'id'|'createdAt'|'status'|'duration'>) => {
    const success = leaveData.submitLeaveRequest(request);
    if(success) {
      alert("Leave request submitted successfully!");
    }
  };

  const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void;}> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
        isActive
          ? 'border-b-2 border-primary text-primary font-semibold'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 border-b-2 border-transparent'
      }`}
    >
      {label}
    </button>
  );

  return (
    <DashboardLayout currentUser={currentUser} onLogout={onLogout} leaveData={leaveData}>
      {leaveData.isLoading ? (
        <div className="flex justify-center items-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Dashboard</h2>
                <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>Request Leave</span>
                </button>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <TabButton label="My Profile" isActive={activeTab === 'myProfile'} onClick={() => setActiveTab('myProfile')} />
                    <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                </nav>
            </div>

            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                {/* Leave History & Calendar */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">My Leave Requests</h2>
                    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                    {myRequests.length > 0 ? myRequests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(req => (
                        <div key={req.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex justify-between items-start">
                            <div>
                            <p className="font-semibold">{req.type} Leave</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {format(new Date(req.startDate), 'MMM d, yyyy, h:mm a')} to {format(new Date(req.endDate), 'MMM d, yyyy, h:mm a')}
                            </p>
                            </div>
                            <StatusBadge status={req.status} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">"{req.reason}"</p>
                        </div>
                    )) : <p className="text-gray-500 dark:text-gray-400">No requests found.</p>}
                    </div>
                </div>
                <div className="xl:col-span-2">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">My Calendar</h2>
                    <Calendar
                    orgCoverage={myCoverage}
                    />
                </div>
                </div>
              </div>
            )}
            
            {activeTab === 'myProfile' && (
                <MyProfileView currentUser={currentUser} leaveData={leaveData} />
            )}
        </div>
      )}
      <LeaveRequestForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitRequest}
        currentUser={currentUser}
        leaveData={leaveData}
      />
    </DashboardLayout>
  );
};

export default EmployeeDashboard;