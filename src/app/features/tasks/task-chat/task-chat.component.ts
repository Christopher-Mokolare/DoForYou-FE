import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-chat.component.html',
  styleUrls: ['./task-chat.component.scss']
})
export class TaskChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() taskId!: string;
  @Input() taskTitle!: string;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  messages: any[] = [];
  newMessage = '';
  loading = false;
  sending = false;
  currentUserId: string = '';
  showNewMessageIndicator = false;
  private refreshInterval: any;
  private userHasScrolledUp = false;
  private initialLoad = true;

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = (user as any)?.userId || '';
    this.loading = true;
    this.loadMessages();
    this.refreshInterval = setInterval(() => this.loadMessages(), 3000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  onScroll(): void {
    if (!this.messagesContainer) return;
    const element = this.messagesContainer.nativeElement;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    this.userHasScrolledUp = !isAtBottom;
    
    if (isAtBottom) {
      this.showNewMessageIndicator = false;
    }
  }

  loadMessages(): void {
    this.taskService.getTaskMessages(this.taskId).subscribe({
      next: (response) => {
        if (response.success) {
          const newData = response.data || [];
          const hasNewMessages = newData.length > this.messages.length;
          const wasAtBottom = this.isScrolledNearBottom();
          
          this.messages = newData;
          this.taskService.markMessagesAsRead(this.taskId).subscribe();
          
          if (hasNewMessages) {
            requestAnimationFrame(() => {
              if (this.initialLoad || wasAtBottom || !this.userHasScrolledUp) {
                this.scrollToBottom();
              } else {
                this.showNewMessageIndicator = true;
              }
            });
          }
          
          this.initialLoad = false;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  isScrolledNearBottom(): boolean {
    if (!this.messagesContainer) return true;
    const element = this.messagesContainer.nativeElement;
    return element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.sending) return;

    this.sending = true;
    this.taskService.sendTaskMessage(this.taskId, this.newMessage).subscribe({
      next: (response) => {
        if (response.success) {
          this.newMessage = '';
          this.loadMessages();
        }
        this.sending = false;
      },
      error: () => {
        this.sending = false;
      }
    });
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        this.showNewMessageIndicator = false;
        this.userHasScrolledUp = false;
      }
    } catch(err) { }
  }

  isMyMessage(message: any): boolean {
    return message.isCurrentUser === true;
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
