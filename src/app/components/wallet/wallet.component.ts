import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService, WalletData, WithdrawRequest } from '../../services/payment.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="container mx-auto p-4 max-w-2xl">
      <h2 class="text-2xl font-bold mb-6">My Wallet</h2>
      
      <!-- Wallet Balance -->
      <div class="bg-blue-100 border border-blue-400 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-blue-800 mb-2">Available Balance</h3>
        <p class="text-3xl font-bold text-blue-900">R{{walletData?.balance || 0}}</p>
      </div>

      <!-- Withdraw Section -->
      <div class="bg-white border rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Withdraw Funds</h3>
        
        <form [formGroup]="withdrawForm" (ngSubmit)="onWithdraw()">
          <div class="mb-4">
            <label class="block text-sm font-bold mb-2">Amount (ZAR)</label>
            <input 
              type="number" 
              formControlName="amount"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter amount to withdraw">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-bold mb-2">Bank Name</label>
            <select 
              formControlName="bankName"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500">
              <option value="">Select Bank</option>
              <option value="FNB">FNB</option>
              <option value="Standard Bank">Standard Bank</option>
              <option value="ABSA">ABSA</option>
              <option value="Nedbank">Nedbank</option>
              <option value="Capitec">Capitec</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-bold mb-2">Account Number</label>
            <input 
              type="text" 
              formControlName="bankAccount"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter account number">
          </div>
          
          <button 
            type="submit"
            [disabled]="!withdrawForm.valid || isWithdrawing || (walletData?.balance || 0) < 50"
            class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50">
            {{isWithdrawing ? 'Processing...' : 'Withdraw Funds'}}
          </button>
          
          <p class="text-sm text-gray-500 mt-2">Minimum withdrawal: R50</p>
        </form>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Recent Transactions</h3>
        
        <div *ngIf="walletData?.recentTransactions?.length === 0" class="text-gray-500 text-center py-4">
          No transactions yet
        </div>
        
        <div *ngFor="let transaction of walletData?.recentTransactions" 
             class="flex justify-between items-center py-3 border-b last:border-b-0">
          <div>
            <p class="font-medium">{{transaction.transactionType}}</p>
            <p class="text-sm text-gray-500">{{transaction.createdAt | date}}</p>
            <p *ngIf="transaction.description" class="text-sm text-gray-600">{{transaction.description}}</p>
          </div>
          <div class="text-right">
            <p class="font-bold" [class.text-green-600]="transaction.amount > 0" [class.text-red-600]="transaction.amount < 0">
              {{transaction.amount > 0 ? '+' : ''}}R{{transaction.amount}}
            </p>
            <p class="text-sm" [class.text-green-600]="transaction.status === 'Completed'" [class.text-yellow-600]="transaction.status === 'Pending'">
              {{transaction.status}}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WalletComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private fb = inject(FormBuilder);

  walletData: WalletData | null = null;
  withdrawForm: FormGroup;
  isWithdrawing = false;

  constructor() {
    this.withdrawForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(50)]],
      bankName: ['', Validators.required],
      bankAccount: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit() {
    this.loadWallet();
  }

  loadWallet() {
    this.paymentService.getWallet().subscribe({
      next: (response) => {
        if (response.success) {
          this.walletData = response.data;
        }
      },
    });
  }

  onWithdraw() {
    if (this.withdrawForm.valid && this.walletData) {
      this.isWithdrawing = true;
      
      const withdrawRequest: WithdrawRequest = {
        amount: this.withdrawForm.value.amount,
        bankName: this.withdrawForm.value.bankName,
        bankAccount: this.withdrawForm.value.bankAccount
      };

      this.paymentService.withdrawFunds(withdrawRequest).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadWallet(); // Refresh wallet
            this.withdrawForm.reset();
          }
          this.isWithdrawing = false;
        },
        error: (error) => {
          this.isWithdrawing = false;
        }
      });
    }
  }
}