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
  styles: []
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  showPassword = false;
  showConfirmPassword = false;
  dateOfBirth = '';

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
      idNumber: ['', [Validators.pattern('^[0-9]{13}$')]],
      address: [''],
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
    if (idNumber && idNumber.length === 13 && /^\d{13}$/.test(idNumber)) {
      this.dateOfBirth = this.extractDateFromIdNumber(idNumber);
    } else {
      this.dateOfBirth = '';
    }
  }

  private extractDateFromIdNumber(idNumber: string): string {
    const year = idNumber.substring(0, 2);
    const month = idNumber.substring(2, 4);
    const day = idNumber.substring(4, 6);
    
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const fullYear = parseInt(year) <= (currentYear % 100) ? currentCentury + parseInt(year) : currentCentury - 100 + parseInt(year);
    
    return `${day}/${month}/${fullYear}`;
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