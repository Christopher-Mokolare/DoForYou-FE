import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EscrowStatus {
  taskId: string;
  paymentStatus: string;
  escrowStatus: 'none' | 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  escrowHoldUntil?: string;
  commissionAmount: number;
  payoutAmount: number;
  budget: number;
  timeUntilRelease: number; // hours
}

export interface EscrowTransaction {
  id: number;
  taskId: number;
  totalAmount: number;
  commissionAmount: number;
  payoutAmount: number;
  status: string;
  paymentReceivedAt?: string;
  scheduledReleaseAt?: string;
  releasedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EscrowService {
  private apiUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  // Get escrow status for a task
  getEscrowStatus(taskId: string): Observable<{ success: boolean; data: EscrowStatus }> {
    return this.http.get<any>(`${this.apiUrl}/${taskId}/escrow-status`);
  }

  // Release escrow (admin only)
  releaseEscrow(taskId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/release-escrow`, {});
  }

  // Get all escrow transactions (admin)
  getAllEscrowTransactions(): Observable<EscrowTransaction[]> {
    return this.http.get<EscrowTransaction[]>(`${this.apiUrl}/escrow/all`);
  }

  // Calculate time remaining until release
  getTimeRemaining(releaseDate: string): string {
    const now = new Date();
    const release = new Date(releaseDate);
    const diff = release.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready for release';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  }

  // Format escrow status for display
  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'none': 'bg-secondary',
      'pending': 'bg-warning',
      'held': 'bg-info',
      'released': 'bg-success',
      'refunded': 'bg-danger',
      'disputed': 'bg-dark'
    };
    return statusMap[status] || 'bg-secondary';
  }

  // Get status display text
  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'none': 'No Escrow',
      'pending': 'Payment Pending',
      'held': 'Funds Held',
      'released': 'Funds Released',
      'refunded': 'Refunded',
      'disputed': 'Under Dispute'
    };
    return textMap[status] || status;
  }

  // Check if escrow can be released
  canReleaseEscrow(escrowStatus: EscrowStatus): boolean {
    return escrowStatus.escrowStatus === 'held' && 
           escrowStatus.timeUntilRelease <= 0;
  }
}
