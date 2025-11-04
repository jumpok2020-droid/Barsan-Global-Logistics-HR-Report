import { Department, Employee, LeaveRequest, Holiday, UserRole, LeaveType, LeaveStatus, EmployeeStatus } from './types';

export const N8N_LOGIN_WEBHOOK = "https://cherry99.app.n8n.cloud/webhook/HRBarsan-Login";
export const N8N_MYLEAVE_WEBHOOK = "https://cherry99.app.n8n.cloud/webhook/MY-LEAVE";
export const N8N_QUOTA_WEBHOOK = "https://cherry99.app.n8n.cloud/webhook/MY-LEAVE";
export const WEBHOOK_TIMEOUT_MS = 10000;

export const DEPARTMENTS: Department[] = [
  { id: 1, name: 'Accounting/HR', managerId: 2, minStaffPerDay: 1 },
  { id: 2, name: 'Director', managerId: 2, minStaffPerDay: 1 },
  { id: 3, name: 'Admin', managerId: 3, minStaffPerDay: 1 },
  { id: 4, name: 'Operations', managerId: 5, minStaffPerDay: 3 },
  { id: 5, name: 'Sales', managerId: 2, minStaffPerDay: 2 },
  { id: 6, name: 'IT', managerId: 2, minStaffPerDay: 1 },
];

export const EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'Phukit Thepnimit',
    email: 'phukit.thepnimit@barsan.com',
    password: 'password',
    departmentId: 1, // Accounting/HR
    managerId: 2, // Serkan Celik
    role: UserRole.HR_ADMIN,
    quota: { Annual: 10, Sick: 100, Business: 5, Other: 5 },
    status: EmployeeStatus.ACTIVE,
  },
  {
    id: 2,
    name: 'Serkan Celik',
    email: 'serkan.celik@barsan.com',
    password: 'password',
    departmentId: 2, // Director
    managerId: null,
    role: UserRole.HR_ADMIN,
    quota: { Annual: 0, Sick: 0, Business: 0, Other: 5 },
    status: EmployeeStatus.ACTIVE,
  },
  {
    id: 3,
    name: 'Admin Admin',
    email: '-',
    password: 'password',
    departmentId: 3, // Admin
    managerId: null,
    role: UserRole.EMPLOYEE,
    quota: { Annual: 0, Sick: 0, Business: 0, Other: 5 },
    status: EmployeeStatus.INACTIVE,
  },
  { id: 4, name: 'Nittaya Srisawat', email: 'nittaya.s@example.com', password: 'password', departmentId: 4, managerId: 5, role: UserRole.EMPLOYEE, quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 5, name: 'Somchai Jaidee', email: 'somchai.j@example.com', password: 'password', departmentId: 4, managerId: 2, role: UserRole.MANAGER, quota: { Annual: 10, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 6, name: 'Malee Petch', email: 'malee.p@example.com', password: 'password', departmentId: 4, managerId: 5, role: UserRole.EMPLOYEE, quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 7, name: 'Arthit Boonmee', email: 'arthit.b@example.com', password: 'password', departmentId: 4, managerId: 5, role: UserRole.EMPLOYEE, quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 8, name: 'Pornthip Sukasem', email: 'pornthip.s@example.com', password: 'password', departmentId: 5, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 8, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 9, name: 'Voravit Charoen', email: 'voravit.c@example.com', password: 'password', departmentId: 5, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 8, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 10, name: 'Kannika Wong', email: 'kannika.w@example.com', password: 'password', departmentId: 5, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 8, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 11, name: 'Jirayu Techavanich', email: 'jirayu.t@example.com', password: 'password', departmentId: 6, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 10, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 12, name: 'Araya Chompoo', email: 'araya.c@example.com', password: 'password', departmentId: 1, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 10, Sick: 100, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 13, name: 'Chalermpon Sri-aram', email: 'chalermpon.s@example.com', password: 'password', departmentId: 4, managerId: 5, role: UserRole.EMPLOYEE, quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 14, name: 'Thida Phan', email: 'thida.p@example.com', password: 'password', departmentId: 4, managerId: 5, role: UserRole.EMPLOYEE, quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 15, name: 'Paitoon Ngam', email: 'paitoon.n@example.com', password: 'password', departmentId: 4, managerId: 5, role: UserRole.EMPLOYEE, quota: { Annual: 6, Sick: 30, Business: 3, Other: 5 }, status: EmployeeStatus.INACTIVE },
  { id: 16, name: 'Sunee Rattana', email: 'sunee.r@example.com', password: 'password', departmentId: 5, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 8, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 17, name: 'Chatchai Decha', email: 'chatchai.d@example.com', password: 'password', departmentId: 6, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 10, Sick: 30, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
  { id: 18, name: 'Wanida Udom', email: 'wanida.u@example.com', password: 'password', departmentId: 1, managerId: 2, role: UserRole.EMPLOYEE, quota: { Annual: 10, Sick: 100, Business: 5, Other: 5 }, status: EmployeeStatus.ACTIVE },
];


const today = new Date();
const getFutureDate = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};
const getPastDate = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}


