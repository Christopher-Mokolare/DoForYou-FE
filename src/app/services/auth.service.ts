import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginModel, RegisterModel, AuthResponse, User, ChangePasswordModel } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/v1/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private http = inject(HttpClient);

  constructor() {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('currentUser');
    
    console.log('Loading current user - Token exists:', !!token, 'User exists:', !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.log('User loaded successfully');
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    } else {
      console.log('No user data found in localStorage');
    }
  }

  register(registerData: RegisterModel): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData);
  }

login(loginData: LoginModel): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
    .pipe(
      tap(response => {
        console.log('Login response received');
        if (response.success && response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          
          // Set preferences based on registration userType
          if (!localStorage.getItem('userPreferences') && response.user) {
            const userType = response.user.userType;
            const defaultPreferences = {
              canCreateTasks: userType === 'creator' || userType === 'both',
              canAcceptTasks: userType === 'runner' || userType === 'both',
              taskCreatorNotifications: true,
              taskRunnerNotifications: true,
              paymentNotifications: true,
              emailNotifications: true,
              smsNotifications: false
            };
            localStorage.setItem('userPreferences', JSON.stringify(defaultPreferences));
          }
          
          console.log('User logged in successfully');
        }
      }),
      catchError(error => {
        console.error('Login failed with status:', error?.status || 'unknown');
        if (error.status === 0) {
          console.error('Backend connection failed');
        }
        return throwError(() => error);
      })
    );
}

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    console.log('User logged out');
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('Retrieving token from storage:', !!token);
    return token;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp > Date.now() / 1000;
      console.log('Token validation completed');
      return isValid;
    } catch {
      return false;
    }
  }

  changePassword(changePasswordData: ChangePasswordModel): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, changePasswordData);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes('Admin') || false;
  }

  canPostErrands(): boolean {
    if (!this.isAuthenticated() || this.isAdmin()) {
      return false;
    }
    
    const user = this.getCurrentUser();
    const userType = (user as any)?.userType;
    
    // Check userType first, then fall back to preferences
    if (userType) {
      return userType === 'creator' || userType === 'both';
    }
    
    const preferences = this.getUserPreferences();
    return preferences?.canCreateTasks === true;
  }

  canAcceptTasks(): boolean {
    if (!this.isAuthenticated() || this.isAdmin()) {
      return false;
    }
    
    const user = this.getCurrentUser();
    const userType = (user as any)?.userType;
    
    // Check userType first, then fall back to preferences
    if (userType) {
      return userType === 'runner' || userType === 'both';
    }
    
    const preferences = this.getUserPreferences();
    return preferences?.canAcceptTasks === true;
  }

  // Business rule: Check if user can create tasks
  canCreateTasks(): boolean {
    if (!this.isAuthenticated() || this.isAdmin()) {
      return false;
    }
    
    const user = this.getCurrentUser();
    const userType = (user as any)?.userType;
    
    // Check userType first, then fall back to preferences
    if (userType) {
      return userType === 'creator' || userType === 'both';
    }
    
    const preferences = this.getUserPreferences();
    return preferences?.canCreateTasks === true;
  }

  // Business rule: Check if user can claim tasks
  canClaimTasks(): boolean {
    return this.canAcceptTasks();
  }

  // Business rule: Update user preferences
  updateUserPreferences(preferences: any): void {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }

  private getUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    return saved ? JSON.parse(saved) : { canCreateTasks: true, canAcceptTasks: false };
  }

  refreshCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  }

  isProfileComplete(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const preferences = this.getUserPreferences();
    const hasBasicInfo = user.name && user.email && user.contact;
    const hasUserType = preferences && (preferences.canCreateTasks || preferences.canAcceptTasks);
    const hasNewFields = user.firstName && user.lastName; // Check for new required fields
    
    return hasBasicInfo && hasUserType && hasNewFields;
  }

  needsProfileUpdate(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Check if user is missing new required fields OR has old format data
    const hasNewFormat = !!(user.firstName && user.lastName && user.userType);
    const hasOldFormatOnly = !!(user.name && !user.firstName); // Has old 'name' but no 'firstName'
    
    return !hasNewFormat || hasOldFormatOnly;
  }

  isProfileIncomplete(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const userType = (user as any)?.userType;
    const profileCompletion = (user as any).profileCompletion || 0;
    
    // For runners, require higher completion (need ID, address, bank details)
    if (userType === 'runner') {
      const hasRequiredFields = !!(user as any).idNumber && !!(user as any).address;
      return profileCompletion < 80 || !hasRequiredFields;
    }
    
    // For creators, standard completion check
    return profileCompletion < 80;
  }

  getProfileCompletion(): number {
    const user = this.getCurrentUser();
    if (!user) return 0;
    
    return (user as any).profileCompletion || 0;
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/v1/user/profile`, profileData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/v1/user/profile`);
  }



  verifyEmail(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/v1/user/send-verification-email`, {});
  }

  verifyPhone(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/v1/user/verify-phone`, {});
  }

  // Helper method to check token validity with detailed logging
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('No token found');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp < (Date.now() / 1000);
      console.log('Token validation completed');
      return !isExpired;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  }
}