import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateTaskData {
  taskDescription: string;
  category: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  termsAccepted: boolean;
  priority: string;
}

export interface CreateTaskResponse {
  success: boolean;
  data: any;
  message: string;
  error?: string;
  taskId?: string;
  paymentStatus?: string;
  taskStatus?: string;
}

export interface Errand {
  id?: number;
  taskId: string;
  timestamp: string;
  userName: string;
  userContact: string;
  createdByUserId: number;
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  paymentStatus: string;
  taskStatus: string;
  helperName?: string;
  helperContact?: string;
  priority: string;
  createdAt: string;
  completedAt?: string;
  
  // Legacy field mappings for backward compatibility
  name?: string;
  contact?: string;
  status?: string;
  category?: string;
  name_and_surname?: string;
  contact_number?: string;
  task_description?: string;
  area_suburb?: string;
  date_time_needed?: string;
  taskid?: string;
}

export interface PaginatedResponse {
  success: boolean;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tasks: Errand[];
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ErrandsService {
  private readonly apiBaseUrl = environment.apiUrl;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000;

  constructor(private http: HttpClient) {}

  // Create a new task (requires authentication)
  createTask(taskData: CreateTaskData): Observable<CreateTaskResponse> {
    const url = `${this.apiBaseUrl}/api/v1/tasks`;
    
    console.log('Creating task');
    
    return this.http.post<CreateTaskResponse>(url, taskData).pipe(
      tap(() => {
        console.log('Task created successfully');
        this.clearCache();
      }),
      catchError(error => {
        console.error('Error creating task:', error);
        return throwError(() => new Error('Failed to create task. Please try again.'));
      })
    );
  }

  getVerifiedTasks(page: number = 1, pageSize: number = 10, filters: any = {}): Observable<PaginatedResponse> {
    const url = `${this.apiBaseUrl}/api/v1/tasks/available`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('includeOwn', 'true'); // Add parameter to include user's own tasks

    // Add filters
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);

    console.log('Making API call for available tasks (including own)');
    console.log('Request URL:', url);
    console.log('Request params:', params.toString());

    return this.http.get<PaginatedResponse>(url, { params }).pipe(
      retry(2),
      map(response => this.processResponse(response)),
      tap(data => {
        console.log('Available tasks API response processed:', data.count, 'tasks found');
        if (data.count === 0) {
          console.warn('No tasks returned. Possible reasons:');
          console.warn('1. Backend filtering by status (e.g., only showing VERIFIED/POSTED tasks)');
          console.warn('2. PayFast webhook has not updated task status yet');
          console.warn('3. Task payment verification pending');
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Get user's own tasks (requires authentication)
  getUserTasks(): Observable<PaginatedResponse> {
    const url = `${this.apiBaseUrl}/api/v1/tasks`;
    console.log('Getting user tasks');
    
    return this.http.get<PaginatedResponse>(url).pipe(
      map(response => this.processResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  // Accept/claim a task (requires authentication)
  claimTask(taskId: string, helperName: string, helperContact: string): Observable<any> {
    const claimData = {
      helperName: helperName,
      helperContact: helperContact
    };
    
    const url = `${this.apiBaseUrl}/api/v1/tasks/${taskId}/claim`;
    console.log('Claiming task');
    
    return this.http.post(url, claimData).pipe(
      tap(() => {
        console.log('Task claimed successfully');
        this.clearCache();
      }),
      catchError(error => {
        console.error('Error claiming task:', error);
        return throwError(() => new Error('Failed to claim task. Please try again.'));
      })
    );
  }

  // Get single task details
  getTask(taskId: string): Observable<any> {
    const url = `${this.apiBaseUrl}/api/v1/tasks/${taskId}`;
    console.log('Getting task details');
    
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error fetching task:', error);
        return throwError(() => new Error('Failed to fetch task details.'));
      })
    );
  }

  private processResponse(response: any): PaginatedResponse {
    console.log('Processing API response');

    if (response && response.tasks !== undefined) {
      const tasks = response.tasks.map((task: any) => this.normalizeTask(task));
      
      return {
        success: response.success !== false,
        count: response.count || 0,
        page: response.page || 1,
        pageSize: response.pageSize || 10,
        totalPages: response.totalPages || 1,
        tasks: tasks,
        timestamp: response.timestamp || new Date().toISOString()
      };
    }

    // Handle case where response is the direct data array
    if (response && Array.isArray(response.data)) {
      const tasks = response.data.map((task: any) => this.normalizeTask(task));
      
      return {
        success: response.success !== false,
        count: response.pagination?.totalCount || response.data.length,
        page: response.pagination?.page || 1,
        pageSize: response.pagination?.pageSize || 10,
        totalPages: response.pagination?.totalPages || 1,
        tasks: tasks,
        timestamp: response.timestamp || new Date().toISOString()
      };
    }

    console.warn('Unexpected response format received');
    return {
      success: true,
      count: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      tasks: [],
      timestamp: new Date().toISOString()
    };
  }

  // UPDATED: Normalize task for new dual status system
  private normalizeTask(task: any): Errand {
    const normalizedTask: Errand = {
      id: task.id,
      taskId: task.taskId,
      timestamp: task.timestamp || task.createdAt,
      userName: task.userName || 'Unknown User',
      userContact: task.userContact || 'Contact not available',
      createdByUserId: task.createdByUserId,
      taskDescription: task.taskDescription,
      area: task.area,
      dateNeeded: task.dateNeeded,
      budget: task.budget,
      notes: task.notes,
      paymentStatus: task.paymentStatus,
      taskStatus: task.taskStatus,
      helperName: task.helperName,
      helperContact: task.helperContact,
      priority: task.priority,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      
      // Legacy field mappings for backward compatibility
      name: task.userName,
      contact: task.userContact,
      status: task.taskStatus,
      category: task.category,
      name_and_surname: task.userName,
      contact_number: task.userContact, 
      task_description: task.taskDescription,
      area_suburb: task.area,
      date_time_needed: task.dateNeeded,
      taskid: task.taskId
    };

    // Task normalized successfully
    return normalizedTask;
  }

  private generateCacheKey(...args: any[]): string {
    return args.join('_');
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  private handleError(error: any): Observable<PaginatedResponse> {
    console.error('API request failed with status:', error?.status || 'unknown');
    return of({
      success: false,
      count: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      tasks: [],
      timestamp: new Date().toISOString()
    });
  }

  // Generate PayFast payment URL for task
  generatePaymentUrl(taskId: string): Observable<any> {
    const url = `${this.apiBaseUrl}/api/v1/payment/initiate`;
    console.log('Generating payment URL');
    
    return this.http.post(url, { taskId }).pipe(
      tap(() => {
        console.log('Payment URL generated successfully');
      }),
      catchError(error => {
        console.error('Error generating payment URL:', error);
        return throwError(() => new Error('Failed to generate payment URL.'));
      })
    );
  }

  // Get filter options (statuses and categories)
  getFilterOptions(): Observable<any> {
    const url = `${this.apiBaseUrl}/api/v1/tasks/filters`;
    console.log('Getting filter options');
    
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error fetching filter options:', error);
        return of({ statuses: [], categories: [] });
      })
    );
  }

  clearCache(): void {
    console.log('Clearing cache');
    this.cache.clear();
  }

  // Force refresh tasks after payment completion
  refreshTasksAfterPayment(): Observable<PaginatedResponse> {
    console.log('Force refreshing tasks after payment');
    this.clearCache();
    return this.getVerifiedTasks(1, 10, {});
  }

  // Check if a specific task is now available
  checkTaskAvailability(taskId: string): Observable<boolean> {
    return this.getVerifiedTasks(1, 50, {}).pipe(
      map(response => {
        const taskExists = response.tasks.some(task => 
          (task.taskId === taskId || task.taskid === taskId)
        );
        console.log(`Task ${taskId} availability check:`, taskExists);
        return taskExists;
      })
    );
  }

  // Debug method to get all user tasks regardless of status
  getAllUserTasksDebug(): Observable<any> {
    const url = `${this.apiBaseUrl}/api/v1/tasks/debug`;
    console.log('Getting all user tasks for debugging');
    
    return this.http.get(url).pipe(
      tap(response => {
        console.log('Debug - All user tasks:', response);
      }),
      catchError(error => {
        console.error('Debug endpoint not available:', error);
        // Fallback to regular user tasks endpoint
        return this.getUserTasks();
      })
    );
  }
}