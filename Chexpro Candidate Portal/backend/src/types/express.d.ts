import { CandidateUser } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: CandidateUser;
    }
  }
}

export {};
