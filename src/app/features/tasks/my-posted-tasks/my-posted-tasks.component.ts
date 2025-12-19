import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-my-posted-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <h2><i class="fas fa-clipboard-list"></i> My Posted Tasks</h2>
      
      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <p>Loading your posted tasks...</p>
      </div>
      
      <div *ngIf="!loading && tasks.length === 0" class="alert alert-info">
        <i class="fas fa-info-circle"></i>
        You haven't posted any tasks yet.
        <a routerLink="/tasks/post" class="btn btn-primary ms-3">Post Your First Task</a>
      </div>
      
      <div class="row">
        <div *ngFor="let task of tasks" class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title">{{ task.title }}</h5>
                <span class="badge" [ngClass]="getStatusClass(task.taskStatus)">
                  {{ getStatusText(task.taskStatus) }}
                </span>
              </div>
              
              <p class="card-text">{{ task.taskDescription | slice:0:100 }}...</p>
              
              <div class="task-meta mb-3">
                <small class="text-muted">
                  <i class="fas fa-tag"></i> {{ task.category }}
                </small>
                <br>
                <small class="text-muted">
                  <i class="fas fa-calendar"></i> Due: {{ task.dateNeeded | date:'short' }}
                </small>
                <br>
                <strong class="text-success">
                  <i class="fas fa-money-bill"></i> R{{ task.budget }}
                </strong>
              </div>
              
              <!-- Runner Info (if accepted) -->
              <div *ngIf="task.helperName" class="runner-info mb-3">
                <div class="alert alert-success py-2">
                  <small class="text-success">
                    <i class="fas fa-user-check"></i> <strong>Accepted by:</strong>
                  </small>
                  <br>
                  <strong>{{ task.helperName }}</strong>
                  <br>
                  <small>{{ task.helperContact }}</small>
                </div>
              </div>
              
              <!-- No Runner Info -->
              <div *ngIf="!task.helperName && task.taskStatus === 'posted'" class="alert alert-warning py-2">
                <small>
                  <i class="fas fa-clock"></i> Waiting for someone to accept this task
                </small>
              </div>
            </div>
            
            <div class="card-footer">
              <a [routerLink]="['/tasks', task.taskId, 'detail']" class="btn btn-primary btn-sm">
                <i class="fas fa-eye"></i> View Details
              </a>
              
              <a *ngIf="task.helperContact" 
                 [href]="'tel:' + task.helperContact" 
                 class="btn btn-outline-success btn-sm ms-2">
                <i class="fas fa-phone"></i> Call Runner
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-meta {
      border-left: 4px solid var(--primary-color, #e67e22);
      padding-left: 10px;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
    }
    
    .runner-info {
      background: #d4edda !important;
      border-color: #c3e6cb !important;
    }
    
    .badge-success { background-color: #28a745 !important; }
    .badge-warning { background-color: #ffc107 !important; color: #212529 !important; }
    .badge-primary { background-color: #007bff !important; }
    .badge-danger { background-color: #dc3545 !important; }
    .badge-secondary { background-color: #6c757d !important; }
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
          // Handle nested data structure from API
          this.tasks = (response.data as any)?.tasks || response.data || [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
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

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'posted': return 'Available';
      case 'claimed': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
}