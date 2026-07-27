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
