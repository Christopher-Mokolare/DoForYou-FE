import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserPreferences {
  canCreateTasks: boolean;
  canAcceptTasks: boolean;
  taskCreatorNotifications: boolean;
  taskRunnerNotifications: boolean;
  paymentNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  minTaskAmount?: number;
  maxTaskAmount?: number;
  preferredCategories?: string[];
  preferredLocations?: string[];
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountHolderName: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private apiUrl = `${environment.apiUrl}/api/v1/user/profile`;

  constructor(private http: HttpClient) {}

  getUserPreferences(): Observable<UserPreferences> {
    // Get preferences from localStorage since backend doesn't have separate preferences endpoint
    const saved = localStorage.getItem('userPreferences');
    const preferences = saved ? JSON.parse(saved) : this.getDefaultPreferences();
    return of(preferences);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.getUserPreferences();
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      canCreateTasks: true,
      canAcceptTasks: false,
      taskCreatorNotifications: true,
      taskRunnerNotifications: true,
      paymentNotifications: true,
      emailNotifications: true,
      smsNotifications: false
    };
  }

  updateUserPreferences(preferences: UserPreferences): Observable<any> {
    // Save to localStorage
    this.saveToLocalStorage(preferences);
    
    // Get current user data to include required fields
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Update user type in database via profile endpoint with required fields
    const userType = this.getUserTypeFromPreferences(preferences);
    const updateData = {
      userType,
      firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'User',
      lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || 'Name',
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber || currentUser.contact
    };
    
    return this.http.put(this.apiUrl, updateData);
  }

  updatePreferences(preferences: UserPreferences): Observable<any> {
    return this.updateUserPreferences(preferences);
  }

  private getUserTypeFromPreferences(preferences: UserPreferences): string {
    if (preferences.canCreateTasks && preferences.canAcceptTasks) {
      return 'both';
    } else if (preferences.canCreateTasks) {
      return 'creator';
    } else if (preferences.canAcceptTasks) {
      return 'runner';
    }
    return 'both'; // default
  }

  updateBankDetails(bankDetails: BankDetails): Observable<any> {
    return this.http.put(this.apiUrl, bankDetails);
  }

  saveToLocalStorage(preferences: UserPreferences): void {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }
}