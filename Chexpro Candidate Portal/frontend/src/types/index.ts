export interface User {
  id: string;
  email: string;
  role: string;
  applicantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  ssnLast4: string;
  currentAddress?: Address;
  addressHistory?: Address[];
  employmentHistory?: Employment[];
  educationHistory?: Education[];
  additionalInfo?: AdditionalInfo;
  signature?: string;
  signatureDate?: string;
  wizardStep: number;
  wizardCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isCurrent: boolean;
  moveInDate: string;
  moveOutDate?: string;
}

export interface Employment {
  id?: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  reasonForLeaving?: string;
}

export interface Education {
  id?: string;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrentlyEnrolled: boolean;
}

export interface AdditionalInfo {
  consentedToBackgroundCheck: boolean;
  convictedOfCrime: boolean;
  crimeDetails?: string;
  authorizedToWork: boolean;
  immigrationStatus?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  applicantId: string;
  status: OrderStatus;
  packageType: string;
  packagePrice: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_adverse_action'
  | 'adverse_action'
  | 'completed'
  | 'cancelled';

export interface Check {
  id: string;
  orderId: string;
  checkType: string;
  status: CheckStatus;
  result?: string;
  notes?: string;
  initiatedAt: string;
  completedAt?: string;
}

export type CheckStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Applicant {
  id: string;
  userId: string;
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  ssn?: string;
  status: string;
  portalCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  applicantId: string;
  orderId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  verified?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

export type NotificationType =
  | 'status_update'
  | 'document_request'
  | 'wizard_reminder'
  | 'adverse_action'
  | 'check_complete'
  | 'general';

export interface WizardStepData {
  step: number;
  data: Record<string, unknown>;
}

export interface CheckTimeline {
  id: string;
  orderId: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface InvitationValidation {
  valid: boolean;
  invitation?: CandidateInvitation;
  error?: string;
}

export interface CandidateInvitation {
  id: string;
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  clientName: string;
  positionTitle: string;
  orderId: string;
  expiresAt: string;
  registrationCompletedAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  invitationToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
