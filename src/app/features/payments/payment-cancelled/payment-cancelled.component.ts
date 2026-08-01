import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-cancelled',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-cancelled.component.html',
  styleUrls: ['./payment-cancelled.component.scss']
})
export class PaymentCancelledComponent {
  constructor(private router: Router) {}

  tryAgain() {
    this.router.navigate(['/tasks/post']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}