import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// NEW: Updated interface without name and contact
export interface CreateTaskData {
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  termsAccepted: boolean;
  priority: string; // NEW: Added priority
}

export interface CreateTaskResponse {
  success: boolean;
  data: any;
  message: string;
  error?: string;
}

// NEW: Updated Errand interface with dual status system
export interface Errand {
  id?: number;
  taskId: string;
  timestamp: string;
  userName: string; // NEW: From user profile
  userContact: string; // NEW: From user profile
  createdByUserId: number; // NEW: User relationship
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  paymentStatus: string; // NEW: Dual status system
  taskStatus: string; // NEW: Dual status system
  helperName?: string;
  helperContact?: string;
  priority: string;
  createdAt: string;
  completedAt?: string; // NEW: Completion timestamp
  
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
    const url = `${this.apiBaseUrl}/api/Tasks`;
    
    console.log('Creating task with new structure:', taskData);
    
    return this.http.post<CreateTaskResponse>(url, taskData).pipe(
      tap(response => {
        console.log('Task creation response:', response);
        this.clearCache(); // Clear cache when new task is created
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

    const url = `${this.apiBaseUrl}/api/Tasks/available`;
    let params = new HttpParams()
      .set('Page', page.toString())
      .set('PageSize', pageSize.toString());

    // Add filters - UPDATED for new status system
    if (filters.search) params = params.set('Search', filters.search);
    if (filters.paymentStatus) params = params.set('PaymentStatus', filters.paymentStatus);
    if (filters.taskStatus) params = params.set('TaskStatus', filters.taskStatus);
    if (filters.area) params = params.set('Area', filters.area);

    console.log('Making API call to:', url);
    console.log('With params:', params.toString());

    return this.http.get<PaginatedResponse>(url, { params }).pipe(
      retry(2),
      map(response => this.processResponse(response)),
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => this.handleError(error))
    );
  }

  // Get user's own tasks (requires authentication)
  getUserTasks(): Observable<PaginatedResponse> {
    const url = `${this.apiBaseUrl}/api/Tasks`;
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
    
    return this.http.patch(`${this.apiBaseUrl}/api/Tasks/${taskId}/claim`, claimData).pipe(
      tap(() => this.clearCache()), // Clear cache when task is claimed
      catchError(error => {
        console.error('Error claiming task:', error);
        return throwError(() => new Error('Failed to claim task. Please try again.'));
      })
    );
  }

  // Get single task details
  getTask(taskId: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/api/Tasks/${taskId}`).pipe(
      catchError(error => {
        console.error('Error fetching task:', error);
        return throwError(() => new Error('Failed to fetch task details.'));
      })
    );
  }

  private processResponse(response: any): PaginatedResponse {
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
    return {
      id: task.id,
      taskId: task.taskId,
      timestamp: task.timestamp || task.createdAt,
      userName: task.userName || task.name, // Map from backend
      userContact: task.userContact || task.contact, // Map from backend
      createdByUserId: task.createdByUserId,
      taskDescription: task.taskDescription,
      area: task.area,
      dateNeeded: task.dateNeeded,
      budget: task.budget,
      notes: task.notes,
      paymentStatus: task.paymentStatus, // NEW: Dual status
      taskStatus: task.taskStatus, // NEW: Dual status
      helperName: task.helperName,
      helperContact: task.helperContact,
      priority: task.priority,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      
      // Legacy field mappings for backward compatibility
      name: task.userName || task.name,
      contact: task.userContact || task.contact,
      status: task.taskStatus, // Map to new taskStatus
      category: task.category,
      name_and_surname: task.userName || task.name,
      contact_number: task.userContact || task.contact, 
      task_description: task.taskDescription,
      area_suburb: task.area,
      date_time_needed: task.dateNeeded,
      taskid: task.taskId
    };
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
    console.error('API Error:', error);
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

  clearCache(): void {
    this.cache.clear();
  }
}