import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrandsService, CreateTaskData } from '../../services/errands.service';

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
  showOtherCategoryInput = false;

  constructor(
    private fb: FormBuilder,
    private errandsService: ErrandsService,
    private router: Router
  ) {
    this.taskForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact: ['', [Validators.required, Validators.pattern(/^(\+27|0)[1-9][0-9]{8}$/)]],
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      area: ['', [Validators.required]],
      category: ['', [Validators.required]],
      otherCategory: [''],
      dateNeeded: ['', [Validators.required, this.futureDateValidator]],
      budget: ['', [Validators.required, Validators.min(0)]],
      notes: [''],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    this.taskForm.get('category')?.valueChanges.subscribe(value => {
      this.showOtherCategoryInput = value === 'other';
      
      if (value === 'other') {
        this.taskForm.get('otherCategory')?.setValidators([Validators.required]);
      } else {
        this.taskForm.get('otherCategory')?.clearValidators();
        this.taskForm.get('otherCategory')?.setValue('');
      }
      this.taskForm.get('otherCategory')?.updateValueAndValidity();
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
    
    if (this.taskForm.valid) {
      this.isSubmitting = true;
      
      const formData: CreateTaskData = {
        name: this.taskForm.value.name,
        contact: this.taskForm.value.contact,
        taskDescription: this.taskForm.value.taskDescription,
        area: this.taskForm.value.area,
        category: this.taskForm.value.category === 'other' 
          ? this.taskForm.value.otherCategory 
          : this.taskForm.value.category,
        dateNeeded: new Date(this.taskForm.value.dateNeeded).toISOString(),
        budget: parseFloat(this.taskForm.value.budget),
        notes: this.taskForm.value.notes || undefined,
        termsAccepted: this.taskForm.value.termsAccepted
      };

      console.log('Submitting task data:', formData);

      this.errandsService.createTask(formData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          if (response.success) {
            alert('Task posted successfully! Please make payment to get your task published.');
            this.router.navigate(['/']);
          } else {
            alert('Failed to post task: ' + (response.error || 'Unknown error'));
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating task:', error);
          alert('Error posting task. Please try again. ' + error.message);
        }
      });
    } else {
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      
      const firstInvalidControl = document.querySelector('.is-invalid');
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
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
    if (errors['pattern']) return 'Please enter a valid South African phone number';
    if (errors['min']) return 'Budget must be at least R0';
    if (errors['futureDate']) return 'Please select a future date';
    if (errors['requiredTrue']) return 'You must accept the terms and conditions';
    
    return 'Invalid value';
  }
}