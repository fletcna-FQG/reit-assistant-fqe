export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'weak_password'
  | 'invalid_credentials'
  | 'network_error'
  | 'unknown';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode = 'unknown') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
