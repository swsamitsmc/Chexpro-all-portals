import { Request } from 'express';
import { AdminRole } from '@prisma/client';

// Admin user type for request
export interface AdminUserPayload {
  id: string;
  email: string;
  role: AdminRole;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
}

// Extend Express Request
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUserPayload;
  adminId?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  lastLogin?: Date;
  status: string;
  createdAt: Date;
}

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  type: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  config?: Record<string, unknown>;
  isVisible: boolean;
}

// Order types
export interface OrderFilter {
  status?: string;
  clientId?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
  search?: string;
}

// Permission types
export interface Permission {
  resource: string;
  actions: Array<'create' | 'read' | 'update' | 'delete' | 'manage'>;
}

// Role permissions map
export const rolePermissions: Record<AdminRole, Permission[]> = {
  super_admin: [
    { resource: 'all', actions: ['manage'] },
  ],
  operations_manager: [
    { resource: 'orders', actions: ['read', 'update', 'manage'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'vendors', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read', 'create'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'sla', actions: ['read', 'update'] },
    { resource: 'team', actions: ['read', 'update'] },
  ],
  processor: [
    { resource: 'orders', actions: ['read', 'update'] },
    { resource: 'documents', actions: ['read', 'create', 'update'] },
    { resource: 'applicants', actions: ['read', 'update'] },
  ],
  qa_specialist: [
    { resource: 'orders', actions: ['read'] },
    { resource: 'qa_reviews', actions: ['read', 'create', 'update'] },
    { resource: 'reports', actions: ['read'] },
  ],
  client_success_mgr: [
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'orders', actions: ['read'] },
    { resource: 'packages', actions: ['read', 'create', 'update'] },
    { resource: 'billing', actions: ['read'] },
  ],
  credentialing_spec: [
    { resource: 'credentialing', actions: ['read', 'create', 'update'] },
    { resource: 'clients', actions: ['read', 'create', 'update'] },
    { resource: 'documents', actions: ['read', 'create', 'update'] },
  ],
  compliance_officer: [
    { resource: 'orders', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'compliance', actions: ['read', 'update'] },
    { resource: 'disputes', actions: ['read', 'update'] },
    { resource: 'adverse_actions', actions: ['read', 'update'] },
  ],
};

// Helper to check permission
export function hasPermission(
  role: AdminRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): boolean {
  const permissions = rolePermissions[role];
  return permissions.some(
    (p) =>
      (p.resource === 'all' || p.resource === resource) &&
      p.actions.includes('manage') || p.actions.includes(action)
  );
}