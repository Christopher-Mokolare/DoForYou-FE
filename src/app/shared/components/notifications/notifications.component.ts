import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: number;
  createdAt: Date;
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
  loading = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadNotifications();
  }

  get hasUnreadNotifications(): boolean {
    return this.notifications.some(n => !n.isRead);
  }

  private loadNotifications(): void {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/notifications`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notifications = response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
      }
    });
  }

  getIconClass(type: string): string {
    const icons: Record<string, string> = {
      'task_claimed': 'fa-hand-paper',
      'task_completed': 'fa-check-circle',
      'payment_received': 'fa-money-bill-wave',
      'new_message': 'fa-envelope',
      'system': 'fa-cog'
    };
    return icons[type] || 'fa-bell';
  }

  getIconBgClass(type: string): string {
    if (type.includes('task')) return 'bg-task';
    if (type.includes('payment')) return 'bg-payment';
    if (type.includes('message')) return 'bg-message';
    return 'bg-system';
  }

  markAsRead(notification: Notification): void {
    this.http.post(`${environment.apiUrl}/notifications/${notification.id}/mark-read`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          notification.isRead = true;
        }
      },
      error: () => {
        console.error('Failed to mark notification as read');
      }
    });
  }

  handleNotificationClick(notification: Notification): void {
    console.log('Notification clicked:', notification);
    console.log('Related Task ID:', notification.relatedTaskId);
    console.log('Notification Type:', notification.type);
    
    this.markAsRead(notification);
    
    if (notification.type === 'new_message' || notification.type.includes('message')) {
      if (notification.relatedTaskId) {
        console.log('Navigating to chat:', `/tasks/chat/${notification.relatedTaskId}`);
        this.router.navigate(['/tasks/chat', notification.relatedTaskId]);
      } else {
        console.log('No task ID found, trying to extract from message or navigating to messages list');
        // Try to extract task info from message and navigate to messages list
        // User can select the conversation from there
        this.router.navigate(['/messages']);
      }
    } else if (notification.relatedTaskId) {
      console.log('Navigating to task details:', notification.relatedTaskId);
      this.router.navigate(['/task-details', notification.relatedTaskId]);
    }
  }

  markAllAsRead(): void {
    this.http.post(`${environment.apiUrl}/notifications/mark-all-read`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notifications.forEach(n => n.isRead = true);
        }
      },
      error: () => {
        console.error('Failed to mark all notifications as read');
      }
    });
  }

  clearAll(): void {
    const deletePromises = this.notifications.map(n => 
      this.http.delete(`${environment.apiUrl}/notifications/${n.id}`).toPromise()
    );
    
    Promise.all(deletePromises).then(() => {
      this.notifications = [];
    }).catch(() => {
      console.error('Failed to clear notifications');
    });
  }

  deleteNotification(notification: Notification): void {
    this.http.delete(`${environment.apiUrl}/notifications/${notification.id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          const index = this.notifications.indexOf(notification);
          if (index > -1) {
            this.notifications.splice(index, 1);
          }
        }
      },
      error: () => {
        console.error('Failed to delete notification');
      }
    });
  }

  viewTask(notification: Notification): void {
    if (notification.type === 'new_message' || notification.type.includes('message')) {
      if (notification.relatedTaskId) {
        this.router.navigate(['/tasks/chat', notification.relatedTaskId]);
      } else {
        this.router.navigate(['/messages']);
      }
    } else if (notification.relatedTaskId) {
      this.router.navigate(['/task-details', notification.relatedTaskId]);
    }
  }
}