import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TaskDetail {
  id: string;
  taskId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  status: string;
  priority: string;
  createdAt: string;
  dueDate: string;
  creatorName: string;
  creatorContact: string;
  runnerName?: string;
  runnerContact?: string;
  runnerId?: string;
  createdByUserId: string;
  completedAt?: string;
  notes?: string;
  progressUpdates: ProgressUpdate[];
  canEdit: boolean;
  canComplete: boolean;
  canCancel: boolean;
}

export interface ProgressUpdate {
  id: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface TaskMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;
  
  // Real-time updates subject
  private taskUpdatesSubject = new BehaviorSubject<any>(null);
  public taskUpdates$ = this.taskUpdatesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get detailed task information
  getTaskDetail(taskId: string): Observable<ApiResponse<TaskDetail>> {
    return this.http.get<ApiResponse<TaskDetail>>(`${this.apiUrl}/${taskId}/detail`);
  }

  // Progress Management
  addProgressUpdate(taskId: string, message: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/progress`, {
      progressNote: message
    });
  }

  getProgressUpdates(taskId: string): Observable<ApiResponse<ProgressUpdate[]>> {
    return this.http.get<ApiResponse<ProgressUpdate[]>>(`${this.apiUrl}/${taskId}/progress`);
  }

  // Task Status Management
  completeTask(taskId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/complete`, {});
  }

  confirmTask(taskId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/confirm`, {});
  }

  cancelTask(taskId: string, reason: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/cancel`, {
      reason: reason
    });
  }

  // Communication
  sendTaskMessage(taskId: string, message: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/messages`, {
      content: message
    });
  }

  getTaskMessages(taskId: string): Observable<ApiResponse<TaskMessage[]>> {
    return this.http.get<ApiResponse<TaskMessage[]>>(`${this.apiUrl}/${taskId}/messages`);
  }

  markMessagesAsRead(taskId: string): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/messages/read`, {});
  }

  // Task Management for Dashboard
  getMyActiveTasks(): Observable<ApiResponse<TaskDetail[]>> {
    return this.http.get<ApiResponse<TaskDetail[]>>(`${this.apiUrl}/my-active`);
  }

  getMyPostedTasks(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-posted`);
  }

  getMyCompletedTasks(): Observable<ApiResponse<TaskDetail[]>> {
    return this.http.get<ApiResponse<TaskDetail[]>>(`${this.apiUrl}/my-completed`);
  }

  // Dashboard Statistics
  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard/stats`);
  }

  getRecentActivity(limit: number = 5): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/dashboard/activity`, { params });
  }

  // Task Search and Filtering
  searchTasks(query: string, filters?: any): Observable<ApiResponse<TaskDetail[]>> {
    let params = new HttpParams().set('search', query);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    
    return this.http.get<ApiResponse<TaskDetail[]>>(`${this.apiUrl}/search`, { params });
  }

  // Notifications
  getUnreadNotifications(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/notifications/unread`);
  }

  markNotificationAsRead(notificationId: string): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  // Task Rating and Reviews
  rateTask(taskId: string, rating: number, review?: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/rate`, {
      rating: rating,
      review: review
    });
  }

  getTaskRating(taskId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${taskId}/rating`);
  }

  // Dispute Management
  reportIssue(taskId: string, issue: string, category: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${taskId}/report`, {
      issue: issue,
      category: category
    });
  }

  // Task Analytics
  getTaskAnalytics(period: string = 'month'): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics`, { params });
  }

  // Cleanup and Maintenance
  cleanupOrphanedTasks(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/cleanup`, {});
  }

  // Real-time Updates
  subscribeToTaskUpdates(taskId: string): void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling
    setInterval(() => {
      this.getTaskDetail(taskId).subscribe(response => {
        if (response.success) {
          this.taskUpdatesSubject.next(response.data);
        }
      });
    }, 30000); // Poll every 30 seconds
  }

  // Utility Methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  calculateCommission(amount: number): number {
    return amount * 0.15; // 15% commission
  }

  calculateRunnerEarning(amount: number): number {
    return amount - this.calculateCommission(amount);
  }

  getTaskStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'posted': return '#28a745';
      case 'claimed': return '#ffc107';
      case 'completed': return '#007bff';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getTaskPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'standard': return '#17a2b8';
      case 'low': return '#6c757d';
      default: return '#17a2b8';
    }
  }
}