import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
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

export type ErrandsResponse = PaginatedResponse | Errand[];

@Injectable({ providedIn: 'root' })
export class ErrandsService {
  private readonly apiEndpoint = environment.apiUrl;
  private cachedErrands: Errand[] = [];
  private lastFetchTime: number = 0;

  constructor(private http: HttpClient) {}

  getVerifiedTasks(page: number = 1, pageSize: number = 10): Observable<ErrandsResponse> {
    const now = Date.now();
    const cacheExpiry = 30000; // 30 seconds cache
    
    if (this.cachedErrands.length > 0 && (now - this.lastFetchTime) < cacheExpiry) {
      return of(this.cachedErrands);
    }

    return this.http.jsonp(
      `${this.apiEndpoint}?apiKey=${environment.apiKey}&page=${page}&pageSize=${pageSize}`,
      'callback'
    ).pipe(
      map((response: any) => {
        console.log('Raw API response:', response);
        
        // Check if this is a paginated response
        if (response && response.tasks !== undefined) {
          // Paginated response
          return {
            success: response.success !== undefined ? response.success : true,
            count: response.count || 0,
            page: response.page || 1,
            pageSize: response.pageSize || pageSize,
            totalPages: response.totalPages || 1,
            tasks: this.processTasks(response.tasks),
            timestamp: response.timestamp || new Date().toISOString()
          };
        } else {
          // Non-paginated response (fallback)
          const tasks = this.processTasks(response);
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
      }),
      catchError(error => {
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
      })
    );
  }

  private processTasks(response: any): Errand[] {
    if (!response) return [];

    const tasks = Array.isArray(response) ? response : [response];

    return tasks
      .filter((task: any) => {
        const status = task.status ? task.status.toString().toUpperCase() : '';
        const helper = task.helper_details || task.helper || '';
        
        return (status.includes('VERIFIED') || status.includes('OPEN')) &&
               (!helper || helper.toString().trim() === '');
      })
      .map((task: any) => this.normalizeTask(task));
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
      helper_details: task.helper_details || task.helper || ''
    };
  }
}