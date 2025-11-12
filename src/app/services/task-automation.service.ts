import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface TaskStatus {
  taskId: string;
  status: string;
  paymentStatus: string;
  lastUpdated: Date;
  autoActions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TaskAutomationService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Auto-refresh task status every 30 seconds for active tasks
  getTaskStatusUpdates(taskId: string): Observable<TaskStatus> {
    return interval(30000).pipe(
      filter(() => this.authService.isAuthenticated()),
      switchMap(() => this.getTaskStatus(taskId))
    );
  }

  private getTaskStatus(taskId: string): Observable<TaskStatus> {
    return this.http.get<TaskStatus>(`${this.apiUrl}/Tasks/${taskId}/status`);
  }

  // Check for overdue tasks
  checkOverdueTasks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Tasks/overdue`);
  }

  // Auto-claim task based on user preferences
  autoClaimTask(taskId: string, preferences: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Tasks/${taskId}/auto-claim`, preferences);
  }

  // Get automation suggestions for user
  getAutomationSuggestions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/automation/suggestions`);
  }

  // Enable/disable auto-features
  updateAutomationSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/automation-settings`, settings);
  }

  // Get task completion predictions
  getTaskPredictions(taskId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/Tasks/${taskId}/predictions`);
  }

  // Auto-rate completed tasks
  autoRateTask(taskId: string, rating: number, feedback?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Tasks/${taskId}/auto-rate`, {
      rating,
      feedback,
      automated: true
    });
  }

  // Schedule task reminders
  scheduleReminder(taskId: string, reminderTime: Date): Observable<any> {
    return this.http.post(`${this.apiUrl}/Tasks/${taskId}/reminder`, {
      reminderTime: reminderTime.toISOString()
    });
  }

  // Get task analytics for automation insights
  getTaskAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/tasks`);
  }
}