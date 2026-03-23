import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WalletService, WalletTransaction } from '../../services/wallet.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare var bootstrap: any;

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchCode: string;
  accountType: string;
  isVerified: boolean;
  isActive: boolean;
}

interface Bank {
  code: string;
  name: string;
  branchCode: string;
}

interface WithdrawalRequest {
  id: number;
  amount: number;
  fee: number;
  status: string;
  reference: string;
  createdAt: string;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  balance = 0;
  pendingPayouts = 0;
  totalEarned = 0;
  totalWithdrawn = 0;
  canWithdraw = false;
  
  bankAccounts: BankAccount[] = [];
  selectedBankAccount: BankAccount | null = null;
  withdrawalRequests: WithdrawalRequest[] = [];
  supportedBanks: Bank[] = [];
  
  addBankForm: FormGroup;
  withdrawForm: FormGroup;
  otpForm: FormGroup;
  
  showAddBank = false;
  showWithdraw = false;
  showOtpVerification = false;
  pendingWithdrawalId: number | null = null;
  withdrawalFee = 0;
  
  transactions: WalletTransaction[] = [];
  loadingTransactions = false;
  loading = false;

  constructor(
    private walletService: WalletService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.addBankForm = this.fb.group({
      bankName: ['', Validators.required],
      accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      accountHolderName: ['', Validators.required],
      branchCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      accountType: ['Cheque', Validators.required]
    });
    
    this.withdrawForm = this.fb.group({
      amount: [50, [Validators.required, Validators.min(50), Validators.max(10000)]],
      bankAccountId: ['', Validators.required]
    });
    
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadWalletBalance();
    this.loadTransactions();
    this.loadBankAccounts();
    this.loadWithdrawalRequests();
    this.loadSupportedBanks();
  }
  
  loadSupportedBanks(): void {
    this.http.get<any>(`${environment.apiUrl}/banking/banks`).subscribe({
      next: (response) => {
        if (response.success) {
          this.supportedBanks = response.data || [];
        }
      },
      error: (error) => console.error('Error loading banks:', error)
    });
  }
  
  loadBankAccounts(): void {
    this.http.get<any>(`${environment.apiUrl}/banking/bank-accounts`).subscribe({
      next: (response) => {
        if (response.success) {
          this.bankAccounts = response.data || [];
        }
      },
      error: (error) => console.error('Error loading bank accounts:', error)
    });
  }
  
  loadWithdrawalRequests(): void {
    this.http.get<any>(`${environment.apiUrl}/banking/withdrawals`).subscribe({
      next: (response) => {
        if (response.success) {
          this.withdrawalRequests = response.data || [];
        }
      },
      error: (error) => console.error('Error loading withdrawals:', error)
    });
  }
  
  calculateFee(): void {
    const amount = this.withdrawForm.get('amount')?.value;
    if (amount) {
      this.http.get<any>(`${environment.apiUrl}/banking/withdrawal-fee?amount=${amount}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.withdrawalFee = response.data;
          }
        }
      });
    }
  }
  
  addBankAccount(): void {
    if (this.addBankForm.invalid) return;
    
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/banking/bank-accounts`, this.addBankForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Bank account added successfully');
          this.loadBankAccounts();
          this.addBankForm.reset({ accountType: 'Cheque' });
          this.showAddBank = false;
        }
        this.loading = false;
      },
      error: (error) => {
        alert(error.error?.error || 'Failed to add bank account');
        this.loading = false;
      }
    });
  }
  
  onBankSelected(event: any): void {
    const selectedBank = this.supportedBanks.find(b => b.name === event.target.value);
    if (selectedBank) {
      this.addBankForm.patchValue({
        branchCode: selectedBank.branchCode
      });
    }
  }
  
  initiateWithdrawal(): void {
    if (this.withdrawForm.invalid) return;
    
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/banking/withdraw`, this.withdrawForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingWithdrawalId = response.data.id;
          this.showWithdraw = false;
          this.showOtpVerification = true;
          alert('OTP sent to your registered email/phone');
        }
        this.loading = false;
      },
      error: (error) => {
        alert(error.error?.error || 'Failed to initiate withdrawal');
        this.loading = false;
      }
    });
  }
  
  verifyOtp(): void {
    if (this.otpForm.invalid || !this.pendingWithdrawalId) return;
    
    this.loading = true;
    const payload = {
      withdrawalId: this.pendingWithdrawalId,
      otp: this.otpForm.get('otp')?.value
    };
    
    this.http.post<any>(`${environment.apiUrl}/banking/verify-withdrawal`, payload).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Withdrawal successful! Funds will be transferred within 1-3 business days.');
          this.loadWalletBalance();
          this.loadWithdrawalRequests();
          this.loadTransactions();
          this.showOtpVerification = false;
          this.otpForm.reset();
          this.withdrawForm.reset({ amount: 50 });
        }
        this.loading = false;
      },
      error: (error) => {
        alert(error.error?.error || 'Invalid OTP');
        this.loading = false;
      }
    });
  }
  
  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  }

  loadWalletBalance(): void {
    this.walletService.getBalance().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.balance = response.data.availableBalance || 0;
          this.pendingPayouts = response.data.pendingPayouts || 0;
          this.totalEarned = response.data.totalEarned || 0;
          this.totalWithdrawn = response.data.totalWithdrawn || 0;
          this.canWithdraw = this.balance >= 50;
        }
      },
      error: (error) => {
        console.error('Error loading wallet balance:', error);
      }
    });
  }

  loadTransactions(): void {
    this.loadingTransactions = true;
    this.walletService.getTransactions(1, 20).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.transactions = response.data.items || [];
        }
        this.loadingTransactions = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loadingTransactions = false;
      }
    });
  }

  showWithdrawModal(): void {
    if (this.bankAccounts.length === 0) {
      alert('Please add a bank account first');
      this.showAddBank = true;
      return;
    }
    this.showWithdraw = true;
    this.calculateFee();
  }

  withdrawFunds(): void {
    this.initiateWithdrawal();
  }

  private resetForm(): void {
    this.withdrawForm.reset({ amount: 50 });
  }

  getTransactionIcon(type: string): string {
    return type === 'debit' ? 'fa-arrow-up' : 'fa-arrow-down';
  }

  formatCurrency(amount: number): string {
    return this.walletService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}