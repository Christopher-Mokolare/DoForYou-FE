import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isCurrentUser: boolean;
  status: 'sent' | 'delivered' | 'read';
}

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
  
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  loadingMore = false;
  sending = false;
  currentUserId: string = '';
  currentUserName: string = '';
  showNewMessageIndicator = false;
  
  // Pagination properties
  currentPage = 0;
  pageSize = 50;
  hasMoreMessages = true;
  totalMessages = 0;
  
  private refreshInterval: any;
  private userHasScrolledUp = false;
  private initialLoad = true;
  private previousScrollHeight = 0;
  private isLoadingHistory = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = (user as any)?.userId || '';
    this.currentUserName = (user as any)?.name || 'You';
    this.loading = true;
    this.loadMessages();
    // Increase polling to 5 seconds to reduce blinking
    this.refreshInterval = setInterval(() => this.loadMessages(), 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewInit(): void {
    // Aggressively scroll to bottom on initial load
    this.scrollToBottomAfterRender();
    
    // Additional attempts to ensure scroll
    setTimeout(() => this.forceScrollToBottom(), 200);
    setTimeout(() => this.forceScrollToBottom(), 500);
    setTimeout(() => this.forceScrollToBottom(), 1000);
  }

  private scrollToBottomAfterRender(): void {
    requestAnimationFrame(() => {
      this.forceScrollToBottom();
      setTimeout(() => this.forceScrollToBottom(), 0);
      setTimeout(() => this.forceScrollToBottom(), 50);
      setTimeout(() => this.forceScrollToBottom(), 100);
      setTimeout(() => this.forceScrollToBottom(), 200);
    });
  }

  onScroll(): void {
    if (!this.messagesContainer) return;
    
    const element = this.messagesContainer.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
    
    this.userHasScrolledUp = !isAtBottom;
    
    if (isAtBottom) {
      this.showNewMessageIndicator = false;
    }
    
    // Check if user scrolled to the TOP to load older messages
    if (scrollTop < 50 && this.hasMoreMessages && !this.loadingMore && !this.isLoadingHistory) {
      this.loadOlderMessages();
    }
  }

  loadMessages(): void {
    // Don't reload if we're loading history
    if (this.isLoadingHistory) return;
    
    this.taskService.getTaskMessages(this.taskId).subscribe({
      next: (response) => {
        if (response.success) {
          const newData = response.data || [];
          
          // Update total messages count
          if (response.total) {
            this.totalMessages = response.total;
            this.hasMoreMessages = this.messages.length < this.totalMessages;
          }
          
          // Only update if messages actually changed
          if (this.hasMessagesChanged(newData)) {
            const wasAtBottom = this.isScrolledNearBottom();
            
            // For initial load, replace all messages
            if (this.initialLoad) {
              this.messages = newData.map((msg: any) => ({
                ...msg,
                status: this.getMessageStatus(msg)
              }));
              
              // Force scroll to bottom on initial load
              setTimeout(() => this.scrollToBottomAfterRender(), 100);
              setTimeout(() => this.forceScrollToBottom(), 300);
              setTimeout(() => this.forceScrollToBottom(), 600);
            } else {
              // For subsequent loads, merge new messages at the end
              const existingIds = new Set(this.messages.map(m => m.id));
              const newMessages = newData
                .filter((msg: any) => !existingIds.has(msg.id))
                .map((msg: any) => ({
                  ...msg,
                  status: this.getMessageStatus(msg)
                }));
              
              if (newMessages.length > 0) {
                this.messages = [...this.messages, ...newMessages];
                
                // Always scroll to bottom for new messages if user was at bottom
                if (wasAtBottom) {
                  setTimeout(() => this.forceScrollToBottom(), 0);
                  setTimeout(() => this.forceScrollToBottom(), 100);
                } else if (this.userHasScrolledUp) {
                  this.showNewMessageIndicator = true;
                }
              }
            }
            
            if (this.messages.some(m => !m.isCurrentUser && m.status !== 'read')) {
              this.taskService.markMessagesAsRead(this.taskId).subscribe();
            }
            
            this.initialLoad = false;
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private hasMessagesChanged(newData: any[]): boolean {
    if (newData.length !== this.messages.length) {
      return true;
    }
    
    for (let i = 0; i < newData.length; i++) {
      const newMsg = newData[i];
      const oldMsg = this.messages[i];
      
      if (!oldMsg || 
          newMsg.id !== oldMsg.id || 
          newMsg.content !== oldMsg.content ||
          newMsg.timestamp !== oldMsg.timestamp) {
        return true;
      }
    }
    
    return false;
  }

  isScrolledNearBottom(): boolean {
    if (!this.messagesContainer) return true;
    const element = this.messagesContainer.nativeElement;
    // Consider "near bottom" if within 150px of bottom
    return element.scrollHeight - element.scrollTop <= element.clientHeight + 150;
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.sending) return;

    const messageText = this.newMessage.trim();
    this.sending = true;
    
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      content: messageText,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      timestamp: new Date().toISOString(),
      isCurrentUser: true,
      status: 'sent'
    };
    
    this.messages.push(tempMessage);
    this.newMessage = '';
    
    // Force scroll after Angular updates the view
    setTimeout(() => this.forceScrollToBottom(), 0);
    
    this.taskService.sendTaskMessage(this.taskId, messageText).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMessages();
        } else {
          this.messages = this.messages.filter(m => m.id !== tempMessage.id);
        }
        this.sending = false;
      },
      error: () => {
        this.messages = this.messages.filter(m => m.id !== tempMessage.id);
        this.sending = false;
      }
    });
  }

  scrollToBottom(smooth: boolean = false): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        
        // Force scroll to the absolute bottom
        const scrollToPosition = element.scrollHeight;
        
        if (smooth) {
          element.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
          });
        } else {
          element.scrollTop = scrollToPosition;
        }
        
        // Double-check after a brief delay to ensure it scrolled
        setTimeout(() => {
          element.scrollTop = element.scrollHeight;
        }, 50);
        
        this.showNewMessageIndicator = false;
        this.userHasScrolledUp = false;
      }
    } catch(err) { }
  }

  private forceScrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        // Force scroll to absolute maximum
        element.scrollTop = element.scrollHeight + 1000;
        
        // Verify scroll worked and retry if needed
        setTimeout(() => {
          if (element.scrollTop + element.clientHeight < element.scrollHeight - 5) {
            element.scrollTop = element.scrollHeight + 1000;
          }
        }, 50);
        
        this.showNewMessageIndicator = false;
        this.userHasScrolledUp = false;
      }
    } catch(err) { }
  }

  isMyMessage(message: Message): boolean {
    return message.isCurrentUser === true;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);
    
    if (diffDays === 0) {
      if (diffHours < 1) {
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  private getMessageStatus(message: any): 'sent' | 'delivered' | 'read' {
    if (!message.isCurrentUser) return 'sent';
    if (message.read) return 'read';
    if (message.delivered) return 'delivered';
    return 'sent';
  }
  
  getMessageStatusIcon(status: string): string {
    switch(status) {
      case 'sent': return 'fa-check';
      case 'delivered': return 'fa-check-double';
      case 'read': return 'fa-check-double read';
      default: return 'fa-check';
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadOlderMessages(): void {
    if (this.loadingMore || !this.hasMoreMessages || this.messages.length === 0) return;
    
    this.loadingMore = true;
    this.isLoadingHistory = true;
    
    // Save current scroll position and height
    this.previousScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
    
    const oldestMessageId = this.messages[0]?.id;
    
    this.taskService.getTaskMessages(this.taskId, {
      before: oldestMessageId,
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const olderMessages = response.data.map((msg: any) => ({
            ...msg,
            status: this.getMessageStatus(msg)
          }));
          
          // Check if we received fewer messages than requested (no more messages)
          if (response.data.length < this.pageSize) {
            this.hasMoreMessages = false;
          }
          
          // Insert older messages at the beginning
          this.messages = [...olderMessages, ...this.messages];
          
          // Maintain scroll position after messages are added above
          setTimeout(() => this.restoreScrollPosition(), 0);
        } else {
          this.hasMoreMessages = false;
        }
        
        this.loadingMore = false;
        
        // Small delay to prevent multiple triggers
        setTimeout(() => {
          this.isLoadingHistory = false;
        }, 500);
      },
      error: () => {
        this.loadingMore = false;
        this.isLoadingHistory = false;
      }
    });
  }

  private restoreScrollPosition(): void {
    if (!this.messagesContainer) return;
    
    const element = this.messagesContainer.nativeElement;
    const newScrollHeight = element.scrollHeight;
    const scrollDifference = newScrollHeight - this.previousScrollHeight;
    
    // Restore scroll position by adding the difference to current scrollTop
    element.scrollTop = scrollDifference + 10; // +10 to account for padding/margins
  }
}
