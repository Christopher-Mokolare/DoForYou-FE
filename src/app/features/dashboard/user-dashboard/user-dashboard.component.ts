import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { UserPreferencesService } from '../../../services/user-preferences.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  stats = { active: 0, completed: 0, pending: 0 };
  runnerStats = { claimed: 0, inProgress: 0, earnings: 0 };
  canCreateTasks = true;
  canAcceptTasks = true;

  constructor(
    private errandsService: ErrandsService,
    private authService: AuthService,
    private userPreferencesService: UserPreferencesService
  ) {}

  ngOnInit() {
    this.loadUserPreferences();
    this.loadUserStats();
  }

  private loadUserPreferences() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.canCreateTasks = user.canCreateTasks ?? true;
      this.canAcceptTasks = user.canAcceptTasks ?? true;
    }
  }

  private loadUserStats() {
    // Load tasks created by user
    this.errandsService.getUserTasks().subscribe({
      next: (response) => {
        const tasks = response.tasks || [];
        this.stats = {
          active: tasks.filter(t => t.taskStatus === 'posted' || t.taskStatus === 'claimed').length,
          completed: tasks.filter(t => t.taskStatus === 'completed').length,
          pending: tasks.filter(t => t.paymentStatus === 'pending').length
        };
      },
      error: () => {
        this.stats = { active: 0, completed: 0, pending: 0 };
      }
    });

    // Load tasks claimed by user (as runner)
    this.loadRunnerStats();
  }

  private loadRunnerStats() {
    // This would need a new API endpoint to get tasks where current user is the runner
    // For now, using available tasks and filtering client-side
    this.errandsService.getVerifiedTasks().subscribe({
      next: (response) => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const runnerTasks = response.tasks.filter(t => t.helperContact === currentUser.contact);
          this.runnerStats = {
            claimed: runnerTasks.filter(t => t.taskStatus === 'claimed').length,
            inProgress: runnerTasks.filter(t => t.taskStatus === 'in_progress').length,
            earnings: 0 // Would calculate from completed tasks
          };
        }
      },
      error: () => {
        this.runnerStats = { claimed: 0, inProgress: 0, earnings: 0 };
      }
    });
  }
}