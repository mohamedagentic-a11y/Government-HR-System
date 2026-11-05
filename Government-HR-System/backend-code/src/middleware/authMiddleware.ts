import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AppRole = 'HR Staff' | 'Manager' | 'Employee';

export interface JwtPayload {
  employeeId: string;
  role: AppRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required but not set');
  }
  return secret;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header.',
      },
    });
    return;
  }

  const token = authHeader.slice(7);

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'SERVER_CONFIGURATION_ERROR',
        message: 'Server is not properly configured.',
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded.employeeId || !decoded.role) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token payload is invalid.',
        },
      });
      return;
    }

    const validRoles: AppRole[] = ['HR Staff', 'Manager', 'Employee'];
    if (!validRoles.includes(decoded.role)) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token contains an unrecognized role.',
        },
      });
      return;
    }

    req.user = {
      employeeId: decoded.employeeId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Bearer token has expired.',
        },
      });
      return;
    }

    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Bearer token is invalid.',
      },
    });
  }
}

export function requireRole(roles: AppRole[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access restricted. Required role(s): ${roles.join(', ')}.`,
        },
      });
      return;
    }

    next();
  };
}