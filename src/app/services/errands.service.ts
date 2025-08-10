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
  status: string;
  payment_verified: string;
  notes?: string;
  helper_details?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrandsService {
  private readonly apiEndpoint = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVerifiedTasks(): Observable<Errand[]> {
    return this.http.jsonp(
      `${this.apiEndpoint}?apiKey=${environment.apiKey}`,
      'callback' // this must match the parameter name in your script (e.parameter.callback)
    ).pipe(
      map((response: any) => this.processTasks(response)),
      catchError(error => {
        console.error('JSONP API Error:', error);
        return of([]);
      })
    );
  }

  private processTasks(response: any): Errand[] {
    if (!response) return [];

    const tasks = Array.isArray(response) ? response : [response];

    return tasks
      .filter((task: any) => {
        const status = task.status ? task.status.toString().toUpperCase() : '';
        const paymentVerified = task.payment_verified ? task.payment_verified.toString().toUpperCase() : '';
        const helper = task.helper || task.helper_details || '';

        return paymentVerified.includes('YES') &&
               (status.includes('VERIFIED') || status.includes('OPEN')) &&
               (!helper || helper.toString().trim() === '');
      })
      .map((task: any) => this.normalizeTask(task));
  }

private normalizeTask(task: any): Errand {
  return {
    timestamp: task.timestamp || '',
    name_and_surname: task.name_and_surname || task.name || '',
    contact_number: task.contact_number || task.contact || '',
    task_description: task['task_description_(include_as_much_detail_as_possible)'] || '',
    area_suburb: task['area/suburb'] || '',
    date_time_needed: task['date_&_time_needed'] || '',
    budget: task['budget_(please_send_pop_to_dfy_on_0795258611)_'] || '0',
    taskid: task.taskid || task.taskId || '',
    status: task.status || '',
    payment_verified: task.payment_verified || 'NO',
    notes: task.notes || task['optional_notes'] || '',
    helper_details: task.helper_details || task.helper || ''
  };
}

}
