// errands.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs'; // Add 'of' for mock data

export interface Errand {
  timestamp: string;
  name_and_surname: string;
  contact_number: string;
  task_description: string;
  area_suburb: string;
  date_time_needed: string;
  budget: string;
  payment_verified: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrandsService {
  private apiUrl = 'YOUR_APPS_SCRIPT_URL?apiKey=YOUR_SECRET_KEY';

  constructor(private http: HttpClient) { }

  // Updated to use mock data if API fails
  getErrands(): Observable<Errand[]> {
    return this.http.get<Errand[]>(this.apiUrl).pipe(
      // Add error handling to return mock data if API fails
      catchError(error => {
        console.error('API failed, using mock data', error);
        return of(this.getMockData());
      })
    );
  }

  private getMockData(): Errand[] {
    return [
      {
        timestamp: new Date().toISOString(),
        name_and_surname: 'Test User',
        contact_number: '27781234567',
        task_description: 'Help me assemble IKEA furniture',
        area_suburb: 'Johannesburg',
        date_time_needed: new Date(Date.now() + 86400000).toISOString(),
        budget: '350',
        payment_verified: 'YES'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        name_and_surname: 'Another User',
        contact_number: '27823334455',
        task_description: 'Need a ride to the airport',
        area_suburb: 'Pretoria',
        date_time_needed: new Date(Date.now() + 172800000).toISOString(),
        budget: '150',
        payment_verified: 'YES'
      }
    ];
  }
}