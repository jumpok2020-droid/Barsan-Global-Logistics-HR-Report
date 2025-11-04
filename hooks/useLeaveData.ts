import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  LeaveRequest,
  Employee,
  Department,
  LeaveType,
  LeaveStatus,
  Holiday,
  AuditLog,
  AuditAction,
  UserRole,
  EmployeeStatus,
} from '../types';
import {
  LEAVE_REQUESTS,
  EMPLOYEES,
  DEPARTMENTS,
  HOLIDAYS,
  N8N_MYLEAVE_WEBHOOK,
  N8N_QUOTA_WEBHOOK,
} from '../constants';
// FIX: `differenceInBusinessDays` from date-fns doesn't support a `holidays` option.
// Replaced with `eachDayOfInterval` and `isWeekend` for a manual, correct calculation.
import { addYears, subYears, eachDayOfInterval, isWeekend } from 'date-fns';
import { fetchCoverageByDateRange, OrgCoverageData } from '../services/leaveService';

export interface LeaveQuotaData {
  user: string;
  annualLeave: number;
  businessLeave: number;
  sickLeave: number;
}

const useLeaveData = (currentUser: Employee | null) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [departments] = useState<Department[]>(DEPARTMENTS);
  const [holidays] = useState<Holiday[]>(HOLIDAYS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [leaveQuota, setLeaveQuota] = useState<LeaveQuotaData | null>(null);

  const getEmployeeById = useCallback((id: number) => employees.find(e => e.id === id), [employees]);
  const getDepartmentById = useCallback((id: number) => departments.find(d => d.id === id), [departments]);

  const getTeamMembers = useCallback((managerId: number) => {
    return employees.filter(e => e.managerId === managerId);
  }, [employees]);
  
  const generateOrgCoverage = useCallback((perspectiveOf: Employee): OrgCoverageData => {
    const today = new Date();
    const startDate = subYears(today, 1);
    const endDate = addYears(today, 1);
    return fetchCoverageByDateRange(
        startDate,
        endDate,
        employees,
        leaveRequests,
        holidays,
        departments,
        perspectiveOf
    );
  }, [employees, leaveRequests, holidays, departments]);

  const calculateDuration = useCallback((start: string, end: string) => {
    if (!start || !end) return 0;
    // FIX: Re-implemented duration calculation as `differenceInBusinessDays` does not support holidays option.
    // This implementation iterates through each day in the interval and checks if it's a weekend or a holiday.
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate < startDate) return 0;

    const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    let businessDays = 0;
    for (const day of days) {
      if (!isWeekend(day) && !holidayDates.has(day.toDateString())) {
        businessDays++;
      }
    }
    return businessDays;
  }, [holidays]);

  useEffect(() => {
    const fetchAllData = async () => {
        if (!currentUser) {
            setLeaveRequests([]);
            setLeaveQuota(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const historyUrl = `${N8N_MYLEAVE_WEBHOOK}?email=${encodeURIComponent(currentUser.email)}`;
            const quotaUrl = `${N8N_QUOTA_WEBHOOK}?user=${encodeURIComponent(currentUser.name)}`;

            const [historyResponse, quotaResponse] = await Promise.all([
                fetch(historyUrl),
                fetch(quotaUrl),
            ]);

            // Process history
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                if (historyData.ok && Array.isArray(historyData.leaves)) {
                     const mappedRequests: LeaveRequest[] = historyData.leaves.map((l: any, index: number) => {
                        const startDate = l.StartDate || l.startDate;
                        const endDate = l.EndDate || l.endDate;

                        // The API might return leaves for a manager's team. Try to find the correct employee.
                        const employee = employees.find(e => e.email === l.Email) || employees.find(e => e.name.includes(l.Name));

                        return {
                            id: l.id || Date.now() + index,
                            employeeId: employee ? employee.id : currentUser.id,
                            type: (l.LeaveType || l.type) as LeaveType,
                            startDate,
                            endDate,
                            duration: calculateDuration(startDate, endDate),
                            reason: l.Remark || l.reason || '',
                            status: (l.Status || l.status) as LeaveStatus,
                            createdAt: l.createdAt || new Date(startDate).toISOString(),
                            approverId: l.approverId ? Number(l.approverId) : undefined,
                            approvedAt: l.approvedAt,
                            rejectReason: l.rejectReason,
                        };
                    });
                    setLeaveRequests(mappedRequests);
                } else {
                    setLeaveRequests([]);
                }
            } else {
                console.warn(`Failed to fetch leave history: ${historyResponse.statusText}`);
                setLeaveRequests([]);
            }

            // Process quota
            if (quotaResponse.ok) {
                const quotaData = await quotaResponse.json();
                if (Array.isArray(quotaData) && quotaData.length > 0) {
                    setLeaveQuota(quotaData[0]);
                } else {
                    setLeaveQuota(null);
                }
            } else {
                console.warn(`Failed to fetch leave quota: ${quotaResponse.statusText}`);
                setLeaveQuota(null);
            }

        } catch (error) {
            console.error("Error fetching leave data:", error);
            setLeaveRequests([]);
            setLeaveQuota(null);
        } finally {
            setIsLoading(false);
        }
    };

    fetchAllData();
  }, [currentUser, calculateDuration, employees]);


  const logAction = (actorId: number, action: AuditAction, entityId: number, details: string) => {
    const newLog: AuditLog = {
        id: Date.now() + Math.random(),
        actorId,
        action,
        entityType: 'Employee',
        entityId,
        details,
        timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const submitLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'duration'>) => {
    const duration = calculateDuration(request.startDate, request.endDate);
    const employee = getEmployeeById(request.employeeId);

    if (employee && employee.quota[request.type] < duration) {
        alert("Error: You do not have enough leave quota for this request.");
        return false;
    }

    const newRequest: Omit<LeaveRequest, 'id'> = {
      ...request,
      createdAt: new Date().toISOString(),
      status: LeaveStatus.PENDING,
      duration,
    };
    
    if (employee) {
        const department = getDepartmentById(employee.departmentId);
        const manager = employee.managerId ? getEmployeeById(employee.managerId) : null;
        
        const payload = {
            Id: employee.id,
            Name: employee.name,
            Email: employee.email,
            department: department?.name,
            Manager: manager?.name,
            annual_quota: employee.quota.Annual,
            sick_quota: employee.quota.Sick,
            business_quota: employee.quota.Business,
            leaveType: newRequest.type,
            startDate: newRequest.startDate,
            endDate: newRequest.endDate,
            duration: newRequest.duration,
            reason: newRequest.reason,
            status: newRequest.status,
            attachmentName: newRequest.attachment?.name || null,
        };

        fetch(N8N_MYLEAVE_WEBHOOK, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`MyLeave webhook call failed with status: ${response.status}`);
            }
            return response.text().then(text => text ? JSON.parse(text) : null);
        })
        .then(data => {
            if (!data) {
                console.warn('MyLeave webhook returned an empty response.');
                return;
            }

            const employeeId = request.employeeId;
            let userUpdateData = null;

            if (Array.isArray(data)) {
                userUpdateData = data.find(d => d.ok && Number(d.Id) === employeeId);
            } else if (data && data.ok) {
                userUpdateData = data;
            }

            if (userUpdateData) {
                setEmployees(prevEmployees => 
                    prevEmployees.map(emp => {
                        if (emp.id === Number(userUpdateData.Id)) {
                            return { 
                                ...emp, 
                                quota: {
                                    ...emp.quota,
                                    Annual: Number(userUpdateData.annual_quota),
                                    Sick: Number(userUpdateData.sick_quota),
                                    Business: Number(userUpdateData.business_quota),
                                } 
                            };
                        }
                        return emp;
                    })
                );
            } else {
                 console.error('MyLeave webhook response did not contain valid data for the user:', data);
            }
        })
        .catch(error => console.error('Error processing MyLeave webhook response:', error))
        .finally(() => {
            // Re-fetch the leave list to ensure UI is in sync
            // This relies on currentUser being available in the hook's scope.
            if (currentUser) {
              // This is a bit of a hack. A better way would be to have a dedicated refetch function.
              // For now, we can manually trigger the effect logic again.
              const url = `${N8N_MYLEAVE_WEBHOOK}?email=${encodeURIComponent(currentUser.email)}`;
              fetch(url).then(res => res.json()).then(data => {
                if (data.ok && Array.isArray(data.leaves)) {
                  const mappedRequests: LeaveRequest[] = data.leaves.map((l: any, index: number) => ({
                    id: l.id || Date.now() + index,
                    employeeId: currentUser.id,
                    type: l.LeaveType as LeaveType,
                    startDate: l.StartDate,
                    endDate: l.EndDate,
                    duration: calculateDuration(l.StartDate, l.EndDate),
                    reason: l.Remark || '',
                    status: l.Status as LeaveStatus,
                    createdAt: l.createdAt || new Date(l.StartDate).toISOString(),
                  }));
                  setLeaveRequests(mappedRequests);
                }
              });
            }
        });
    }

    return true;
  };

  const updateRequestStatus = (
    requestId: number,
    status: LeaveStatus,
    approverId: number,
    rejectReason?: string
  ) => {
    setLeaveRequests(prevRequests =>
      prevRequests.map(req => {
        if (req.id === requestId) {
          // In a real app, this would also be a POST/PUT to an API endpoint
          return {
            ...req,
            status,
            approverId,
            approvedAt: status === LeaveStatus.APPROVED ? new Date().toISOString() : undefined,
            rejectReason: status === LeaveStatus.REJECTED ? rejectReason : undefined,
          };
        }
        return req;
      })
    );
  };

  const addEmployee = (employeeData: Omit<Employee, 'id'>, actorId: number) => {
      const newEmployee: Employee = {
          ...employeeData,
          id: Date.now(),
      };
      setEmployees(prev => [...prev, newEmployee]);
      logAction(actorId, AuditAction.EMPLOYEE_ADDED, newEmployee.id, `New employee ${newEmployee.name} was added.`);
  };

  const updateEmployeeRole = (employeeId: number, newRole: UserRole, actorId: number) => {
      let oldRole: UserRole | undefined;
      let employeeName: string | undefined;
      setEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
              oldRole = emp.role;
              employeeName = emp.name;
              return { ...emp, role: newRole };
          }
          return emp;
      }));
      if (oldRole && employeeName) {
          logAction(actorId, AuditAction.ROLE_CHANGE, employeeId, `${employeeName}'s role changed from ${oldRole} to ${newRole}.`);
      }
  };

  const updateEmployeeStatus = (employeeId: number, newStatus: EmployeeStatus, actorId: number) => {
      let oldStatus: EmployeeStatus | undefined;
      let employeeName: string | undefined;
      setEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
              oldStatus = emp.status;
              employeeName = emp.name;
              return { ...emp, status: newStatus };
          }
          return emp;
      }));
      if (oldStatus && employeeName) {
          logAction(actorId, AuditAction.STATUS_CHANGE, employeeId, `${employeeName}'s status changed from ${oldStatus} to ${newStatus}.`);
      }
  };

  return {
    leaveRequests,
    employees,
    departments,
    holidays,
    auditLogs,
    isLoading,
    leaveQuota,
    getEmployeeById,
    getDepartmentById,
    getTeamMembers,
    submitLeaveRequest,
    updateRequestStatus,
    calculateDuration,
    addEmployee,
    updateEmployeeRole,
    updateEmployeeStatus,
    generateOrgCoverage,
  };
};

export type LeaveData = ReturnType<typeof useLeaveData>;

export default useLeaveData;