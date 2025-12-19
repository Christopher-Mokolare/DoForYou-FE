import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserPreferencesService, UserPreferences } from '../../../services/user-preferences.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-preferences.component.html',
  styleUrls: ['./user-preferences.component.scss']
})
export class UserPreferencesComponent implements OnInit {
  preferences: UserPreferences = {
    canCreateTasks: true,
    canAcceptTasks: false,
    taskCreatorNotifications: true,
    taskRunnerNotifications: true,
    paymentNotifications: true,
    emailNotifications: true,
    smsNotifications: false
  };
  saving = false;

  constructor(
    private preferencesService: UserPreferencesService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  get isTaskCreator(): boolean {
    return this.preferences.canCreateTasks;
  }

  loadPreferences(): void {
    // Load from current user data first, then fall back to localStorage
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && (currentUser as any).userType) {
      const userType = (currentUser as any).userType;
      this.preferences.canCreateTasks = userType === 'creator' || userType === 'both';
      this.preferences.canAcceptTasks = userType === 'runner' || userType === 'both';
    }
    
    // Load other preferences from service (localStorage)
    this.preferencesService.getUserPreferences().subscribe({
      next: (prefs) => {
        // Only update non-role preferences to preserve database userType
        this.preferences.taskCreatorNotifications = prefs.taskCreatorNotifications;
        this.preferences.taskRunnerNotifications = prefs.taskRunnerNotifications;
        this.preferences.paymentNotifications = prefs.paymentNotifications;
        this.preferences.emailNotifications = prefs.emailNotifications;
        this.preferences.smsNotifications = prefs.smsNotifications;
        this.preferences.minTaskAmount = prefs.minTaskAmount;
        this.preferences.maxTaskAmount = prefs.maxTaskAmount;
        this.preferences.preferredCategories = prefs.preferredCategories;
        this.preferences.preferredLocations = prefs.preferredLocations;
      },
    });
  }

  toggleRole(): void {
    this.preferences.canCreateTasks = !this.preferences.canCreateTasks;
    this.preferences.canAcceptTasks = !this.preferences.canCreateTasks;
  }

  savePreferences(): void {
    this.saving = true;
    this.preferencesService.updateUserPreferences(this.preferences).subscribe({
      next: (response) => {
        // Update current user data with new userType
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          // Update userType based on preferences
          if (this.preferences.canCreateTasks && this.preferences.canAcceptTasks) {
            (currentUser as any).userType = 'both';
          } else if (this.preferences.canCreateTasks) {
            (currentUser as any).userType = 'creator';
          } else if (this.preferences.canAcceptTasks) {
            (currentUser as any).userType = 'runner';
          }
          
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          this.authService.refreshCurrentUser();
        }
        
        const roleMessage = this.preferences.canCreateTasks && this.preferences.canAcceptTasks ? 'Both Creator & Runner' :
                           this.preferences.canCreateTasks ? 'Task Creator' : 'Task Runner';
        this.saving = false;
      },
      error: (error) => {
        this.saving = false;
      }
    });
  }
}