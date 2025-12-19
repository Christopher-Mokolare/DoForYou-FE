import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      try {
        const isAdmin = user?.roles?.includes('Admin') ?? false;
        
        if (isAdmin) {
          return true;
        }
        
        router.navigate(['/login']);
        return false;
      } catch (error) {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};