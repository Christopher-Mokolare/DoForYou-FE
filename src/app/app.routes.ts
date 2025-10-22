import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BrowseErrandsComponent } from './components/browse-errands/browse-errands.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { PostErrandComponent } from './components/post-errand/post-errand.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminTasksComponent } from './components/admin/admin-tasks/admin-tasks.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminPaymentsComponent } from './components/admin/admin-payments/admin-payments.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'browse-errands', component: BrowseErrandsComponent },
  { path: 'post-errand', component: PostErrandComponent, canActivate: [authGuard] },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // ✅ CORRECTED: Admin Routes with canActivate
  { 
    path: 'admin', 
    canActivate: [adminGuard], // ✅ This should be canActivate, not canActivateChild
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'tasks', component: AdminTasksComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'payments', component: AdminPaymentsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '**', redirectTo: '' }
];