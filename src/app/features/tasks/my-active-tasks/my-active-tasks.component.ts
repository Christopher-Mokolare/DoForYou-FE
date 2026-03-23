import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-my-active-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tasks-container">
      <div class="container-fluid py-4">
        <div class="page-header">
          <h1 class="page-title">My Active Tasks</h1>
          <p class="page-subtitle">Track and manage your ongoing tasks</p>
        </div>
        
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-border text-primary" role="status"></div>
          <p>Loading your active tasks...</p>
        </div>
        
        <div *ngIf="!loading && tasks.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Active Tasks</h3>
          <p>You don't have any active tasks at the moment.</p>
          <a routerLink="/tasks/browse" class="btn-primary">Browse Available Tasks</a>
        </div>
        
        <div *ngIf="!loading && tasks.length > 0" class="tasks-grid">
          <div *ngFor="let task of tasks" class="task-card">
            <div class="task-header">
              <div class="task-status">
                <span [ngClass]="'badge-' + getStatusClass(task.status)">
                  {{ task.status | titlecase }}
                </span>
              </div>
              <div class="task-budget">R{{ getRunnerPayout(task.budget) }}</div>
            </div>
            
            <div class="task-content">
              <h3 class="task-title">{{ task.title || task.description }}</h3>
              
              <div class="task-details">
                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">{{ task.category }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date:</span>
                  <span class="detail-value">{{ task.dueDate | date:'MMM d, y' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">{{ task.location || 'Not specified' }}</span>
                </div>
              </div>
              
              <div class="task-creator">
                <div class="creator-info">
                  <div class="creator-avatar">{{ getInitials(task.creatorName) }}</div>
                  <div class="creator-details">
                    <div class="creator-name">{{ task.creatorName }}</div>
                    <div class="creator-contact">{{ task.creatorContact }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="task-actions">
              <div class="flex gap-2 mb-2">
                <button (click)="openChat(task)" class="btn-outline flex-1">
                  <i class="fas fa-comment"></i> Chat
                </button>
                <a [href]="'tel:' + task.creatorContact" class="btn-outline flex-1">
                  <i class="fas fa-phone"></i> Call
                </a>
              </div>
              <div class="flex gap-2">
                <button (click)="viewTaskDetails(task)" class="btn-primary flex-1">
                  View Details
                </button>
                <button (click)="markComplete(task)" class="btn-success flex-1">
                  <i class="fas fa-check-circle"></i> Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-container {
      background: var(--background, #f8f9fa);
      min-height: 100vh;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--text-dark, #1F2937);
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      color: var(--text-muted, #6B7280);
      font-size: 1.1rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin: 2rem auto;
      max-width: 500px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .task-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: all 0.2s;
      border: 1px solid var(--border, #E5E7EB);
    }

    .task-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px rgba(0,0,0,0.1);
    }

    .task-header {
      background: var(--background-dark, #F3F4F6);
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .task-content {
      padding: 1.25rem;
    }

    .task-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-dark, #1F2937);
      margin-bottom: 1rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 3em;
    }

    .task-details {
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-light, #F3F4F6);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 600;
      color: var(--text-muted, #6B7280);
      font-size: 0.85rem;
    }

    .detail-value {
      color: var(--text-dark, #1F2937);
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-creator {
      background: var(--background, #F9FAFB);
      border-radius: 0.5rem;
      padding: 0.75rem;
      border-left: 3px solid var(--primary, #FF8A00);
    }

    .creator-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .creator-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary, #FF8A00);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }

    .creator-name {
      font-weight: 600;
      color: var(--text-dark, #1F2937);
      font-size: 0.9rem;
    }

    .creator-contact {
      font-size: 0.8rem;
      color: var(--text-muted, #6B7280);
    }

    .task-actions {
      padding: 1rem 1.25rem;
      background: var(--background, #F9FAFB);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .task-budget {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--success, #2ECC71);
    }

    @media (max-width: 768px) {
      .tasks-grid {
        grid-template-columns: 1fr;
      }

      .page-title {
        font-size: 2rem;
      }
    }
  `]
})
export class MyActiveTasksComponent implements OnInit {
  tasks: any[] = [];
  loading = true;
  selectedTask: any = null;

  constructor(
    private taskService: TaskService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveTasks();
  }

  private loadActiveTasks(): void {
    this.taskService.getMyActiveTasks().subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks = response.data || [];
          console.log('Active tasks loaded:', this.tasks);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load active tasks:', error);
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'posted': return 'posted';
      case 'claimed': return 'claimed';
      case 'completed': return 'completed';
      case 'runnerpaid': return 'paid';
      case 'cancelled': return 'cancelled';
      default: return 'posted';
    }
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  }

  getRunnerPayout(budget: number): number {
    return budget * 0.85;
  }

  viewTaskDetails(task: any): void {
    this.selectedTask = task;
    
    const details = `
      <div style="text-align: center; padding: 1rem;">
        <div style="margin-bottom: 1rem;">
          <strong>Description:</strong><br/>
          <span>${task.description || task.title}</span>
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Category:</strong> ${task.category}<br/>
          <strong>Budget:</strong> R${task.budget}<br/>
          <strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
          <strong>Location:</strong> ${task.location || 'Not specified'}
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Posted by:</strong> ${task.creatorName}<br/>
          <strong>Contact:</strong> ${task.creatorContact}
        </div>
        <div>
          <strong>Status:</strong> <span style="color: var(--primary);">${task.status}</span>
        </div>
      </div>
    `;
    
    this.modalService.showModal({
      title: 'Task Details',
      message: details,
      type: 'info',
      confirmText: 'Close'
    });
  }

  completeTask(taskId: string): void {
    this.taskService.completeTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.modalService.showAlert('Success', 'Task marked as complete!', 'success');
          this.loadActiveTasks();
        } else {
          this.modalService.showAlert('Error', response.error || 'Failed to complete task', 'error');
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', error?.error?.title || 'Failed to complete task', 'error');
      }
    });
  }

  openChat(task: any): void {
    this.router.navigate(['/tasks/chat', task.taskId], {
      queryParams: { title: task.title || task.description }
    });
  }

  markComplete(task: any): void {
    this.modalService.showConfirm(
      'Complete Task',
      `Are you sure you want to mark "${task.title || task.description}" as complete?`,
      () => this.completeTask(task.taskId),
      undefined,
      'Mark Complete',
      'Cancel'
    );
  }
}