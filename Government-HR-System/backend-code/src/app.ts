import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { errorMiddleware } from './middleware/errorMiddleware';
import { authRouter } from './routes/authRoutes';
import { employeeRouter } from './routes/employeeRoutes';
import { leaveRouter } from './routes/leaveRoutes';
import { payrollRouter } from './routes/payrollRoutes';
import { performanceRouter } from './routes/performanceRoutes';
import { onboardingRouter } from './routes/onboardingRoutes';
import { departmentRouter } from './routes/departmentRoutes';
import { payslipRouter } from './routes/payslipRoutes';

const app = express();

// Security headers
app.use(helmet());

// CORS — read allowed origins from environment; never allow all origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server) only in controlled cases
      if (!origin) {
        return callback(null, false);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
    },
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Global rate limiter: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: false, // disable default RateLimit-* headers
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    });
  },
  skip: () => false,
  // Manually set X-RateLimit headers via onLimitReached / headers option
  // express-rate-limit v6+ supports `standardHeaders: 'draft-7'` or custom
});

// Apply rate limiter and attach X-RateLimit-Limit / X-RateLimit-Remaining headers manually
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  // Let the limiter run, then we set custom headers via a wrapper
  next();
});

// Use the limiter with custom header names
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown'
    );
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    });
  },
  // Attach custom headers on every response
  skip: () => false,
});

// Middleware to set X-RateLimit headers by wrapping rateLimit
// express-rate-limit stores info on req; we use a small wrapper
app.use(
  '/api',
  (req: Request, res: Response, next: NextFunction) => {
    apiLimiter(req, res, (err?: unknown) => {
      if (err) return next(err);
      // After limiter runs, attach custom headers using its stored data
      // express-rate-limit v6 exposes req.rateLimit
      const rl = (req as Request & { rateLimit?: { limit: number; remaining: number } }).rateLimit;
      if (rl) {
        res.setHeader('X-RateLimit-Limit', rl.limit);
        res.setHeader('X-RateLimit-Remaining', rl.remaining);
      }
      next();
    });
  }
);

// Mount routers under /api/v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/leaves', leaveRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/performance', performanceRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1/payslips', payslipRouter);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found.`,
    },
  });
});

// Global error handler
app.use(errorMiddleware);

export { app };