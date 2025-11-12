import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { UserPreferencesComponent } from './user-preferences/user-preferences.component';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';

export const USER_ROUTES: Routes = [
  { path: 'profile', component: ProfileComponent },
  { path: 'preferences', component: UserPreferencesComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: '', redirectTo: 'profile', pathMatch: 'full' }
];