import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const ssoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ssoToken } = req.body;

    if (!ssoToken) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'SSO token is required.',
        },
      });
      return;
    }

    const jwt = await authService.exchangeSsoToken(ssoToken);

    res.status(200).json({
      data: { token: jwt },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed.';

    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message,
      },
    });
  }
};