import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ErrandsService } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
  task: any = null;
  canClaim = false;
  canComplete = false;
  taskId: string = '';

  constructor(
    private route: ActivatedRoute,
    private errandsService: ErrandsService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.taskId = this.route.snapshot.params['id'];
    this.loadTaskDetails();
    
    // Check for auto-accept parameter
    const shouldAutoAccept = this.route.snapshot.queryParams['accept'];
    if (shouldAutoAccept === 'true') {
      this.autoAcceptTask();
    }
  }

  private loadTaskDetails() {
    this.errandsService.getTask(this.taskId).subscribe({
      next: (response) => {
        this.task = response.data;
        this.updateActionButtons();
      },
      error: (error) => {
        console.error('Error loading task:', error);
      }
    });
  }

  private autoAcceptTask() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.task) {
      this.errandsService.claimTask(this.taskId, currentUser.name, currentUser.contact).subscribe({
        next: () => {
          this.modalService.showAlert('Success', 'Task accepted successfully! You can now start working on it.', 'success');
          this.loadTaskDetails(); // Refresh task data
        },
        error: (error) => {
          console.error('Error claiming task:', error);
          this.modalService.showAlert('Error', 'Failed to accept task. Please try again.', 'error');
        }
      });
    }
  }

  private updateActionButtons() {
    // Update button visibility based on task status
    this.canClaim = this.task?.taskStatus === 'posted';
    this.canComplete = this.task?.taskStatus === 'claimed';
  }

  claimTask() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.modalService.showAlert('Error', 'Please log in to claim tasks', 'error');
      return;
    }

    this.errandsService.claimTask(this.taskId, currentUser.name, currentUser.contact).subscribe({
      next: () => {
        this.modalService.showAlert('Success', 'Task claimed successfully! You can now start working on it.', 'success');
        this.loadTaskDetails(); // Refresh to show updated status
      },
      error: (error) => {
        console.error('Error claiming task:', error);
        this.modalService.showAlert('Error', 'Failed to claim task. Please try again.', 'error');
      }
    });
  }

  markComplete() {
    // TODO: Implement mark complete functionality
    this.modalService.showAlert('Info', 'Mark complete functionality coming soon!', 'info');
  }
}