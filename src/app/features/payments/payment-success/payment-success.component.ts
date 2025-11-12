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
    const pendingTaskData = sessionStorage.getItem('pendingTask');
    
    if (pendingTaskData) {
      const taskData = JSON.parse(pendingTaskData);
      
      // Add 10 second timeout
      const timeout = setTimeout(() => {
        this.handleError('Task creation timed out. Please contact support.');
      }, 10000);
      
      this.errandsService.createTask(taskData).subscribe({
        next: (response) => {
          clearTimeout(timeout);
          if (response.success) {
            sessionStorage.removeItem('pendingTask');
            this.processing = false;
          } else {
            this.handleError('Failed to create task after payment');
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          console.error('Task creation error:', error);
          this.handleError('Error creating task after payment');
        }
      });
    } else {
      this.handleError('No pending task data found');
    }
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