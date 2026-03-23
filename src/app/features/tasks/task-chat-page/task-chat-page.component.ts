import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskChatComponent } from '../task-chat/task-chat.component';

@Component({
  selector: 'app-task-chat-page',
  standalone: true,
  imports: [CommonModule, TaskChatComponent],
  template: `
    <div class="page-container">
      <div class="container-fluid py-4">
        <button class="btn-outline mb-3" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back to Tasks
        </button>
        <app-task-chat [taskId]="taskId" [taskTitle]="taskTitle"></app-task-chat>
      </div>
    </div>
  `
})
export class TaskChatPageComponent implements OnInit {
  taskId: string = '';
  taskTitle: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    this.taskTitle = this.route.snapshot.queryParamMap.get('title') || 'Task Chat';
  }

  goBack(): void {
    this.router.navigate(['/tasks/my-active']);
  }
}
