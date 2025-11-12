import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (!this.isProfileComplete(user)) {
      this.router.navigate(['/profile']);
      return false;
    }

    return true;
  }

  private isProfileComplete(user: any): boolean {
    const preferences = this.getUserPreferences();
    
    // Check required fields
    const hasBasicInfo = user.name && user.email && user.contact;
    const hasUserType = preferences && (preferences.canCreateTasks || preferences.canAcceptTasks);
    
    return hasBasicInfo && hasUserType;
  }

  private getUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    return saved ? JSON.parse(saved) : null;
  }
}