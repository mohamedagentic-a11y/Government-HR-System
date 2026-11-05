import { Router } from 'express';
import { ssoLogin } from '../controllers/authController';

const authRouter = Router();

authRouter.post('/sso', ssoLogin);

authRouter.post('/refresh', (req, res) => {
  const { token } = req.body as { token?: string };

  if (!token) {
    return res.status(400).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Refresh token is required.',
      },
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set.');
  }

  let decoded: { employeeId: string; role: string; iat?: number; exp?: number };
  try {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    decoded = jwt.verify(token, jwtRefreshSecret) as typeof decoded;
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'The refresh token is invalid or has expired.',
      },
    });
  }

  const VALID_ROLES = ['HR Staff', 'Manager', 'Employee'] as const;
  if (!VALID_ROLES.includes(decoded.role as (typeof VALID_ROLES)[number])) {
    return res.status(403).json({
      error: {
        code: 'INVALID_ROLE',
        message: 'Token contains an unrecognised role.',
      },
    });
  }

  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
  const accessToken = jwt.sign(
    { employeeId: decoded.employeeId, role: decoded.role },
    jwtSecret,
    { expiresIn: '1h' }
  );

  return res.status(200).json({
    data: { accessToken },
    meta: { timestamp: new Date().toISOString() },
  });
});

export { authRouter };