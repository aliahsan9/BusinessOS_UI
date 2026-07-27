export interface AccountProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  tenantId: string;
  isActive: boolean;
  roles: string[];
  joinedAt: string | null;
  lastActiveAt: string | null;
}

export interface UpdateAccountProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
