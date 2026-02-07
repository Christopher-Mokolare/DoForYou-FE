import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { GlobalStateService } from '../../../services/global-state.service';
import { ErrandsService } from '../../../services/errands.service';

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
  paymentHistory: any[] = [];
  canCreateTasks = false;
  canAcceptTasks = false;
  needsProfileUpdate = false;
  isProfileIncomplete = false;
  profileCompletion = 0;
  userType = '';

  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private globalState = inject(GlobalStateService);
  private errandsService = inject(ErrandsService);
  
  cleanupInProgress = false;

  ngOnInit() {
    // Subscribe to global state for reactive updates
    this.globalState.canCreateTasks$.subscribe(canCreate => {
      this.canCreateTasks = canCreate;
    });
    
    this.globalState.canAcceptTasks$.subscribe(canAccept => {
      this.canAcceptTasks = canAccept;
    });
    
    const user = this.authService.getCurrentUser();
    this.userType = (user as any)?.userType || '';
    
    console.log('Current userType:', this.userType);
    
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
          
          // Refresh userType based on fresh data
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
      console.log('User needs to complete profile with new required information');
    }
    if (this.isProfileIncomplete) {
      console.log('User profile is incomplete:', this.profileCompletion + '%');
    }
  }

  private loadUserStats() {
    // Load enhanced dashboard stats
    this.taskService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          const userType = data.userType || 'both';
          
          // Map backend stats to frontend format based on user type
          if (userType === 'creator' || userType === 'both') {
            this.creatorStats = {
              active: data.postedTasks || 0,
              inProgress: data.tasksInProgress || 0,
              completed: data.completedTasks || 0,
              pending: data.pendingTasks || 0,
              totalSpent: data.totalSpent || 0,
              thisMonth: 0, // TODO: Add to backend
              averageCost: 0, // TODO: Add to backend
              mostExpensive: 0 // TODO: Add to backend
            };
          }
          
          if (userType === 'runner' || userType === 'both') {
            this.runnerStats = {
              available: 0, // TODO: Add to backend
              myActive: data.tasksInProgress || 0,
              completed: data.completedTasks || 0,
              totalEarnings: data.totalEarned || 0,
              thisMonth: 0, // TODO: Add to backend
              completionRate: 0, // TODO: Add to backend
              averageEarning: 0 // TODO: Add to backend
            };
          }
          
          console.log('Dashboard stats loaded:', data);
        }
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });

    // Load recent activity
    this.taskService.getRecentActivity(5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentActivity = response.data;
          console.log('Recent activity loaded:', response.data);
        }
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
      }
    });
  }

  cleanupOrphanedTasks(): void {
    if (this.cleanupInProgress) return;
    
    this.cleanupInProgress = true;
    this.taskService.cleanupOrphanedTasks().subscribe({
      next: (response) => {
        console.log('Cleanup completed:', response);
        alert(`Cleanup completed! Removed ${response.data?.deletedCount || 0} orphaned tasks.`);
        this.loadUserStats(); // Refresh stats
        this.cleanupInProgress = false;
      },
      error: (error) => {
        console.error('Cleanup failed:', error);
        alert('Cleanup failed. Please try again.');
        this.cleanupInProgress = false;
      }
    });
  }

  loadPaymentHistory(): void {
    this.errandsService.getPaymentHistory().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.paymentHistory = response.data;
          console.log('Payment history loaded:', response.data);
        }
      },
      error: (error: any) => {
        console.error('Error loading payment history:', error);
        alert('Failed to load payment history.');
      }
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'task_created': return 'fas fa-plus-circle';
      case 'task_claimed': return 'fas fa-handshake';
      case 'task_completed_creator': return 'fas fa-check-circle';
      case 'task_completed_runner': return 'fas fa-trophy';
      case 'payment_received': return 'fas fa-money-bill-wave';
      default: return 'fas fa-info-circle';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'task_created': return 'activity-icon-primary';
      case 'task_claimed': return 'activity-icon-warning';
      case 'task_completed_creator': return 'activity-icon-success';
      case 'task_completed_runner': return 'activity-icon-success';
      case 'payment_received': return 'activity-icon-success';
      default: return 'activity-icon-info';
    }
  }
}