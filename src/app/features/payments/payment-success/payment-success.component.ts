import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  processing = true;

  constructor(
    private router: Router,
    private errandsService: ErrandsService
  ) {}

  ngOnInit() {
    this.createTaskAfterPayment();
  }

  private createTaskAfterPayment() {
    const timeout = setTimeout(() => {
      this.handleError('Payment confirmation timed out. Please contact support.');
    }, 10000);
    
    this.errandsService.handlePaymentSuccess().subscribe({
      next: (response) => {
        clearTimeout(timeout);
        if (response.success) {
          this.processing = false;
        } else {
          this.handleError('Failed to confirm payment');
        }
      },
      error: (error) => {
        clearTimeout(timeout);
        console.error('Payment confirmation error:', error);
        this.handleError('Error confirming payment');
      }
    });
  }

  private handleError(message: string) {
    console.error(message);
    alert(message + '. Please contact support.');
    this.processing = false;
  }

  goToDashboard() {
    this.router.navigate(['/user-dashboard']);
  }
}