import { Employee, LeaveRequest, Holiday, Department, LeaveStatus, UserRole } from '../types';
import { eachDayOfInterval, format } from 'date-fns';

export interface DailyCoverage {
  date: string;
  working: { id: number; name: string; department: string; }[];
  onLeave: { id: number; name: string; department: string; leaveType: string; start: string; end: string; status: LeaveStatus; }[];
  holidays: { name: string; }[];
  totalWorking: number;
  totalOnLeave: number;
}

export interface OrgCoverageData {
  [date: string]: DailyCoverage;
}

/**
 * Simulates fetching and processing organization-wide leave and working data for a given date range.
 * This would be an API endpoint in a real application.
 * @param startDate - The start of the date range.
 * @param endDate - The end of the date range.
 * @param allEmployees - A list of all employees.
 * @param allLeaveRequests - A list of all leave requests.
 * @param allHolidays - A list of all holidays.
 * @param allDepartments - A list of all departments.
 * @param perspectiveOf - The employee for whom the data is being fetched, to determine visibility.
 * @returns An object mapping date strings to detailed daily coverage data.
 */
export const fetchCoverageByDateRange = (
  startDate: Date,
  endDate: Date,
  allEmployees: Employee[],
  allLeaveRequests: LeaveRequest[],
  allHolidays: Holiday[],
  allDepartments: Department[],
  perspectiveOf: Employee
): OrgCoverageData => {
  const coverageData: OrgCoverageData = {};
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  const activeEmployees = allEmployees.filter(e => e.status === 'Active');
  const departmentMap = new Map(allDepartments.map(d => [d.id, d.name]));

  const teamMemberIds = perspectiveOf.role === UserRole.MANAGER 
    ? new Set(allEmployees.filter(e => e.managerId === perspectiveOf.id).map(e => e.id))
    : new Set();

  dateRange.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd');

    const holidayOnDay = allHolidays.filter(h => h.date === dayStr);
    const onLeaveEmployees = new Set<number>();
    
    const onLeaveDetails = allLeaveRequests
      .filter(req => {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        reqStart.setHours(0,0,0,0);
        reqEnd.setHours(0,0,0,0);
        day.setHours(0,0,0,0);
        return day >= reqStart && day <= reqEnd;
      })
      .map(req => {
        const employee = allEmployees.find(e => e.id === req.employeeId);
        if (!employee) return null;

        // Visibility Rules
        const canView = 
          perspectiveOf.role === UserRole.HR_ADMIN || // HR can see everything
          req.employeeId === perspectiveOf.id || // Users can see their own requests
          (perspectiveOf.role === UserRole.MANAGER && teamMemberIds.has(req.employeeId)) || // Managers see their team's requests
          req.status === LeaveStatus.APPROVED; // Everyone can see approved leaves
        
        if (!canView) return null;

        if (req.status === LeaveStatus.APPROVED) {
            onLeaveEmployees.add(req.employeeId);
        }

        return {
          id: employee.id,
          name: employee.name,
          department: departmentMap.get(employee.departmentId) || 'Unknown',
          leaveType: req.type,
          start: req.startDate,
          end: req.endDate,
          status: req.status,
        };
      })
      .filter(Boolean) as DailyCoverage['onLeave'];
      
    const workingEmployees = activeEmployees
      .filter(emp => !onLeaveEmployees.has(emp.id))
      .map(emp => ({
        id: emp.id,
        name: emp.name,
        department: departmentMap.get(emp.departmentId) || 'Unknown',
      }));

    coverageData[dayStr] = {
      date: dayStr,
      working: workingEmployees,
      onLeave: onLeaveDetails,
      holidays: holidayOnDay.map(h => ({ name: h.name })),
      totalWorking: workingEmployees.length,
      totalOnLeave: onLeaveEmployees.size,
    };
  });

  return coverageData;
};