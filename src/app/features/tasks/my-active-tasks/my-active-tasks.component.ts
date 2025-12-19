import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-my-active-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <h2><i class="fas fa-tasks"></i> My Active Tasks</h2>
      
      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <p>Loading your active tasks...</p>
      </div>
      
      <div *ngIf="!loading && tasks.length === 0" class="alert alert-info">
        <i class="fas fa-info-circle"></i>
        You don't have any active tasks at the moment.
        <a routerLink="/tasks/browse" class="btn btn-primary ms-3">Browse Available Tasks</a>
      </div>
      
      <div class="row">
        <div *ngFor="let task of tasks" class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">{{ task.title }}</h5>
              <p class="card-text">{{ task.description | slice:0:100 }}...</p>
              <div class="task-meta mb-3">
                <small class="text-muted">
                  <i class="fas fa-tag"></i> {{ task.category }}
                </small>
                <br>
                <small class="text-muted">
                  <i class="fas fa-calendar"></i> Due: {{ task.dueDate | date:'short' }}
                </small>
                <br>
                <strong class="text-success">
                  <i class="fas fa-money-bill"></i> R{{ task.budget }}
                </strong>
              </div>
              <div class="task-creator mb-3">
                <small class="text-muted">Creator:</small>
                <br>
                <strong>{{ task.creatorName }}</strong>
                <br>
                <small>{{ task.creatorContact }}</small>
              </div>
            </div>
            <div class="card-footer">
              <a [routerLink]="['/tasks', task.taskId, 'detail']" class="btn btn-primary btn-sm">
                <i class="fas fa-eye"></i> View Details
              </a>
              <a [href]="'tel:' + task.creatorContact" class="btn btn-outline-primary btn-sm ms-2">
                <i class="fas fa-phone"></i> Call
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
    
    .task-creator {
      background: #e9ecef;
      padding: 8px;
      border-radius: 4px;
    }
  `]
})
export class MyActiveTasksComponent implements OnInit {
  tasks: any[] = [];
  loading = true;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadActiveTasks();
  }

  private loadActiveTasks(): void {
    this.taskService.getMyActiveTasks().subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks = response.data || [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
}