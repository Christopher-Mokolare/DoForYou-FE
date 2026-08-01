import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WalletService, WalletTransaction } from '../../services/wallet.service';
import { ModalService } from '../../services/modal.service';

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
    private fb: FormBuilder,
    private modalService: ModalService
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
    this.supportedBanks = [
      { code: 'FNB', name: 'FNB', branchCode: '250655' },
      { code: 'STD', name: 'Standard Bank', branchCode: '051001' },
      { code: 'ABSA', name: 'ABSA', branchCode: '632005' },
      { code: 'NED', name: 'Nedbank', branchCode: '198765' },
      { code: 'CAP', name: 'Capitec', branchCode: '470010' },
      { code: 'AFR', name: 'African Bank', branchCode: '430000' }
    ];
  }

  loadBankAccounts(): void {
    // Banking endpoints not yet available — bank accounts managed via profile page
  }

  loadWithdrawalRequests(): void {
    // Banking endpoints not yet available
  }

  calculateFee(): void {
    // Flat fee until banking endpoint is available
    this.withdrawalFee = 10;
  }

  addBankAccount(): void {
    this.modalService.showAlert('Coming Soon', 'Bank account management is coming soon. Please update your bank details on the Profile page.', 'info');
  }

  initiateWithdrawal(): void {
    if (this.withdrawForm.invalid) return;
    this.loading = true;
    this.walletService.requestWithdrawal({ amount: this.withdrawForm.value.amount, paymentMethod: 'bank', accountDetails: {} }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.modalService.showAlert('Withdrawal Requested', 'Your withdrawal request has been submitted. Funds will be transferred within 1-3 business days.', 'success');
          this.loadWalletBalance();
          this.showWithdraw = false;
          this.withdrawForm.reset({ amount: 50 });
        } else {
          this.modalService.showAlert('Error', response.error || 'Failed to request withdrawal.', 'error');
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.modalService.showAlert('Error', error.error?.error || 'Failed to request withdrawal.', 'error');
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
    if (this.balance < 50) {
      this.modalService.showAlert('Insufficient Balance', 'Minimum withdrawal amount is R50.', 'warning');
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

  onBankSelected(event: Event): void {
    const bankName = (event.target as HTMLSelectElement).value;
    const bank = this.supportedBanks.find(b => b.name === bankName);
    if (bank) this.addBankForm.patchValue({ branchCode: bank.branchCode });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;
    this.modalService.showAlert('Coming Soon', 'OTP verification is coming soon.', 'info');
    this.showOtpVerification = false;
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