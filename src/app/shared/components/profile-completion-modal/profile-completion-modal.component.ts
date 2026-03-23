import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile-completion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Complete Your Profile</h3>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="completion-status">
            <div class="progress-circle">
              <span class="percentage">{{getProfileCompletion()}}%</span>
            </div>
            <p>Your profile is {{getProfileCompletion()}}% complete</p>
          </div>
          
          <div class="requirements">
            <h4>Required for full platform access:</h4>
            <ul class="checklist">
              <li [class.completed]="hasName()">
                <i class="fas" [class.fa-check]="hasName()" [class.fa-times]="!hasName()"></i>
                Full Name
              </li>
              <li [class.completed]="hasPhone()">
                <i class="fas" [class.fa-check]="hasPhone()" [class.fa-times]="!hasPhone()"></i>
                Phone Number
              </li>
              <li [class.completed]="hasAddress()">
                <i class="fas" [class.fa-check]="hasAddress()" [class.fa-times]="!hasAddress()"></i>
                Address
              </li>
              <li [class.completed]="hasIdNumber()">
                <i class="fas" [class.fa-check]="hasIdNumber()" [class.fa-times]="!hasIdNumber()"></i>
                ID Number
              </li>
              <li [class.completed]="hasDateOfBirth()">
                <i class="fas" [class.fa-check]="hasDateOfBirth()" [class.fa-times]="!hasDateOfBirth()"></i>
                Date of Birth
              </li>
              <li [class.completed]="hasEmailVerified()">
                <i class="fas" [class.fa-check]="hasEmailVerified()" [class.fa-times]="!hasEmailVerified()"></i>
                Email Verified
              </li>
              <li [class.completed]="hasPhoneVerified()">
                <i class="fas" [class.fa-check]="hasPhoneVerified()" [class.fa-times]="!hasPhoneVerified()"></i>
                Phone Verified
              </li>
            </ul>
          </div>
          
          <div class="benefits">
            <h4>Complete your profile to:</h4>
            <ul>
              <li>Post and accept tasks</li>
              <li>Receive payments securely</li>
              <li>Build trust with other users</li>
              <li>Access all platform features</li>
            </ul>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Later</button>
          <button class="btn btn-primary" (click)="goToProfile()">Complete Profile</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;

      h3 {
        margin: 0;
        color: #333;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .completion-status {
      text-align: center;
      margin-bottom: 2rem;

      .progress-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: conic-gradient(#FF6B35 var(--progress, 0%), #eee 0%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
        }

        .percentage {
          position: relative;
          z-index: 1;
          font-weight: bold;
          color: #333;
        }
      }
    }

    .requirements {
      margin-bottom: 2rem;

      h4 {
        margin-bottom: 1rem;
        color: #333;
      }

      .checklist {
        list-style: none;
        padding: 0;

        li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          color: #666;

          &.completed {
            color: #28a745;
          }

          i {
            width: 16px;
          }

          .fa-check {
            color: #28a745;
          }

          .fa-times {
            color: #dc3545;
          }
        }
      }
    }

    .benefits {
      h4 {
        margin-bottom: 1rem;
        color: #333;
      }

      ul {
        color: #666;
        padding-left: 1.2rem;

        li {
          margin-bottom: 0.5rem;
        }
      }
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;

      &:hover {
        background: #5a6268;
      }
    }

    .btn-primary {
      background: #FF6B35;
      color: white;

      &:hover {
        background: #e55a2b;
      }
    }
  `]
})
export class ProfileCompletionModalComponent {
  @Input() isVisible = false;
  @Input() profileCompletion = 0;
  @Output() closed = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  close() {
    this.isVisible = false;
    this.closed.emit();
  }

  goToProfile() {
    this.close();
    this.router.navigate(['/user/profile']);
  }

  getProfileCompletion(): number {
    return this.profileCompletion || this.authService.getProfileCompletion();
  }

  private getCurrentUser() {
    return this.authService.getCurrentUser() as any;
  }

  hasName(): boolean {
    const user = this.getCurrentUser();
    return !!(user?.firstName && user?.lastName);
  }

  hasPhone(): boolean {
    const user = this.getCurrentUser();
    return !!(user?.phoneNumber || user?.contact);
  }

  hasAddress(): boolean {
    const user = this.getCurrentUser();
    return !!user?.address;
  }

  hasIdNumber(): boolean {
    const user = this.getCurrentUser();
    return !!user?.idNumber;
  }

  hasDateOfBirth(): boolean {
    const user = this.getCurrentUser();
    return !!user?.dateOfBirth;
  }

  hasEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return !!user?.emailVerified;
  }

  hasPhoneVerified(): boolean {
    const user = this.getCurrentUser();
    return !!user?.phoneVerified;
  }
}