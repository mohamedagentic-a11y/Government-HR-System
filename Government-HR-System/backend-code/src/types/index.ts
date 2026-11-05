export enum Role {
  HR_STAFF = 'HR Staff',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee',
}

export interface JwtPayload {
  employeeId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface Department {
  DepartmentID: string;
  NameArabic: string;
  NameEnglish: string;
  ManagerID?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface Employee {
  EmployeeID: string;
  NameArabic: string;
  NameEnglish?: string;
  NationalID?: string;
  DepartmentID: string;
  Department?: Department;
  JobTitle?: string;
  JobTitleArabic?: string;
  Role: Role;
  Email?: string;
  PhoneNumber?: string;
  HireDate?: string;
  HireDateHijri?: string;
  IsActive?: boolean;
  ManagerID?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveType = 'Annual' | 'Sick' | 'Emergency' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Other';

export interface LeaveRequest {
  LeaveID: string;
  EmployeeID: string;
  Employee?: Pick<Employee, 'EmployeeID' | 'NameArabic' | 'DepartmentID'>;
  LeaveType: LeaveType;
  StartDate: string;
  EndDate: string;
  StartDateHijri?: string;
  EndDateHijri?: string;
  DurationDays?: number;
  Status: LeaveStatus;
  Comments?: string;
  ManagerID?: string;
  ManagerComments?: string;
  ApprovedAt?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface PayrollRecord {
  PayrollID: string;
  EmployeeID: string;
  Employee?: Pick<Employee, 'EmployeeID' | 'NameArabic' | 'DepartmentID'>;
  PayPeriodMonth: number;
  PayPeriodYear: number;
  BasicSalary: number;
  HousingAllowance?: number;
  TransportationAllowance?: number;
  OtherAllowances?: number;
  GrossSalary: number;
  SocialInsuranceDeduction?: number;
  TaxDeduction?: number;
  OtherDeductions?: number;
  NetSalary: number;
  PayslipPath?: string;
  ProcessedAt?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export type PerformanceRating = 'Excellent' | 'Good' | 'Satisfactory' | 'NeedsImprovement' | 'Unsatisfactory';

export interface KpiEntry {
  KpiID?: string;
  Title: string;
  TitleArabic?: string;
  Target: string;
  Achieved?: string;
  Weight?: number;
  Score?: number;
}

export interface PerformanceReview {
  ReviewID: string;
  EmployeeID: string;
  Employee?: Pick<Employee, 'EmployeeID' | 'NameArabic' | 'DepartmentID'>;
  ReviewerID: string;
  Reviewer?: Pick<Employee, 'EmployeeID' | 'NameArabic'>;
  PeriodStart: string;
  PeriodEnd: string;
  PeriodStartHijri?: string;
  PeriodEndHijri?: string;
  Kpis?: KpiEntry[];
  OverallScore?: number;
  Rating?: PerformanceRating;
  ManagerComments?: string;
  EmployeeComments?: string;
  Status?: 'Draft' | 'Submitted' | 'Acknowledged';
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ApiMeta {
  timestamp: string;
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  meta?: ApiMeta;
  error?: {
    code: string;
    message: string;
  };
}

export interface PayrollRunSummary {
  TotalEmployees: number;
  TotalAmount: number;
  Anomalies: number;
}