import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, DashboardStats } from '../../../services/admin.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.loadingService.show();

    this.adminService.getDashboard().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.loadingService.hide();
        
        if (response.success) {
          this.stats = response.data;
        } else {
          this.error = 'Failed to load dashboard data';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.loadingService.hide();
        this.error = 'Error loading dashboard. Please try again.';
        console.error('Dashboard error:', err);
      }
    });
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }
}