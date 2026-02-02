import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from './category.service';

export interface PaymentRequest {
  taskId: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  message?: string;
}

export interface WalletData {
  balance: number;
  recentTransactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  transactionType: string;
  status: string;
  description?: string;
  createdAt: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccount: string;
  bankName: string;
}

export interface WithdrawResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payment`;
  private http = inject(HttpClient);

  initiatePayment(request: PaymentRequest): Observable<ApiResponse<PaymentResponse>> {
    return this.http.post<ApiResponse<PaymentResponse>>(`${this.apiUrl}/initiate`, request);
  }

  getWallet(): Observable<ApiResponse<WalletData>> {
    return this.http.get<ApiResponse<WalletData>>(`${this.apiUrl}/wallet`);
  }

  withdrawFunds(request: WithdrawRequest): Observable<ApiResponse<WithdrawResponse>> {
    return this.http.post<ApiResponse<WithdrawResponse>>(`${this.apiUrl}/withdraw`, request);
  }

  calculateCommission(amount: number): { platformFee: number; runnerAmount: number } {
    const platformFee = Math.round(amount * 0.15 * 100) / 100; // 15% commission
    const runnerAmount = Math.round((amount - platformFee) * 100) / 100;
    return { platformFee, runnerAmount };
  }
}