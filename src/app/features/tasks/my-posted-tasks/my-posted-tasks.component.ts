import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-my-posted-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tasks-container">
      <div class="container-fluid py-4">
        <div class="page-header">
          <h1 class="page-title">My Posted Tasks</h1>
          <p class="page-subtitle">Manage and track your posted tasks</p>
        </div>
        
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-border text-primary" role="status"></div>
          <p>Loading your posted tasks...</p>
        </div>
        
        <div *ngIf="!loading && tasks.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No Posted Tasks</h3>
          <p>You haven't posted any tasks yet.</p>
          <a routerLink="/tasks/post" class="btn btn-primary">Post Your First Task</a>
        </div>
        
        <div *ngIf="!loading && tasks.length > 0" class="tasks-grid">
          <div *ngFor="let task of tasks" class="task-card">
            <div class="task-header">
              <div class="task-status">
                <span class="badge" [ngClass]="getStatusClass(task.taskStatus)">
                  {{ task.taskStatus | titlecase }}
                </span>
              </div>
              <div class="task-budget">R{{ task.budget }}</div>
            </div>
            
            <div class="task-content">
              <h3 class="task-title">{{ task.taskDescription }}</h3>
              <p class="task-description">{{ task.taskDescription | slice:0:120 }}...</p>
              
              <div class="task-details">
                <div class="detail-row">
                  <span class="detail-label">Category</span>
                  <span class="detail-value">{{ task.category }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value">{{ task.createdAt | date:'MMM d, y' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location</span>
                  <span class="detail-value">{{ task.area }}</span>
                </div>
                <div class="detail-row" *ngIf="task.helperName">
                  <span class="detail-label">Runner</span>
                  <span class="detail-value">{{ task.helperName }}</span>
                </div>
              </div>
              
              <div class="task-runner" *ngIf="task.helperName">
                <div class="runner-info">
                  <div class="runner-avatar">{{ getInitials(task.helperName) }}</div>
                  <div class="runner-details">
                    <div class="runner-name">{{ task.helperName }}</div>
                    <div class="runner-contact">{{ task.helperContact }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="task-actions">
              <a [routerLink]="['/tasks', task.taskId]" class="btn btn-primary">
                View Details
              </a>
              <a *ngIf="task.helperContact" [href]="'tel:' + task.helperContact" class="btn btn-outline-primary">
                Call Runner
              </a>
              <button *ngIf="task.taskStatus === 'completed'" 
                      class="btn btn-success"
                      (click)="confirmTask(task.taskId)">
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-container {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      position: relative;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      color: #6c757d;
      font-size: 1.1rem;
      font-weight: 500;
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
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin: 2rem auto;
      max-width: 500px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #495057;
      margin-bottom: 1rem;
    }

    .empty-state p {
      color: #6c757d;
      margin-bottom: 2rem;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .task-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border-radius: 16px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
      overflow: hidden;
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.2);
      height: fit-content;
    }

    .task-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }

    .task-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    .task-content {
      padding: 1.25rem;
    }

    .task-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.75rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-description {
      display: none;
    }

    .task-details {
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 600;
      color: #6c757d;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      color: #495057;
      font-weight: 500;
      font-size: 0.9rem;
      text-align: right;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-runner {
      background: linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%);
      border-radius: 8px;
      padding: 0.75rem;
      border-left: 3px solid #28a745;
      margin-bottom: 1rem;
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
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }

    .runner-name {
      font-weight: 600;
      color: #495057;
      font-size: 0.9rem;
    }

    .runner-contact {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .task-actions {
      padding: 1rem 1.25rem;
      background: #f8f9fa;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      border-radius: 8px;
      font-weight: 600;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      transition: all 0.3s ease;
      text-decoration: none;
      text-align: center;
      flex: 1;
      min-width: 80px;
    }

    .task-budget {
      font-size: 1.25rem;
      font-weight: 800;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .badge {
      padding: 0.4rem 0.8rem;
      border-radius: 16px;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-success { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
    .badge-warning { background: linear-gradient(135deg, #ffc107, #e0a800); color: white; }
    .badge-primary { background: linear-gradient(135deg, #007bff, #0056b3); color: white; }
    .badge-info { background: linear-gradient(135deg, #17a2b8, #138496); color: white; }
    .badge-danger { background: linear-gradient(135deg, #dc3545, #c82333); color: white; }sk-stats {
      display: flex;
      gap: 2rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      padding: 1rem;
      border-left: 4px solid #667eea;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #495057;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .task-actions {
      padding: 1.5rem;
      background: #f8f9fa;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn {
      border-radius: 12px;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      transition: all 0.3s ease;
      text-decoration: none;
      text-align: center;
      flex: 1;
      position: relative;
      overflow: hidden;
      border: none;
      cursor: pointer;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.5s;
    }

    .btn:hover::before {
      left: 100%;
    }

    .btn-primary {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
      color: white;
    }

    .btn-success {
      background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
    }

    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
      color: white;
    }

    .btn-outline-primary {
      border: 2px solid #007bff;
      color: #007bff;
      background: transparent;
    }

    .btn-outline-primary:hover {
      background: #007bff;
      color: white;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .tasks-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .task-card {
        margin: 0 1rem;
      }

      .task-actions {
        flex-direction: column;
      }

      .task-stats {
        justify-content: center;
      }
    }
  `]
})
export class MyPostedTasksComponent implements OnInit {
  tasks: any[] = [];
  loading = true;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadPostedTasks();
  }

  private loadPostedTasks(): void {
    this.taskService.getMyPostedTasks().subscribe({
      next: (response) => {
        if (response.success) {
          // Handle nested data structure from backend
          this.tasks = response.data?.tasks || response.data || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load posted tasks:', error);
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'posted': return 'badge-success';
      case 'claimed': return 'badge-warning';
      case 'completed': return 'badge-primary';
      case 'runnerpaid': return 'badge-info';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  }

  confirmTask(taskId: string): void {
    this.taskService.confirmTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPostedTasks();
        }
      },
      error: (error) => {
        console.error('Failed to confirm task:', error);
      }
    });
  }
}