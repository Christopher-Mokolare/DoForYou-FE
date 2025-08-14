import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this import
import { ErrandsService, Errand, PaginatedResponse } from '../../services/errands.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-browse-errands',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, TruncatePipe, FormsModule], // Add FormsModule here
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

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [5, 10, 20, 50];

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
    
    this.errandsService.getVerifiedTasks(this.currentPage, this.itemsPerPage).subscribe({
      next: (data: PaginatedResponse | Errand[]) => {
        if (this.isPaginatedResponse(data)) {
          this.errands = data.tasks;
          this.totalItems = data.count;
          this.totalPages = data.totalPages;
        } else {
          this.errands = data;
          this.totalItems = data.length;
          this.totalPages = Math.ceil(data.length / this.itemsPerPage);
        }
        
        this.lastUpdated = new Date();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.error = 'Failed to load errands. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private isPaginatedResponse(response: PaginatedResponse | Errand[]): response is PaginatedResponse {
    return (response as PaginatedResponse).tasks !== undefined;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5; // Show max 5 page numbers at a time
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < this.totalPages) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  acceptErrand(errand: Errand): void {
    if (!errand.contact_number) {
      console.error('No contact number available for this errand');
      return;
    }
    const message = `I'd like to help with Task ID ${errand.taskID || errand.taskid || '(missing)'}: ${errand.task_description || 'your task'}`;
    const whatsappUrl = `https://wa.me/27795258611?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadErrands();
    });
  }

  trackByErrand(index: number, errand: Errand): string {
    return errand.taskID || errand.taskid || `${errand.timestamp}-${index}`;
  }

  refreshErrands(): void {
    this.loadErrands();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadErrands();
    }
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.loadErrands();
  }
}