import React from 'react';
import { format } from 'date-fns';
import { LeaveRequest, LeaveStatus, Employee } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from './icons';

interface PendingApprovalsListProps {
  requests: LeaveRequest[];
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
  getEmployeeById: (id: number) => Employee | undefined;
  checkStaffingImpact: (request: LeaveRequest) => boolean;
}

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center space-x-1";
    switch (status) {
        case LeaveStatus.PENDING:
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`}><ClockIcon className="w-3 h-3"/><span>Pending</span></span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
}


const PendingApprovalsList: React.FC<PendingApprovalsListProps> = ({
  requests,
  onApprove,
  onReject,
  getEmployeeById,
  checkStaffingImpact
}) => {
  if (requests.length === 0) {
    return (
        <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-300">No Pending Approvals</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your approval queue is all clear.</p>
        </div>
    );
  }

  return (
    <div className="flex space-x-4 p-4 -m-4 overflow-x-auto">
      {requests.map(req => {
        const employee = getEmployeeById(req.employeeId);
        const staffingImpact = checkStaffingImpact(req);

        return (
          <div key={req.id} className={`flex-shrink-0 w-80 p-4 rounded-xl shadow-lg border-t-4 transition-colors ${staffingImpact ? 'bg-red-50 dark:bg-gray-800 border-red-400' : 'bg-white dark:bg-gray-800 border-primary'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{employee?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{employee ? getEmployeeById(employee.departmentId)?.name : 'Unknown Dept'}</p>
              </div>
              <StatusBadge status={req.status} />
            </div>
            <div className="mt-3">
              <p className="font-semibold text-gray-700 dark:text-gray-200">{req.type} Leave <span className="font-normal text-gray-500 dark:text-gray-400">({req.duration} days)</span></p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(req.startDate), 'MMM d, h:mm a')} &rarr; {format(new Date(req.endDate), 'h:mm a')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">"{req.reason}"</p>
            </div>
            {staffingImpact && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded-md">
                Warning: Approval impacts minimum staffing.
              </p>
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => onReject(req.id)}
                className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(req.id)}
                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PendingApprovalsList;