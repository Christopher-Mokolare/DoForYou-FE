// services/errands.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Errand {
  timestamp: string;
  name_and_surname: string;
  contact_number: string;
  task_description?: string;
  area_suburb?: string;
  date_time_needed: string;
  budget?: string;
  taskid: string;
  taskID?: string;
  status: string;
  notes?: string;
  helper_details?: string;
  category?: string;
  priority?: string;
}

export interface PaginatedResponse {
  success: boolean;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tasks: Errand[];
  timestamp: string;
  filters?: any;
}

export type ErrandsResponse = PaginatedResponse | Errand[];

@Injectable({ providedIn: 'root' })
export class ErrandsService {
  private readonly apiEndpoint = environment.apiUrl;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(private http: HttpClient) {}

  getVerifiedTasks(page: number = 1, pageSize: number = 10, filters: any = {}): Observable<PaginatedResponse> {
    const cacheKey = this.generateCacheKey('tasks', page, pageSize, filters);
    const cachedData = this.getFromCache(cacheKey);

    if (cachedData) {
      return of(cachedData);
    }

    const params = this.buildQueryParams(page, pageSize, filters);

    return this.http.jsonp<PaginatedResponse>(
      `${this.apiEndpoint}?${params}`,
      'callback'
    ).pipe(
      retry(2),
      map(response => this.processResponse(response)),
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => this.handleError(error))
    );
  }

  private buildQueryParams(page: number, pageSize: number, filters: any): string {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());
    
    // Add filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.set(key, filters[key]);
      }
    });

    return params.toString();
  }

  private processResponse(response: any): PaginatedResponse {
    if (response && response.tasks !== undefined) {
      return {
        success: response.success !== false,
        count: response.count || 0,
        page: response.page || 1,
        pageSize: response.pageSize || 10,
        totalPages: response.totalPages || 1,
        tasks: this.normalizeTasks(response.tasks),
        timestamp: response.timestamp || new Date().toISOString(),
        filters: response.filters || {}
      };
    }

    // Fallback for non-paginated responses
    const tasks = this.normalizeTasks(response);
    return {
      success: true,
      count: tasks.length,
      page: 1,
      pageSize: tasks.length,
      totalPages: 1,
      tasks: tasks,
      timestamp: new Date().toISOString()
    };
  }

  private normalizeTasks(tasks: any[]): Errand[] {
    if (!Array.isArray(tasks)) return [];

    return tasks
      .filter(task => this.isValidTask(task))
      .map(task => this.normalizeTask(task));
  }

  private isValidTask(task: any): boolean {
    const status = (task.status || '').toString().toUpperCase();
    const helper = (task.helper_details || task.helper || '').toString().trim();
    
    return (status.includes('VERIFIED') || status.includes('OPEN')) && 
           (!helper || helper === '');
  }

  private normalizeTask(task: any): Errand {
    return {
      timestamp: task.timestamp || '',
      name_and_surname: task.name_and_surname || task.name || '',
      contact_number: task.contact_number || task.contact || '',
      task_description: task.task_description || 
                       task['task_description_(include_as_much_detail_as_possible)'] || '',
      area_suburb: task.area_suburb || task['area/suburb'] || '',
      date_time_needed: task.date_time_needed || task['date_&_time_needed'] || '',
      budget: task.budget || task['budget_(please_send_pop_to_dfy_on_0795258611)_'] || '0',
      taskid: task.taskid || task.taskId || '',
      taskID: task.taskID || task.taskid || '',
      status: task.status || '',
      notes: task.notes || task.optional_notes || '',
      helper_details: task.helper_details || task.helper || '',
      category: task.category || task.area || '',
      priority: task.priority || 'normal'
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
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown error occurred'
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}