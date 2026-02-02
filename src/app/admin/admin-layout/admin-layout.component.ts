import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <nav class="admin-sidebar">
        <div class="sidebar-header">
          <h4>DoForYou Admin</h4>
        </div>
        
        <ul class="nav flex-column">
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/dashboard" routerLinkActive="active">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/tasks" routerLinkActive="active">
              <i class="fas fa-tasks"></i>
              Tasks
              <span class="badge bg-warning ms-auto" *ngIf="pendingCount > 0">{{pendingCount}}</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/users" routerLinkActive="active">
              <i class="fas fa-users"></i>
              Users
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/payments" routerLinkActive="active">
              <i class="fas fa-credit-card"></i>
              Payments
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              <i class="fas fa-user-shield"></i>
            </div>
            <div class="user-details">
              <div class="user-name">{{currentUser?.name}}</div>
              <small class="text-muted">Administrator</small>
            </div>
          </div>
          <button class="btn btn-outline-light btn-sm w-100 mt-2" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="admin-main">
        <!-- Top Bar -->
        <header class="admin-header">
          <button class="btn btn-link sidebar-toggle d-lg-none" (click)="toggleSidebar()">
            <i class="fas fa-bars"></i>
          </button>
        </header>

        <!-- Page Content -->
        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }

    .admin-sidebar {
      width: 280px;
      background: linear-gradient(135deg, #FF6B35, #F7931E);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: calc(100vh - 80px);
      overflow-y: auto;
      z-index: 999;
      left: 0;
      top: 80px;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-header h4 {
      margin: 0;
      font-weight: 700;
      color: white;
    }

    .nav {
      flex: 1;
      padding: 1rem 0;
    }

    .nav-link {
      color: rgba(255, 255, 255, 0.8);
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
      border: none;
      text-decoration: none;
    }

    .nav-link:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-link.active {
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border-right: 3px solid white;
    }

    .nav-link i {
      width: 20px;
      text-align: center;
    }

    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-weight: 600;
      color: white;
    }

    .admin-main {
      flex: 1;
      margin-left: 280px;
      display: flex;
      flex-direction: column;
    }

    .admin-header {
      background: white;
      border-bottom: 1px solid #eee;
      padding: .5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .admin-content {
      flex: 1;
      background: #f8f9fa;
      min-height: calc(100vh - 80px);
    }

    .sidebar-toggle {
      color: #FF6B35;
      font-size: 1.2rem;
    }

    @media (min-width: 992px) {
      .admin-sidebar {
        transform: translateX(0) !important;
        position: fixed;
        left: 0;
        top: 80px;
        height: calc(100vh - 80px);
      }
    }

    @media (max-width: 991.98px) {
      .admin-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .admin-sidebar.show {
        transform: translateX(0);
      }

      .admin-main {
        margin-left: 0;
      }

      .admin-header {
        padding: 1rem;
      }

      .admin-content {
        padding: 1rem;
      }
    }

    @media (max-width: 575.98px) {
      .sidebar-header h4 {
        font-size: 1.1rem;
      }

      .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .user-info {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }

      .sidebar-footer {
        padding: 1rem;
      }
    }
  `]
})
export class AdminLayoutComponent {
  currentUser: any = null;
  pendingCount = 0;
  sidebarOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('show', this.sidebarOpen);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}