import { Component, OnInit, inject } from '@angular/core';
import { TaskService, TaskDto, ClaimTaskRequest } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-list',
  template: `
    <div class="container mx-auto p-4">
      <h2 class="text-2xl font-bold mb-6">Available Tasks</h2>
      
      <div *ngIf="!canAcceptTasks" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        Enable task acceptance in your profile to claim tasks.
      </div>

      <div class="grid gap-4">
        <div *ngFor="let task of tasks" class="bg-white border rounded-lg p-4 shadow">
          <h3 class="font-bold text-lg mb-2">{{task.taskDescription}}</h3>
          <p class="text-gray-600 mb-2">📍 {{task.area}}</p>
          <p class="text-green-600 font-bold mb-2">💰 R{{task.budget}}</p>
          <p class="text-sm text-gray-500 mb-3">📅 {{task.dateNeeded | date}}</p>
          
          <button 
            *ngIf="canAcceptTasks && task.taskStatus === 'Available'"
            (click)="claimTask(task)"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Claim Task
          </button>
          
          <span *ngIf="task.taskStatus !== 'Available'" 
                class="bg-gray-200 text-gray-600 px-4 py-2 rounded">
            {{task.taskStatus}}
          </span>
        </div>
      </div>

      <!-- Claim Task Modal -->
      <div *ngIf="showClaimModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-bold mb-4">Claim Task</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-bold mb-2">Your Name</label>
            <input 
              [(ngModel)]="claimData.helperName"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter your full name">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-bold mb-2">Contact Number</label>
            <input 
              [(ngModel)]="claimData.helperContact"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter your phone number">
          </div>
          
          <div class="flex gap-2">
            <button 
              (click)="confirmClaim()"
              [disabled]="!claimData.helperName || !claimData.helperContact"
              class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">
              Confirm Claim
            </button>
            <button 
              (click)="cancelClaim()"
              class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  tasks: TaskDto[] = [];
  canAcceptTasks = false;
  showClaimModal = false;
  selectedTask: TaskDto | null = null;
  claimData: ClaimTaskRequest = { helperName: '', helperContact: '' };

  ngOnInit() {
    this.canAcceptTasks = this.authService.canAcceptTasks();
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getAvailableTasks().subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks = response.data.tasks;
        }
      },
      error: (error) => console.error('Error loading tasks:', error)
    });
  }

  claimTask(task: TaskDto) {
    this.selectedTask = task;
    this.showClaimModal = true;
    this.claimData = { helperName: '', helperContact: '' };
  }

  confirmClaim() {
    if (this.selectedTask && this.claimData.helperName && this.claimData.helperContact) {
      this.taskService.claimTask(this.selectedTask.taskId, this.claimData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTasks(); // Refresh list
            this.cancelClaim();
          }
        },
        error: (error) => console.error('Error claiming task:', error)
      });
    }
  }

  cancelClaim() {
    this.showClaimModal = false;
    this.selectedTask = null;
  }
}