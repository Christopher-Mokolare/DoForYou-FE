import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      (req, next) => {
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