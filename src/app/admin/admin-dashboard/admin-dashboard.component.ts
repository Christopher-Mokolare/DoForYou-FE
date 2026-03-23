import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminDashboard } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p class="text-muted">Manage your DoForYou platform</p>
      </div>

      <!-- Error Message -->
      <div class="alert alert-danger" *ngIf="error">
        <i class="fas fa-exclamation-circle"></i> {{error}}
      </div>

      <!-- Loading State -->
      <div class="text-center py-5" *ngIf="loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div class="stats-grid" *ngIf="dashboard && !loading">
        <!-- Task Stats -->
        <div class="stat-card">
          <div class="stat-icon tasks">
            <i class="fas fa-tasks"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.totalTasks}}</h3>
            <p>Total Tasks</p>
            <small class="text-success" *ngIf="dashboard.pendingTasks > 0">
              {{dashboard.pendingTasks}} pending
            </small>
          </div>
        </div>

        <!-- User Stats -->
        <div class="stat-card">
          <div class="stat-icon users">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.totalUsers}}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <!-- Revenue Stats -->
        <div class="stat-card">
          <div class="stat-icon revenue">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>R{{dashboard.totalRevenue | number:'1.2-2'}}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <!-- Active Tasks -->
        <div class="stat-card">
          <div class="stat-icon urgent">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.activeTasks}}</h3>
            <p>Urgent Tasks</p>
            <small class="text-info" *ngIf="dashboard.completedTasks > 0">
              {{dashboard.completedTasks}} completed
            </small>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="row">
          <!-- Quick Actions -->
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header">
                <h5>Quick Actions</h5>
              </div>
              <div class="card-body">
                <div class="quick-actions">
                  <button class="btn btn-sm" style="background: #FFE57F; color: #333;" routerLink="/admin/tasks" 
                          [queryParams]="{paymentStatus: 'pending'}">
                    <i class="fas fa-check-circle"></i>
                    Verify Payments ({{dashboard?.pendingTasks || 0}})
                  </button>
                  <button class="btn btn-sm" style="background: #FFAB40; color: white;" routerLink="/admin/users" 
                          [queryParams]="{isVerified: false}">
                    <i class="fas fa-user-check"></i>
                    Verify Users
                  </button>
                  <button class="btn btn-sm" style="background: #FFD180; color: white;" routerLink="/admin/tasks" 
                          [queryParams]="{priority: 'urgent'}">
                    <i class="fas fa-bolt"></i>
                    Urgent Tasks
                  </button>
                  <button class="btn btn-sm" style="background: #FF9E40; color: white;" routerLink="/admin/payments">
                    <i class="fas fa-money-bill-wave"></i>
                    Payment Overview
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header">
                <h5>Recent Activity</h5>
              </div>
              <div class="card-body">
                <div class="activity-list" *ngIf="dashboard?.recentTasks?.length; else noActivity">
                  <div class="activity-item" *ngFor="let task of dashboard?.recentTasks">
                    <div class="activity-icon">
                      <i class="fas fa-tasks text-primary"></i>
                    </div>
                    <div class="activity-content">
                      <p class="mb-1"><strong>{{task?.taskId}}</strong> - {{task?.description}}</p>
                      <small class="text-muted">
                        by {{task?.userName}} • R{{task?.budget | number:'1.2-2'}} • {{task?.status}}
                      </small>
                    </div>
                  </div>
                </div>
                <ng-template #noActivity>
                  <p class="text-muted text-center">No recent activity</p>
                </ng-template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 1rem;
    }

    @media (min-width: 768px) {
      .admin-dashboard {
        padding: 1.5rem;
      }
    }

    .dashboard-header {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .dashboard-header h1 {
      color: #FF6B35;
      margin-bottom: 0.25rem;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .dashboard-header p {
      font-size: 0.875rem;
      margin: 0;
      color: #6c757d;
    }

    @media (min-width: 768px) {
      .dashboard-header h1 {
        font-size: 2rem;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (min-width: 576px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
    }

    @media (min-width: 992px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
      }
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }

    @media (min-width: 768px) {
      .stat-card {
        padding: 1.25rem;
        gap: 1rem;
      }
    }

    .stat-icon {
      width: 45px;
      height: 45px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    @media (min-width: 768px) {
      .stat-icon {
        width: 55px;
        height: 55px;
        font-size: 1.3rem;
      }
    }

    .stat-icon.tasks { background: #FFAB40; }
    .stat-icon.users { background: #FFD180; }
    .stat-icon.revenue { background: #FF9E40; }
    .stat-icon.urgent { background: #FF8A00; }

    .stat-content h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: #333;
    }

    @media (min-width: 768px) {
      .stat-content h3 {
        font-size: 1.5rem;
      }
    }

    .stat-content p {
      margin: 0.25rem 0 0 0;
      color: #666;
      font-weight: 500;
      font-size: 0.8rem;
    }

    @media (min-width: 768px) {
      .stat-content p {
        font-size: 0.9rem;
      }
    }

    .stat-content small {
      font-size: 0.7rem;
    }

    .dashboard-content .row > div {
      margin-bottom: 1rem;
    }

    @media (min-width: 992px) {
      .dashboard-content .row > div {
        margin-bottom: 0;
      }
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-actions .btn {
      justify-content: flex-start;
      text-align: left;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (min-width: 768px) {
      .quick-actions .btn {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }
    }

    .quick-actions .btn i {
      margin-right: 0.5rem;
      width: 16px;
      flex-shrink: 0;
    }

    .activity-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-content p {
      margin: 0;
      font-size: 0.85rem;
      word-break: break-word;
    }

    .card {
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      overflow: hidden;
    }

    .card-header {
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      padding: 0.875rem 1rem;
    }

    .card-header h5 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #333;
    }

    @media (min-width: 768px) {
      .card-header {
        padding: 1rem 1.25rem;
      }

      .card-header h5 {
        font-size: 1rem;
      }
    }

    .card-body {
      padding: 1rem;
    }

    @media (min-width: 768px) {
      .card-body {
        padding: 1.25rem;
      }
    }

    .alert {
      padding: 0.875rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .alert-danger {
      background-color: #f8d7da;
      border: 1px solid #f5c2c7;
      color: #842029;
    }

    .spinner-border {
      width: 2.5rem;
      height: 2.5rem;
      border-width: 0.25rem;
    }

    @media (max-width: 575px) {
      .quick-actions .btn {
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
      }

      .card-header {
        padding: 0.75rem 0.875rem;
      }

      .card-body {
        padding: 0.875rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  dashboard: AdminDashboard | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.adminService.getDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboard = response.data;
        } else {
          this.error = 'Failed to load dashboard';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard:', err);
        if (err.status === 403) {
          this.error = 'Access denied. Admin privileges required.';
        } else if (err.status === 401) {
          this.error = 'Authentication failed. Please login again.';
        } else {
          this.error = `Failed to load dashboard: ${err.message || 'Unknown error'}`;
        }
        this.loading = false;
      }
    });
  }
}
