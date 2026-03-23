import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { EscrowService } from '../../../services/escrow.service';
import { RealtimeService } from '../../../services/realtime.service';
import { WalletService } from '../../../services/wallet.service';

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
  
  escrowStatus: any = null;
  escrowTimeRemaining = '';
  
  refreshSubscription?: Subscription;
  realtimeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService,
    private modalService: ModalService,
    private escrowService: EscrowService,
    private realtimeService: RealtimeService,
    private walletService: WalletService
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
    this.realtimeSubscription?.unsubscribe();
    if (this.task) {
      this.realtimeService.leaveTaskChat(parseInt(this.task.taskId));
    }
  }

  private loadTaskDetail(taskId: string): void {
    this.loading = true;
    this.error = null;

    this.taskService.getTaskDetail(taskId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Map API response to component interface
          const data = response.data as any; // Use any to access API fields
          this.task = {
            id: data.id?.toString() || '',
            taskId: data.taskId,
            title: data.taskDescription, // API uses taskDescription
            description: data.taskDescription,
            category: data.category,
            location: data.area, // API uses area
            budget: data.budget,
            status: data.status || data.taskStatus, // Try both fields
            priority: data.priority,
            createdAt: data.createdAt,
            dueDate: data.dateNeeded, // API uses dateNeeded
            creatorName: data.userName || data.name, // Try both fields
            creatorContact: data.userContact || data.contact, // Try both fields
            runnerName: data.helperName,
            runnerContact: data.helperContact,
            runnerId: data.acceptedByUserId?.toString(),
            createdByUserId: data.createdByUserId?.toString() || '',
            completedAt: data.completedAt,
            notes: data.notes,
            progressUpdates: [], // Will be loaded separately if needed
            canEdit: false,
            canComplete: false,
            canCancel: false
          };
          
          this.isCreator = this.task.createdByUserId === this.currentUserId;
          this.isRunner = this.task.runnerId === this.currentUserId;
          this.loadMessages();
          this.loadEscrowStatus();
          this.setupRealtimeChat();
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
          this.messages = (response.data || []).map((message: any) => ({
            ...message,
            isCurrentUser: message.senderId?.toString() === this.currentUserId
          }));
        }
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
      }
    });
  }

  private loadEscrowStatus(): void {
    if (!this.task) return;
    
    this.escrowService.getEscrowStatus(this.task.taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.escrowStatus = response.data;
          if (this.escrowStatus.escrowHoldUntil) {
            this.escrowTimeRemaining = this.escrowService.getTimeRemaining(this.escrowStatus.escrowHoldUntil);
          }
        }
      },
      error: (error) => {
        console.error('Failed to load escrow status:', error);
      }
    });
  }

  private setupRealtimeChat(): void {
    if (!this.task) return;
    
    const taskIdNum = parseInt(this.task.taskId);
    this.realtimeService.joinTaskChat(taskIdNum);
    
    this.realtimeSubscription = this.realtimeService.messages$.subscribe(messages => {
      const taskMessages = messages.filter(m => m.taskId === taskIdNum);
      if (taskMessages.length > 0) {
        this.loadMessages();
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

    if (confirm('Are you sure you want to mark this task as completed?')) {
      this.taskService.completeTask(this.task.taskId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTaskDetail(this.task!.taskId);
            alert('Task marked as completed!');
          }
        },
        error: (error) => {
          alert('Failed to complete task');
        }
      });
    }
  }

  confirmCompletion(): void {
    if (!this.task || !this.isCreator) return;

    this.modalService.showConfirm(
      'Confirm Task Completion',
      'Are you sure you want to confirm this task is completed? This will release payment to the runner.',
      () => {
        this.taskService.confirmTask(this.task!.taskId).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadTaskDetail(this.task!.taskId);
              this.modalService.showAlert('Success', 'Task confirmed and payment released!', 'success');
            }
          },
          error: (error) => {
            this.modalService.showAlert('Error', 'Failed to confirm task completion', 'error');
          }
        });
      }
    );
  }

  sendMessage(): void {
    if (!this.task || !this.newMessage.trim()) return;

    const taskIdNum = parseInt(this.task.taskId);
    this.realtimeService.sendMessage(taskIdNum, this.newMessage).then(() => {
      this.newMessage = '';
    }).catch(() => {
      this.taskService.sendTaskMessage(this.task!.taskId, this.newMessage).subscribe({
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
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'posted': return 'badge-success';
      case 'claimed': return 'badge-warning';
      case 'completed': return 'badge-primary';
      case 'runnerpaid': return 'badge-info';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getEscrowStatusClass(): string {
    if (!this.escrowStatus) return 'badge-secondary';
    return this.escrowService.getStatusBadgeClass(this.escrowStatus.escrowStatus);
  }

  getEscrowStatusText(): string {
    if (!this.escrowStatus) return 'No Escrow';
    return this.escrowService.getStatusText(this.escrowStatus.escrowStatus);
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