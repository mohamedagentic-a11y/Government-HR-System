import { pool } from '../db/pool';

interface Employee {
  employeeid: string;
  namearabic: string;
  departmentid: string;
  basesalary: number;
  housingallowance: number;
  transportationallowance: number;
  otherallowances: number;
  status: string;
}

interface LeaveRecord {
  employeeid: string;
  leavetype: string;
  startdate: Date;
  enddate: Date;
  status: string;
  deductiondays: number;
}

interface PayrollRecord {
  employeeid: string;
  basesalary: number;
  totalallowances: number;
  totaldeductions: number;
  netsalary: number;
  anomalies: string[];
}

interface PayrollRunResult {
  totalEmployees: number;
  totalAmount: number;
  anomalies: number;
  payrollPeriod: string;
  recordsCreated: number;
}

interface AnomalyFlag {
  employeeid: string;
  reason: string;
}

function getCurrentPayrollPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function fetchActiveEmployees(): Promise<Employee[]> {
  const query = `
    SELECT
      e.employeeid,
      e.namearabic,
      e.departmentid,
      COALESCE(ps.basesalary, 0) AS basesalary,
      COALESCE(ps.housingallowance, 0) AS housingallowance,
      COALESCE(ps.transportationallowance, 0) AS transportationallowance,
      COALESCE(ps.otherallowances, 0) AS otherallowances,
      e.status
    FROM employees e
    LEFT JOIN payroll_salary ps ON ps.employeeid = e.employeeid AND ps.isactive = true
    WHERE e.status = 'Active'
  `;
  const result = await pool.query(query);
  return result.rows as Employee[];
}

async function fetchLeaveDataForPeriod(period: string): Promise<LeaveRecord[]> {
  const [year, month] = period.split('-').map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const query = `
    SELECT
      l.employeeid,
      l.leavetype,
      l.startdate,
      l.enddate,
      l.status,
      GREATEST(
        0,
        (
          LEAST(l.enddate::date, $2::date) - GREATEST(l.startdate::date, $1::date)
        ) + 1
      ) AS deductiondays
    FROM leaves l
    WHERE l.status = 'Approved'
      AND l.leavetype = 'Unpaid'
      AND l.startdate <= $2
      AND l.enddate >= $1
  `;

  const result = await pool.query(query, [
    startOfMonth.toISOString().split('T')[0],
    endOfMonth.toISOString().split('T')[0],
  ]);

  return result.rows as LeaveRecord[];
}

function calculateDailyRate(baseSalary: number): number {
  return baseSalary / 30;
}

function calculateDeductions(
  employee: Employee,
  leaveRecords: LeaveRecord[]
): { totalDeductions: number; deductionBreakdown: string[] } {
  const breakdown: string[] = [];
  let totalDeductions = 0;

  const employeeLeaves = leaveRecords.filter(
    (l) => l.employeeid === employee.employeeid
  );

  for (const leave of employeeLeaves) {
    const days = Number(leave.deductiondays);
    if (days > 0) {
      const deductionAmount = calculateDailyRate(employee.basesalary) * days;
      totalDeductions += deductionAmount;
      breakdown.push(`Unpaid leave deduction: ${days} days = ${deductionAmount.toFixed(2)}`);
    }
  }

  return { totalDeductions, deductionBreakdown: breakdown };
}

function detectAnomalies(record: PayrollRecord, employee: Employee): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  if (record.netsalary < 0) {
    flags.push({
      employeeid: employee.employeeid,
      reason: `Net salary is negative: ${record.netsalary.toFixed(2)}`,
    });
  }

  if (employee.basesalary <= 0) {
    flags.push({
      employeeid: employee.employeeid,
      reason: `Base salary is zero or not configured`,
    });
  }

  if (record.totaldeductions > record.basesalary + record.totalallowances) {
    flags.push({
      employeeid: employee.employeeid,
      reason: `Total deductions exceed gross pay`,
    });
  }

  if (record.netsalary > 500000) {
    flags.push({
      employeeid: employee.employeeid,
      reason: `Unusually high net salary: ${record.netsalary.toFixed(2)}`,
    });
  }

  return flags;
}

async function saveDraftPayrollRecords(
  records: PayrollRecord[],
  period: string,
  client: Awaited<ReturnType<typeof pool.connect>>
): Promise<number> {
  const insertQuery = `
    INSERT INTO payroll_records (
      employeeid,
      payrollperiod,
      basesalary,
      totalallowances,
      totaldeductions,
      netsalary,
      anomalies,
      status,
      createdat,
      updatedat
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Draft', NOW(), NOW())
    ON CONFLICT (employeeid, payrollperiod)
    DO UPDATE SET
      basesalary = EXCLUDED.basesalary,
      totalallowances = EXCLUDED.totalallowances,
      totaldeductions = EXCLUDED.totaldeductions,
      netsalary = EXCLUDED.netsalary,
      anomalies = EXCLUDED.anomalies,
      status = 'Draft',
      updatedat = NOW()
  `;

  let count = 0;
  for (const record of records) {
    await client.query(insertQuery, [
      record.employeeid,
      period,
      record.basesalary,
      record.totalallowances,
      record.totaldeductions,
      record.netsalary,
      JSON.stringify(record.anomalies),
    ]);
    count++;
  }

  return count;
}

async function runPayroll(): Promise<PayrollRunResult> {
  const period = getCurrentPayrollPeriod();

  const employees = await fetchActiveEmployees();
  if (employees.length === 0) {
    return {
      totalEmployees: 0,
      totalAmount: 0,
      anomalies: 0,
      payrollPeriod: period,
      recordsCreated: 0,
    };
  }

  const leaveRecords = await fetchLeaveDataForPeriod(period);

  const payrollRecords: PayrollRecord[] = [];
  const allAnomalies: AnomalyFlag[] = [];

  for (const employee of employees) {
    const totalAllowances =
      Number(employee.housingallowance) +
      Number(employee.transportationallowance) +
      Number(employee.otherallowances);

    const { totalDeductions, deductionBreakdown } = calculateDeductions(
      employee,
      leaveRecords
    );

    const grossPay = Number(employee.basesalary) + totalAllowances;
    const netSalary = grossPay - totalDeductions;

    const record: PayrollRecord = {
      employeeid: employee.employeeid,
      basesalary: Number(employee.basesalary),
      totalallowances: totalAllowances,
      totaldeductions: totalDeductions,
      netsalary: netSalary,
      anomalies: deductionBreakdown,
    };

    const anomalyFlags = detectAnomalies(record, employee);
    if (anomalyFlags.length > 0) {
      allAnomalies.push(...anomalyFlags);
      record.anomalies = [
        ...record.anomalies,
        ...anomalyFlags.map((f) => f.reason),
      ];
    }

    payrollRecords.push(record);
  }

  const totalAmount = payrollRecords.reduce(
    (sum, r) => sum + r.netsalary,
    0
  );

  const client = await pool.connect();
  let recordsCreated = 0;

  try {
    await client.query('BEGIN');
    recordsCreated = await saveDraftPayrollRecords(payrollRecords, period, client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    totalEmployees: employees.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    anomalies: allAnomalies.length,
    payrollPeriod: period,
    recordsCreated,
  };
}

export const payrollService = {
  runPayroll,
  fetchActiveEmployees,
  fetchLeaveDataForPeriod,
  getCurrentPayrollPeriod,
};