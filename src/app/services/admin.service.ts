import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalTasks: number;
  pendingVerification: number;
  verifiedTasks: number;
  completedTasks: number;
  totalRevenue: number;
  pendingRevenue: number;
  urgentTasks: number;
  unclaimedTasks: number;
  recentTasks: number;
}

export interface AdminTaskQuery {
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  taskStatus?: string;
  search?: string;
  userEmail?: string;
  userContact?: string;
}

export interface BulkVerifyRequest {
  taskIds: string[];
}

export interface BulkOperationResult {
  taskId: string;
  success: boolean;
  message: string;
}

export interface PaymentsOverview {
  totalCommission: number;
  pendingCommission: number;
  runnerPayouts: number;
  completedTasks: number;
  pendingPayouts: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/dashboard`);
  }

  getTasks(query: AdminTaskQuery): Observable<any> {
    let params = new HttpParams();
    
    if (query.page) params = params.set('Page', query.page.toString());
    if (query.pageSize) params = params.set('PageSize', query.pageSize.toString());
    if (query.paymentStatus) params = params.set('PaymentStatus', query.paymentStatus);
    if (query.taskStatus) params = params.set('TaskStatus', query.taskStatus);
    if (query.search) params = params.set('Search', query.search);
    if (query.userEmail) params = params.set('UserEmail', query.userEmail);
    if (query.userContact) params = params.set('UserContact', query.userContact);

    return this.http.get(`${this.apiUrl}/tasks`, { params });
  }

  bulkVerifyPayments(request: BulkVerifyRequest): Observable<{ success: boolean; results: BulkOperationResult[] }> {
    return this.http.post<{ success: boolean; results: BulkOperationResult[] }>(
      `${this.apiUrl}/tasks/bulk-verify`, 
      request
    );
  }

  verifyPayment(taskId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/tasks/${taskId}/verify-payment`, 
      {}
    );
  }

  getPaymentsOverview(): Observable<{ success: boolean; data: PaymentsOverview }> {
    return this.http.get<{ success: boolean; data: PaymentsOverview }>(`${this.apiUrl}/payments/overview`);
  }

  getUsers(query: any): Observable<any> {
    let params = new HttpParams();
    
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.role) params = params.set('role', query.role);
    if (query.isVerified !== undefined) params = params.set('isVerified', query.isVerified.toString());

    return this.http.get(`${this.apiUrl}/users`, { params });
  }
}