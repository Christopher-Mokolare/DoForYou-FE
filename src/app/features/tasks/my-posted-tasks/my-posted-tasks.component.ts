import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-my-posted-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><i class="fas fa-list-check"></i> My Posted Tasks</h1>
        <p>Manage and track your posted tasks</p>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your posted tasks...</p>
      </div>

      <div *ngIf="!loading && tasks.length === 0" class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <h3>No Posted Tasks</h3>
        <p>You haven't posted any tasks yet.</p>
        <a routerLink="/post-errand" class="btn-primary">Post Your First Task</a>
      </div>

      <div *ngIf="!loading && tasks.length > 0">
        <div *ngIf="groupedTasks.pendingPayment.length > 0" class="status-section">
          <h2 class="status-heading" (click)="toggleSection('pendingPayment')">
            <i class="fas fa-exclamation-circle"></i> Pending Payment ({{ groupedTasks.pendingPayment.length }})
            <i class="fas" [ngClass]="expandedSections.pendingPayment ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </h2>
          <div class="tasks-grid" *ngIf="expandedSections.pendingPayment">
            <div *ngFor="let task of groupedTasks.pendingPayment" class="task-card">
              <div class="task-header">
                <span [ngClass]="getStatusBadge(task.taskStatus)">{{ task.taskStatus }}</span>
                <div class="task-budget">R{{ task.budget }}</div>
              </div>
              <div class="task-content">
                <h3 class="task-title">{{ task.taskDescription }}</h3>
                <div class="task-details">
                  <div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">{{ task.category }}</span></div>
                  <div class="detail-row"><span class="detail-label">Due Date:</span><span class="detail-value">{{ task.createdAt | date:'MMM d, y' }}</span></div>
                  <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">{{ task.area?.length > 30 ? (task.area | slice:0:30) + '...' : task.area }}</span></div>
                </div>
              </div>
              <div class="task-actions">
                <div class="flex gap-2">
                  <button (click)="editTask(task)" class="btn-outline flex-1"><i class="fas fa-edit"></i> Edit Task</button>
                  <button (click)="completePayment(task.taskId)" class="btn-primary flex-1"><i class="fas fa-credit-card"></i> Pay Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="groupedTasks.posted.length > 0" class="status-section">
          <h2 class="status-heading" (click)="toggleSection('posted')">
            <i class="fas fa-bullhorn"></i> Live on Browse Errands ({{ groupedTasks.posted.length }})
            <i class="fas" [ngClass]="expandedSections.posted ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </h2>
          <div class="tasks-grid" *ngIf="expandedSections.posted">
            <div *ngFor="let task of groupedTasks.posted" class="task-card">
              <div class="task-header">
                <span [ngClass]="getStatusBadge(task.taskStatus)">{{ task.taskStatus }}</span>
                <div class="task-budget">R{{ task.budget }}</div>
              </div>
              <div class="task-content">
                <h3 class="task-title">{{ task.taskDescription }}</h3>
                <div class="task-details">
                  <div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">{{ task.category }}</span></div>
                  <div class="detail-row"><span class="detail-label">Due Date:</span><span class="detail-value">{{ task.createdAt | date:'MMM d, y' }}</span></div>
                  <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">{{ task.area?.length > 30 ? (task.area | slice:0:30) + '...' : task.area }}</span></div>
                </div>
              </div>
              <div class="task-actions">
                <button (click)="viewTaskDetails(task)" class="btn-primary w-full">View Details</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="groupedTasks.completed.length > 0" class="status-section">
          <h2 class="status-heading" (click)="toggleSection('completed')">
            <i class="fas fa-clock"></i> Awaiting Confirmation ({{ groupedTasks.completed.length }})
            <i class="fas" [ngClass]="expandedSections.completed ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </h2>
          <div class="tasks-grid" *ngIf="expandedSections.completed">
            <div *ngFor="let task of groupedTasks.completed" class="task-card">
              <div class="task-header">
                <span [ngClass]="getStatusBadge(task.taskStatus)">{{ task.taskStatus }}</span>
                <div class="task-budget">R{{ task.budget }}</div>
              </div>
              <div class="task-content">
                <h3 class="task-title">{{ task.taskDescription }}</h3>
                <div class="task-details">
                  <div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">{{ task.category }}</span></div>
                  <div class="detail-row"><span class="detail-label">Due Date:</span><span class="detail-value">{{ task.createdAt | date:'MMM d, y' }}</span></div>
                  <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">{{ task.area?.length > 30 ? (task.area | slice:0:30) + '...' : task.area }}</span></div>
                </div>
                <div *ngIf="task.helperName" class="task-runner">
                  <div class="runner-info">
                    <div class="runner-avatar">{{ getInitials(task.helperName) }}</div>
                    <div class="runner-details"><div class="runner-name">{{ task.helperName }}</div><div class="runner-contact">{{ task.helperContact }}</div></div>
                  </div>
                </div>
              </div>
              <div class="task-actions">
                <div class="flex gap-2 mb-2">
                  <button (click)="openChat(task)" class="btn-outline flex-1"><i class="fas fa-comment"></i> Chat</button>
                  <a *ngIf="task.helperContact" [href]="'tel:' + task.helperContact" class="btn-outline flex-1"><i class="fas fa-phone"></i> Call</a>
                </div>
                <div class="flex gap-2">
                  <button (click)="showTaskDetails(task)" class="btn-outline flex-1">View Details</button>
                  <button (click)="confirmTaskCompletion(task)" class="btn-primary flex-1"><i class="fas fa-check"></i>Pay Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="groupedTasks.claimed.length > 0" class="status-section">
          <h2 class="status-heading" (click)="toggleSection('claimed')">
            <i class="fas fa-spinner"></i> In Progress ({{ groupedTasks.claimed.length }})
            <i class="fas" [ngClass]="expandedSections.claimed ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </h2>
          <div class="tasks-grid" *ngIf="expandedSections.claimed">
            <div *ngFor="let task of groupedTasks.claimed" class="task-card">
              <div class="task-header">
                <span [ngClass]="getStatusBadge(task.taskStatus)">{{ task.taskStatus }}</span>
                <div class="task-budget">R{{ task.budget }}</div>
              </div>
              <div class="task-content">
                <h3 class="task-title">{{ task.taskDescription }}</h3>
                <div class="task-details">
                  <div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">{{ task.category }}</span></div>
                  <div class="detail-row"><span class="detail-label">Due Date:</span><span class="detail-value">{{ task.createdAt | date:'MMM d, y' }}</span></div>
                  <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">{{ task.area?.length > 30 ? (task.area | slice:0:30) + '...' : task.area }}</span></div>
                </div>
                <div *ngIf="task.helperName" class="task-runner">
                  <div class="runner-info">
                    <div class="runner-avatar">{{ getInitials(task.helperName) }}</div>
                    <div class="runner-details"><div class="runner-name">{{ task.helperName }}</div><div class="runner-contact">{{ task.helperContact }}</div></div>
                  </div>
                </div>
              </div>
              <div class="task-actions">
                <div class="flex gap-2 mb-2">
                  <button (click)="openChat(task)" class="btn-outline flex-1"><i class="fas fa-comment"></i> Chat</button>
                  <a *ngIf="task.helperContact" [href]="'tel:' + task.helperContact" class="btn-outline flex-1"><i class="fas fa-phone"></i> Call</a>
                </div>
                <button (click)="showTaskDetails(task)" class="btn-primary w-full">View Details</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="groupedTasks.runnerPaid.length > 0" class="status-section">
          <h2 class="status-heading" (click)="toggleSection('runnerPaid')">
            <i class="fas fa-check-circle"></i> Completed ({{ groupedTasks.runnerPaid.length }})
            <i class="fas" [ngClass]="expandedSections.runnerPaid ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </h2>
          <div class="tasks-grid" *ngIf="expandedSections.runnerPaid">
            <div *ngFor="let task of groupedTasks.runnerPaid" class="task-card">
              <div class="task-header">
                <span [ngClass]="getStatusBadge(task.taskStatus)">{{ task.taskStatus }}</span>
                <div class="task-budget">R{{ task.budget }}</div>
              </div>
              <div class="task-content">
                <h3 class="task-title">{{ task.taskDescription }}</h3>
                <div class="task-details">
                  <div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">{{ task.category }}</span></div>
                  <div class="detail-row"><span class="detail-label">Due Date:</span><span class="detail-value">{{ task.createdAt | date:'MMM d, y' }}</span></div>
                  <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">{{ task.area?.length > 30 ? (task.area | slice:0:30) + '...' : task.area }}</span></div>
                </div>
                <div *ngIf="task.helperName" class="task-runner">
                  <div class="runner-info">
                    <div class="runner-avatar">{{ getInitials(task.helperName) }}</div>
                    <div class="runner-details"><div class="runner-name">{{ task.helperName }}</div><div class="runner-contact">{{ task.helperContact }}</div></div>
                  </div>
                </div>
              </div>
              <div class="task-actions">
                <div class="flex gap-2">
                  <button (click)="viewTaskDetails(task)" class="btn-primary flex-1">View Details</button>
                  <a *ngIf="task.helperContact" [href]="'tel:' + task.helperContact" class="btn-outline flex-1"><i class="fas fa-phone"></i> Call</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      background: var(--background, #f8f9fa);
      min-height: 100vh;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--text-dark, #1F2937);
      margin-bottom: 0.5rem;
    }

    .page-header p {
      color: var(--text-muted, #6B7280);
      font-size: 1.1rem;
    }

    .status-section {
      margin-bottom: 3rem;
    }

    .status-heading {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-dark, #1F2937);
      margin-bottom: 1.5rem;
      padding: 1rem;
      border-bottom: 2px solid var(--primary, #FF8A00);
      cursor: pointer;
      user-select: none;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.2s;
    }

    .status-heading:hover {
      background: rgba(255, 138, 0, 0.05);
    }

    .status-heading i:first-child {
      color: var(--primary, #FF8A00);
    }

    .status-heading i:last-child {
      color: var(--text-muted, #6B7280);
      font-size: 1rem;
      margin-left: auto;
      transition: transform 0.3s;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      padding: 1rem 0;
      max-width: 1400px;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    }

    .task-runner {
      background: var(--background, #F9FAFB);
      border-radius: 0.5rem;
      padding: 0.75rem;
      border-left: 3px solid var(--success, #2ECC71);
    }

    .runner-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .runner-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--success, #2ECC71);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .runner-name {
      font-weight: 600;
      color: var(--text-dark, #1F2937);
      font-size: 0.9rem;
    }

    .runner-contact {
      font-size: 0.8rem;
      color: var(--text-muted, #6B7280);
    }

    .task-actions {
      padding: 1rem 1.25rem;
      background: var(--background, #F9FAFB);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-height: 80px;
    }

    .task-actions button,
    .task-actions a {
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
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

      .page-header h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class MyPostedTasksComponent implements OnInit {
  tasks: any[] = [];
  loading = true;
  groupedTasks = {
    pendingPayment: [] as any[],
    posted: [] as any[],
    claimed: [] as any[],
    completed: [] as any[],
    runnerPaid: [] as any[]
  };
  
  expandedSections = {
    pendingPayment: true,
    posted: true,
    claimed: true,
    completed: true,
    runnerPaid: true
  };

  constructor(
    private taskService: TaskService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPostedTasks();
  }

  private loadPostedTasks(): void {
    this.taskService.getMyPostedTasks().subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks = response.data?.tasks || response.data || [];
          this.groupTasksByStatus();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load posted tasks:', error);
        this.loading = false;
      }
    });
  }

  private groupTasksByStatus(): void {
    this.groupedTasks = {
      pendingPayment: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'pendingpayment'),
      posted: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'posted'),
      claimed: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'claimed'),
      completed: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'completed'),
      runnerPaid: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'runnerpaid')
    };
  }

  toggleSection(section: keyof typeof this.expandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  getStatusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'posted': return 'badge-posted';
      case 'claimed': return 'badge-claimed';
      case 'completed': return 'badge-completed';
      case 'runnerpaid': return 'badge-paid';
      case 'cancelled': return 'badge-cancelled';
      case 'pendingpayment': return 'badge-pending';
      default: return 'badge-posted';
    }
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  }

  viewTaskDetails(task: any): void {
    if (task.taskStatus?.toLowerCase() === 'completed') {
      this.modalService.showConfirm(
        'Confirm Task Completion',
        `Are you sure you want to confirm and release payment for "${task.taskDescription}"?`,
        () => this.confirmTask(task.taskId),
        undefined,
        'Pay Now',
        'Cancel'
      );
    } else {
      const details = `
        <div style="text-align: center; padding: 1rem;">
          <div style="margin-bottom: 1rem;">
            <strong>Description:</strong><br/>
            <span>${task.taskDescription}</span>
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Category:</strong> ${task.category}<br/>
            <strong>Budget:</strong> R${task.budget}<br/>
            <strong>Due Date:</strong> ${new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
            <strong>Location:</strong> ${task.area}
          </div>
          ${task.helperName ? `
          <div style="margin-bottom: 1rem;">
            <strong>Runner:</strong> ${task.helperName}<br/>
            <strong>Contact:</strong> ${task.helperContact}
          </div>
          ` : ''}
          <div>
            <strong>Status:</strong> <span style="color: var(--primary);">${task.taskStatus}</span>
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
  }

  confirmTask(taskId: string): void {
    this.taskService.confirmTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.modalService.showAlert('Success', 'Task confirmed and payment released!', 'success');
          this.loadPostedTasks();
        } else {
          this.modalService.showAlert('Error', response.error || 'Failed to confirm task', 'error');
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', error?.error?.title || 'Failed to confirm task', 'error');
      }
    });
  }

  completePayment(taskId: string): void {
    this.taskService.getPaymentUrl(taskId).subscribe({
      next: (response) => {
        if (response.success && response.data?.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          this.modalService.showAlert('Error', 'Failed to get payment URL', 'error');
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', error?.error?.message || 'Failed to get payment URL', 'error');
      }
    });
  }

  editTask(task: any): void {
    this.router.navigate(['/tasks/edit', task.taskId]);
  }

  openChat(task: any): void {
    this.router.navigate(['/tasks/chat', task.taskId], {
      queryParams: { title: task.taskDescription }
    });
  }

  showTaskDetails(task: any): void {
    const details = `
      <div style="text-align: center; padding: 1rem;">
        <div style="margin-bottom: 1rem;">
          <strong>Description:</strong><br/>
          <span>${task.taskDescription}</span>
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Category:</strong> ${task.category}<br/>
          <strong>Budget:</strong> R${task.budget}<br/>
          <strong>Due Date:</strong> ${new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
          <strong>Location:</strong> ${task.area}
        </div>
        ${task.helperName ? `
        <div style="margin-bottom: 1rem;">
          <strong>Runner:</strong> ${task.helperName}<br/>
          <strong>Contact:</strong> ${task.helperContact}
        </div>
        ` : ''}
        <div>
          <strong>Status:</strong> <span style="color: var(--primary);">${task.taskStatus}</span>
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

  confirmTaskCompletion(task: any): void {
    this.modalService.showConfirm(
      'Confirm Task Completion',
      `Are you sure you want to confirm and release payment for "${task.taskDescription}"?`,
      () => this.confirmTask(task.taskId),
      undefined,
      'Pay Now',
      'Cancel'
    );
  }
}