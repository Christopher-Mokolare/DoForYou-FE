import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { TermsComponent } from './pages/terms/terms.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { MessagesComponent } from './features/messages/messages.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { ProfileCompletionGuard } from './guards/profile-completion.guard';

export const routes: Routes = [
  // Static Pages
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'terms', component: TermsComponent },
  
  // Auth Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Wallet Route
  { path: 'wallet', component: WalletComponent, canActivate: [authGuard] },
  
  // Messages Route
  { path: 'messages', component: MessagesComponent, canActivate: [authGuard] },
  
  // Feature Routes (Lazy Loaded)
  {
    path: 'tasks',
    loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.TASKS_ROUTES)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canActivate: [authGuard, ProfileCompletionGuard]
  },
  {
    path: 'payments',
    loadChildren: () => import('./features/payments/payments.routes').then(m => m.PAYMENTS_ROUTES)
  },
  {
    path: 'user',
    loadChildren: () => import('./features/user-management/user.routes').then(m => m.USER_ROUTES),
    canActivate: [authGuard]
  },
  
  // Admin Routes
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  
  // Legacy redirects for backward compatibility
  { path: 'browse-errands', redirectTo: 'tasks/browse' },
  { path: 'post-errand', redirectTo: 'tasks/post' },
  { path: 'task/:id', redirectTo: 'tasks/:id' },
  { path: 'profile', redirectTo: 'user/profile' },
  { path: 'notifications', redirectTo: 'user/notifications' },
  { path: 'payment-success', redirectTo: 'payments/success' },
  { path: 'payment-cancelled', redirectTo: 'payments/cancelled' },
  { path: 'user-dashboard', redirectTo: 'dashboard' },
  { path: 'task-tracking', redirectTo: 'tasks/tracking' },
  
  { path: '**', redirectTo: '' }
];