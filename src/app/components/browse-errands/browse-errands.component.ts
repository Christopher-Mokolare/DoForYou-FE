import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ErrandsService, Errand } from '../../services/errands.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-browse-errands',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, TruncatePipe],
  templateUrl: './browse-errands.component.html',
  styleUrls: ['./browse-errands.component.scss']
})
export class BrowseErrandsComponent implements OnInit, OnDestroy {
  errands: Errand[] = [];
  isLoading = true;
  error: string | null = null;
  lastUpdated?: Date;
  refreshSubscription?: Subscription;
  readonly taskRequestForm = environment.taskRequestForm;

  constructor(private errandsService: ErrandsService) {}

  ngOnInit(): void {
    this.loadErrands();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadErrands(): void {
    this.isLoading = true;
    this.error = null;
    
    this.errandsService.getVerifiedTasks().subscribe({
      next: (data) => {
        this.errands = data;
        this.lastUpdated = new Date();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load errands. Please try again later.';
        this.isLoading = false;
        console.error('Error loading errands:', err);
      }
    });
  }

  acceptErrand(errand: Errand): void {
    if (!errand.contact_number) {
      console.error('No contact number available for this errand');
      return;
    }

    const cleanNumber = errand.contact_number.toString().replace(/\D/g, '');
    const message = `I'd like to help with: ${errand.task_description || 'your task'}`;
    const whatsappUrl = `https://wa.me/27${cleanNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadErrands();
    });
  }

  trackByErrand(index: number, errand: Errand): string {
    return errand.taskid || `${errand.timestamp}-${index}`;
  }

  refreshErrands(): void {
    this.loadErrands();
  }
}