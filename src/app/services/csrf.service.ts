import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CsrfService {
  private csrfToken: string | null = null;

  constructor(private http: HttpClient) {}

  getCsrfToken(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/csrf-token`);
  }

  setCsrfToken(token: string): void {
    this.csrfToken = token;
    // Store in meta tag for form submissions
    let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = token;
  }

  getStoredCsrfToken(): string | null {
    return this.csrfToken;
  }

  addCsrfHeaders(headers: any = {}): any {
    if (this.csrfToken) {
      headers['X-XSRF-TOKEN'] = this.csrfToken;
    }
    return headers;
  }
}