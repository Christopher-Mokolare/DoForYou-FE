export interface LoginModel {
  email: string;
  password: string;
}

export interface RegisterModel {
  name: string;
  email: string;
  contact: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  contact: string;
  isVerified: boolean;
  profileCompleted: boolean;
  rating: number;
  completedTasks: number;
  createdAt: string;
  lastLoginAt?: string;

  roles?: string[];
  isAdmin?: boolean; 
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