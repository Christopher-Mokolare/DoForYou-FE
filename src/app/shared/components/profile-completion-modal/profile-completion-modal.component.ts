import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile-completion-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="modal fade show" style="display: block;" *ngIf="isVisible">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-circle me-2"></i>Complete Your Profile
            </h5>
            <button type="button" class="btn-close" (click)="close()"></button>
          </div>
          <div class="modal-body text-center">
            <div class="mb-3">
              <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            </div>
            <h6>Profile Incomplete</h6>
            <p class="mb-3">Your profile is only {{profileCompletion}}% complete. Complete your profile to post tasks and access all features.</p>
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar bg-warning" [style.width.%]="profileCompletion"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close()">Later</button>
            <a routerLink="/profile" class="btn btn-primary" (click)="close()">Complete Profile</a>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="isVisible"></div>
  `
})
export class ProfileCompletionModalComponent {
  @Input() isVisible = false;
  @Input() profileCompletion = 0;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.isVisible = false;
    this.closed.emit();
  }
}