import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: number;
  taskId: number;
  senderId: number;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private hubConnection?: signalR.HubConnection;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private typingSubject = new BehaviorSubject<{ taskId: number; userId: number; isTyping: boolean } | null>(null);
  private connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');

  public messages$ = this.messagesSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();

  constructor() {}

  // Initialize SignalR connection
  async connect(token: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connectionStateSubject.next('connecting');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalRUrl}`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register event handlers
    this.registerEventHandlers();

    try {
      await this.hubConnection.start();
      this.connectionStateSubject.next('connected');
      console.log('SignalR Connected');
    } catch (err) {
      console.error('SignalR Connection Error:', err);
      this.connectionStateSubject.next('disconnected');
      throw err;
    }
  }

  // Disconnect
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionStateSubject.next('disconnected');
    }
  }

  // Send chat message
  async sendMessage(taskId: number, message: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendMessage', taskId, message);
    }
  }

  // Send typing indicator
  async sendTyping(taskId: number, isTyping: boolean): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('Typing', taskId, isTyping);
    }
  }

  // Join task chat room
  async joinTaskChat(taskId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinTaskChat', taskId);
    }
  }

  // Leave task chat room
  async leaveTaskChat(taskId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveTaskChat', taskId);
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('MarkAsRead', messageId);
    }
  }

  // Private: Register event handlers
  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    // Receive message
    this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    // User typing
    this.hubConnection.on('UserTyping', (data: { taskId: number; userId: number; isTyping: boolean }) => {
      this.typingSubject.next(data);
    });

    // Receive notification
    this.hubConnection.on('NewNotification', (notification: Notification) => {
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([notification, ...currentNotifications]);
      
      // Show browser notification if supported
      this.showBrowserNotification(notification);
    });

    // Task status updated
    this.hubConnection.on('TaskStatusUpdated', (data: { taskId: number; status: string }) => {
      console.log('Task status updated:', data);
      // Emit event or update state as needed
    });

    // Connection events
    this.hubConnection.onreconnecting(() => {
      this.connectionStateSubject.next('connecting');
      console.log('SignalR Reconnecting...');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStateSubject.next('connected');
      console.log('SignalR Reconnected');
    });

    this.hubConnection.onclose(() => {
      this.connectionStateSubject.next('disconnected');
      console.log('SignalR Disconnected');
    });
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/logo.png',
        badge: '/assets/badge.png',
        tag: notification.id.toString()
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // Get connection state
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  // Clear messages
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  // Clear notifications
  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }
}
