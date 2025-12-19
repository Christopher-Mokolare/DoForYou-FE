import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  creatorStats = { active: 0, inProgress: 0, completed: 0, pending: 0, totalSpent: 0, thisMonth: 0, averageCost: 0, mostExpensive: 0 };
  runnerStats = { available: 0, myActive: 0, completed: 0, totalEarnings: 0, thisMonth: 0, completionRate: 0, averageEarning: 0 };
  recentActivity: any[] = [];
  canCreateTasks = false;
  canAcceptTasks = false;
  needsProfileUpdate = false;
  isProfileIncomplete = false;
  profileCompletion = 0;
  userType = '';

  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  
  cleanupInProgress = false;

  ngOnInit() {
    this.canCreateTasks = this.authService.canCreateTasks();
    this.canAcceptTasks = this.authService.canAcceptTasks();
    const user = this.authService.getCurrentUser();
    this.userType = (user as any)?.userType || '';
    
    
    this.loadFreshProfileData();
    this.loadUserStats();
  }

  private loadFreshProfileData() {
    // Get fresh profile data from server
    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Update localStorage with fresh data
          localStorage.setItem('currentUser', JSON.stringify(response.data));
          this.authService.refreshCurrentUser();
          
          // Refresh permissions and userType based on fresh data
          this.canCreateTasks = this.authService.canCreateTasks();
          this.canAcceptTasks = this.authService.canAcceptTasks();
          this.userType = response.data.userType || '';
          this.checkProfileCompletion();
        }
      },
      error: () => {
        // Fallback to cached data if server request fails
        const user = this.authService.getCurrentUser();
        this.userType = (user as any)?.userType || '';
        this.checkProfileCompletion();
      }
    });
  }

  private checkProfileCompletion() {
    this.needsProfileUpdate = this.authService.needsProfileUpdate();
    this.isProfileIncomplete = this.authService.isProfileIncomplete();
    
    const user = this.authService.getCurrentUser();
    this.profileCompletion = (user as any)?.profileCompletion || 0;
    
    if (this.needsProfileUpdate) {
    }
    if (this.isProfileIncomplete) {
    }
  }

  private loadUserStats() {
    // Load enhanced dashboard stats
    this.taskService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.creatorStats = response.data.creator;
          this.runnerStats = response.data.runner;
        }
      },
      error: (error) => {
      }
    });

    // Load recent activity
    this.taskService.getRecentActivity(5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentActivity = response.data;
        }
      },
      error: (error) => {
      }
    });
  }

  cleanupOrphanedTasks(): void {
    if (this.cleanupInProgress) return;
    
    this.cleanupInProgress = true;
    this.taskService.cleanupOrphanedTasks().subscribe({
      next: (response) => {
        this.loadUserStats(); // Refresh stats
        this.cleanupInProgress = false;
      },
      error: (error) => {
        this.cleanupInProgress = false;
      }
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'task_created': return 'fas fa-plus-circle';
      case 'task_claimed': return 'fas fa-handshake';
      case 'task_completed_creator': return 'fas fa-check-circle';
      case 'task_completed_runner': return 'fas fa-trophy';
      default: return 'fas fa-info-circle';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'task_created': return 'activity-icon-primary';
      case 'task_claimed': return 'activity-icon-warning';
      case 'task_completed_creator': return 'activity-icon-success';
      case 'task_completed_runner': return 'activity-icon-success';
      default: return 'activity-icon-info';
    }
  }
}