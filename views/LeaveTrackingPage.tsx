import React, { useState, useMemo } from 'react';
import useLeaveTrackingData from '../hooks/useLeaveTrackingData';
import { EmployeeLeaveSummary } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from '../components/icons';
import LeaveProgress from '../components/LeaveProgress';

type SortKey = 'annualRemaining' | 'businessRemaining' | 'sickRemaining';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const LeaveInfoCell: React.FC<{
    used: number;
    quota: number;
    remaining: number;
    color: string;
    isSorted: boolean;
}> = ({ used, quota, remaining, color, isSorted }) => {
    return (
        <td className={`px-4 py-3 align-top transition-colors ${isSorted ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
             <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Used: {used} of {quota}</span>
                <span className={`font-bold text-lg ${isSorted ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>
                    {remaining}
                </span>
            </div>
            <LeaveProgress used={used} quota={quota} color={color} />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">Days Remaining</div>
        </td>
    );
};

interface LeaveTrackingPageProps {
    apiFilter?: { department?: string };
    title?: string;
}

const LeaveTrackingPage: React.FC<LeaveTrackingPageProps> = ({ apiFilter, title }) => {
    const { summaryData, isLoading, error } = useLeaveTrackingData(apiFilter);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'annualRemaining', direction: 'ascending' });

    const filteredData = useMemo(() => {
        // Department filtering is now done by the API via apiFilter.
        // We only need to filter by the search term on the client side.
        if (!searchTerm) {
            return summaryData;
        }
        return summaryData.filter(employee =>
            employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [summaryData, searchTerm]);

    const sortedData = useMemo(() => {
        if (sortConfig.key) {
            return [...filteredData].sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                }
                
                return 0;
            });
        }
        return filteredData;
    }, [filteredData, sortConfig]);
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="ml-4 text-lg">Loading Employee Data...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>;
    }

    const handleSort = (key: SortKey) => {
        const isCurrentKey = sortConfig.key === key;
        const newDirection = isCurrentKey && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        setSortConfig({ key, direction: newDirection });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{title || 'Employee Leave Tracking Report'}</h2>
            
            {/* Controls */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl sticky top-24 z-30 shadow-sm">
                 <input
                    type="text"
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto max-w-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-primary focus:border-primary"
                    aria-label="Search employees"
                />
            </div>
            
            {/* Employee Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:text-gray-300 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-center w-16">ลำดับ</th>
                            <th scope="col" className="px-6 py-3">Employee Name</th>
                            {[
                                { label: 'Annual Leave (พักร้อน)', key: 'annualRemaining' },
                                { label: 'Business Leave (ลากิจ)', key: 'businessRemaining' },
                                { label: 'Sick Leave (ลาป่วย)', key: 'sickRemaining' }
                            ].map(({ label, key }) => {
                                const sortKey = key as SortKey;
                                const isActive = sortConfig.key === sortKey;
                                const direction = isActive ? sortConfig.direction : 'descending';
                                return (
                                    <th 
                                        key={key} 
                                        scope="col" 
                                        onClick={() => handleSort(sortKey)} 
                                        className={`px-4 py-3 cursor-pointer select-none transition-colors ${isActive ? 'text-primary' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        <div className="flex items-center">
                                            <span>{label}</span>
                                            {isActive && (
                                                <span className="ml-2">
                                                    {direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((emp) => (
                            <tr key={emp.employeeId} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                                <td className="px-4 py-4 text-center font-medium text-gray-900 dark:text-white">{emp.employeeId}</td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{emp.employeeName}</th>
                                
                                <LeaveInfoCell
                                    used={emp.annualUsed}
                                    quota={emp.annualQuota}
                                    remaining={emp.annualRemaining}
                                    color="bg-blue-500"
                                    isSorted={sortConfig.key === 'annualRemaining'}
                                />
                                <LeaveInfoCell
                                    used={emp.businessUsed}
                                    quota={emp.businessQuota}
                                    remaining={emp.businessRemaining}
                                    color="bg-purple-500"
                                    isSorted={sortConfig.key === 'businessRemaining'}
                                />
                                <LeaveInfoCell
                                    used={emp.sickUsed}
                                    quota={emp.sickQuota}
                                    remaining={emp.sickRemaining}
                                    color="bg-red-500"
                                    isSorted={sortConfig.key === 'sickRemaining'}
                                />
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedData.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Employees Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            No employees found matching your search criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveTrackingPage;