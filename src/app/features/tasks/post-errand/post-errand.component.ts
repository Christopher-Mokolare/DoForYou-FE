import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrandsService, CreateTaskData } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-post-errand',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './post-errand.component.html',
  styleUrls: ['./post-errand.component.scss']
})
export class PostErrandComponent implements OnInit {
  taskForm: FormGroup;
  isSubmitting = false;
  submitted = false;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private errandsService: ErrandsService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router
  ) {
    this.taskForm = this.createForm();
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    
    // Check if user preferences allow task creation
    if (this.currentUser?.canCreateTasks === false) {
      alert('You have selected "Task Runner" mode. To post errands, please update your preferences to "Task Creator" or "Both" in your profile settings.');
      this.router.navigate(['/profile/preferences']);
      return;
    }

    // User loaded successfully
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // REMOVED: name and contact fields - they come from user profile
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      area: ['', [Validators.required]],
      priority: ['standard', [Validators.required]],
      dateNeeded: ['', [Validators.required, this.futureDateValidator]],
      budget: ['', [Validators.required, Validators.min(0)]],
      notes: [''],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { futureDate: true };
    }
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.loadingService.show();
      
      try {
        // Validate and sanitize form data
        const formData: CreateTaskData = {
          taskDescription: this.sanitizeInput(this.taskForm.value.taskDescription),
          area: this.sanitizeInput(this.taskForm.value.area),
          priority: this.taskForm.value.priority,
          dateNeeded: new Date(this.taskForm.value.dateNeeded).toISOString(),
          budget: this.validateBudget(this.taskForm.value.budget),
          notes: this.taskForm.value.notes ? this.sanitizeInput(this.taskForm.value.notes) : undefined,
          termsAccepted: this.taskForm.value.termsAccepted
        };

      // Submitting task data

        // Store task data in session and redirect to payment first
        const taskData = {
          ...formData,
          budget: formData.budget
        };
        
        sessionStorage.setItem('pendingTask', JSON.stringify(taskData));
        
        this.loadingService.hide();
        this.isSubmitting = false;
        
        // Generate temporary task ID for payment
        const tempTaskId = 'TEMP_' + Date.now();
        this.initiatePayment(tempTaskId, taskData.budget);
      } catch (error) {
        console.error('Error processing task submission');
        this.loadingService.hide();
        this.isSubmitting = false;
        alert('Error processing your request. Please try again.');
      }
    } else {
      this.markFormGroupTouched();
      
      try {
        const firstInvalidControl = document.querySelector('.is-invalid');
        if (firstInvalidControl) {
          firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Error scrolling to invalid field');
      }
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check field validity
  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  // Helper to get specific error message
  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    
    const errors = field.errors;
    
    if (errors['required']) return 'This field is required';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['min']) return 'Budget must be at least R0';
    if (errors['futureDate']) return 'Please select a future date';
    if (errors['requiredTrue']) return 'You must accept the terms and conditions';
    
    return 'Invalid value';
  }

  private initiatePayment(tempTaskId: string, budget: number): void {
    // Generate payment URL with temporary task ID
    const paymentUrl = this.generatePayFastUrl(tempTaskId, budget);
    
    // Show message and redirect to payment
    alert(`Budget: R${budget.toFixed(2)}\n\nYou will now be redirected to PayFast to complete payment.\n\nYour task will be posted after successful payment.`);
    
    // Reset form
    this.taskForm.reset({ priority: 'standard' });
    
    // Redirect to PayFast payment page
    window.location.href = paymentUrl;
  }

  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>"'&]/g, '');
  }

  private validateBudget(budget: any): number {
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      throw new Error('Invalid budget amount');
    }
    return numBudget;
  }

  private generatePayFastUrl(taskId: string, amount: number): string {
    const sanitizedTaskId = this.sanitizeInput(taskId);
    const paymentData = {
      merchant_id: '10000100',
      merchant_key: '46f0cd694581a',
      amount: amount.toFixed(2),
      item_name: `Task Payment - ${sanitizedTaskId}`,
      item_description: 'DoForYou Task Payment',
      return_url: 'http://localhost:4200/payment-success',
      cancel_url: 'http://localhost:4200/payment-cancelled',
      notify_url: 'http://localhost:5015/api/payfast/notify',
      custom_str1: sanitizedTaskId
    };

    const queryString = Object.entries(paymentData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `https://sandbox.payfast.co.za/eng/process?${queryString}`;
  }
}