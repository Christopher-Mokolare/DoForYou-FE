import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'task' | 'payment' | 'message' | 'system';
  read: boolean;
  timestamp: Date;
  taskId?: number;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  currentUser: any = null;
  preferences = {
    taskCreator: true,
    taskRunner: true,
    payments: true
  };
  loading = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadNotifications();
    this.loadPreferences();
  }

  get hasUnreadNotifications(): boolean {
    return this.notifications.some(n => !n.read);
  }

  private loadNotifications(): void {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/api/notifications`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notifications = response.notifications || [];
        }
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
      }
    });
  }

  private loadPreferences(): void {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      this.preferences = JSON.parse(saved);
    }
  }

  getIconClass(type: string): string {
    const icons: Record<string, string> = {
      'task': 'fa-tasks',
      'payment': 'fa-money-bill-wave',
      'message': 'fa-envelope',
      'system': 'fa-cog'
    };
    return icons[type] || 'fa-bell';
  }

  getIconBgClass(type: string): string {
    return `bg-${type}`;
  }

  markAsRead(notification: Notification): void {
    this.http.post(`${environment.apiUrl}/api/notifications/${notification.id}/mark-read`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          notification.read = true;
        }
      },
      error: () => {
      }
    });
  }

  markAllAsRead(): void {
    this.http.post(`${environment.apiUrl}/api/notifications/mark-all-read`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notifications.forEach(n => n.read = true);
        }
      },
      error: () => {
      }
    });
  }

  clearAll(): void {
    const deletePromises = this.notifications.map(n => 
      this.http.delete(`${environment.apiUrl}/api/notifications/${n.id}`).toPromise()
    );
    
    Promise.all(deletePromises).then(() => {
      this.notifications = [];
    }).catch(() => {
    });
  }

  deleteNotification(notification: Notification): void {
    this.http.delete(`${environment.apiUrl}/api/notifications/${notification.id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          const index = this.notifications.indexOf(notification);
          if (index > -1) {
            this.notifications.splice(index, 1);
          }
        }
      },
      error: () => {
      }
    });
  }

  viewTask(notification: Notification): void {
    if (notification.taskId) {
      window.location.href = `/task-details/${notification.taskId}`;
    }
  }

  updatePreferences(): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }
}