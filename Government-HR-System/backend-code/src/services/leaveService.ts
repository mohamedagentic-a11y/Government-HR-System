import { pool } from '../db/pool';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Hijri / Gregorian conversion utility
// ---------------------------------------------------------------------------

/**
 * Validates a Hijri date string in YYYY-MM-DD format.
 * Basic range checks: year 1300-1600, month 1-12, day 1-30.
 */
function isValidHijriDate(hijri: string): boolean {
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = hijri.match(regex);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  return year >= 1300 && year <= 1600 && month >= 1 && month <= 12 && day >= 1 && day <= 30;
}

/**
 * Convert a Hijri date string (YYYY-MM-DD) to a Gregorian JavaScript Date.
 *
 * Uses the Kuwaiti algorithm, which is the same algorithm used by the
 * Umm al-Qura calendar for most dates and is accurate enough for
 * business-logic purposes (leave balance calculation, ordering).
 *
 * Reference: https://www.staff.science.uu.nl/~gent0113/islam/islam_tabcal.htm
 */
function hijriToGregorian(hijri: string): Date {
  const parts = hijri.split('-').map(Number);
  const hy = parts[0];
  const hm = parts[1];
  const hd = parts[2];

  // Julian Day Number for the Hijri date (Tabular / Kuwaiti algorithm)
  const N = hd + Math.ceil(29.5 * (hm - 1));
  const Q = Math.floor(hy / 30);
  const R = hy % 30;
  const A = Math.floor((11 * R + 3) / 30);
  const W = 404 * Q + 11 * R; // helper
  void W; // suppress unused warning — we calculate JDN directly below
  const JDN =
    hd +
    Math.ceil(29.5 * (hm - 1)) +
    (hy - 1) * 354 +
    Math.floor((3 + 11 * hy) / 30) +
    1948440 -
    385;

  void N; // used indirectly above
  void A;

  // JDN → Gregorian
  const L = JDN + 68569;
  const n = Math.floor((4 * L) / 146097);
  const lRem = L - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (lRem + 1)) / 1461001);
  const lRem2 = lRem - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * lRem2) / 2447);
  const day = lRem2 - Math.floor((2447 * j) / 80);
  const lRem3 = Math.floor(j / 11);
  const month = j + 2 - 12 * lRem3;
  const year = 100 * (n - 49) + i + lRem3;

  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Calculate the number of days between two Hijri date strings (inclusive).
 */
