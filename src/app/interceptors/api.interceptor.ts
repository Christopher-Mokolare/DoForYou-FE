// interceptors/api.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Show loading indicator for API calls
    this.loadingService.show();
    
    // Clone the request to add the API key
    const apiReq = req.clone({
      url: this.prepareUrl(req.url),
      setParams: {
        apiKey: environment.apiKey
      }
    });

    return next.handle(apiReq).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.loadingService.hide();
        }
      }),
      catchError(error => {
        this.loadingService.hide();
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }

  private prepareUrl(url: string): string {
    // Handle JSONP requests for Google Apps Script
    if (url.includes(environment.apiUrl) && !url.includes('callback=JSONP_CALLBACK')) {
      return `${url}${url.includes('?') ? '&' : '?'}callback=JSONP_CALLBACK`;
    }
    return url;
  }
}