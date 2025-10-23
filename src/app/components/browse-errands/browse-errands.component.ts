import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { ErrandsService, Errand, PaginatedResponse } from '../../services/errands.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { LoadingService } from '../../services/loading.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-browse-errands',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, TruncatePipe, FormsModule],
  templateUrl: './browse-errands.component.html',
  styleUrls: ['./browse-errands.component.scss'],
  providers: [LoadingService]
})
export class BrowseErrandsComponent implements OnInit, OnDestroy {
  errands: Errand[] = [];
  isLoading = true;
  error: string | null = null;
  lastUpdated?: Date;
  refreshSubscription?: Subscription;
  searchSubject = new Subject<string>();
  searchSubscription?: Subscription;
  isLoggedIn = false;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [5, 10, 20, 50];

  // Filters
  searchTerm = '';
  statusFilter = '';
  categoryFilter = '';
  locationFilter = '';

  readonly taskRequestForm = environment.taskRequestForm;
  readonly whatsappNumber = environment.whatsappNumber;

  constructor(
    private errandsService: ErrandsService,
    private loadingService: LoadingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadErrands();
    this.setupAutoRefresh();
    this.setupSearch();

    // Subscribe to loading state
    this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Check authentication status
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      console.log('Authentication status:', this.isLoggedIn);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  loadErrands(): void {
    this.loadingService.show();
    this.error = null;
    
    const filters = this.buildFilters();

    console.log('Loading errands with filters:', filters);

    this.errandsService.getVerifiedTasks(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (data: PaginatedResponse) => {
        this.errands = data.tasks;
        this.totalItems = data.count;
        this.totalPages = data.totalPages;
        this.lastUpdated = new Date();
        this.loadingService.hide();
        console.log('Errands loaded successfully:', this.errands.length, 'tasks');
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.error = 'Failed to load errands. Please try again later.';
        this.loadingService.hide();
      }
    });
  }

  private buildFilters(): any {
    const filters: any = {};
    
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.statusFilter) filters.taskStatus = this.statusFilter;
    if (this.categoryFilter) filters.category = this.categoryFilter;
    if (this.locationFilter) filters.area = this.locationFilter;

    return filters;
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  private setupSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadErrands();
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  acceptErrand(errand: Errand): void {
    if (!this.isLoggedIn) {
      alert('Please log in to accept tasks');
      return;
    }

    const contact = errand.userContact || errand.contact_number;
    const status = errand.taskStatus || errand.status || '';
    
    if (!contact || status.toUpperCase().includes('PENDING') || status.toUpperCase().includes('CLAIMED')) {
      alert('This task cannot be accepted at the moment.');
      return;
    }

    const taskId = errand.taskId || errand.taskid || '(missing)';
    const taskDescription = errand.taskDescription || errand.task_description || 'your task';
    const message = `I'd like to help with Task ID ${taskId}: ${taskDescription}`;
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    console.log('Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadErrands();
    });
  }

  trackByErrand(index: number, errand: Errand): string {
    return errand.taskId || errand.taskid || `${errand.timestamp}-${index}` || `errand-${index}`;
  }

  refreshErrands(): void {
    this.errandsService.clearCache();
    this.loadErrands();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadErrands();
      this.scrollToTop();
    }
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.loadErrands();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadErrands();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.categoryFilter = '';
    this.locationFilter = '';
    this.currentPage = 1;
    this.loadErrands();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Utility methods for status handling
  getStatusClass(status?: string): string {
    if (!status) return 'secondary';
    
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('VERIFIED') || statusUpper.includes('POSTED')) return 'success';
    if (statusUpper.includes('PENDING')) return 'warning';
    if (statusUpper.includes('OPEN')) return 'info';
    if (statusUpper.includes('COMPLETED') || statusUpper.includes('PAID')) return 'secondary';
    if (statusUpper.includes('DRAFT')) return 'light';
    return 'secondary';
  }

  getButtonText(errand: Errand): string {
    const status = errand.taskStatus || errand.status || '';
    const contact = errand.userContact || errand.contact_number;
    
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('PENDING')) return 'Awaiting Verification';
    if (statusUpper.includes('CLAIMED')) return 'Already Claimed';
    if (!contact) return 'Contact Unavailable';
    return 'Accept Task';
  }

  getButtonTooltip(errand: Errand): string {
    const status = errand.taskStatus || errand.status || '';
    const contact = errand.userContact || errand.contact_number;
    
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('PENDING')) return 'This task is awaiting payment verification';
    if (statusUpper.includes('CLAIMED')) return 'This task has already been accepted by someone';
    if (!contact) return 'Contact information is not available for this task';
    return 'Click to contact via WhatsApp';
  }
}