import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminDashboard {
  totalUsers: number;
  totalTasks: number;
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalRevenue: number;
  recentTasks: any[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  contact: string;
  role: string;
  isVerified: boolean;
  profileCompleted: boolean;
  tasksPosted: number;
  tasksCompleted: number;
  rating: number;
  lastLoginAt: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<{success: boolean, data: AdminDashboard}> {
    return this.http.get<{success: boolean, data: AdminDashboard}>(`${this.apiUrl}/dashboard`);
  }

  getPaymentsOverview(): Observable<{success: boolean, data: any}> {
    return this.http.get<{success: boolean, data: any}>(`${this.apiUrl}/payments`);
  }

  getTasks(query?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks`, { params: query });
  }

  verifyPayment(taskId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${taskId}/verify`, {});
  }

  unverifyPayment(taskId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${taskId}/unverify`, {});
  }

  bulkVerifyPayments(taskIds: string[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/bulk-verify`, { taskIds });
  }

  getUsers(query?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { params: query });
  }

  updateUserStatus(userId: number, isVerified: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/status`, { isVerified });
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/role`, { role });
  }
}