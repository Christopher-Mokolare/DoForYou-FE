import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';

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

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  task: TaskDetail | null = null;
  loading = true;
  error: string | null = null;
  
  progressMessage = '';
  newMessage = '';
  messages: any[] = [];
  
  currentUserId = '';
  isCreator = false;
  isRunner = false;
  
  refreshSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (!taskId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = (currentUser as any)?.id?.toString() || '';

    this.loadTaskDetail(taskId);
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private loadTaskDetail(taskId: string): void {
    this.loading = true;
    this.error = null;

    this.taskService.getTaskDetail(taskId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.task = response.data;
          this.isCreator = this.task.createdByUserId === this.currentUserId;
          this.isRunner = this.task.runnerId === this.currentUserId;
          this.loadMessages();
        } else {
          this.error = 'Task not found';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load task details';
        this.loading = false;
      }
    });
  }

  private loadMessages(): void {
    if (!this.task) return;
    
    this.taskService.getTaskMessages(this.task.taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.data || [];
        }
      },
      error: (error) => {
      }
    });
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(30000).subscribe(() => {
      if (this.task) {
        this.loadTaskDetail(this.task.taskId);
      }
    });
  }

  addProgressUpdate(): void {
    if (!this.task || !this.progressMessage.trim()) return;

    this.taskService.addProgressUpdate(this.task.taskId, this.progressMessage).subscribe({
      next: (response) => {
        if (response.success) {
          this.progressMessage = '';
          this.loadTaskDetail(this.task!.taskId);
          this.modalService.showAlert('Success', 'Progress update added successfully', 'success');
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', 'Failed to add progress update', 'error');
      }
    });
  }

  completeTask(): void {
    if (!this.task || !this.isRunner) return;

    this.modalService.showConfirm(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      () => {
        this.taskService.completeTask(this.task!.taskId).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadTaskDetail(this.task!.taskId);
              this.modalService.showAlert('Success', 'Task marked as completed!', 'success');
            }
          },
          error: (error) => {
            this.modalService.showAlert('Error', 'Failed to complete task', 'error');
          }
        });
      }
    );
  }

  sendMessage(): void {
    if (!this.task || !this.newMessage.trim()) return;

    this.taskService.sendTaskMessage(this.task.taskId, this.newMessage).subscribe({
      next: (response) => {
        if (response.success) {
          this.newMessage = '';
          this.loadMessages();
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', 'Failed to send message', 'error');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'posted': return 'badge-success';
      case 'claimed': return 'badge-warning';
      case 'completed': return 'badge-primary';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  callCreator(): void {
    if (this.task?.creatorContact) {
      window.open(`tel:${this.task.creatorContact}`);
    }
  }

  callRunner(): void {
    if (this.task?.runnerContact) {
      window.open(`tel:${this.task.runnerContact}`);
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-danger';
      case 'high': return 'text-warning';
      case 'standard': return 'text-info';
      case 'low': return 'text-muted';
      default: return 'text-info';
    }
  }

  whatsappCreator(): void {
    if (this.task?.creatorContact) {
      const message = encodeURIComponent(`Hi, regarding task: ${this.task.title}`);
      window.open(`https://wa.me/${this.task.creatorContact.replace(/\D/g, '')}?text=${message}`);
    }
  }

  whatsappRunner(): void {
    if (this.task?.runnerContact) {
      const message = encodeURIComponent(`Hi, regarding task: ${this.task.title}`);
      window.open(`https://wa.me/${this.task.runnerContact.replace(/\D/g, '')}?text=${message}`);
    }
  }
}