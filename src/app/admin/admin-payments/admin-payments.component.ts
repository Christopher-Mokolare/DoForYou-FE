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
    <div class="admin-payments">
      <div class="page-header">
        <h1>Payment Overview</h1>
        <p class="text-muted">Monitor platform revenue and payouts</p>
      </div>

      <!-- Financial Stats -->
      <div class="stats-grid" *ngIf="paymentsData">
        <div class="stat-card revenue">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>R{{paymentsData.totalCommission | number:'1.2-2'}}</h3>
            <p>Total Revenue (15%)</p>
            <small class="text-success">Platform commission earned</small>
          </div>
        </div>

        <div class="stat-card pending">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>R{{paymentsData.pendingCommission | number:'1.2-2'}}</h3>
            <p>Pending Revenue</p>
            <small class="text-warning">Awaiting payment verification</small>
          </div>
        </div>

        <div class="stat-card payouts">
          <div class="stat-icon">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <div class="stat-content">
            <h3>R{{paymentsData.runnerPayouts | number:'1.2-2'}}</h3>
            <p>Runner Payouts (85%)</p>
            <small class="text-info">Total paid to helpers</small>
          </div>
        </div>

        <div class="stat-card pending-payouts">
          <div class="stat-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h3>{{paymentsData.pendingPayouts}}</h3>
            <p>Pending Payouts</p>
            <small class="text-danger">Tasks awaiting runner payment</small>
          </div>
        </div>
      </div>

      <!-- Payment Breakdown -->
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5>Revenue Breakdown</h5>
            </div>
            <div class="card-body">
              <div class="revenue-chart">
                <canvas #revenueChart width="400" height="200"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="quick-actions">
                <a class="btn btn-primary btn-sm w-100 mb-2" 
                   routerLink="/admin/tasks" [queryParams]="{paymentStatus: 'pending'}">
                  <i class="fas fa-check-circle"></i>
                  Verify Pending Payments
                </a>
                <a class="btn btn-success btn-sm w-100 mb-2"
                   routerLink="/admin/tasks" [queryParams]="{taskStatus: 'completed'}">
                  <i class="fas fa-money-bill-wave"></i>
                  Process Runner Payouts
                </a>
                <button class="btn btn-info btn-sm w-100 mb-2" (click)="exportPaymentReport()">
                  <i class="fas fa-download"></i>
                  Export Payment Report
                </button>
                <button class="btn btn-warning btn-sm w-100" (click)="refreshData()">
                  <i class="fas fa-sync-alt"></i>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          <!-- Payment Status Legend -->
          <div class="card mt-3">
            <div class="card-header">
              <h6>Payment Flow</h6>
            </div>
            <div class="card-body">
              <div class="payment-flow">
                <div class="flow-step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <strong>User Payment</strong>
                    <small>Customer pays upfront</small>
                  </div>
                </div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <strong>Auto Verification</strong>
                    <small>PayFast ITN confirms payment</small>
                  </div>
                </div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <strong>Task Completion</strong>
                    <small>Helper completes task</small>
                  </div>
                </div>
                <div class="flow-arrow">↓</div>
                <div class="flow-step">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <strong>Auto Payout</strong>
                    <small>85% to helper, 15% commission (1hr delay)</small>
                  </div>
                </div>
              </div>
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