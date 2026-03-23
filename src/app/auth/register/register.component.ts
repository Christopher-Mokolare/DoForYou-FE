import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  showPassword = false;
  showConfirmPassword = false;
  dateOfBirth = '';
  currentStep = 1;
  totalSteps = 3;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9+\\-\\s()]+$')]],
      userType: ['', [Validators.required]],
      idNumber: ['', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      address: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.isStepValid(this.currentStep)) {
        this.currentStep++;
      } else {
        this.markStepTouched(this.currentStep);
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch(step) {
      case 1:
        return !!(this.registerForm.get('firstName')?.valid && 
                 this.registerForm.get('lastName')?.valid &&
                 this.registerForm.get('email')?.valid &&
                 this.registerForm.get('phoneNumber')?.valid);
      case 2:
        return !!(this.registerForm.get('userType')?.valid &&
                 this.registerForm.get('idNumber')?.valid &&
                 this.registerForm.get('address')?.valid &&
                 this.registerForm.get('dateOfBirth')?.valid);
      case 3:
        return !!(this.registerForm.get('password')?.valid && 
                 this.registerForm.get('confirmPassword')?.valid &&
                 !this.registerForm.hasError('passwordMismatch'));
      default:
        return false;
    }
  }

  markStepTouched(step: number): void {
    const fields: { [key: number]: string[] } = {
      1: ['firstName', 'lastName', 'email', 'phoneNumber'],
      2: ['userType', 'idNumber', 'address', 'dateOfBirth'],
      3: ['password', 'confirmPassword']
    };
    
    fields[step]?.forEach(field => {
      this.registerForm.get(field)?.markAsTouched();
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loadingService.show();
      this.errorMessage = '';
      
      const { confirmPassword, ...registerData } = this.registerForm.value;
      
      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          this.loadingService.hide();
          if (response.success) {
            this.router.navigate(['/login'], { 
              queryParams: { message: 'Registration successful! Please login.' }
            });
          } else {
            this.errorMessage = response.message || 'Registration failed. Please try again.';
          }
        },
        error: (error: any) => {
          this.loadingService.hide();
          this.errorMessage = 'Registration failed. Please try again.';
          console.error('Registration error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onIdNumberChange(): void {
    const idNumber = this.registerForm.get('idNumber')?.value;
    console.log('=== ID NUMBER CHANGE EVENT ===');
    console.log('ID Number changed:', idNumber);
    console.log('ID length:', idNumber?.length);
    console.log('ID regex test:', /^\d{13}$/.test(idNumber));
    
    if (idNumber && idNumber.length === 13 && /^\d{13}$/.test(idNumber)) {
      console.log('✅ Calling API to validate ID:', idNumber);
      
      this.authService.validateIdNumber(idNumber).subscribe({
        next: (response: any) => {
          console.log('✅ API Response:', response);
          if (response.success && response.data.isValid) {
            console.log('✅ Setting date of birth:', response.data.dateOfBirth);
            this.registerForm.patchValue({
              dateOfBirth: response.data.dateOfBirth
            });
            console.log('✅ Form updated, new value:', this.registerForm.get('dateOfBirth')?.value);
          }
        },
        error: (error) => {
          console.error('❌ ID validation error:', error);
        }
      });
    } else {
      console.log('❌ ID number validation failed');
      console.log('- Has value:', !!idNumber);
      console.log('- Length is 13:', idNumber?.length === 13);
      console.log('- Regex passes:', /^\d{13}$/.test(idNumber));
    }
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.errors[errorType] && field.touched);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}