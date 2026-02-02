import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare var bootstrap: any;

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  balance = 0;
  canWithdraw = false;
  withdrawAmount = 50;
  bankName = '';
  bankAccount = '';
  withdrawing = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadWalletBalance();
  }

  loadWalletBalance(): void {
    this.http.get<any>(`${environment.apiUrl}/payment/wallet`).subscribe({
      next: (response) => {
        if (response.success) {
          this.balance = response.data.balance;
          this.canWithdraw = response.data.canWithdraw;
        }
      },
      error: (error) => {
        console.error('Error loading wallet balance:', error);
      }
    });
  }

  showWithdrawModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('withdrawModal'));
    modal.show();
  }

  withdrawFunds(): void {
    if (this.withdrawAmount < 50 || this.withdrawAmount > this.balance) {
      alert('Invalid withdrawal amount');
      return;
    }

    this.withdrawing = true;

    const withdrawRequest = {
      amount: this.withdrawAmount,
      bankName: this.bankName,
      bankAccount: this.bankAccount
    };

    this.http.post<any>(`${environment.apiUrl}/payment/withdraw`, withdrawRequest).subscribe({
      next: (response) => {
        if (response.success) {
          alert(response.message);
          this.loadWalletBalance();
          this.resetForm();
          const modal = bootstrap.Modal.getInstance(document.getElementById('withdrawModal'));
          modal.hide();
        }
        this.withdrawing = false;
      },
      error: (error) => {
        alert('Withdrawal failed: ' + (error.error?.error || 'Please try again'));
        this.withdrawing = false;
      }
    });
  }

  private resetForm(): void {
    this.withdrawAmount = 50;
    this.bankName = '';
    this.bankAccount = '';
  }
}