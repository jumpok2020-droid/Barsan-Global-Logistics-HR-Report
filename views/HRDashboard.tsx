import React, { useMemo, useState } from 'react';
import { Employee, Department, LeaveStatus, UserRole, EmployeeStatus, LeaveRequest } from '../types';
import { LeaveData } from '../hooks/useLeaveData';
import DashboardLayout from './DashboardLayout';
import Calendar from '../components/Calendar';
import { eachDayOfInterval, format, addDays } from 'date-fns';
import { PlusCircleIcon } from '../components/icons';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { OrgCoverageData } from '../services/leaveService';
import LeaveTrackingPage from './LeaveTrackingPage';
import MyProfileView from './MyProfileView';
import PendingApprovalsList from '../components/PendingApprovalsList';

interface HRDashboardProps {
  currentUser: Employee;
  leaveData: LeaveData;
  onLogout: () => void;
}

const CoverageIndicator: React.FC<{ coverage: number }> = ({ coverage }) => {
    let colorClass = 'bg-green-500';
    if (coverage < 0.75) colorClass = 'bg-yellow-500';
    if (coverage < 0.5) colorClass = 'bg-red-500';
    return <div className={`w-full h-2.5 rounded-full ${colorClass}`} style={{ width: `${Math.max(coverage * 100, 5)}%` }} />;
};

const AddEmployeeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (employeeData: Omit<Employee, 'id'>) => void;
    departments: Department[];
}> = ({ isOpen, onClose, onAdd, departments }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [departmentId, setDepartmentId] = useState<number>(departments[0]?.id || 0);
    const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const department = departments.find(d => d.id === departmentId);
        onAdd({
            name,
            email,
            // FIX: Add default password for new employee to satisfy Employee type.
            password: 'password',
            departmentId,
            role,
            managerId: role === UserRole.MANAGER ? null : department?.managerId || null,
            status: EmployeeStatus.ACTIVE,
            quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 } // Default quota
        });
        onClose();
        // Reset form
        setName('');
        setEmail('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Add New Employee</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form fields for name, email, department, role */}
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700" />
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700" />
                    <select value={departmentId} onChange={e => setDepartmentId(Number(e.target.value))} className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">Add Employee</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HRDashboard: React.FC<HRDashboardProps> = ({ currentUser, leaveData, onLogout }) => {
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('myProfile'); // 'overview', 'tracking', or 'myProfile'
    
    const orgCoverage: OrgCoverageData = useMemo(() =>
        leaveData.generateOrgCoverage(currentUser),
        [leaveData, currentUser]
    );

    const handleSubmitRequest = (request: Omit<LeaveRequest, 'id'|'createdAt'|'status'|'duration'>) => {
        const success = leaveData.submitLeaveRequest(request);
        if(success) {
          alert("Leave request submitted successfully!");
        }
    };

    const dailyCoverage = useMemo(() => {
        const today = new Date();
        const next7Days = eachDayOfInterval({start: today, end: addDays(today, 6)});
        return next7Days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayData = orgCoverage[dayStr];

            const departmentCoverage = leaveData.departments.map(dept => {
                const deptEmployees = leaveData.employees.filter(e => e.departmentId === dept.id && e.status === EmployeeStatus.ACTIVE);
                const onLeaveCount = dayData ? dayData.onLeave.filter(l => l.status === LeaveStatus.APPROVED && l.department === dept.name).length : 0;
                const working = deptEmployees.length - onLeaveCount;
                return {
                    ...dept,
                    totalStaff: deptEmployees.length,
                    onLeave: onLeaveCount,
                    working,
                    isBelowThreshold: working < dept.minStaffPerDay
                };
            });
            return {
                date: dayStr,
                departments: departmentCoverage
            };
        });
    }, [orgCoverage, leaveData.departments, leaveData.employees]);
    
    const handleRoleChange = (employeeId: number, newRole: UserRole) => {
        leaveData.updateEmployeeRole(employeeId, newRole, currentUser.id);
    };

    const handleStatusChange = (employee: Employee) => {
        const newStatus = employee.status === EmployeeStatus.ACTIVE ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE;
        if (window.confirm(`Are you sure you want to set ${employee.name}'s status to ${newStatus}?`)) {
            leaveData.updateEmployeeStatus(employee.id, newStatus, currentUser.id);
        }
    };

    const allPendingRequests = useMemo(() =>
        leaveData.leaveRequests
            .filter(req => req.status === LeaveStatus.PENDING)
            .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        [leaveData.leaveRequests]
    );

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
        const employee = leaveData.getEmployeeById(request.employeeId);
        if (!employee) return false;

        const department = leaveData.getDepartmentById(employee.departmentId);
        if (!department) return false;
        
        const departmentEmployees = leaveData.employees.filter(e => e.departmentId === department.id && e.status === EmployeeStatus.ACTIVE);

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
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">HR Admin Dashboard</h2>
                    <button onClick={() => setIsLeaveFormOpen(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <PlusCircleIcon className="w-6 h-6" />
                        <span>Request My Leave</span>
                    </button>
                </div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton label="My Profile" isActive={activeTab === 'myProfile'} onClick={() => setActiveTab('myProfile')} />
                        <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Tracking Report" isActive={activeTab === 'tracking'} onClick={() => setActiveTab('tracking')} />
                    </nav>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Pending Approvals ({allPendingRequests.length})</h3>
                            <PendingApprovalsList
                                requests={allPendingRequests}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                getEmployeeById={leaveData.getEmployeeById}
                                checkStaffingImpact={checkStaffingImpact}
                            />
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Department Coverage (Next 7 Days)</h3>
                            <div className="overflow-x-auto">
                                <div className="flex space-x-6">
                                    {dailyCoverage.map(dayData => (
                                        <div key={dayData.date} className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <p className="font-bold text-center mb-4 text-gray-600 dark:text-gray-300">{format(new Date(dayData.date), 'EEE, MMM d')}</p>
                                            <div className="space-y-4">
                                                {dayData.departments.map(dept => (
                                                    <div key={dept.id} className={`p-3 rounded-md ${dept.isBelowThreshold ? 'bg-red-100 dark:bg-red-900/40' : 'bg-gray-100 dark:bg-gray-600/30'}`}>
                                                        <div className="flex justify-between items-center text-sm mb-1">
                                                            <span className="font-semibold">{dept.name}</span>
                                                            <span className={`font-bold ${dept.isBelowThreshold ? 'text-red-600 dark:text-red-300' : 'text-gray-600 dark:text-gray-300'}`}>{dept.working} / {dept.totalStaff}</span>
                                                        </div>
                                                        <CoverageIndicator coverage={dept.totalStaff > 0 ? dept.working / dept.totalStaff : 1} />
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min: {dept.minStaffPerDay}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                            <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                                 <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Employee Management</h3>
                                    <button onClick={() => setIsAddEmployeeModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-700">
                                        <PlusCircleIcon className="w-5 h-5" />
                                        <span>Add Employee</span>
                                    </button>
                                </div>
                                <div className="max-h-[50vh] overflow-auto">
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">Name</th>
                                                <th scope="col" className="px-6 py-3">Role</th>
                                                <th scope="col" className="px-6 py-3">Status</th>
                                                <th scope="col" className="px-6 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaveData.employees.map(emp => (
                                                <tr key={emp.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                                                    <td className="px-6 py-4">
                                                        <select value={emp.role} onChange={e => handleRoleChange(emp.id, e.target.value as UserRole)} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2">
                                                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 font-semibold text-xs rounded-full ${emp.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{emp.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => handleStatusChange(emp)} className={`text-xs px-3 py-1 rounded-md ${emp.status === EmployeeStatus.ACTIVE ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'}`}>{emp.status === EmployeeStatus.ACTIVE ? 'Deactivate' : 'Activate'}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Audit Log</h3>
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                    {leaveData.auditLogs.length > 0 ? leaveData.auditLogs.map(log => {
                                        const actor = leaveData.getEmployeeById(log.actorId);
                                        return (
                                            <div key={log.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border-l-4 border-gray-300 dark:border-gray-500">
                                                <p className="font-semibold text-gray-700 dark:text-gray-200">{actor?.name || 'System'} <span className="font-normal text-gray-500 dark:text-gray-400">performed action:</span> {log.action}</p>
                                                <p className="text-gray-600 dark:text-gray-300">{log.details}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                        );
                                    }) : <p className="text-gray-500 dark:text-gray-400">No administrative actions recorded yet.</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Organization-Wide Leave Calendar</h3>
                             <Calendar
                                orgCoverage={orgCoverage}
                             />
                        </div>
                    </div>
                )}

                {activeTab === 'tracking' && (
                    <div className="animate-fade-in">
                        <LeaveTrackingPage />
                    </div>
                )}

                {activeTab === 'myProfile' && (
                    <MyProfileView currentUser={currentUser} leaveData={leaveData} />
                )}
            </div>
            <AddEmployeeModal isOpen={isAddEmployeeModalOpen} onClose={() => setIsAddEmployeeModalOpen(false)} onAdd={(data) => leaveData.addEmployee(data, currentUser.id)} departments={leaveData.departments} />
            <LeaveRequestForm 
              isOpen={isLeaveFormOpen}
              onClose={() => setIsLeaveFormOpen(false)}
              onSubmit={handleSubmitRequest}
              currentUser={currentUser}
              leaveData={leaveData}
            />
        </DashboardLayout>
    );
};

export default HRDashboard;