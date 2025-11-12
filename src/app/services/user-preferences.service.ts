import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private apiUrl = `${environment.apiUrl}/api/UserPreferences`;

  constructor(private http: HttpClient) {}

  getUserPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.apiUrl);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.getUserPreferences();
  }

  updateUserPreferences(preferences: UserPreferences): Observable<any> {
    return this.http.put(this.apiUrl, preferences);
  }

  updatePreferences(preferences: UserPreferences): Observable<any> {
    return this.updateUserPreferences(preferences);
  }

  updateBankDetails(bankDetails: BankDetails): Observable<any> {
    return this.http.put(`${this.apiUrl}/bank-details`, bankDetails);
  }

  saveToLocalStorage(preferences: UserPreferences): void {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }
}