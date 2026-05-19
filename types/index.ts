export type { AuthUser, AuthSession, AuthError, AuthErrorCode } from './auth';

export type DealStatus = 'pipeline' | 'review' | 'approved' | 'closed';

export type Recommendation = 'BUY' | 'NEGOTIATE' | 'HOLD' | 'PASS';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface UserPreferences {
  leftHandedMode: boolean;
}
