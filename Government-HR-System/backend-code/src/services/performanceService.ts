import { pool } from '../db/pool';

interface ReviewCycle {
  cycleId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface PerformanceReview {
  reviewId: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  score: number;
  comments: string;
  status: string;
  createdAt: string;
}

interface AggregatedScores {
  cycleId: string;
  totalReviews: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  employeeScores: Array<{
    employeeId: string;
    score: number;
    reviewCount: number;
  }>;
}

interface CreateReviewCycleInput {
  name: string;
  startDate: string;
  endDate: string;
}

interface RecordReviewInput {
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  score: number;
  comments?: string;
}

export const performanceService = {
  async createReviewCycle(input: CreateReviewCycleInput): Promise<ReviewCycle> {
    const { name, startDate, endDate } = input;

    if (!name || !startDate || !endDate) {
      throw new Error('Missing required fields: name, startDate, endDate');
    }

    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('startDate must be before endDate');
    }

    const result = await pool.query<ReviewCycle>(
      `INSERT INTO review_cycles (name, start_date, end_date, status)
       VALUES ($1, $2, $3, 'Active')
       RETURNING
         cycle_id AS "cycleId",
         name,
         start_date AS "startDate",
         end_date AS "endDate",
         status`,
      [name, startDate, endDate]
    );

    return result.rows[0];
  },

  async getReviewCycles(): Promise<ReviewCycle[]> {
    const result = await pool.query<ReviewCycle>(
      `SELECT
         cycle_id AS "cycleId",
         name,
         start_date AS "startDate",
         end_date AS "endDate",
         status
       FROM review_cycles
       ORDER BY start_date DESC`
    );

    return result.rows;
  },

  async getReviewCycleById(cycleId: string): Promise<ReviewCycle | null> {
    const result = await pool.query<ReviewCycle>(
      `SELECT
         cycle_id AS "cycleId",
         name,
         start_date AS "startDate",
         end_date AS "endDate",
         status
       FROM review_cycles
       WHERE cycle_id = $1`,
      [cycleId]
    );

    return result.rows[0] ?? null;
  },

  async closeReviewCycle(cycleId: string): Promise<ReviewCycle> {
    const result = await pool.query<ReviewCycle>(
      `UPDATE review_cycles
       SET status = 'Closed'
       WHERE cycle_id = $1
       RETURNING
         cycle_id AS "cycleId",
         name,
         start_date AS "startDate",
         end_date AS "endDate",
         status`,
      [cycleId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Review cycle not found: ${cycleId}`);
    }

    return result.rows[0];
  },

  async recordReview(input: RecordReviewInput): Promise<PerformanceReview> {
    const { cycleId, employeeId, reviewerId, score, comments = '' } = input;

    if (!cycleId || !employeeId || !reviewerId) {
      throw new Error('Missing required fields: cycleId, employeeId, reviewerId');
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Score must be a number between 0 and 100');
    }

    const cycleResult = await pool.query(
      `SELECT cycle_id, status FROM review_cycles WHERE cycle_id = $1`,
      [cycleId]
    );

    if (cycleResult.rows.length === 0) {
      throw new Error(`Review cycle not found: ${cycleId}`);
    }

    if (cycleResult.rows[0].status !== 'Active') {
      throw new Error(`Review cycle ${cycleId} is not active`);
    }

    const result = await pool.query<PerformanceReview>(
      `INSERT INTO performance_reviews
         (cycle_id, employee_id, reviewer_id, score, comments, status, entry_type)
       VALUES ($1, $2, $3, $4, $5, 'Completed', 'PERFORMANCE_REVIEW')
       RETURNING
         review_id AS "reviewId",
         cycle_id AS "cycleId",
         employee_id AS "employeeId",
         reviewer_id AS "reviewerId",
         score,
         comments,
         status,
         created_at AS "createdAt"`,
      [cycleId, employeeId, reviewerId, score, comments]
    );

    return result.rows[0];
  },

  async getReviewsByCycle(cycleId: string): Promise<PerformanceReview[]> {
    const result = await pool.query<PerformanceReview>(
      `SELECT
         review_id AS "reviewId",
         cycle_id AS "cycleId",
         employee_id AS "employeeId",
         reviewer_id AS "reviewerId",
         score,
         comments,
         status,
         created_at AS "createdAt"
       FROM performance_reviews
       WHERE cycle_id = $1
         AND entry_type = 'PERFORMANCE_REVIEW'
       ORDER BY created_at DESC`,
      [cycleId]
    );

    return result.rows;
  },

  async getReviewsByEmployee(employeeId: string): Promise<PerformanceReview[]> {
    const result = await pool.query<PerformanceReview>(
      `SELECT
         review_id AS "reviewId",
         cycle_id AS "cycleId",
         employee_id AS "employeeId",
         reviewer_id AS "reviewerId",
         score,
         comments,
         status,
         created_at AS "createdAt"
       FROM performance_reviews
       WHERE employee_id = $1
         AND entry_type = 'PERFORMANCE_REVIEW'
       ORDER BY created_at DESC`,
      [employeeId]
    );

    return result.rows;
  },

  async aggregateScoresByCycle(cycleId: string): Promise<AggregatedScores> {
    const cycleResult = await pool.query(
      `SELECT cycle_id FROM review_cycles WHERE cycle_id = $1`,
      [cycleId]
    );

    if (cycleResult.rows.length === 0) {
      throw new Error(`Review cycle not found: ${cycleId}`);
    }

    const summaryResult = await pool.query<{
      totalReviews: string;
      averageScore: string;
      minScore: string;
      maxScore: string;
    }>(
      `SELECT
         COUNT(*)::text AS "totalReviews",
         COALESCE(AVG(score), 0)::text AS "averageScore",
         COALESCE(MIN(score), 0)::text AS "minScore",
         COALESCE(MAX(score), 0)::text AS "maxScore"
       FROM performance_reviews
       WHERE cycle_id = $1
         AND entry_type = 'PERFORMANCE_REVIEW'`,
      [cycleId]
    );

    const perEmployeeResult = await pool.query<{
      employeeId: string;
      score: string;
      reviewCount: string;
    }>(
      `SELECT
         employee_id AS "employeeId",
         AVG(score)::text AS "score",
         COUNT(*)::text AS "reviewCount"
       FROM performance_reviews
       WHERE cycle_id = $1
         AND entry_type = 'PERFORMANCE_REVIEW'
       GROUP BY employee_id
       ORDER BY employee_id`,
      [cycleId]
    );

    const summary = summaryResult.rows[0];

    return {
      cycleId,
      totalReviews: parseInt(summary.totalReviews, 10),
      averageScore: parseFloat(parseFloat(summary.averageScore).toFixed(2)),
      minScore: parseFloat(summary.minScore),
      maxScore: parseFloat(summary.maxScore),
      employeeScores: perEmployeeResult.rows.map((row) => ({
        employeeId: row.employeeId,
        score: parseFloat(parseFloat(row.score).toFixed(2)),
        reviewCount: parseInt(row.reviewCount, 10),
      })),
    };
  },

  async getReviewById(reviewId: string): Promise<PerformanceReview | null> {
    const result = await pool.query<PerformanceReview>(
      `SELECT
         review_id AS "reviewId",
         cycle_id AS "cycleId",
         employee_id AS "employeeId",
         reviewer_id AS "reviewerId",
         score,
         comments,
         status,
         created_at AS "createdAt"
       FROM performance_reviews
       WHERE review_id = $1
         AND entry_type = 'PERFORMANCE_REVIEW'`,
      [reviewId]
    );

    return result.rows[0] ?? null;
  },
};