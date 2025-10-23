import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('Auth Interceptor - Token:', token ? 'Present' : 'Missing');
  console.log('Auth Interceptor - URL:', req.url);

  if (token && req.url.includes('/api/')) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    console.log('Auth headers set for:', req.url);
    return next(authReq);
  }

  console.log('No auth headers for:', req.url);
  return next(req);
};