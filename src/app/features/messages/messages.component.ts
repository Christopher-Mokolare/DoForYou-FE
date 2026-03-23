import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Conversation {
  taskId: number;
  taskTitle: string;
  otherUser: {
    id: number;
    name: string;
    initials: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  taskStatus: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {
  conversations: Conversation[] = [];
  loading = false;
  currentUserId: number = 0;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || 0;
    this.loadConversations();
  }

  private loadConversations(): void {
    this.loading = true;
    
    // Load both posted and active tasks to get all conversations
    Promise.all([
      this.http.get(`${environment.apiUrl}/tasks/my-posted`).toPromise(),
      this.http.get(`${environment.apiUrl}/tasks/my-active`).toPromise()
    ]).then(([postedResponse, activeResponse]: any[]) => {
      const conversations: Conversation[] = [];
      
      // Process posted tasks (where user is the poster)
      if (postedResponse?.success && postedResponse.data) {
        const postedTasks = Array.isArray(postedResponse.data) ? postedResponse.data : postedResponse.data.tasks || [];
        postedTasks.forEach((task: any) => {
          if (task.claimedBy || task.ClaimedBy) {
            const runner = task.claimedBy || task.ClaimedBy;
            conversations.push({
              taskId: task.taskId || task.TaskId,
              taskTitle: task.description || task.Description || task.taskDescription,
              otherUser: {
                id: runner.id || runner.Id,
                name: runner.name || runner.Name || 'Runner',
                initials: this.getInitials(runner.name || runner.Name || 'Runner')
              },
              lastMessage: 'Chat with runner',
              lastMessageTime: new Date(task.updatedAt || task.UpdatedAt || task.createdAt),
              unreadCount: 0,
              taskStatus: task.status || task.Status
            });
          }
        });
      }
      
      // Process active tasks (where user is the runner)
      if (activeResponse?.success && activeResponse.data) {
        const activeTasks = Array.isArray(activeResponse.data) ? activeResponse.data : activeResponse.data.tasks || [];
        activeTasks.forEach((task: any) => {
          const poster = task.postedBy || task.PostedBy;
          if (poster) {
            conversations.push({
              taskId: task.taskId || task.TaskId,
              taskTitle: task.description || task.Description || task.taskDescription,
              otherUser: {
                id: poster.id || poster.Id,
                name: poster.name || poster.Name || 'Poster',
                initials: this.getInitials(poster.name || poster.Name || 'Poster')
              },
              lastMessage: 'Chat with poster',
              lastMessageTime: new Date(task.updatedAt || task.UpdatedAt || task.createdAt),
              unreadCount: 0,
              taskStatus: task.status || task.Status
            });
          }
        });
      }
      
      // Sort by last message time
      this.conversations = conversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      
      this.loading = false;
    }).catch(error => {
      console.error('Failed to load conversations:', error);
      this.loading = false;
    });
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  openChat(conversation: Conversation): void {
    this.router.navigate(['/tasks/chat', conversation.taskId], {
      queryParams: { title: conversation.taskTitle }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return 'badge-success';
    if (statusLower === 'claimed' || statusLower === 'inprogress') return 'badge-primary';
    if (statusLower === 'posted') return 'badge-info';
    return 'badge-secondary';
  }
}
