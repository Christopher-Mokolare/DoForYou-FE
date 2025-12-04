import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../services/category.service';
import { TaskService, CreateTaskRequest } from '../../services/task.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-create',
  template: `
    <div class="container mx-auto p-4 max-w-2xl">
      <h2 class="text-2xl font-bold mb-6">Create New Task</h2>
      
      <div *ngIf="!canCreateTasks" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        You need to enable task creation in your profile settings.
      </div>

      <div *ngIf="profileIncomplete" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Complete your profile to post tasks. Your profile is {{profileCompletion}}% complete.
        <a routerLink="/profile" class="underline ml-2">Complete Profile</a>
      </div>

      <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" *ngIf="canCreateTasks && !profileIncomplete">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Task Description</label>
          <textarea 
            formControlName="taskDescription" 
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            rows="3"
            placeholder="Describe what you need help with...">
          </textarea>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Budget (ZAR)</label>
          <input 
            type="number" 
            formControlName="budget" 
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="100"
            (input)="calculateCommission()">
          
          <div *ngIf="commissionInfo" class="mt-2 text-sm text-gray-600">
            <p>Platform fee (15%): R{{commissionInfo.platformFee}}</p>
            <p>Runner will receive: R{{commissionInfo.runnerAmount}}</p>
          </div>
        </div>

        <button 
          type="submit" 
          [disabled]="!taskForm.valid || isSubmitting"
          class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50">
          {{isSubmitting ? 'Creating Task...' : 'Create Task & Pay'}}
        </button>
      </form>
    </div>
  `
})
export class TaskCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  taskForm: FormGroup;
  canCreateTasks = false;
  profileIncomplete = false;
  profileCompletion = 0;
  isSubmitting = false;
  commissionInfo: { platformFee: number; runnerAmount: number } | null = null;

  constructor() {
    this.taskForm = this.fb.group({
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      area: ['', Validators.required],
      budget: ['', [Validators.required, Validators.min(10)]],
      dateNeeded: ['', Validators.required],
      priority: ['standard', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.canCreateTasks = this.authService.canPostErrands();
    this.profileIncomplete = this.authService.isProfileIncomplete();
    this.profileCompletion = this.authService.getProfileCompletion();
  }

  calculateCommission() {
    const budget = this.taskForm.get('budget')?.value;
    if (budget && budget > 0) {
      this.commissionInfo = this.paymentService.calculateCommission(budget);
    }
  }

  onSubmit() {
    if (this.taskForm.valid && this.canCreateTasks && !this.profileIncomplete) {
      this.isSubmitting = true;
      
      const taskData: CreateTaskRequest = {
        taskDescription: this.taskForm.value.taskDescription,
        area: this.taskForm.value.area,
        dateNeeded: this.taskForm.value.dateNeeded,
        budget: this.taskForm.value.budget,
        notes: '',
        priority: this.taskForm.value.priority,
        termsAccepted: this.taskForm.value.termsAccepted
      };

      this.taskService.createTask(taskData).subscribe({
        next: (response) => {
          if (response.success) {
            this.initiatePayment(response.data.id, taskData.budget);
          }
        },
        error: () => this.isSubmitting = false
      });
    }
  }

  private initiatePayment(taskId: string, amount: number) {
    const paymentRequest = {
      taskId: taskId,
      amount: amount,
      paymentMethod: 'payfast'
    };

    this.paymentService.initiatePayment(paymentRequest).subscribe({
      next: (response) => {
        if (response.success && response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        }
      },
      error: () => this.isSubmitting = false
    });
  }
}