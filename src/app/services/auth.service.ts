import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginModel, RegisterModel, AuthResponse, User, ChangePasswordModel } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/Authenticate`;
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
          
          // Set default preferences for new users
          if (!localStorage.getItem('userPreferences')) {
            const defaultPreferences = {
              canCreateTasks: true,
              canAcceptTasks: false,
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
    
    const preferences = this.getUserPreferences();
    return preferences?.canCreateTasks === true;
  }

  canAcceptTasks(): boolean {
    if (!this.isAuthenticated() || this.isAdmin()) {
      return false;
    }
    
    const preferences = this.getUserPreferences();
    return preferences?.canAcceptTasks === true;
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
    
    return hasBasicInfo && hasUserType;
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-profile`, profileData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  getUserStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
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