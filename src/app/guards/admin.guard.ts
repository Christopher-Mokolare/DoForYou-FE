import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // For now, we'll allow any authenticated user to access admin
    // In production, you'd check the user's role from JWT token
    const currentUser = authService.getCurrentUser();
    
    // TODO: Implement proper role checking from JWT token
    // For now, we'll allow access and add role checking later
    console.log('Admin access granted to:', currentUser?.email);
    return true;
    
    // Future implementation:
    // const token = authService.getToken();
    // const payload = JSON.parse(atob(token.split('.')[1]));
    // const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    // return Array.isArray(roles) ? roles.includes('Admin') : roles === 'Admin';
  } else {
    console.log('Admin access denied - not authenticated');
    router.navigate(['/login'], { queryParams: { returnUrl: '/admin' } });
    return false;
  }
};