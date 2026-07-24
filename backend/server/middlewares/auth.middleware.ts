import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  Role,
  hasMinRole,
  isRoleCode,
  lowestRole,
  type RoleCode,
} from '@machinefit/shared';
import { jwtConfig } from '../config/jwt.js';
import { getPool } from '../config/database.js';
import { userRepository } from '../repositories/user.repository.js';
import { findDevUserById } from '../data/dev-users.js';

export interface AuthPayload {
  userId: string;
  roleCode: RoleCode;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function unauthorized(res: Response, code = 'UNAUTHORIZED', message = 'Authentication required'): void {
  res.status(401).json({
    success: false,
    error: { code, message },
  });
}

function forbidden(res: Response): void {
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
  });
}

/**
 * Resolve live role from DB (or dev store) so admin role changes apply
 * immediately without waiting for token expiry.
 */
async function resolveLiveAuth(payload: AuthPayload): Promise<AuthPayload | null> {
  const pool = getPool();
  if (pool) {
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) return null;
    return {
      userId: user.id,
      roleCode: isRoleCode(user.roleCode) ? user.roleCode : Role.MEMBER,
      email: user.email,
    };
  }

  const dev = findDevUserById(payload.userId);
  if (dev) {
    if (!dev.isActive) return null;
    return {
      userId: dev.id,
      roleCode: isRoleCode(dev.roleCode) ? dev.roleCode : Role.MEMBER,
      email: dev.email,
    };
  }

  // No DB / no dev user — trust JWT payload if role is known (tests)
  if (!isRoleCode(payload.roleCode)) return null;
  return {
    userId: payload.userId,
    roleCode: payload.roleCode,
    email: payload.email,
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res);
    return;
  }

  const token = header.slice(7);
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, jwtConfig.secret) as AuthPayload;
  } catch {
    unauthorized(res, 'INVALID_TOKEN', 'Invalid or expired token');
    return;
  }

  void resolveLiveAuth(payload)
    .then((live) => {
      if (!live) {
        unauthorized(res, 'UNAUTHORIZED', 'Authentication required');
        return;
      }
      req.user = live;
      next();
    })
    .catch((err) => next(err));
}

export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, jwtConfig.secret) as AuthPayload;
  } catch {
    next();
    return;
  }

  void resolveLiveAuth(payload)
    .then((live) => {
      if (live) req.user = live;
      next();
    })
    .catch(() => next());
}

/**
 * Hierarchical RBAC gate: user level must be >= required minimum.
 *
 * - `requireMinRole('owner')` → owner and admin
 * - `requireRole('owner', 'admin')` (legacy) → interpreted as min of listed = owner
 */
export function requireMinRole(minRole: RoleCode) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    if (!hasMinRole(req.user.roleCode, minRole)) {
      forbidden(res);
      return;
    }
    next();
  };
}

/**
 * Legacy-compatible entry point used by existing routes.
 * Multiple roles are treated as an allowlist collapsed to the lowest
 * required level (hierarchical inheritance covers higher roles).
 */
export function requireRole(...roles: RoleCode[]) {
  const minRole = roles.length === 0 ? Role.MEMBER : lowestRole(roles);
  return requireMinRole(minRole);
}
