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
    this.preferencesService.getUserPreferences().subscribe({
      next: (prefs) => this.preferences = prefs,
      error: () => console.error('Error loading preferences')
    });
  }

  toggleRole(): void {
    this.preferences.canCreateTasks = !this.preferences.canCreateTasks;
    this.preferences.canAcceptTasks = !this.preferences.canCreateTasks;
  }

  savePreferences(): void {
    this.saving = true;
    this.preferencesService.updateUserPreferences(this.preferences).subscribe({
      next: () => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          currentUser.canCreateTasks = this.preferences.canCreateTasks;
          currentUser.canAcceptTasks = this.preferences.canAcceptTasks;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          this.authService.refreshCurrentUser();
        }
        
        const roleMessage = this.preferences.canCreateTasks ? 'Task Creator' : 'Task Runner';
        alert(`Preferences saved! You are now set as: ${roleMessage}`);
        window.location.reload();
      },
      error: () => {
        console.error('Error saving preferences');
        alert('Error saving preferences. Please try again.');
      },
      complete: () => this.saving = false
    });
  }
}