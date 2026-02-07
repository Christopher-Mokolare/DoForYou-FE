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
          <div class="stat-icon bg-primary">
            <i class="fas fa-tasks"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.taskStats.totalTasks}}</h3>
            <p>Total Tasks</p>
            <small class="text-success" *ngIf="dashboard.taskStats.pendingVerification > 0">
              {{dashboard.taskStats.pendingVerification}} pending verification
            </small>
          </div>
        </div>

        <!-- User Stats -->
        <div class="stat-card">
          <div class="stat-icon bg-success">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.userStats.totalUsers}}</h3>
            <p>Total Users</p>
            <small class="text-info">{{dashboard.userStats.newUsers}} new this week</small>
          </div>
        </div>

        <!-- Revenue Stats -->
        <div class="stat-card">
          <div class="stat-icon bg-warning">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>R{{dashboard.financialStats.totalRevenue | number:'1.2-2'}}</h3>
            <p>Total Revenue</p>
            <small class="text-warning" *ngIf="dashboard.financialStats.pendingRevenue > 0">
              R{{dashboard.financialStats.pendingRevenue | number:'1.2-2'}} pending
            </small>
          </div>
        </div>

        <!-- Urgent Tasks -->
        <div class="stat-card">
          <div class="stat-icon bg-danger">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h3>{{dashboard.taskStats.urgentTasks}}</h3>
            <p>Urgent Tasks</p>
            <small class="text-danger" *ngIf="dashboard.taskStats.unclaimedTasks > 0">
              {{dashboard.taskStats.unclaimedTasks}} unclaimed
            </small>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="row">
          <!-- Quick Actions -->
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5>Quick Actionwwews</h5>
              </div>
              <div class="card-body">
                <div class="quick-actions">
                  <button class="btn btn-primary btn-sm" routerLink="/admin/tasks" 
                          [queryParams]="{paymentStatus: 'pending'}">
                    <i class="fas fa-check-circle"></i>
                    Verify Payments ({{dashboard?.taskStats?.pendingVerification || 0}})
                  </button>
                  <button class="btn btn-success btn-sm" routerLink="/admin/users" 
                          [queryParams]="{isVerified: false}">
                    <i class="fas fa-user-check"></i>
                    Verify Users
                  </button>
                  <button class="btn btn-warning btn-sm" routerLink="/admin/tasks" 
                          [queryParams]="{priority: 'urgent'}">
                    <i class="fas fa-bolt"></i>
                    Urgent Tasks
                  </button>
                  <button class="btn btn-info btn-sm" routerLink="/admin/payments">
                    <i class="fas fa-money-bill-wave"></i>
                    Payment Overview
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5>Recent Activity</h5>
              </div>
              <div class="card-body">
                <div class="activity-list" *ngIf="dashboard?.recentActivity?.length; else noActivity">
                  <div class="activity-item" *ngFor="let activity of dashboard?.recentActivity">
                    <div class="activity-icon">
                      <i class="fas fa-plus-circle text-success"></i>
                    </div>
                    <div class="activity-content">
                      <p class="mb-1">{{activity?.description}}</p>
                      <small class="text-muted">
                        by {{activity?.userName}} • {{activity?.timestamp | date:'short'}}
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
        padding: 2rem;
      }
    }

    .dashboard-header {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    @media (min-width: 768px) {
      .dashboard-header {
        margin-bottom: 2rem;
        text-align: left;
      }
    }

    .dashboard-header h1 {
      color: #FF6B35;
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
    }

    @media (min-width: 768px) {
      .dashboard-header h1 {
        font-size: 2.5rem;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    @media (min-width: 576px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
    }

    @media (min-width: 992px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    @media (min-width: 768px) {
      .stat-card {
        padding: 1.5rem;
      }
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    @media (min-width: 768px) {
      .stat-icon {
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
      }
    }

    .stat-content h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0;
      color: #333;
    }

    @media (min-width: 768px) {
      .stat-content h3 {
        font-size: 2rem;
      }
    }

    .stat-content p {
      margin: 0;
      color: #666;
      font-weight: 500;
      font-size: 0.9rem;
    }

    @media (min-width: 768px) {
      .stat-content p {
        font-size: 1rem;
      }
    }

    .stat-content small {
      font-size: 0.75rem;
    }

    .dashboard-content .row > div {
      margin-bottom: 1.5rem;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quick-actions .btn {
      justify-content: flex-start;
      text-align: left;
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }

    .quick-actions .btn i {
      margin-right: 0.5rem;
      width: 16px;
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
    }

    .activity-content p {
      margin: 0;
      font-size: 0.9rem;
    }

    .card {
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
    }

    .card-header {
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      border-radius: 12px 12px 0 0 !important;
      padding: 1rem 1.25rem;
    }

    .card-header h5 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .card-body {
      padding: 1.25rem;
    }

    @media (max-width: 767px) {
      .card-header {
        padding: 0.75rem 1rem;
      }
      
      .card-body {
        padding: 1rem;
      }
      
      .quick-actions .btn {
        font-size: 0.875rem;
        padding: 0.625rem 0.875rem;
      }
    }

    .bg-primary { background-color: #FF6B35 !important; }
    .bg-success { background-color: #28a745 !important; }
    .bg-warning { background-color: #ffc107 !important; }
    .bg-danger { background-color: #dc3545 !important; }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .alert-danger {
      background-color: #f8d7da;
      border: 1px solid #f5c2c7;
      color: #842029;
    }

    .spinner-border {
      width: 3rem;
      height: 3rem;
      border-width: 0.3rem;
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