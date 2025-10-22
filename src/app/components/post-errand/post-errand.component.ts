import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrandsService, CreateTaskData } from '../../services/errands.service';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';

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
    // Get current user for context
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      console.log('Current user:', this.currentUser);
    }
  }

  // UPDATED: Form without name and contact fields
  private createForm(): FormGroup {
    return this.fb.group({
      // REMOVED: name and contact fields - they come from user profile
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      area: ['', [Validators.required]],
      priority: ['standard', [Validators.required]], // NEW: Priority field
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
      
      // UPDATED: Create task data without name and contact
      const formData: CreateTaskData = {
        taskDescription: this.taskForm.value.taskDescription,
        area: this.taskForm.value.area,
        priority: this.taskForm.value.priority, // NEW
        dateNeeded: new Date(this.taskForm.value.dateNeeded).toISOString(),
        budget: parseFloat(this.taskForm.value.budget),
        notes: this.taskForm.value.notes || undefined,
        termsAccepted: this.taskForm.value.termsAccepted
      };

      console.log('Submitting task with new structure:', formData);

      this.errandsService.createTask(formData).subscribe({
        next: (response) => {
          this.loadingService.hide();
          this.isSubmitting = false;
          
          if (response.success) {
            console.log('Task created successfully:', response);
            alert('Task posted successfully! Please make payment to get your task published.');
            this.taskForm.reset({ priority: 'standard' }); // Reset with default priority
            this.router.navigate(['/browse-errands']);
          } else {
            alert('Failed to post task: ' + (response.error || response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          this.loadingService.hide();
          this.isSubmitting = false;
          console.error('Error creating task:', error);
          alert('Error posting task. Please try again. ' + (error.message || ''));
        }
      });
    } else {
      this.markFormGroupTouched();
      
      const firstInvalidControl = document.querySelector('.is-invalid');
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
}