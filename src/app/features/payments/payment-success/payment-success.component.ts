import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  processing = true;
  isAuthenticated = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private errandsService: ErrandsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    // Check if status parameter indicates success
    this.route.queryParams.subscribe(params => {
      if (params['status'] === 'success') {
        // Payment was processed by PayFast webhook, just show success
        this.processing = false;
      } else if (this.isAuthenticated) {
        // Try to confirm payment via API if user is authenticated
        this.createTaskAfterPayment();
      } else {
        // Not authenticated and no success status, show generic success
        this.processing = false;
      }
    });
  }

  private createTaskAfterPayment() {
    const timeout = setTimeout(() => {
      this.handleError('Payment confirmation timed out. Your payment may still be processing.');
    }, 10000);
    
    this.errandsService.handlePaymentSuccess().subscribe({
      next: (response) => {
        clearTimeout(timeout);
        if (response.success) {
          this.processing = false;
        } else {
          this.handleError('Payment confirmation pending');
        }
      },
      error: (error) => {
        clearTimeout(timeout);
        console.error('Payment confirmation error:', error);
        // Don't show error for authentication issues, payment might be processed by webhook
        this.processing = false;
      }
    });
  }

  private handleError(message: string) {
    console.error(message);
    this.processing = false;
  }

  goToDashboard() {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}