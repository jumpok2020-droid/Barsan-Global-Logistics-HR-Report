import React, { useMemo, useState } from 'react';
import { Employee, LeaveRequest, LeaveStatus, Department, EmployeeStatus } from '../types';
import { LeaveData } from '../hooks/useLeaveData';
import DashboardLayout from './DashboardLayout';
import Calendar from '../components/Calendar';
import { eachDayOfInterval, format, addDays } from 'date-fns';
import { PlusCircleIcon } from '../components/icons';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { OrgCoverageData } from '../services/leaveService';
import PendingApprovalsList from '../components/PendingApprovalsList';
import MyProfileView from './MyProfileView';

interface ManagerDashboardProps {
  currentUser: Employee;
  leaveData: LeaveData;
  onLogout: () => void;
}

const CoverageIndicator: React.FC<{ coverage: number; total: number }> = ({ coverage, total }) => {
    const percentage = total > 0 ? (coverage / total) * 100 : 0;
    let colorClass = 'bg-green-500';
    // Using a threshold of being equal to min staff as yellow
    if (percentage < 80) colorClass = 'bg-yellow-500';
    if (percentage < 60) colorClass = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ currentUser, leaveData, onLogout }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('myProfile');

  const teamMembers = leaveData.getTeamMembers(currentUser.id);
  const teamMemberIds = useMemo(() => teamMembers.map(tm => tm.id), [teamMembers]);
  const department = leaveData.getDepartmentById(currentUser.departmentId) as Department;

  const departmentEmployees = useMemo(() => 
    leaveData.employees.filter(e => e.departmentId === department.id && e.status === EmployeeStatus.ACTIVE),
    [leaveData.employees, department.id]
  );
  
  const orgCoverage: OrgCoverageData = useMemo(() =>
    leaveData.generateOrgCoverage(currentUser),
    [leaveData, currentUser]
  );

  const pendingRequests = leaveData.leaveRequests.filter(
    req => teamMemberIds.includes(req.employeeId) && req.status === LeaveStatus.PENDING
  ).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSubmitRequest = (request: Omit<LeaveRequest, 'id'|'createdAt'|'status'|'duration'>) => {
    const success = leaveData.submitLeaveRequest(request);
    if(success) {
      alert("Leave request submitted successfully!");
    }
  };

  const handleApprove = (requestId: number) => {
    leaveData.updateRequestStatus(requestId, LeaveStatus.APPROVED, currentUser.id);
  };

  const handleReject = (requestId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      leaveData.updateRequestStatus(requestId, LeaveStatus.REJECTED, currentUser.id, reason);
    }
  };
  
  const checkStaffingImpact = (request: LeaveRequest) => {
    const days = eachDayOfInterval({start: new Date(request.startDate), end: new Date(request.endDate)});
    for(const day of days) {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayCoverage = orgCoverage[dayStr];
        if (dayCoverage) {
            const teamOnLeave = dayCoverage.onLeave.filter(l => 
                l.status === LeaveStatus.APPROVED &&
                departmentEmployees.some(de => de.id === l.id)
            ).length;
            const teamWorking = departmentEmployees.length - teamOnLeave;
            if ((teamWorking - 1) < department.minStaffPerDay) {
                 return true; // Returns true if it causes a staffing issue
            }
        }
    }
    return false;
  }

  const dailyCoverage = useMemo(() => {
    const today = new Date();
    const next7Days = eachDayOfInterval({ start: today, end: addDays(today, 6) });

    return next7Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = orgCoverage[dayStr];
        const deptOnLeave = dayData ? dayData.onLeave.filter(l => 
            l.status === LeaveStatus.APPROVED && departmentEmployees.some(de => de.id === l.id)
        ).length : 0;
        const working = departmentEmployees.length - deptOnLeave;

        return {
            date: dayStr,
            totalStaff: departmentEmployees.length,
            working,
            isBelowThreshold: working < department.minStaffPerDay,
            minStaffPerDay: department.minStaffPerDay,
        };
    });
  }, [orgCoverage, department.minStaffPerDay, departmentEmployees]);
  
  const SectionHeader: React.FC<{title: string}> = ({title}) => (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-300 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-gray-100 dark:bg-gray-900 pr-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</span>
      </div>
    </div>
  );

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Manager Console: {department.name}</h2>
              <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                <PlusCircleIcon className="w-6 h-6" />
                <span>Request Leave</span>
            </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <TabButton label="My Profile" isActive={activeTab === 'myProfile'} onClick={() => setActiveTab('myProfile')} />
                <TabButton label="Manager Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} />
            </nav>
        </div>

        {activeTab === 'console' && (
          <div className="space-y-8 animate-fade-in">
              <SectionHeader title="Pending Approvals" />
              <PendingApprovalsList 
                  requests={pendingRequests}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  getEmployeeById={leaveData.getEmployeeById}
                  checkStaffingImpact={checkStaffingImpact}
              />

              <SectionHeader title="Team Calendar & Coverage" />
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Department Coverage (Next 7 Days)</h3>
                  <div className="overflow-x-auto pb-4">
                      <div className="flex space-x-4">
                          {dailyCoverage.map(dayData => (
                              <div key={dayData.date} className="flex-shrink-0 w-60 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <p className="font-bold text-center mb-3 text-gray-700 dark:text-gray-200">{format(new Date(dayData.date), 'EEE, MMM d')}</p>
                                  <div className={`p-3 rounded-md ${dayData.isBelowThreshold ? 'bg-red-100 dark:bg-red-900/40' : 'bg-gray-100 dark:bg-gray-600/30'}`}>
                                      <div className="flex justify-between items-center text-sm mb-2">
                                          <span className="font-semibold">{department.name}</span>
                                          <span className={`font-bold ${dayData.isBelowThreshold ? 'text-red-600 dark:text-red-300' : 'text-gray-600 dark:text-gray-300'}`}>{dayData.working} / {dayData.totalStaff}</span>
                                      </div>
                                      <CoverageIndicator coverage={dayData.working} total={dayData.totalStaff} />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min: {dayData.minStaffPerDay}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              
              <Calendar
                  orgCoverage={orgCoverage}
              />
          </div>
        )}

        {activeTab === 'myProfile' && (
          <MyProfileView currentUser={currentUser} leaveData={leaveData} />
        )}

      </div>
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

export default ManagerDashboard;