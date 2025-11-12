import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ErrorHandlerService } from '../services/error-handler.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);
  const token = authService.getToken();

  let authReq = req;

  // Add auth token for API requests with validation
  if (token && authService.isTokenValid() && (req.url.includes('/api/') || req.url.includes('/admin/'))) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  } else if (token && !authService.isTokenValid()) {
    // Token is expired, logout user
    authService.logout();
  }

  // Add security headers
  authReq = authReq.clone({
    headers: authReq.headers
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cache-Control', 'no-cache')
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      
      // Handle network errors
      if (error.status === 0) {
        console.error('Network error - backend may be unavailable');
      }
      
      return errorHandler.handleError(error);
    })
  );
};