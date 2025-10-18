import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateTaskData {
  name: string;
  contact: string;
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  termsAccepted: boolean;
  category: string;
}

export interface CreateTaskResponse {
  success: boolean;
  data: any;
  message: string;
  error?: string;
}

export interface Errand {
  id?: number;
  taskId: string;
  timestamp: string;
  name: string;
  contact: string;
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  status: string;
  helperName?: string;
  helperContact?: string;
  category: string;
  priority: string;
  createdAt: string;
  // Legacy field mappings
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

  // Create a new task
  createTask(taskData: CreateTaskData): Observable<CreateTaskResponse> {
    const url = `${this.apiBaseUrl}/api/Tasks`;
    
    console.log('Creating task with data:', taskData);
    
    return this.http.post<CreateTaskResponse>(url, taskData).pipe(
      tap(response => {
        console.log('Task creation response:', response);
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

    // Add filters
    if (filters.search) params = params.set('Search', filters.search);
    if (filters.status) params = params.set('Status', filters.status);
    if (filters.category) params = params.set('Category', filters.category);
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

  private normalizeTask(task: any): Errand {
    return {
      id: task.id,
      taskId: task.taskId,
      timestamp: task.timestamp || task.createdAt,
      name: task.name,
      contact: task.contact,
      taskDescription: task.taskDescription,
      area: task.area,
      dateNeeded: task.dateNeeded,
      budget: task.budget,
      notes: task.notes,
      status: task.status,
      helperName: task.helperName,
      helperContact: task.helperContact,
      category: task.category,
      priority: task.priority,
      createdAt: task.createdAt,
      name_and_surname: task.name,
      contact_number: task.contact, 
      task_description: task.taskDescription,
      area_suburb: task.area,
      date_time_needed: task.dateNeeded,
      taskid: task.taskId
    };
  }

  // Accept/claim a task
  claimTask(taskId: string): Observable<any> {
    return this.http.patch(`${this.apiBaseUrl}/api/Tasks/${taskId}/claim`, {});
  }

  // Get single task details
  getTask(taskId: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/api/Tasks/${taskId}`);
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