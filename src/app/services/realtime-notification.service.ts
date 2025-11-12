import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  taskId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeNotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private authService: AuthService) {
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    if (!this.authService.isAuthenticated()) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/notificationHub`, {
        accessTokenFactory: () => this.authService.getToken() || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: any) => {
      this.addNotification({
        id: notification.id || Date.now().toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: new Date(notification.timestamp || Date.now()),
        read: false,
        taskId: notification.taskId
      });
    });

    this.hubConnection.on('TaskClaimed', (data: any) => {
      this.addNotification({
        id: Date.now().toString(),
        title: 'Task Claimed',
        message: `Your task "${data.taskDescription}" has been claimed by ${data.helperName}`,
        type: 'success',
        timestamp: new Date(),
        read: false,
        taskId: data.taskId
      });
    });

    this.hubConnection.on('PaymentVerified', (data: any) => {
      this.addNotification({
        id: Date.now().toString(),
        title: 'Payment Verified',
        message: `Payment for task ${data.taskId} has been verified`,
        type: 'success',
        timestamp: new Date(),
        read: false,
        taskId: data.taskId
      });
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error establishing SignalR connection:', error);
    }
  }

  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications].slice(0, 50); // Keep last 50
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    
    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png'
      });
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  public markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  public markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  public clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  public async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.initializeConnection();
  }
}