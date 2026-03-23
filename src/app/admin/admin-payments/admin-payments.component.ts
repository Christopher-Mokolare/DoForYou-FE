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
          <span class="stat-badge" style="background: #FFAB40; color: white;">Revenue: R{{paymentsData?.totalRevenue | number:'1.2-2'}}</span>
          <span class="stat-badge" style="background: #FFD180; color: white;">Pending: R{{paymentsData?.pendingRevenue | number:'1.2-2'}}</span>
        </div>
      </div>

      <!-- Financial Stats -->
      <div class="row mb-4" *ngIf="paymentsData">
        <div class="col-xl-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted text-uppercase small mb-1">Platform Revenue</div>
                <div class="h4 mb-0" style="color: #FFAB40;">R{{paymentsData.totalRevenue | number:'1.2-2'}}</div>
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
                <div class="h4 mb-0" style="color: #FFD180;">R{{paymentsData.pendingRevenue | number:'1.2-2'}}</div>
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
                <div class="h4 mb-0" style="color: #FF9E40;">R{{(paymentsData.totalRevenue * 0.85) | number:'1.2-2'}}</div>
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
                <div class="h4 mb-0" style="color: #FF8A00;">R{{(paymentsData.pendingRevenue * 0.85) | number:'1.2-2'}}</div>
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
            <a class="btn w-100" style="background: #FFE57F; color: #333;" routerLink="/admin/tasks" [queryParams]="{paymentStatus: 'pending'}">
              <i class="fas fa-check-circle me-2"></i>
              <span class="d-none d-lg-inline">Verify Payments</span>
              <span class="d-lg-none">Verify</span>
            </a>
          </div>
          <div class="col-md-3 mb-3">
            <a class="btn w-100" style="background: #FFAB40; color: white;" routerLink="/admin/tasks" [queryParams]="{taskStatus: 'completed'}">
              <i class="fas fa-money-bill-wave me-2"></i>
              <span class="d-none d-lg-inline">Process Payouts</span>
              <span class="d-lg-none">Payouts</span>
            </a>
          </div>
          <div class="col-md-3 mb-3">
            <button class="btn w-100" style="background: #FFD180; color: white;" (click)="exportPaymentReport()">
              <i class="fas fa-download me-2"></i>
              <span class="d-none d-lg-inline">Export Report</span>
              <span class="d-lg-none">Export</span>
            </button>
          </div>
          <div class="col-md-3 mb-3">
            <button class="btn w-100" style="background: #FF9E40; color: white;" (click)="refreshData()">
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
          <div class="col-lg mb-4">
            <div class="text-center p-3 border rounded h-100">
              <div class="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; background: #FFAB40;">
                <span class="fw-bold fs-4">1</span>
              </div>
              <h6 class="fw-bold">User Payment</h6>
              <p class="small text-muted mb-2">Customer pays task amount upfront via PayFast</p>
              <div class="badge" style="background: #FFAB40;">Status: PendingPayment</div>
            </div>
          </div>
          <div class="col-auto d-none d-lg-flex align-items-center justify-content-center px-0">
            <i class="fas fa-arrow-right fa-2x" style="color: #FFAB40;"></i>
          </div>
          <div class="col-lg mb-4">
            <div class="text-center p-3 border rounded h-100">
              <div class="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; background: #FFD180;">
                <span class="fw-bold fs-4">2</span>
              </div>
              <h6 class="fw-bold">Auto Verification</h6>
              <p class="small text-muted mb-2">PayFast ITN webhook confirms payment received</p>
              <div class="badge" style="background: #FFD180;">Status: Posted</div>
            </div>
          </div>
          <div class="col-auto d-none d-lg-flex align-items-center justify-content-center px-0">
            <i class="fas fa-arrow-right fa-2x" style="color: #FFD180;"></i>
          </div>
          <div class="col-lg mb-4">
            <div class="text-center p-3 border rounded h-100">
              <div class="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; background: #FFE57F;">
                <span class="fw-bold fs-4">3</span>
              </div>
              <h6 class="fw-bold">Task Completion</h6>
              <p class="small text-muted mb-2">Helper marks task as complete, funds held in escrow</p>
              <div class="badge" style="background: #FFE57F; color: #333;">Status: Completed</div>
            </div>
          </div>
          <div class="col-auto d-none d-lg-flex align-items-center justify-content-center px-0">
            <i class="fas fa-arrow-right fa-2x" style="color: #FFE57F;"></i>
          </div>
          <div class="col-lg mb-4">
            <div class="text-center p-3 border rounded h-100">
              <div class="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; background: #FF9E40;">
                <span class="fw-bold fs-4">4</span>
              </div>
              <h6 class="fw-bold">48hr Escrow Hold</h6>
              <p class="small text-muted mb-2">Creator confirms OR auto-release after 48 hours</p>
              <div class="badge" style="background: #FF9E40;">EscrowReleaseService</div>
            </div>
          </div>
          <div class="col-auto d-none d-lg-flex align-items-center justify-content-center px-0">
            <i class="fas fa-arrow-right fa-2x" style="color: #FF9E40;"></i>
          </div>
          <div class="col-lg mb-4">
            <div class="text-center p-3 border rounded h-100">
              <div class="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px; background: #FF8A00;">
                <span class="fw-bold fs-4">5</span>
              </div>
              <h6 class="fw-bold">Wallet Credit</h6>
              <p class="small text-muted mb-2">85% credited to helper, 15% platform commission</p>
              <div class="badge" style="background: #FF8A00;">Status: RunnerPaid</div>
            </div>
          </div>
        </div>
        <div class="alert alert-info mt-4 mb-0">
          <i class="fas fa-info-circle me-2"></i>
          <strong>Protection:</strong> Helpers are guaranteed payment after 48 hours even if creator doesn't respond. Funds remain in helper's wallet until they initiate withdrawal to their bank account.
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
    
    return `Date,Total Revenue,Pending Revenue,Runner Payouts,Pending Payouts\n${date},${sanitizeValue(this.paymentsData?.totalRevenue)},${sanitizeValue(this.paymentsData?.pendingRevenue)},${sanitizeValue(this.paymentsData?.totalRevenue * 0.85)},${sanitizeValue(this.paymentsData?.pendingRevenue * 0.85)}`;
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
            (this.paymentsData?.totalRevenue || 0) * 0.15,
            (this.paymentsData?.totalRevenue || 0) * 0.85
          ],
          backgroundColor: ['#FFAB40', '#FFD180'],
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
        this.paymentsData.totalRevenue * 0.15,
        this.paymentsData.totalRevenue * 0.85
      ];
      this.chart.update();
    }
  }
}