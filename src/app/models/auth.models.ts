export interface LoginModel {
  email: string;
  password: string;
}

export interface RegisterModel {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: string;
  idNumber?: string;
  address: string;
  dateOfBirth?: string;
  username?: string;
  password: string;
  confirmPassword?: string;
}

export interface User {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  contact: string;
  phoneNumber?: string;
  userType?: string;
  isVerified: boolean;
  profileCompleted: boolean;
  rating: number;
  completedTasks: number;
  createdAt: string;
  lastLoginAt?: string;

  roles?: string[];
  isAdmin?: boolean;
  canCreateTasks?: boolean;
  canAcceptTasks?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiration?: string;
}

export interface ChangePasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}