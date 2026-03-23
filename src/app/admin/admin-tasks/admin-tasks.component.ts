import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tasks.component.html',
  styleUrls: ['./admin-tasks.component.scss']
})
export class AdminTasksComponent implements OnInit {
  tasks: any[] = [];
  selectedTasks: string[] = [];
  verifying: string[] = [];
  loading = true;
  showTaskModal = false;
  selectedTask: any = null;
  
  filters = {
    paymentStatus: '',
    taskStatus: '',
    priority: '',
    search: ''
  };

  pagination = {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  };

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Apply initial filters from query params
    this.route.queryParams.subscribe(params => {
      if (params['paymentStatus']) this.filters.paymentStatus = params['paymentStatus'];
      if (params['taskStatus']) this.filters.taskStatus = params['taskStatus'];
      if (params['priority']) this.filters.priority = params['priority'];
      this.loadTasks();
    });
  }

  loadTasks() {
    this.loading = true;
    const query = {
      ...this.filters,
      page: this.pagination.page,
      pageSize: this.pagination.pageSize
    };

    console.log('Loading tasks with query:', query);

    this.adminService.getTasks(query).subscribe({
      next: (response) => {
        console.log('Raw API response:', response);
        
        // Handle nested data structure
        const data = response.data || response;
        
        if (Array.isArray(data)) {
          this.tasks = data;
          this.pagination = {
            page: 1,
            pageSize: 20,
            totalCount: data.length,
            totalPages: 1
          };
        } else {
          this.tasks = data.tasks || [];
          this.pagination = {
            page: data.page || 1,
            pageSize: data.pageSize || 20,
            totalCount: data.count || data.totalCount || 0,
            totalPages: data.totalPages || 1
          };
        }
        
        console.log('Processed tasks:', this.tasks);
        console.log('Pagination:', this.pagination);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.pagination.page = 1;
    this.loadTasks();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.page = page;
      this.loadTasks();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.pagination.page - 2);
    const end = Math.min(this.pagination.totalPages, this.pagination.page + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleTaskSelection(taskId: string, event: any) {
    if (event.target.checked) {
      this.selectedTasks.push(taskId);
    } else {
      this.selectedTasks = this.selectedTasks.filter(id => id !== taskId);
    }
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedTasks = this.tasks.map(task => task.TaskId || task.id?.toString());
    } else {
      this.selectedTasks = [];
    }
  }

  isAllSelected(): boolean {
    return this.tasks.length > 0 && this.selectedTasks.length === this.tasks.length;
  }

  verifyPayment(taskId: string) {
    this.verifying.push(taskId);
    
    this.adminService.verifyPayment(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTasks(); // Refresh the list
        }
        this.verifying = this.verifying.filter(id => id !== taskId);
      },
      error: () => {
        console.error('Payment verification failed');
        this.verifying = this.verifying.filter(id => id !== taskId);
      }
    });
  }

  unverifyPayment(taskId: string) {
    this.verifying.push(taskId);
    
    this.adminService.unverifyPayment(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTasks(); // Refresh the list
        }
        this.verifying = this.verifying.filter(id => id !== taskId);
      },
      error: () => {
        console.error('Payment unverification failed');
        this.verifying = this.verifying.filter(id => id !== taskId);
      }
    });
  }

  bulkVerifySelected() {
    if (this.selectedTasks.length === 0) return;

    this.adminService.bulkVerifyPayments(this.selectedTasks).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedTasks = [];
          this.loadTasks();
        }
      },
      error: () => {
        console.error('Bulk verification failed');
      }
    });
  }

  viewTask(task: any) {
    this.selectedTask = task;
    this.showTaskModal = true;
  }

  closeTaskModal() {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  getPaymentStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Pending': 'bg-warning',
      'pending': 'bg-warning',
      'Completed': 'bg-success',
      'completed': 'bg-success',
      'Failed': 'bg-danger',
      'failed': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  getTaskStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PendingPayment': 'bg-warning',
      'pendingpayment': 'bg-warning',
      'Posted': 'bg-info',
      'posted': 'bg-info',
      'Claimed': 'bg-primary',
      'claimed': 'bg-primary',
      'Completed': 'bg-success',
      'completed': 'bg-success',
      'Cancelled': 'bg-danger',
      'cancelled': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }
}