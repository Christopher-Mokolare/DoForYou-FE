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

    // Use AuthService method for consistency
    if (this.authService.isProfileIncomplete()) {
      this.router.navigate(['/user/profile']);
      return false;
    }

    return true;
  }

  private isProfileComplete(user: any): boolean {
    // Check required fields using the current user object structure
    const hasBasicInfo = (user.firstName && user.lastName) || user.name;
    const hasEmail = user.email;
    const hasContact = user.contact || user.phoneNumber;
    const hasUserType = user.userType;
    
    return hasBasicInfo && hasEmail && hasContact && hasUserType;
  }

  private getUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    return saved ? JSON.parse(saved) : null;
  }
}