import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';

declare var Chart: any;

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Payment Overview</h1>
        <div class="header-stats">
          <span class="stat-badge success">Revenue: R{{paymentsData?.totalCommission | number:'1.2-2'}}</span>
          <span class="stat-badge warning">Pending: R{{paymentsData?.pendingCommission | number:'1.2-2'}}</span>
        </div>
      </div>

      <!-- Financial Stats -->
      <div class="row mb-4" *ngIf="paymentsData">
        <div class="col-xl-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted text-uppercase small mb-1">Platform Revenue</div>
                <div class="h4 mb-0 text-success">R{{paymentsData.totalCommission | number:'1.2-2'}}</div>
                <small class="text-muted">15% Commission</small>
              </div>
              <i class="fas fa-dollar-sign fa-2x text-muted opacity-50"></i>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted text-uppercase small mb-1">Pending Revenue</div>
                <div class="h4 mb-0 text-warning">R{{paymentsData.pendingCommission | number:'1.2-2'}}</div>
                <small class="text-muted">Awaiting verification</small>
              </div>
              <i class="fas fa-clock fa-2x text-muted opacity-50"></i>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted text-uppercase small mb-1">Helper Payouts</div>
                <div class="h4 mb-0 text-info">R{{paymentsData.runnerPayouts | number:'1.2-2'}}</div>
                <small class="text-muted">85% to helpers</small>
              </div>
              <i class="fas fa-hand-holding-usd fa-2x text-muted opacity-50"></i>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted text-uppercase small mb-1">Pending Payouts</div>
                <div class="h4 mb-0 text-danger">{{paymentsData.pendingPayouts}}</div>
                <small class="text-muted">Tasks awaiting payment</small>
              </div>
              <i class="fas fa-exclamation-triangle fa-2x text-muted opacity-50"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="content-card mb-4">
        <h5 class="mb-3">Quick Actions</h5>
        <div class="row">
          <div class="col-md-3 mb-3">
            <a class="btn btn-warning w-100" routerLink="/admin/tasks" [queryParams]="{paymentStatus: 'pending'}">
              <i class="fas fa-check-circle me-2"></i>
              <span class="d-none d-lg-inline">Verify Payments</span>
              <span class="d-lg-none">Verify</span>
            </a>
          </div>
          <div class="col-md-3 mb-3">
            <a class="btn btn-success w-100" routerLink="/admin/tasks" [queryParams]="{taskStatus: 'completed'}">
              <i class="fas fa-money-bill-wave me-2"></i>
              <span class="d-none d-lg-inline">Process Payouts</span>
              <span class="d-lg-none">Payouts</span>
            </a>
          </div>
          <div class="col-md-3 mb-3">
            <button class="btn btn-info w-100" (click)="exportPaymentReport()">
              <i class="fas fa-download me-2"></i>
              <span class="d-none d-lg-inline">Export Report</span>
              <span class="d-lg-none">Export</span>
            </button>
          </div>
          <div class="col-md-3 mb-3">
            <button class="btn btn-primary w-100" (click)="refreshData()">
              <i class="fas fa-sync-alt me-2"></i>
              <span class="d-none d-lg-inline">Refresh Data</span>
              <span class="d-lg-none">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Payment Flow -->
      <div class="content-card">
        <h5 class="mb-4">Payment Flow</h5>
        <div class="row">
          <div class="col-md-3 mb-4">
            <div class="text-center">
              <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                <span class="fw-bold">1</span>
              </div>
              <h6 class="mt-3">User Payment</h6>
              <p class="small text-muted">Customer pays upfront</p>
            </div>
          </div>
          <div class="col-md-1 d-none d-md-flex align-items-center justify-content-center">
            <i class="fas fa-arrow-down fa-2x text-muted"></i>
          </div>
          <div class="col-md-3 mb-4">
            <div class="text-center">
              <div class="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                <span class="fw-bold">2</span>
              </div>
              <h6 class="mt-3">Auto Verification</h6>
              <p class="small text-muted">PayFast ITN confirms payment</p>
            </div>
          </div>
          <div class="col-md-1 d-none d-md-flex align-items-center justify-content-center">
            <i class="fas fa-arrow-down fa-2x text-muted"></i>
          </div>
          <div class="col-md-3 mb-4">
            <div class="text-center">
              <div class="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                <span class="fw-bold">3</span>
              </div>
              <h6 class="mt-3">Task Completion</h6>
              <p class="small text-muted">Helper completes task</p>
            </div>
          </div>
          <div class="col-md-1 d-none d-md-flex align-items-center justify-content-center">
            <i class="fas fa-arrow-down fa-2x text-muted"></i>
          </div>
          <div class="col-md-3 mb-4">
            <div class="text-center">
              <div class="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                <span class="fw-bold">4</span>
              </div>
              <h6 class="mt-3">Auto Payout</h6>
              <p class="small text-muted">85% to helper, 15% commission (1hr delay)</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-payments {
      padding: 2rem;
    }

    .page-header h1 {
      color: #FF6B35;
      margin-bottom: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .revenue .stat-icon { background: #28a745; }
    .pending .stat-icon { background: #ffc107; }
    .payouts .stat-icon { background: #17a2b8; }
    .pending-payouts .stat-icon { background: #dc3545; }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: bold;
      margin: 0;
      color: #333;
    }

    .stat-content p {
      margin: 0;
      color: #666;
      font-weight: 500;
    }

    .card {
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
    }

    .card-header {
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      border-radius: 12px 12px 0 0 !important;
    }

    .revenue-chart {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .revenue-chart canvas {
      max-height: 100%;
    }

    .quick-actions .btn {
      justify-content: flex-start;
      text-align: left;
    }

    .quick-actions .btn i {
      margin-right: 0.5rem;
      width: 16px;
    }

    .payment-flow {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .flow-step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .step-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #FF6B35;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-content strong {
      display: block;
      font-size: 0.9rem;
    }

    .step-content small {
      color: #666;
      font-size: 0.8rem;
    }

    .flow-arrow {
      text-align: center;
      color: #FF6B35;
      font-size: 1.2rem;
      margin: 0.25rem 0;
    }
  `]
})
export class AdminPaymentsComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChart!: ElementRef<HTMLCanvasElement>;
  paymentsData: any = null;
  loading = true;
  chart: any;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadPaymentsData();
    this.loadChartScript();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initChart(), 100);
  }

  loadPaymentsData() {
    this.loading = true;
    this.adminService.getPaymentsOverview().subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentsData = response.data;
          this.updateChart();
        }
        this.loading = false;
      },
      error: () => {
        console.error('Failed to load payments data');
        this.loading = false;
      }
    });
  }

  refreshData() {
    this.loadPaymentsData();
  }

  exportPaymentReport() {
    if (!this.paymentsData) {
      console.error('No payment data available for export');
      return;
    }
    
    try {
      const csvData = this.generateCSVReport();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating payment report');
    }
  }

  private generateCSVReport(): string {
    const date = new Date().toISOString().split('T')[0];
    const sanitizeValue = (value: any): string => {
      const numValue = Number(value) || 0;
      return numValue.toFixed(2);
    };
    
    return `Date,Total Revenue,Pending Revenue,Runner Payouts,Pending Payouts\n${date},${sanitizeValue(this.paymentsData?.totalCommission)},${sanitizeValue(this.paymentsData?.pendingCommission)},${sanitizeValue(this.paymentsData?.runnerPayouts)},${sanitizeValue(this.paymentsData?.pendingPayouts)}`;
  }

  private loadChartScript() {
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => this.initChart();
      document.head.appendChild(script);
    }
  }

  private initChart() {
    if (!this.revenueChart || typeof Chart === 'undefined') return;

    const ctx = this.revenueChart.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Platform Revenue (15%)', 'Runner Payouts (85%)'],
        datasets: [{
          data: [
            this.paymentsData?.totalCommission || 0,
            this.paymentsData?.runnerPayouts || 0
          ],
          backgroundColor: ['#28a745', '#17a2b8'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  private updateChart() {
    if (this.chart && this.paymentsData) {
      this.chart.data.datasets[0].data = [
        this.paymentsData.totalCommission,
        this.paymentsData.runnerPayouts
      ];
      this.chart.update();
    }
  }
}