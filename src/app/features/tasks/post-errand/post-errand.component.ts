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
  categoryOptions: any[] = [];

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

    // Check if profile is complete
    if (this.authService.isProfileIncomplete()) {
      alert('Please complete your profile before posting tasks. Your profile is only ' + this.authService.getProfileCompletion() + '% complete.');
      this.router.navigate(['/profile']);
      return;
    }

    // Load category options
    this.loadCategoryOptions();
  }

  private loadCategoryOptions(): void {
    this.errandsService.getFilterOptions().subscribe({
      next: (options) => {
        this.categoryOptions = options.categories || [];
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // REMOVED: name and contact fields - they come from user profile
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', [Validators.required]],
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
          category: this.taskForm.value.category,
          area: this.sanitizeInput(this.taskForm.value.area),
          priority: this.taskForm.value.priority,
          dateNeeded: new Date(this.taskForm.value.dateNeeded).toISOString(),
          budget: this.validateBudget(this.taskForm.value.budget),
          notes: this.taskForm.value.notes ? this.sanitizeInput(this.taskForm.value.notes) : undefined,
          termsAccepted: this.taskForm.value.termsAccepted
        };

        // Create task via backend API
        this.errandsService.createTask(formData).subscribe({
          next: (response) => {
            console.log('Task created successfully:', response);
            this.loadingService.hide();
            this.isSubmitting = false;
            
            // Redirect to PayFast payment URL
            if (response.data?.paymentUrl) {
              window.location.href = response.data.paymentUrl;
            } else {
              alert('Payment URL not received. Please try again.');
            }
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.loadingService.hide();
            this.isSubmitting = false;
            alert('Failed to create task. Please try again.');
          }
        });
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


}