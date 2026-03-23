import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-my-posted-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-posted-tasks.component.html',
  styleUrls: ['./my-posted-tasks.component.scss']
})
export class MyPostedTasksComponent implements OnInit {
  tasks: any[] = [];
  loading = true;
  groupedTasks = {
    pendingPayment: [] as any[],
    posted: [] as any[],
    claimed: [] as any[],
    completed: [] as any[],
    runnerPaid: [] as any[]
  };
  
  expandedSections = {
    pendingPayment: true,
    posted: true,
    claimed: true,
    completed: true,
    runnerPaid: true
  };

  constructor(
    private taskService: TaskService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPostedTasks();
  }

  private loadPostedTasks(): void {
    this.taskService.getMyPostedTasks().subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks = response.data?.tasks || response.data || [];
          this.groupTasksByStatus();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load posted tasks:', error);
        this.loading = false;
      }
    });
  }

  private groupTasksByStatus(): void {
    this.groupedTasks = {
      pendingPayment: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'pendingpayment'),
      posted: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'posted'),
      claimed: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'claimed'),
      completed: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'completed'),
      runnerPaid: this.tasks.filter(t => t.taskStatus?.toLowerCase() === 'runnerpaid')
    };
  }

  toggleSection(section: keyof typeof this.expandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  getStatusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'posted': return 'badge-posted';
      case 'claimed': return 'badge-claimed';
      case 'completed': return 'badge-completed';
      case 'runnerpaid': return 'badge-paid';
      case 'cancelled': return 'badge-cancelled';
      case 'pendingpayment': return 'badge-pending';
      default: return 'badge-posted';
    }
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  }

  viewTaskDetails(task: any): void {
    if (task.taskStatus?.toLowerCase() === 'completed') {
      this.modalService.showConfirm(
        'Confirm Task Completion',
        `Are you sure you want to confirm and release payment for "${task.taskDescription}"?`,
        () => this.confirmTask(task.taskId),
        undefined,
        'Pay Now',
        'Cancel'
      );
    } else {
      const details = `
        <div style="text-align: center; padding: 1rem;">
          <div style="margin-bottom: 1rem;">
            <strong>Description:</strong><br/>
            <span>${task.taskDescription}</span>
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Category:</strong> ${task.category}<br/>
            <strong>Budget:</strong> R${task.budget}<br/>
            <strong>Due Date:</strong> ${new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
            <strong>Location:</strong> ${task.area}
          </div>
          ${task.helperName ? `
          <div style="margin-bottom: 1rem;">
            <strong>Runner:</strong> ${task.helperName}<br/>
            <strong>Contact:</strong> ${task.helperContact}
          </div>
          ` : ''}
          <div>
            <strong>Status:</strong> <span style="color: var(--primary);">${task.taskStatus}</span>
          </div>
        </div>
      `;
      
      this.modalService.showModal({
        title: 'Task Details',
        message: details,
        type: 'info',
        confirmText: 'Close'
      });
    }
  }

  confirmTask(taskId: string): void {
    this.taskService.confirmTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.modalService.showAlert('Success', 'Task confirmed and payment released!', 'success');
          this.loadPostedTasks();
        } else {
          this.modalService.showAlert('Error', response.error || 'Failed to confirm task', 'error');
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', error?.error?.title || 'Failed to confirm task', 'error');
      }
    });
  }

  completePayment(taskId: string): void {
    this.taskService.getPaymentUrl(taskId).subscribe({
      next: (response) => {
        if (response.success && response.data?.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          this.modalService.showAlert('Error', 'Failed to get payment URL', 'error');
        }
      },
      error: (error) => {
        this.modalService.showAlert('Error', error?.error?.message || 'Failed to get payment URL', 'error');
      }
    });
  }

  editTask(task: any): void {
    this.router.navigate(['/tasks/edit', task.taskId]);
  }

  openChat(task: any): void {
    this.router.navigate(['/tasks/chat', task.taskId], {
      queryParams: { title: task.taskDescription }
    });
  }

  showTaskDetails(task: any): void {
    const details = `
      <div style="text-align: center; padding: 1rem;">
        <div style="margin-bottom: 1rem;">
          <strong>Description:</strong><br/>
          <span>${task.taskDescription}</span>
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Category:</strong> ${task.category}<br/>
          <strong>Budget:</strong> R${task.budget}<br/>
          <strong>Due Date:</strong> ${new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
          <strong>Location:</strong> ${task.area}
        </div>
        ${task.helperName ? `
        <div style="margin-bottom: 1rem;">
          <strong>Runner:</strong> ${task.helperName}<br/>
          <strong>Contact:</strong> ${task.helperContact}
        </div>
        ` : ''}
        <div>
          <strong>Status:</strong> <span style="color: var(--primary);">${task.taskStatus}</span>
        </div>
      </div>
    `;
    
    this.modalService.showModal({
      title: 'Task Details',
      message: details,
      type: 'info',
      confirmText: 'Close'
    });
  }

  confirmTaskCompletion(task: any): void {
    this.modalService.showConfirm(
      'Confirm Task Completion',
      `Are you sure you want to confirm and release payment for "${task.taskDescription}"?`,
      () => this.confirmTask(task.taskId),
      undefined,
      'Pay Now',
      'Cancel'
    );
  }
}
