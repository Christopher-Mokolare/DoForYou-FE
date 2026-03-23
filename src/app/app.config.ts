import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

const publicEndpoints = ['/tasks/available', '/tasks/filters', '/tasks/payment-success'];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      (req, next) => {
        // Skip auth for public endpoints
        const isPublic = publicEndpoints.some(endpoint => req.url.includes(endpoint));
        if (isPublic) {
          return next(req);
        }
        
        const token = localStorage.getItem('token');
        if (token) {
          req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
        }
        return next(req);
      }
    ])),
    importProvidersFrom(ReactiveFormsModule, FormsModule, CommonModule)
  ]
};