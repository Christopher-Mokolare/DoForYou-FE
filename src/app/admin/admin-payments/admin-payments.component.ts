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
          <span class="stat-badge" style="background: #FFAB40; color: white;">Revenue: R{{(paymentsData?.platformEarnings ?? paymentsData?.totalRevenue ?? 0) | number:'1.2-2'}}</span>
          <span class="stat-badge" style="background: #FFD180; color: white;">Pending: R{{(paymentsData?.pendingCommission ?? paymentsData?.pendingRevenue ?? 0) | number:'1.2-2'}}</span>
        </div>
      </div>

      <!-- Financial Stats -->
      <div class="row mb-4" *ngIf="paymentsData">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex align-items-center gap-3">
              <i class="fas fa-dollar-sign fa-2x text-muted opacity-50"></i>
              <div>
                <div class="text-muted text-uppercase small mb-1">Platform Revenue</div>
                <div class="h5 mb-0" style="color: #FFAB40;">R{{(paymentsData.platformEarnings ?? paymentsData.totalRevenue ?? 0) | number:'1.2-2'}}</div>
                <small class="text-muted">15% Commission</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex align-items-center gap-3">
              <i class="fas fa-clock fa-2x text-muted opacity-50"></i>
              <div>
                <div class="text-muted text-uppercase small mb-1">Pending Revenue</div>
                <div class="h5 mb-0" style="color: #FFD180;">R{{(paymentsData.pendingCommission ?? paymentsData.pendingRevenue ?? 0) | number:'1.2-2'}}</div>
                <small class="text-muted">Awaiting verification</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex align-items-center gap-3">
              <i class="fas fa-hand-holding-usd fa-2x text-muted opacity-50"></i>
              <div>
                <div class="text-muted text-uppercase small mb-1">Helper Payouts</div>
                <div class="h5 mb-0" style="color: #FF9E40;">R{{((paymentsData.platformEarnings ?? paymentsData.totalRevenue ?? 0) / 0.15 * 0.85) | number:'1.2-2'}}</div>
                <small class="text-muted">85% to helpers</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="content-card">
            <div class="d-flex align-items-center gap-3">
              <i class="fas fa-exclamation-triangle fa-2x text-muted opacity-50"></i>
              <div>
                <div class="text-muted text-uppercase small mb-1">Pending Payouts</div>
                <div class="h5 mb-0" style="color: #FF8A00;">R{{((paymentsData.pendingCommission ?? paymentsData.pendingRevenue ?? 0) / 0.15 * 0.85) | number:'1.2-2'}}</div>
                <small class="text-muted">Tasks awaiting payment</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="content-card mb-4">
        <h5 class="mb-3">Quick Actions</h5>
        <div class="row g-2">
          <div class="col-md-3 col-6">
            <a class="btn w-100" style="background: #FFE57F; color: #333; font-size: 0.85rem; padding: 0.625rem;" routerLink="/admin/tasks" [queryParams]="{paymentStatus: 'pending'}">
              <i class="fas fa-check-circle me-1"></i>
              <span class="d-none d-lg-inline">Verify</span>
            </a>
          </div>
          <div class="col-md-3 col-6">
            <a class="btn w-100" style="background: #FFAB40; color: white; font-size: 0.85rem; padding: 0.625rem;" routerLink="/admin/tasks" [queryParams]="{taskStatus: 'completed'}">
              <i class="fas fa-money-bill-wave me-1"></i>
              <span class="d-none d-lg-inline">Payouts</span>
            </a>
          </div>
          <div class="col-md-3 col-6">
            <button class="btn w-100" style="background: #FFD180; color: white; font-size: 0.85rem; padding: 0.625rem;" (click)="exportPaymentReport()">
              <i class="fas fa-download me-1"></i>
              <span class="d-none d-lg-inline">Export</span>
            </button>
          </div>
          <div class="col-md-3 col-6">
            <button class="btn w-100" style="background: #FF9E40; color: white; font-size: 0.85rem; padding: 0.625rem;" (click)="refreshData()">
              <i class="fas fa-sync-alt me-1"></i>
              <span class="d-none d-lg-inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Payment Flow -->
      <div class="content-card">
        <h5 class="mb-4">Payment Flow</h5>
        <div class="payment-flow-container">
          <div class="flow-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <strong>User Payment</strong>
              <p class="mb-0">Customer pays task amount upfront via PayFast</p>
              <span class="badge" style="background: #FFAB40;">PendingPayment</span>
            </div>
          </div>

          <div class="flow-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="flow-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Auto Verification</strong>
              <p class="mb-0">PayFast ITN webhook confirms payment received</p>
              <span class="badge" style="background: #FFD180; color: #333;">Posted</span>
            </div>
          </div>

          <div class="flow-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="flow-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Task Completion</strong>
              <p class="mb-0">Helper marks task as complete, funds held in escrow</p>
              <span class="badge" style="background: #FFE57F; color: #333;">Completed</span>
            </div>
          </div>

          <div class="flow-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="flow-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <strong>48hr Escrow Hold</strong>
              <p class="mb-0">Creator confirms OR auto-release after 48 hours</p>
              <span class="badge" style="background: #FF9E40;">EscrowRelease</span>
            </div>
          </div>

          <div class="flow-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="flow-step">
            <div class="step-number">5</div>
            <div class="step-content">
              <strong>Wallet Credit</strong>
              <p class="mb-0">85% credited to helper, 15% platform commission</p>
              <span class="badge" style="background: #FF8A00;">RunnerPaid</span>
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
    .page-container {
      padding: 1rem;
    }

    @media (min-width: 768px) {
      .page-container {
        padding: 1.5rem;
      }
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;

      @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.75rem;
        padding-bottom: 1.25rem;
      }

      .page-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c3e50;
        margin: 0;

        @media (min-width: 768px) {
          font-size: 1.5rem;
        }
      }

      .header-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        @media (min-width: 768px) {
          gap: 0.75rem;
        }

        .stat-badge {
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;

          @media (min-width: 768px) {
            padding: 0.5rem 0.875rem;
            font-size: 0.8rem;
          }
        }
      }
    }

    .content-card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

      @media (min-width: 768px) {
        padding: 1.25rem;
      }

      h5 {
        font-size: 1rem;
        font-weight: 600;
        color: #333;
        margin: 0;

        @media (min-width: 768px) {
          font-size: 1.1rem;
        }
      }
    }

    .d-flex {
      display: flex;

      &.align-items-center {
        align-items: center;
      }

      &.gap-3 {
        gap: 0.75rem;

        @media (min-width: 768px) {
          gap: 1rem;
        }
      }
    }

    .h5 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;

      @media (min-width: 768px) {
        font-size: 1.25rem;
      }
    }

    .text-muted {
      color: #6c757d;
    }

    .text-uppercase {
      text-transform: uppercase;
    }

    .small {
      font-size: 0.8rem;
    }

    .mb-0 {
      margin-bottom: 0;
    }

    .mb-1 {
      margin-bottom: 0.25rem;
    }

    .mb-3 {
      margin-bottom: 0.75rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }

    .mt-4 {
      margin-top: 1rem;
    }

    .opacity-50 {
      opacity: 0.5;
    }

    .row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;

      &.g-2 {
        gap: 0.5rem;
      }

      @media (min-width: 768px) {
        &.g-2 {
          gap: 0.75rem;
        }
      }
    }

    .col-md-3 {
      @media (max-width: 767px) {
        grid-column: span 1;
      }

      @media (min-width: 768px) {
        grid-column: span 3;
      }
    }

    .col-md-6 {
      @media (max-width: 767px) {
        grid-column: span 1;
      }

      @media (min-width: 768px) {
        grid-column: span 6;
      }
    }

    .col-lg-3 {
      @media (max-width: 991px) {
        grid-column: span 6;
      }

      @media (min-width: 992px) {
        grid-column: span 3;
      }
    }

    .btn {
      border: none;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      i {
        margin-right: 0.25rem;
      }
    }

    .payment-flow-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .flow-step {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #FFAB40;

      @media (min-width: 768px) {
        padding: 1.25rem;
        gap: 1.25rem;
      }
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #FFAB40;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;

      @media (min-width: 768px) {
        width: 45px;
        height: 45px;
        font-size: 1.1rem;
      }
    }

    .step-content {
      flex: 1;

      strong {
        display: block;
        font-size: 0.95rem;
        color: #333;
        margin-bottom: 0.25rem;

        @media (min-width: 768px) {
          font-size: 1rem;
        }
      }

      p {
        font-size: 0.85rem;
        color: #666;
        margin: 0.25rem 0;

        @media (min-width: 768px) {
          font-size: 0.9rem;
        }
      }

      .badge {
        display: inline-block;
        font-size: 0.75rem;
        padding: 0.375rem 0.625rem;
        border-radius: 4px;
        font-weight: 500;
        margin-top: 0.25rem;
      }
    }

    .flow-arrow {
      text-align: center;
      color: #FFAB40;
      font-size: 1.2rem;
      margin: 0.25rem 0;
      padding: 0.25rem 0;
    }

    .alert {
      padding: 0.875rem 1rem;
      border-radius: 6px;
      border: 1px solid #d1ecf1;
      background-color: #d1ecf1;
      color: #0c5460;
      font-size: 0.9rem;

      @media (min-width: 768px) {
        padding: 1rem 1.25rem;
        font-size: 0.95rem;
      }

      i {
        margin-right: 0.5rem;
      }

      strong {
        font-weight: 600;
      }
    }

    @media (max-width: 575px) {
      .page-container {
        padding: 0.75rem;
      }

      .page-header {
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
      }

      .content-card {
        padding: 0.875rem;
      }

      .flow-step {
        padding: 0.875rem;
        gap: 0.75rem;
      }

      .step-number {
        width: 36px;
        height: 36px;
        font-size: 0.9rem;
      }

      .step-content {
        strong {
          font-size: 0.9rem;
        }

        p {
          font-size: 0.8rem;
        }
      }
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
    
    const revenue = this.paymentsData?.platformEarnings ?? this.paymentsData?.totalRevenue ?? 0;
    const pending = this.paymentsData?.pendingCommission ?? this.paymentsData?.pendingRevenue ?? 0;
    return `Date,Total Revenue,Pending Revenue,Runner Payouts,Pending Payouts\n${date},${sanitizeValue(revenue)},${sanitizeValue(pending)},${sanitizeValue(revenue / 0.15 * 0.85)},${sanitizeValue(pending / 0.15 * 0.85)}`;
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
        (this.paymentsData.platformEarnings ?? this.paymentsData.totalRevenue ?? 0) * 1,
        (this.paymentsData.platformEarnings ?? this.paymentsData.totalRevenue ?? 0) / 0.15 * 0.85
      ];
      this.chart.update();
    }
  }
}
