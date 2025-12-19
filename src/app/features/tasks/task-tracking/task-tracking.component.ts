import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-task-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-tracking.component.html',
  styleUrls: ['./task-tracking.component.scss']
})
export class TaskTrackingComponent implements OnInit {
  createdTasks: any[] = [];
  acceptedTasks: any[] = [];
  showCompleteModal = false;
  showRevisionModal = false;
  completionNotes = '';
  revisionNotes = '';
  selectedTaskId = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.http.get(`${environment.apiUrl}/api/tasktracking/my-tasks`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.createdTasks = response.createdTasks || [];
          this.acceptedTasks = response.acceptedTasks || [];
        }
      },
    });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'claimed': 'In Progress',
      'completed': 'Awaiting Confirmation',
      'confirmed': 'Confirmed & Paid',
      'revision_required': 'Revision Required'
    };
    return statusMap[status] || status;
  }

  completeTask(taskId: number): void {
    this.selectedTaskId = taskId;
    this.completionNotes = '';
    this.showCompleteModal = true;
  }

  submitCompletion(): void {
    this.http.post(`${environment.apiUrl}/api/tasktracking/${this.selectedTaskId}/complete`, {
      completionNotes: this.completionNotes
    }).subscribe({
      next: () => {
        this.closeModal();
        this.loadTasks();
      },
    });
  }

  confirmTask(taskId: number, isApproved: boolean): void {
    this.http.post(`${environment.apiUrl}/api/tasktracking/${taskId}/confirm`, {
      isApproved: isApproved
    }).subscribe({
      next: () => this.loadTasks(),
    });
  }

  requestRevision(taskId: number): void {
    this.selectedTaskId = taskId;
    this.revisionNotes = '';
    this.showRevisionModal = true;
  }

  submitRevision(): void {
    this.http.post(`${environment.apiUrl}/api/tasktracking/${this.selectedTaskId}/confirm`, {
      isApproved: false,
      revisionNotes: this.revisionNotes
    }).subscribe({
      next: () => {
        this.closeModal();
        this.loadTasks();
      },
    });
  }

  closeModal(): void {
    this.showCompleteModal = false;
    this.showRevisionModal = false;
    this.completionNotes = '';
    this.revisionNotes = '';
    this.selectedTaskId = 0;
  }
}