import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';
import { UserPreferencesService } from '../../services/user-preferences.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  returnUrl: string = '/';
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private preferencesService = inject(UserPreferencesService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loadingService.show();
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          this.loadingService.hide();
          if (response.success) {
            // Load user preferences immediately after login
            this.preferencesService.getUserPreferences().subscribe();
            
            // Debug: Log token claims
            const token = response.token;
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Token payload:', payload);
                console.log('Role claim:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
              } catch (e) {
                console.error('Failed to decode token:', e);
              }
            }

            // Check if user is admin and redirect accordingly
            if (response.user?.isAdmin || response.user?.roles?.includes('Admin')) {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigateByUrl(this.returnUrl);
            }
          } else {
            this.errorMessage = response.message || 'Login failed. Please try again.';
          }
        },
        error: (error: any) => {
          this.loadingService.hide();
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}