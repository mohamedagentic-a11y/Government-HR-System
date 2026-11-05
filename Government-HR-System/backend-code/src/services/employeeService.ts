import { pool } from '../db/pool';

interface Employee {
  EmployeeID: string;
  NameArabic: string;
  NameEnglish?: string;
  DepartmentID: string;
  JobTitle?: string;
  HireDate?: string;
  Email?: string;
  Role?: string;
}

interface LeaveBalance {
  LeaveType: string;
  TotalEntitlement: number;
  Used: number;
  Remaining: number;
}

interface LeaveRequest {
  LeaveID: string;
  EmployeeID: string;
  LeaveType: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  Comments?: string;
  ManagerComments?: string;
  CreatedAt: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const ANNUAL_LEAVE_ENTITLEMENT = 30;
const SICK_LEAVE_ENTITLEMENT = 14;
const EMERGENCY_LEAVE_ENTITLEMENT = 3;

function getLeaveEntitlement(leaveType: string): number {
  switch (leaveType) {
    case 'Annual':
      return ANNUAL_LEAVE_ENTITLEMENT;
    case 'Sick':
      return SICK_LEAVE_ENTITLEMENT;
    case 'Emergency':
      return EMERGENCY_LEAVE_ENTITLEMENT;
    default:
      return 0;
  }
}

async function getAllEmployees(options: PaginationOptions = {}): Promise<PaginatedResult<Employee>> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const countResult = await pool.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM "EMPLOYEE"'
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query<Employee>(
    `SELECT "EmployeeID", "NameArabic", "NameEnglish", "DepartmentID", "JobTitle", "HireDate", "Email", "Role"
     FROM "EMPLOYEE"
     ORDER BY "NameArabic" ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
  };
}

async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const result = await pool.query<Employee>(
    `SELECT "EmployeeID", "NameArabic", "NameEnglish", "DepartmentID", "JobTitle", "HireDate", "Email", "Role"
     FROM "EMPLOYEE"
     WHERE "EmployeeID" = $1`,
    [employeeId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

async function getLeaveBalance(employeeId: string): Promise<LeaveBalance[]> {
  const leaveTypes = ['Annual', 'Sick', 'Emergency'];

  const result = await pool.query<{ LeaveType: string; used_days: string }>(
    `SELECT "LeaveType", COALESCE(SUM("DurationDays"), 0) AS used_days
     FROM "LEAVE_REQUEST"
     WHERE "EmployeeID" = $1
       AND "Status" = 'Approved'
       AND "LeaveType" = ANY($2::text[])
       AND EXTRACT(YEAR FROM CURRENT_DATE) = EXTRACT(YEAR FROM "CreatedAt"::date)
     GROUP BY "LeaveType"`,
    [employeeId, leaveTypes]
  );

  const usedMap: Record<string, number> = {};
  for (const row of result.rows) {
    usedMap[row.LeaveType] = parseInt(row.used_days, 10);
  }

  return leaveTypes.map((leaveType) => {
    const entitlement = getLeaveEntitlement(leaveType);
    const used = usedMap[leaveType] ?? 0;
    return {
      LeaveType: leaveType,
      TotalEntitlement: entitlement,
      Used: used,
      Remaining: Math.max(0, entitlement - used),
    };
  });
}

async function getEmployeeLeaveRequests(
  employeeId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<LeaveRequest>> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const countResult = await pool.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM "LEAVE_REQUEST" WHERE "EmployeeID" = $1',
    [employeeId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query<LeaveRequest>(
    `SELECT "LeaveID", "EmployeeID", "LeaveType", "StartDate", "EndDate", "Status",
            "Comments", "ManagerComments", "CreatedAt"
     FROM "LEAVE_REQUEST"
     WHERE "EmployeeID" = $1
     ORDER BY "CreatedAt" DESC
     LIMIT $2 OFFSET $3`,
    [employeeId, limit, offset]
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
  };
}

async function getDepartmentEmployees(departmentId: string): Promise<Employee[]> {
  const result = await pool.query<Employee>(
    `SELECT "EmployeeID", "NameArabic", "NameEnglish", "DepartmentID", "JobTitle", "HireDate", "Email", "Role"
     FROM "EMPLOYEE"
     WHERE "DepartmentID" = $1
     ORDER BY "NameArabic" ASC`,
    [departmentId]
  );

  return result.rows;
}

async function getPendingLeaveRequestsForManager(
  managerId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<LeaveRequest & { EmployeeNameArabic: string }>> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const managerEmployee = await getEmployeeById(managerId);
  if (!managerEmployee) {
    return { data: [], total: 0, page, limit };
  }

  const departmentId = managerEmployee.DepartmentID;

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM "LEAVE_REQUEST" lr
     JOIN "EMPLOYEE" e ON lr."EmployeeID" = e."EmployeeID"
     WHERE e."DepartmentID" = $1
       AND lr."Status" = 'Pending'`,
    [departmentId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query<LeaveRequest & { EmployeeNameArabic: string }>(
    `SELECT lr."LeaveID", lr."EmployeeID", lr."LeaveType", lr."StartDate", lr."EndDate",
            lr."Status", lr."Comments", lr."ManagerComments", lr."CreatedAt",
            e."NameArabic" AS "EmployeeNameArabic"
     FROM "LEAVE_REQUEST" lr
     JOIN "EMPLOYEE" e ON lr."EmployeeID" = e."EmployeeID"
     WHERE e."DepartmentID" = $1
       AND lr."Status" = 'Pending'
     ORDER BY lr."CreatedAt" ASC
     LIMIT $2 OFFSET $3`,
    [departmentId, limit, offset]
  );

  return {
    data: result.rows,
    total,
    page,
    limit,
  };
}

export const employeeService = {
  getAllEmployees,
  getEmployeeById,
  getLeaveBalance,
  getEmployeeLeaveRequests,
  getDepartmentEmployees,
  getPendingLeaveRequestsForManager,
};