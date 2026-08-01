import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { ErrandsService, Errand, PaginatedResponse } from '../../../services/errands.service';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { LoadingService } from '../../../services/loading.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { environment } from '../../../../environments/environment';

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
  isLoadingTasks = false;
  error: string | null = null;
  lastUpdated?: Date;
  refreshSubscription?: Subscription;
  searchSubject = new Subject<string>();
  searchSubscription?: Subscription;
  isLoggedIn = false;
  canAcceptTasks = false;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [5, 10, 20, 50];

  // Filters
  searchTerm = '';
  categoryFilter = '';
  locationFilter = '';
  
  // Dynamic filter options
  categoryOptions: any[] = [];

  readonly whatsappNumber = environment.whatsappNumber;

  constructor(
    private errandsService: ErrandsService,
    private loadingService: LoadingService,
    public authService: AuthService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
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
      this.canAcceptTasks = this.authService.canAcceptTasks();

      if (this.isLoggedIn) {
        this.checkAutoAccept();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  loadErrands(): void {
    this.isLoadingTasks = true;
    this.error = null;
    
    const filters = this.buildFilters();

    this.errandsService.getVerifiedTasks(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (data: PaginatedResponse) => {
        this.errands = data.tasks;
        this.totalItems = data.count;
        this.totalPages = data.totalPages;
        this.lastUpdated = new Date();
        this.isLoadingTasks = false;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load errands. Please try again later.';
        this.isLoadingTasks = false;
        this.isLoading = false;
      }
    });
  }

  private loadFilterOptions(): void {
    this.errandsService.getFilterOptions().subscribe({
      next: (response) => {
        console.log('Filter options received:', response);
        const categories = response?.data?.categories || response?.categories || [];
        this.categoryOptions = categories.map((cat: string) => ({
          value: cat,
          label: cat
        }));
        console.log('Category options:', this.categoryOptions);
      },
      error: (error) => {
        console.error('Failed to load filter options:', error);
      }
    });
  }

  private buildFilters(): any {
    const filters: any = {};
    
    if (this.searchTerm) filters.search = this.searchTerm.toUpperCase();
    if (this.categoryFilter && this.categoryFilter !== '') filters.category = this.categoryFilter;

    return filters;
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  private setupSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.errandsService.clearCache();
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
      const taskId = errand.taskId || errand.taskid;
      const returnUrl = encodeURIComponent(`/task/${taskId}?accept=true`);
      
      this.modalService.showConfirm(
        'Login Required',
        'You need to be logged in to accept tasks.',
        () => window.location.href = `/login?returnUrl=${returnUrl}`,
        () => window.location.href = `/register?returnUrl=${returnUrl}`,
        'Login',
        'Register'
      );
      return;
    }

    // Check if user can accept tasks based on preferences
    if (!this.canAcceptTasks) {
      this.modalService.showAlert(
        'Permission Required', 
        'You have selected "Task Creator" mode. To accept tasks, please update your preferences to "Task Runner" or "Both" in your profile settings.',
        'warning'
      );
      return;
    }

    const status = errand.taskStatus || errand.status || '';
    if (status.toUpperCase().includes('PENDING') || status.toUpperCase().includes('CLAIMED')) {
      this.modalService.showAlert('Task Unavailable', 'This task cannot be accepted at the moment.', 'warning');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.modalService.showAlert('Authentication Required', 'Please log in to accept tasks', 'warning');
      return;
    }

    const taskId = errand.taskId || errand.taskid;
    if (!taskId) {
      this.modalService.showAlert('Invalid Task', 'Invalid task ID', 'error');
      return;
    }

    // Call automated API to claim task
    const helperName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'Unknown';
    const helperContact = currentUser.phoneNumber || currentUser.contact || currentUser.email || 'No contact';
    
    console.log('Claiming task with:', { taskId, helperName, helperContact });
    this.errandsService.claimTask(taskId, helperName, helperContact).subscribe({
      next: () => {
        this.modalService.showAlert('Success', 'Task accepted successfully! You can now start working on it.', 'success');
        this.loadErrands(); // Refresh the list
        // Navigate to dashboard to see accepted tasks
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('Task claim failed:', error);
        const errorMessage = error?.error?.title || error?.error?.detail || error?.message || 'Failed to accept task. Please try again.';
        this.modalService.showAlert('Unable to Accept Task', errorMessage, 'error');
      }
    });
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
    this.errandsService.clearCache(); // Clear cache on filter change
    this.loadErrands();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.locationFilter = '';
    this.currentPage = 1;
    this.errandsService.clearCache(); // Clear cache before loading
    this.loadErrands();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private checkAutoAccept(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const acceptTaskId = urlParams.get('accept');
    
    if (acceptTaskId) {
      // Find the task and auto-accept it
      const task = this.errands.find(e => (e.taskId || e.taskid) === acceptTaskId);
      if (task) {
        this.acceptErrand(task);
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/browse-errands');
    }
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
    if (!this.isLoggedIn) return 'Login to Accept';
    if (!this.canAcceptTasks) return 'Task Creator Mode';
    
    const status = errand.taskStatus || errand.status || '';
    const contact = errand.userContact || errand.contact_number;
    
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('PENDING')) return 'Awaiting Verification';
    if (statusUpper.includes('CLAIMED')) return 'Already Claimed';
    if (!contact) return 'Contact Unavailable';
    return 'Accept Task';
  }

  getButtonTooltip(errand: Errand): string {
    if (!this.canAcceptTasks) return 'You are in Task Creator mode. Change to Task Runner mode to accept tasks.';
    
    const status = errand.taskStatus || errand.status || '';
    const contact = errand.userContact || errand.contact_number;
    
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('PENDING')) return 'This task is awaiting payment verification';
    if (statusUpper.includes('CLAIMED')) return 'This task has already been accepted by someone';
    if (!contact) return 'Contact information is not available for this task';
    return 'Click to accept this task';
  }

  postErrand(): void {
    if (!this.authService.isAuthenticated()) {
      this.modalService.showConfirm(
        'Login Required',
        'You need to be logged in to post a task.',
        () => this.router.navigate(['/login'], { queryParams: { returnUrl: '/post-errand' } }),
        () => this.router.navigate(['/register'], { queryParams: { returnUrl: '/post-errand' } }),
        'Login',
        'Register'
      );
      return;
    }
    this.router.navigate(['/post-errand']);
    this.scrollToTop();
  }

  getRunnerPayout(budget: number): number {
    return budget * 0.85;
  }
}