export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 1, employeeId: 1, type: LeaveType.ANNUAL, startDate: `${getFutureDate(10)}T09:00`, endDate: `${getFutureDate(12)}T17:00`, duration: 3, reason: 'Vacation', status: LeaveStatus.PENDING, createdAt: new Date().toISOString() },
  { id: 2, employeeId: 1, type: LeaveType.SICK, startDate: `${getPastDate(1)}T09:00`, endDate: `${getPastDate(1)}T17:00`, duration: 1, reason: 'Flu', status: LeaveStatus.APPROVED, createdAt: new Date().toISOString(), approverId: 2 },
  { id: 3, employeeId: 4, type: LeaveType.ANNUAL, startDate: `${getPastDate(20)}T09:00`, endDate: `${getPastDate(19)}T17:00`, duration: 2, reason: 'Family trip', status: LeaveStatus.APPROVED, createdAt: new Date().toISOString(), approverId: 5 },
  { id: 4, employeeId: 6, type: LeaveType.BUSINESS, startDate: `${getFutureDate(5)}T09:00`, endDate: `${getFutureDate(5)}T17:00`, duration: 1, reason: 'Client meeting', status: LeaveStatus.APPROVED, createdAt: new Date().toISOString(), approverId: 5 },
  { id: 5, employeeId: 8, type: LeaveType.ANNUAL, startDate: `${getPastDate(10)}T09:00`, endDate: `${getPastDate(8)}T17:00`, duration: 3, reason: 'Vacation', status: LeaveStatus.APPROVED, createdAt: new Date().toISOString(), approverId: 2 },
  { id: 6, employeeId: 8, type: LeaveType.SICK, startDate: `${getPastDate(2)}T09:00`, endDate: `${getPastDate(2)}T17:00`, duration: 1, reason: 'Doctor appointment', status: LeaveStatus.APPROVED, createdAt: new Date().toISOString(), approverId: 2 },
  { id: 7, employeeId: 4, type: LeaveType.SICK, startDate: `${getFutureDate(1)}T09:00`, endDate: `${getFutureDate(1)}T17:00`, duration: 1, reason: 'Migraine', status: LeaveStatus.PENDING, createdAt: new Date().toISOString() },
  { id: 8, employeeId: 11, type: LeaveType.ANNUAL, startDate: `${getFutureDate(30)}T09:00`, endDate: `${getFutureDate(34)}T17:00`, duration: 5, reason: 'Trip abroad', status: LeaveStatus.PENDING, createdAt: new Date().toISOString() },
];

export const HOLIDAYS: Holiday[] = [
    { date: `${today.getFullYear()}-01-01`, name: "New Year's Day" },
    { date: `${today.getFullYear()}-12-25`, name: "Christmas Day" },
];

export const DEPARTMENT_COLORS: Record<string, string> = {
  'Accounting/HR': '#a855f7',
  'Director': '#16a34a',
  'Admin': '#2563eb',
  'Operations': '#f97316',
  'Sales': '#ec4899',
  'IT': '#f59e0b',
  'Finance': '#ef4444',
  'Other': '#64748b'
};