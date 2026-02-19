import { UserRole, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      clientId: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      firstName: string | null;
      lastName: string | null;
    }
  }
}

export {};
