export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GoogleSignInResponse {
  status: 'authenticated' | 'registration_required';
  auth?: AuthResponse | null;
  continuationToken?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  message?: string | null;
}

export interface CompleteGoogleRegistrationRequest {
  continuationToken: string;
  businessName: string;
  firstName: string;
  lastName: string;
}

export interface GoogleRegistrationPending {
  continuationToken: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const PASSWORD_RESET_PUBLIC_MESSAGE =
  "If an account exists for this email address, we'll send instructions to reset your password.";

export interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  expiresAt: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface RememberMeCredentials {
  email: string;
}
