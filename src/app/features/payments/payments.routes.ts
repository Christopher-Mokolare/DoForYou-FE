import { Routes } from '@angular/router';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentCancelledComponent } from './payment-cancelled/payment-cancelled.component';

export const PAYMENTS_ROUTES: Routes = [
  { path: 'success', component: PaymentSuccessComponent },
  { path: 'cancelled', component: PaymentCancelledComponent },
  { path: '', redirectTo: 'success', pathMatch: 'full' }
];