import React, { useState, useEffect } from 'react';
import { LeaveType, Employee, Holiday } from '../types';
import { LeaveData } from '../hooks/useLeaveData';

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: any) => void;
  currentUser: Employee;
  leaveData: LeaveData;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ isOpen, onClose, onSubmit, currentUser, leaveData }) => {
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const manager = currentUser.managerId ? leaveData.getEmployeeById(currentUser.managerId) : null;

  useEffect(() => {
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      try {
        const calculatedDuration = leaveData.calculateDuration(startDate, endDate);
        setDuration(calculatedDuration);
        if (currentUser.quota[leaveType] < calculatedDuration) {
          setError(`Insufficient quota. Required: ${calculatedDuration}, Available: ${currentUser.quota[leaveType]}`);
        } else {
          setError('');
        }
      } catch (e) {
        setDuration(0);
        setError('Invalid date range.');
      }
    } else {
      setDuration(0);
      setError('');
    }
  }, [startDate, endDate, leaveType, currentUser.quota, leaveData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error || duration <= 0) {
      alert(`Please fix the errors before submitting: ${error || "Duration must be at least 1 day."}`);
      return;
    }

    onSubmit({
      employeeId: currentUser.id,
      type: leaveType,
      startDate,
      endDate,
      reason,
      attachment,
    });
    onClose();
    // Reset form
    setLeaveType(LeaveType.ANNUAL);
    setStartDate('');
    setEndDate('');
    setReason('');
    setAttachment(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setAttachment(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Request Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Leave Type</label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value as LeaveType)}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              {Object.values(LeaveType).map(type => (
                <option key={type} value={type}>{type} (Remaining: {currentUser.quota[type]})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                required
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          {duration > 0 && <p className="text-sm text-gray-600 dark:text-gray-300">Calculated Duration: {duration} day(s)</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
           {manager && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-300 dark:border-blue-600 rounded-r-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                Your request will be sent to <span className="font-semibold">{manager.name}</span> for approval.
                </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment (Optional)</label>
            <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-gray-700 file:text-primary dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-gray-600"/>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!!error || duration <= 0}>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestForm;