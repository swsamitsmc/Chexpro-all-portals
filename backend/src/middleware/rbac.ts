import { Response, NextFunction, Request } from 'express';
import { AuthenticatedRequest, Permission, ROLE_PERMISSIONS } from '../types';
import { sendError } from '../utils/response';

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      sendError(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      return;
    }

    next();
  };
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    if (!roles.includes(user.role)) {
      sendError(res, 403, 'FORBIDDEN', 'Insufficient role');
      return;
    }

    next();
  };
}
