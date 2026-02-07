import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { AuthService } from './auth.service';
import { UserPreferencesService } from './user-preferences.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  private _canCreateTasks = new BehaviorSubject<boolean>(false);
  private _canAcceptTasks = new BehaviorSubject<boolean>(false);
  private _isAdmin = new BehaviorSubject<boolean>(false);
  private _isAuthenticated = new BehaviorSubject<boolean>(false);

  public canCreateTasks$ = this._canCreateTasks.asObservable();
  public canAcceptTasks$ = this._canAcceptTasks.asObservable();
  public isAdmin$ = this._isAdmin.asObservable();
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor(
    private authService: AuthService,
    private preferencesService: UserPreferencesService
  ) {
    // Set initial state immediately based on current user
    this.setInitialState();
    this.initializeState();
  }

  private setInitialState(): void {
    const user = this.authService.getCurrentUser();
    const isAuthenticated = !!user;
    const isAdmin = this.authService.isAdmin();
    
    this._isAuthenticated.next(isAuthenticated);
    this._isAdmin.next(isAdmin);

    // Only set initial task permissions for non-admin authenticated users
    // These will be overridden when API preferences load
    if (isAuthenticated && !isAdmin) {
      const userType = (user as any)?.userType;
      if (userType === 'runner') {
        // Task runners cannot create tasks by default
        this._canCreateTasks.next(false);
        this._canAcceptTasks.next(true);
      } else if (userType === 'creator') {
        this._canCreateTasks.next(true);
        this._canAcceptTasks.next(false);
      } else if (userType === 'both') {
        this._canCreateTasks.next(true);
        this._canAcceptTasks.next(true);
      }
    }
  }

  private initializeState(): void {
    // Combine user and preferences changes to update global state
    combineLatest([
      this.authService.currentUser$,
      this.preferencesService.preferences$
    ]).subscribe(([user, preferences]) => {
      const isAuthenticated = !!user;
      const isAdmin = this.authService.isAdmin();
      
      this._isAuthenticated.next(isAuthenticated);
      this._isAdmin.next(isAdmin);

      if (!isAuthenticated || isAdmin) {
        this._canCreateTasks.next(false);
        this._canAcceptTasks.next(false);
        return;
      }

      // Always use preferences if available and valid - they override everything
      if (preferences && typeof preferences.canCreateTasks === 'boolean' && typeof preferences.canAcceptTasks === 'boolean') {
        this._canCreateTasks.next(preferences.canCreateTasks);
        this._canAcceptTasks.next(preferences.canAcceptTasks);
      }
    });

    // Load preferences immediately when user is detected
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Always load preferences from API to get latest state
        this.preferencesService.getUserPreferences().subscribe();
      }
    });
  }

  // Convenience methods
  canCreateTasks(): boolean {
    return this._canCreateTasks.value;
  }

  canAcceptTasks(): boolean {
    return this._canAcceptTasks.value;
  }

  isAdmin(): boolean {
    return this._isAdmin.value;
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }
}