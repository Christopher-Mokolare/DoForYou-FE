import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  processing = true;
  statusMessage = 'Processing your payment and activating your task...';
  taskActivated = false;
  private pollingSubscription?: Subscription;
  maxPollingAttempts = 15;
  currentAttempt = 0;

  constructor(
    private router: Router,
    private errandsService: ErrandsService
  ) {}

  ngOnInit() {
    this.verifyTaskActivation();
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  private verifyTaskActivation() {
    const pendingTaskId = sessionStorage.getItem('pendingTaskId');
    
    if (!pendingTaskId) {
      this.processing = false;
      this.taskActivated = true;
      this.statusMessage = 'Payment completed successfully!';
      sessionStorage.removeItem('pendingTask');
      return;
    }

    this.pollTaskStatus(pendingTaskId);
  }

  private pollTaskStatus(taskId: string) {
    this.statusMessage = 'Verifying task activation...';
    
    this.pollingSubscription = interval(2000).pipe(
      take(this.maxPollingAttempts)
    ).subscribe({
      next: () => {
        this.currentAttempt++;
        this.checkTaskStatus(taskId);
      },
      complete: () => {
        if (!this.taskActivated) {
          this.handlePollingTimeout();
        }
      }
    });
  }

  private checkTaskStatus(taskId: string) {
    this.errandsService.getTask(taskId).subscribe({
      next: (response) => {
        const task = response.data || response;
        console.log('Task status check:', task);
        
        if (task.paymentStatus === 'COMPLETED' && 
            (task.taskStatus === 'POSTED' || task.taskStatus === 'VERIFIED' || task.taskStatus === 'AVAILABLE')) {
          this.taskActivated = true;
          this.processing = false;
          this.statusMessage = 'Task activated successfully!';
          this.pollingSubscription?.unsubscribe();
          sessionStorage.removeItem('pendingTaskId');
          sessionStorage.removeItem('pendingTask');
        } else if (this.currentAttempt >= this.maxPollingAttempts) {
          this.handlePollingTimeout();
        } else {
          this.statusMessage = `Waiting for task activation... (${this.currentAttempt}/${this.maxPollingAttempts})`;
        }
      },
      error: (error) => {
        console.error('Error checking task status:', error);
        if (this.currentAttempt >= this.maxPollingAttempts) {
          this.handlePollingTimeout();
        }
      }
    });
  }

  private handlePollingTimeout() {
    this.processing = false;
    this.taskActivated = false;
    this.statusMessage = 'Payment completed, but task activation is taking longer than expected.';
    this.pollingSubscription?.unsubscribe();
    sessionStorage.removeItem('pendingTaskId');
    sessionStorage.removeItem('pendingTask');
  }

  goToDashboard() {
    this.router.navigate(['/user-dashboard']);
  }

  goToBrowseTasks() {
    this.router.navigate(['/browse-errands']);
  }
}