import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = err.statusCode ?? 500;
  let code = err.code ?? 'INTERNAL_SERVER_ERROR';
  let message = err.message ?? 'An unexpected error occurred.';

  // Map well-known error types to appropriate status codes and codes
  if (!err.statusCode) {
    const name = err.name ?? '';

    if (name === 'ValidationError') {
      statusCode = 400;
      code = 'VALIDATION_FAILED';
    } else if (name === 'UnauthorizedError' || name === 'JsonWebTokenError') {
      statusCode = 401;
      code = 'UNAUTHORIZED';
      message = 'Invalid or missing authentication token.';
    } else if (name === 'TokenExpiredError') {
      statusCode = 401;
      code = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired.';
    } else if (name === 'ForbiddenError') {
      statusCode = 403;
      code = 'FORBIDDEN';
      message = 'You do not have permission to perform this action.';
    } else if (name === 'NotFoundError') {
      statusCode = 404;
      code = 'NOT_FOUND';
    } else if (name === 'ConflictError') {
      statusCode = 409;
      code = 'CONFLICT';
    } else if (name === 'SyntaxError' && (err as any).type === 'entity.parse.failed') {
      statusCode = 400;
      code = 'INVALID_JSON';
      message = 'Request body contains invalid JSON.';
    }
  }

  // Map HTTP status to a default code if no code was set
  if (code === 'INTERNAL_SERVER_ERROR') {
    switch (statusCode) {
      case 400:
        code = 'BAD_REQUEST';
        break;
      case 401:
        code = 'UNAUTHORIZED';
        break;
      case 403:
        code = 'FORBIDDEN';
        break;
      case 404:
        code = 'NOT_FOUND';
        break;
      case 409:
        code = 'CONFLICT';
        break;
      case 422:
        code = 'UNPROCESSABLE_ENTITY';
        break;
      case 429:
        code = 'TOO_MANY_REQUESTS';
        break;
      default:
        code = 'INTERNAL_SERVER_ERROR';
        break;
    }
  }

  // Do not expose internal error details in production for 5xx errors
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  // Log the error for server-side visibility
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: statusCode >= 500 ? 'error' : 'warn',
      code,
      statusCode,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      method: req.method,
      url: req.originalUrl,
    })
  );

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}