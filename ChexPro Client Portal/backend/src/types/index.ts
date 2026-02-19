import { Request } from 'express';
import {
  UserRole,
  UserStatus,
  OrderStatus,
  ClientStatus,
  VendorName,
} from '@prisma/client';

// ============================================================
// AUTH TYPES
// ============================================================

// Note: The Express.User interface is augmented in express.d.ts
// to include our custom user properties (clientId, role, etc.)

export interface JwtPayload {
  userId: string;
  clientId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Re-export Express.User for use in route handlers
export type AuthUser = Express.User;
export type AuthenticatedRequest = Request;

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiMeta {
  timestamp: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta: ApiMeta;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================
// PAGINATION
// ============================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// ORDER TYPES
// ============================================================

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  packageId?: string;
}

export interface CreateOrderDto {
  packageId?: string;
  customServices?: string[];
  referenceNumber?: string;
  positionTitle?: string;
  department?: string;
  screeningReason?: string;
  jobLocation?: string;
  applicantId?: string;
  isDraft?: boolean;
}

export interface SubmitOrderDto {
  orderId: string;
  applicantData?: CreateApplicantDto;
  sendInvitation?: boolean;
  invitationEmail?: string;
}

// ============================================================
// APPLICANT TYPES
// ============================================================

export interface AddressDto {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  residenceType?: string;
  yearsAtAddress?: number;
  from?: string;
  to?: string;
}

export interface EmploymentHistoryDto {
  employer: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  supervisorName?: string;
  supervisorContact?: string;
  reasonForLeaving?: string;
  canContact?: boolean;
}

export interface EducationHistoryDto {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationDate?: string;
  studentId?: string;
}

export interface CreateApplicantDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  sin?: string;
  email?: string;
  phone?: string;
  gender?: string;
  currentAddress?: AddressDto;
  addressHistory?: AddressDto[];
  employmentHistory?: EmploymentHistoryDto[];
  educationHistory?: EducationHistoryDto[];
  additionalInfo?: Record<string, unknown>;
  otherNames?: string[];
}

// ============================================================
// VENDOR TYPES
// ============================================================

export interface VendorRequest {
  orderId: string;
  vendorOrderId?: string;
  serviceType: string;
  applicantData: CreateApplicantDto;
  additionalParams?: Record<string, unknown>;
}

export interface VendorResponse {
  vendorOrderId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  results?: Record<string, unknown>;
  errorMessage?: string;
}

export interface VendorWebhookPayload {
  vendorName: VendorName;
  vendorOrderId: string;
  status: string;
  results?: Record<string, unknown>;
  timestamp: string;
}

// ============================================================
// FILE UPLOAD TYPES
// ============================================================

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}

// ============================================================
// EMAIL TYPES
// ============================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedThisMonth: number;
  averageTurnaroundDays: number;
  ordersThisWeek: number;
  requiresAction: number;
}

// ============================================================
// ROLE PERMISSIONS
// ============================================================

export type Permission =
  | 'orders:create'
  | 'orders:read'
  | 'orders:update'
  | 'orders:cancel'
  | 'orders:export'
  | 'applicants:read'
  | 'applicants:update'
  | 'reports:download'
  | 'users:manage'
  | 'billing:read'
  | 'billing:manage'
  | 'branding:manage'
  | 'analytics:read'
  | 'adjudication:manage'
  | 'adverse-action:manage'
  | 'monitoring:manage'
  | 'disputes:manage'
  | 'api-keys:manage'
  | 'client:admin';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:cancel',
    'orders:export',
    'applicants:read',
    'applicants:update',
    'reports:download',
    'users:manage',
    'billing:read',
    'billing:manage',
    'branding:manage',
    'analytics:read',
    'adjudication:manage',
    'adverse-action:manage',
    'monitoring:manage',
    'disputes:manage',
    'api-keys:manage',
    'client:admin',
  ],
  admin: [
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:cancel',
    'orders:export',
    'applicants:read',
    'applicants:update',
    'reports:download',
    'users:manage',
    'billing:read',
    'analytics:read',
    'adjudication:manage',
    'adverse-action:manage',
    'monitoring:manage',
    'disputes:manage',
    'api-keys:manage',
  ],
  manager: [
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:cancel',
    'orders:export',
    'applicants:read',
    'applicants:update',
    'reports:download',
    'analytics:read',
    'adjudication:manage',
    'adverse-action:manage',
    'disputes:manage',
  ],
  user: [
    'orders:create',
    'orders:read',
    'orders:cancel',
    'applicants:read',
    'reports:download',
  ],
};
