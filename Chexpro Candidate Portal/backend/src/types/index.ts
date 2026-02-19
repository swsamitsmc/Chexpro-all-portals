export type OrderStatus =
  | 'draft'
  | 'awaiting_applicant_info'
  | 'data_verification'
  | 'in_progress'
  | 'pending_review'
  | 'requires_action'
  | 'completed'
  | 'cancelled';

export type DocumentType =
  | 'photo_id_front'
  | 'photo_id_back'
  | 'proof_of_address'
  | 'other';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  applicantId?: string;
}

export interface WizardStepData {
  step1?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    gender?: string;
    sin?: string;
  };
  step2?: {
    currentAddress: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
      residenceType?: string;
      yearsAtAddress?: number;
    };
  };
  step3?: {
    addressHistory: Array<{
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
      from: string;
      to?: string;
    }>;
  };
  step4?: {
    employmentHistory: Array<{
      employer: string;
      jobTitle: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      supervisorName?: string;
      supervisorContact?: string;
      reasonForLeaving?: string;
      permissionToContact: boolean;
    }>;
  };
  step5?: {
    educationHistory: Array<{
      institution: string;
      degree: string;
      fieldOfStudy?: string;
      graduationDate?: string;
      studentId?: string;
      didNotGraduate?: boolean;
    }>;
  };
  step6?: {
    otherNames?: Array<{
      firstName: string;
      lastName: string;
      type: 'maiden' | 'legal' | 'alias';
    }>;
    licenses?: string;
    criminalDisclosure: boolean;
    criminalDetails?: string;
    additionalInfo?: string;
  };
  step7?: {
    signatureBase64: string;
    consentGiven: boolean;
  };
}

export interface CheckTimeline {
  id: string;
  status: OrderStatus;
  description: string;
  createdAt: Date;
  notes?: string;
}

export interface NotificationType {
  status_update: string;
  requires_action: string;
  check_complete: string;
  report_ready: string;
  adverse_action: string;
  reminder: string;
}
