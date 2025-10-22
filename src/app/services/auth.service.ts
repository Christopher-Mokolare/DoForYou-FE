import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
        console.log('User loaded successfully:', user.email);
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
          console.log('Login response:', response);
          if (response.success && response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            console.log('User logged in and stored:', response.user.email);
          }
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
      console.log('Token valid:', isValid, 'Expires:', new Date(payload.exp * 1000));
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
      console.log('Token validation - Expired:', isExpired, 'Expiry:', new Date(payload.exp * 1000));
      return !isExpired;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  }
}