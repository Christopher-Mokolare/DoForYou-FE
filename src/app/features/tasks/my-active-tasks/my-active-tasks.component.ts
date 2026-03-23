import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { ModalService } from '../../../services/modal.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Task {
  taskId: string;
  title?: string;
  description: string;
  category: string;
  budget: number;
  dueDate: string;
  location?: string;
  status: string;
  creatorName: string;
  creatorContact: string;
}

@Component({
  selector: 'app-my-active-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-active-tasks.component.html',
  styleUrls: ['./my-active-tasks.component.scss']
})
export class MyActiveTasksComponent implements OnInit, OnDestroy {
  tasks$!: Observable<Task[]>;
  loading$ = new Subject<boolean>();
  private destroy$ = new Subject<void>();

  constructor(
    private readonly taskService: TaskService,
    private readonly modalService: ModalService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByTaskId(index: number, task: Task): string {
    return task.taskId;
  }

  private loadActiveTasks(): void {
    this.loading$.next(true);
    
    this.taskService.getMyActiveTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.tasks$ = new Observable(observer => {
              observer.next(response.data || []);
              observer.complete();
            });
          }
          this.loading$.next(false);
        },
        error: (error) => {
          console.error('Failed to load active tasks:', error);
          this.modalService.showAlert(
            'Error',
            'Failed to load active tasks. Please try again.',
            'error'
          );
          this.loading$.next(false);
        }
      });
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      posted: 'posted',
      claimed: 'claimed',
      completed: 'completed',
      runnerpaid: 'paid',
      cancelled: 'cancelled'
    };
    
    return statusMap[status?.toLowerCase()] || 'posted';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRunnerPayout(budget: number): number {
    return budget * 0.85;
  }

  viewTaskDetails(task: Task): void {
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const details = `
      <div style="text-align: left; padding: 1rem;">
        <div style="margin-bottom: 1rem;">
          <strong>Description:</strong><br/>
          <span>${task.description || task.title}</span>
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Category:</strong> ${task.category}<br/>
          <strong>Budget:</strong> R${task.budget.toFixed(2)}<br/>
          <strong>Your Payout:</strong> R${this.getRunnerPayout(task.budget).toFixed(2)}<br/>
          <strong>Due Date:</strong> ${dueDate}<br/>
          <strong>Location:</strong> ${task.location || 'Not specified'}
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>Posted by:</strong> ${task.creatorName}<br/>
          <strong>Contact:</strong> ${task.creatorContact}
        </div>
        <div>
          <strong>Status:</strong> <span style="color: var(--primary);">${task.status}</span>
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

  openChat(task: Task): void {
    this.router.navigate(['/tasks/chat', task.taskId], {
      queryParams: { title: task.title || task.description }
    });
  }

  markComplete(task: Task): void {
    this.modalService.showConfirm(
      'Complete Task',
      `Are you sure you want to mark "${task.title || task.description}" as complete?`,
      () => this.completeTask(task.taskId),
      undefined,
      'Mark Complete',
      'Cancel'
    );
  }

  private completeTask(taskId: string): void {
    this.taskService.completeTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.modalService.showAlert(
              'Success',
              'Task marked as complete!',
              'success'
            );
            this.loadActiveTasks();
          } else {
            this.modalService.showAlert(
              'Error',
              response.error || 'Failed to complete task',
              'error'
            );
          }
        },
        error: (error) => {
          this.modalService.showAlert(
            'Error',
            error?.error?.title || 'Failed to complete task',
            'error'
          );
        }
      });
  }
}