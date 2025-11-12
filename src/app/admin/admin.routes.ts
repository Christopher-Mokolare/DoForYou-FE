import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminTasksComponent } from './admin-tasks/admin-tasks.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminPaymentsComponent } from './admin-payments/admin-payments.component';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'tasks', component: AdminTasksComponent },
  { path: 'users', component: AdminUsersComponent },
  { path: 'payments', component: AdminPaymentsComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];