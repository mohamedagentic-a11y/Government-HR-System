import jwt from 'jsonwebtoken';
import axios from 'axios';
import { pool } from '../db/pool';

type Role = 'HR Staff' | 'Manager' | 'Employee';

interface SSOVerificationResult {
  upn: string;
  displayName: string;
  email: string;
}

interface EmployeeRecord {
  employeeid: string;
  role: Role;
  nameArabic: string;
  email: string;
}

interface AuthResult {
  token: string;
  employeeId: string;
  role: Role;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

async function verifySSOToken(ssoToken: string): Promise<SSOVerificationResult> {
  const adEndpoint = getRequiredEnv('AD_SSO_ENDPOINT');

  const response = await axios.get<SSOVerificationResult>(adEndpoint, {
    headers: {
      Authorization: `Bearer ${ssoToken}`,
    },
    timeout: 10000,
  });

  if (!response.data || !response.data.upn) {
    throw new Error('Invalid SSO token response from AD endpoint');
  }

  return response.data;
}

async function lookupEmployee(upn: string): Promise<EmployeeRecord> {
  const result = await pool.query<EmployeeRecord>(
    `SELECT
       e."EmployeeID" AS employeeid,
       e."Role"       AS role,
       e."NameArabic" AS "nameArabic",
       e."Email"      AS email
     FROM employees e
     WHERE e."Email" = $1
        OR e."UPN"   = $1
     LIMIT 1`,
    [upn]
  );

  if (result.rows.length === 0) {
    throw new Error(`No employee record found for UPN: ${upn}`);
  }

  const employee = result.rows[0];

  const validRoles: Role[] = ['HR Staff', 'Manager', 'Employee'];
  if (!validRoles.includes(employee.role)) {
    throw new Error(`Unknown role "${employee.role}" for employee ${employee.employeeid}`);
  }

  return employee;
}

function signJWT(employeeId: string, role: Role): string {
  const jwtSecret = getRequiredEnv('JWT_SECRET');

  const payload = {
    employeeId,
    role,
  };

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: '1h',
    issuer: 'government-hr-system',
  });

  return token;
}

async function exchangeSSOForJWT(ssoToken: string): Promise<AuthResult> {
  if (!ssoToken) {
    throw new Error('SSO token is required');
  }

  const ssoIdentity = await verifySSOToken(ssoToken);
  const employee = await lookupEmployee(ssoIdentity.upn);
  const token = signJWT(employee.employeeid, employee.role);

  return {
    token,
    employeeId: employee.employeeid,
    role: employee.role,
  };
}

export const authService = {
  exchangeSSOForJWT,
  verifySSOToken,
  lookupEmployee,
};