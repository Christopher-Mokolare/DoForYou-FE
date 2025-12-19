import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  /**
   * Sanitizes error objects for safe logging
   * Removes sensitive data and prevents log injection
   */
  sanitizeError(error: any): any {
    if (!error) return { message: 'Unknown error' };

    return {
      status: error?.status || 'unknown',
      statusText: error?.statusText || 'Unknown error',
      message: this.sanitizeString(error?.message || 'Request failed'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sanitizes strings to prevent log injection
   * Removes control characters and limits length
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return 'Invalid input';

    return input
      .replace(/[\r\n\t]/g, ' ')  // Remove line breaks and tabs
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .substring(0, 200)  // Limit length
      .trim();
  }

  /**
   * Sanitizes user data for logging
   * Removes PII and sensitive information
   */
  sanitizeUserData(userData: any): any {
    if (!userData) return { message: 'No user data' };

    return {
      id: userData.id || 'unknown',
      email: userData.email ? this.maskEmail(userData.email) : 'unknown',
      role: userData.role || 'user',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Masks email addresses for logging
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'invalid-email';
    
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local.substring(0, 2) + '***' 
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Safe console logging with sanitization
   */
  safeLog(level: 'log' | 'error' | 'warn' | 'info', message: string, data?: any): void {
    const sanitizedMessage = this.sanitizeString(message);
    const sanitizedData = data ? this.sanitizeError(data) : undefined;

    switch (level) {
      case 'error':
        break;
      case 'warn':
        break;
      case 'info':
        break;
      default:
    }
  }
}