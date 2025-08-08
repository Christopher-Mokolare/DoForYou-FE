import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ErrandsService, Errand } from '../../services/errands.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-browse-errands',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule
],
  templateUrl: './browse-errands.component.html',
  styleUrls: ['./browse-errands.component.scss']
})
export class BrowseErrandsComponent implements OnInit {
  errands: Errand[] = [];
  isLoading = true;
  error: string | null = null;
  lastUpdated?: Date;

  constructor(private errandsService: ErrandsService) {}

  ngOnInit(): void {
    this.loadErrands();
  }

  loadErrands(): void {
    this.isLoading = true;
    this.error = null;
    
    this.errandsService.getErrands().subscribe({
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
    const message = `I'd like to help with your verified task: ${errand.task_description}`;
    window.open(
      `https://wa.me/27${errand.contact_number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  trackByErrand(index: number, errand: Errand): string {
    return `${errand.timestamp}-${errand.contact_number}`;
  }
}