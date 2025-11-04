export enum UserRole {
  EMPLOYEE = 'Employee',
  MANAGER = 'Manager',
  HR_ADMIN = 'HR Admin',
}

export enum LeaveType {
  ANNUAL = 'Annual',
  SICK = 'Sick',
  BUSINESS = 'Business',
  OTHER = 'Other',
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export enum EmployeeStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum AuditAction {
    ROLE_CHANGE = 'Role Change',
    STATUS_CHANGE = 'Status Change',
    EMPLOYEE_ADDED = 'Employee Added',
}

export interface LeaveQuota {
  [LeaveType.ANNUAL]: number;
  [LeaveType.SICK]: number;
  [LeaveType.BUSINESS]: number;
  [LeaveType.OTHER]: number;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  password: string;
  departmentId: number;
  managerId: number | null;
  role: UserRole;
  quota: LeaveQuota;
  status: EmployeeStatus;
  managerEmail?: string;
  upToDate?: string;
}

export interface Department {
  id: number;
  name: string;
  managerId: number;
  minStaffPerDay: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  type: LeaveType;
  startDate: string; // ISO String
  endDate: string; // ISO String
  duration: number; // in days
  reason: string;
  attachment?: File;
  status: LeaveStatus;
  createdAt: string; // ISO String
  approverId?: number;
  approvedAt?: string; // ISO String
  rejectReason?: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface AuditLog {
    id: number;
    actorId: number;
    action: AuditAction;
    entityType: 'Employee';
    entityId: number;
    details: string;
    timestamp: string; // ISO String
}

export interface EmployeeLeaveSummary {
  employeeId: number;
  employeeName: string;
  annualQuota: number;
  businessQuota: number;
  sickQuota: number;
  annualUsed: number;
  businessUsed: number;
  sickUsed: number;
  annualRemaining: number;
  businessRemaining: number;
  sickRemaining: number;
  managerEmail?: string;
}