function hijriDaysBetween(start: string, end: string): number {
  const startDate = hijriToGregorian(start);
  const endDate = hijriToGregorian(end);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubmitLeaveInput {
  employeeId: string;
  leaveType: string;
  startDate: string; // Hijri YYYY-MM-DD
  endDate: string;   // Hijri YYYY-MM-DD
  comments?: string;
}

export interface UpdateLeaveStatusInput {
  leaveId: string;
  approverId: string;
  status: 'Approved' | 'Rejected';
  comments?: string;
}

export interface LeaveBalanceRow {
  LeaveType: string;
  TotalDays: number;
  UsedDays: number;
  RemainingDays: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const leaveService = {
  /**
   * Submit a new leave request.
   * Validates Hijri dates, checks leave balance, inserts LEAVE_REQUEST row.
   */
  async submitLeaveRequest(input: SubmitLeaveInput): Promise<{ leaveId: string; status: string }> {
    const { employeeId, leaveType, startDate, endDate, comments } = input;

    // --- Validate Hijri dates ---
    if (!isValidHijriDate(startDate)) {
      throw Object.assign(new Error('Invalid Hijri start date format.'), { code: 'VALIDATION_FAILED', statusCode: 400 });
    }
    if (!isValidHijriDate(endDate)) {
      throw Object.assign(new Error('Invalid Hijri end date format.'), { code: 'VALIDATION_FAILED', statusCode: 400 });
    }

    const startGreg = hijriToGregorian(startDate);
    const endGreg = hijriToGregorian(endDate);

    if (endGreg < startGreg) {
      throw Object.assign(new Error('End date must be on or after start date.'), { code: 'VALIDATION_FAILED', statusCode: 400 });
    }

    const requestedDays = hijriDaysBetween(startDate, endDate);

    // --- Check leave balance ---
    const balanceResult = await pool.query<{ remaining_days: number }>(
      `SELECT lb.total_days - COALESCE(SUM(
           CASE WHEN lr.status = 'Approved'
                THEN lr.duration_days ELSE 0 END
       ), 0) AS remaining_days
       FROM leave_balances lb
       LEFT JOIN leave_requests lr
         ON lr.employee_id = lb.employee_id
        AND lr.leave_type   = lb.leave_type
        AND EXTRACT(YEAR FROM lr.created_at) = EXTRACT(YEAR FROM NOW())
       WHERE lb.employee_id = $1
         AND lb.leave_type   = $2
       GROUP BY lb.total_days`,
      [employeeId, leaveType]
    );

    if (balanceResult.rowCount === 0) {
      throw Object.assign(
        new Error(`No leave balance record found for leave type: ${leaveType}.`),
        { code: 'BALANCE_NOT_FOUND', statusCode: 400 }
      );
    }

    const remaining = Number(balanceResult.rows[0].remaining_days);
    if (requestedDays > remaining) {
      throw Object.assign(
        new Error(`Insufficient leave balance. Requested: ${requestedDays} days, Available: ${remaining} days.`),
        { code: 'INSUFFICIENT_BALANCE', statusCode: 400 }
      );
    }

    // --- Insert leave request ---
    const leaveId = uuidv4();
    await pool.query(
      `INSERT INTO leave_requests
         (leave_id, employee_id, leave_type, start_date_hijri, end_date_hijri,
          start_date_gregorian, end_date_gregorian, duration_days, comments, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', NOW(), NOW())`,
      [
        leaveId,
        employeeId,
        leaveType,
        startDate,
        endDate,
        startGreg.toISOString().slice(0, 10),
        endGreg.toISOString().slice(0, 10),
        requestedDays,
        comments ?? null,
      ]
    );

    return { leaveId, status: 'Pending' };
  },

  /**
   * Approve or reject a leave request.
   * Only a Manager may call this; authorization is enforced at the route level.
   */
  async updateLeaveStatus(input: UpdateLeaveStatusInput): Promise<void> {
    const { leaveId, approverId, status, comments } = input;

    if (status !== 'Approved' && status !== 'Rejected') {
      throw Object.assign(
        new Error('Status must be "Approved" or "Rejected".'),
        { code: 'VALIDATION_FAILED', statusCode: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE leave_requests
          SET status      = $1,
              approver_id = $2,
              comments    = COALESCE($3, comments),
              updated_at  = NOW()
        WHERE leave_id = $4
          AND status   = 'Pending'
       RETURNING leave_id`,
      [status, approverId, comments ?? null, leaveId]
    );

    if (result.rowCount === 0) {
      throw Object.assign(
        new Error('Leave request not found or is no longer in Pending status.'),
        { code: 'NOT_FOUND_OR_CONFLICT', statusCode: 404 }
      );
    }
  },

  /**
   * Retrieve leave balance summary for an employee.
   */
  async getLeaveBalance(employeeId: string): Promise<LeaveBalanceRow[]> {
    const result = await pool.query<LeaveBalanceRow>(
      `SELECT
         lb.leave_type                           AS "LeaveType",
         lb.total_days                           AS "TotalDays",
         COALESCE(SUM(
           CASE WHEN lr.status = 'Approved'
                THEN lr.duration_days ELSE 0 END
         ), 0)::int                              AS "UsedDays",
         (lb.total_days - COALESCE(SUM(
           CASE WHEN lr.status = 'Approved'
                THEN lr.duration_days ELSE 0 END
         ), 0))::int                             AS "RemainingDays"
       FROM leave_balances lb
       LEFT JOIN leave_requests lr
         ON lr.employee_id = lb.employee_id
        AND lr.leave_type   = lb.leave_type
        AND EXTRACT(YEAR FROM lr.created_at) = EXTRACT(YEAR FROM NOW())
       WHERE lb.employee_id = $1
       GROUP BY lb.leave_type, lb.total_days
       ORDER BY lb.leave_type`,
      [employeeId]
    );

    return result.rows;
  },

  /**
   * Retrieve all leave requests for an employee.
   */
  async getEmployeeLeaves(employeeId: string): Promise<Record<string, unknown>[]> {
    const result = await pool.query(
      `SELECT
         leave_id              AS "LeaveID",
         leave_type            AS "LeaveType",
         start_date_hijri      AS "StartDate",
         end_date_hijri        AS "EndDate",
         duration_days         AS "DurationDays",
         status                AS "Status",
         comments              AS "Comments",
         approver_id           AS "ApproverID",
         created_at            AS "CreatedAt"
       FROM leave_requests
       WHERE employee_id = $1
       ORDER BY created_at DESC`,
      [employeeId]
    );
    return result.rows;
  },

  /**
   * Retrieve all pending leave requests (for managers / HR visibility).
   */
  async getPendingLeaves(): Promise<Record<string, unknown>[]> {
    const result = await pool.query(
      `SELECT
         lr.leave_id           AS "LeaveID",
         lr.employee_id        AS "EmployeeID",
         e.name_arabic         AS "EmployeeNameArabic",
         lr.leave_type         AS "LeaveType",
         lr.start_date_hijri   AS "StartDate",
         lr.end_date_hijri     AS "EndDate",
         lr.duration_days      AS "DurationDays",
         lr.comments           AS "Comments",
         lr.created_at         AS "CreatedAt"
       FROM leave_requests lr
       LEFT JOIN employees e ON e.employee_id = lr.employee_id
       WHERE lr.status = 'Pending'
       ORDER BY lr.created_at ASC`
    );
    return result.rows;
  },

  // Expose utility for tests / other modules
  hijriToGregorian,
  isValidHijriDate,
  hijriDaysBetween,
};