import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface WalletTransaction {
  id: number;
  userId: number;
  taskId?: number;
  transactionType: 'deposit' | 'withdrawal' | 'commission' | 'payout' | 'refund' | 'bonus';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
}

export interface WalletBalance {
  balance: number;
  pendingPayouts: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface WithdrawalRequest {
  amount: number;
  paymentMethod: 'bank' | 'vodacom' | 'mtn';
  accountDetails: {
    accountNumber?: string;
    bankName?: string;
    phoneNumber?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/wallet`;
  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBalance();
  }

  // Get wallet balance
  getBalance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/balance`);
  }

  // Get transaction history
  getTransactions(page: number = 1, pageSize: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transactions`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    });
  }

  // Request withdrawal
  requestWithdrawal(request: WithdrawalRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdraw`, request);
  }

  // Get pending withdrawals
  getPendingWithdrawals(): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.apiUrl}/withdrawals/pending`);
  }

  // Calculate commission
  calculateCommission(amount: number): { commission: number; payout: number; total: number } {
    const commission = Math.max(amount * 0.15, 5);
    const payout = amount - commission;
    return { commission, payout, total: amount };
  }

  // Format currency
  formatCurrency(amount: number): string {
    return `R${amount.toFixed(2)}`;
  }

  // Private method to load balance
  private loadBalance(): void {
    this.getBalance().subscribe({
      next: (data) => this.balanceSubject.next(data.balance),
      error: (err) => console.error('Failed to load wallet balance', err)
    });
  }

  // Refresh balance
  refreshBalance(): void {
    this.loadBalance();
  }
}
