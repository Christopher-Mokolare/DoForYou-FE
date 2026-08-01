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
    const url = `${this.apiBaseUrl}/tasks`;
    
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
    const cacheKey = this.generateCacheKey('available_tasks', page, pageSize, filters);
    const cachedData = this.getFromCache(cacheKey);

    if (cachedData) {
      console.log('Returning cached data');
      return of(cachedData);
    }

    const url = `${this.apiBaseUrl}/tasks/available`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Add filters - Match actual HTML form
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);

    console.log('Making API call for available tasks');

    return this.http.get<PaginatedResponse>(url, { params }).pipe(
      retry(2),
      map(response => this.processResponse(response)),
      tap(data => {
        console.log('API response processed');
        this.setCache(cacheKey, data);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Get user's own tasks (requires authentication)
  getUserTasks(): Observable<PaginatedResponse> {
    const url = `${this.apiBaseUrl}/tasks`;
    console.log('Getting user tasks');
    
    return this.http.get<PaginatedResponse>(url).pipe(
      map(response => this.processResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  // Accept/claim a task (requires authentication)
  claimTask(taskId: string, helperName: string, helperContact: string): Observable<any> {
    console.log('ClaimTask called with:', { taskId, helperName, helperContact });
    
    const claimData = {
      helperName: helperName,
      helperContact: helperContact
    };
    
    console.log('Sending claim data:', claimData);
    
    const url = `${this.apiBaseUrl}/tasks/${taskId}/claim`;
    console.log('Claiming task at URL:', url);
    
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
    const url = `${this.apiBaseUrl}/tasks/${taskId}`;
    console.log('Getting task details');
    
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error fetching task:', error);
        return throwError(() => new Error('Failed to fetch task details.'));
      })
    );
  }

  // Get task by ID for editing
  getTaskById(taskId: string): Observable<any> {
    const url = `${this.apiBaseUrl}/tasks/${taskId}`;
    return this.http.get(url);
  }

  // Update existing task
  updateTask(taskId: string, taskData: CreateTaskData): Observable<any> {
    const url = `${this.apiBaseUrl}/tasks/${taskId}`;
    return this.http.put(url, taskData).pipe(
      tap(() => this.clearCache()),
      catchError(error => {
        console.error('Error updating task:', error);
        return throwError(() => error);
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
    const url = `${this.apiBaseUrl}/payment/initiate`;
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
    const url = `${this.apiBaseUrl}/tasks/filters`;
    console.log('Getting filter options from:', url);
    
    return this.http.get(url).pipe(
      tap(response => {
        console.log('Filter options response:', response);
      }),
      catchError(error => {
        console.error('Error fetching filter options:', error);
        return of({ statuses: [], categories: [] });
      })
    );
  }

  // Handle payment success without requiring task ID
  handlePaymentSuccess(): Observable<any> {
    const url = `${this.apiBaseUrl}/tasks/payment-success`;
    console.log('Handling payment success');
    
    return this.http.post(url, {}).pipe(
      tap(() => {
        console.log('Payment success handled');
        this.clearCache();
      }),
      catchError(error => {
        console.error('Error handling payment success:', error);
        return throwError(() => new Error('Failed to process payment success.'));
      })
    );
  }

  // Get payment history
  getPaymentHistory(): Observable<any> {
    const url = `${this.apiBaseUrl}/tasks/payment-history`;
    console.log('Getting payment history');
    
    return this.http.get(url).pipe(
      tap(() => {
        console.log('Payment history loaded');
      }),
      catchError(error => {
        console.error('Error loading payment history:', error);
        return throwError(() => new Error('Failed to load payment history.'));
      })
    );
  }

  // Update task payment status after successful payment
  updateTaskPaymentStatus(taskId: string, paymentStatus: string): Observable<any> {
    const url = `${this.apiBaseUrl}/tasks/${taskId}/payment-status`;
    console.log('Updating task payment status');
    
    return this.http.put(url, { paymentStatus: paymentStatus }).pipe(
      tap(() => {
        console.log('Task payment status updated successfully');
        this.clearCache();
      }),
      catchError(error => {
        console.error('Error updating payment status:', error);
        return throwError(() => new Error('Failed to update payment status.'));
      })
    );
  }

  clearCache(): void {
    console.log('Clearing cache');
    this.cache.clear();
  }
}