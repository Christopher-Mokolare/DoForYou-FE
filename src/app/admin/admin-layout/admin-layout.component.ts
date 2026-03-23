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
      <!-- Backdrop -->
      <div class="backdrop d-lg-none" [class.show]="sidebarOpen" (click)="toggleSidebar()"></div>
      
      <!-- Sidebar -->
      <nav class="admin-sidebar" [class.show]="sidebarOpen">
        <div class="sidebar-header">
          <h4>DoForYou Admin</h4>
        </div>
        
        <ul class="nav flex-column">
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/tasks" routerLinkActive="active" (click)="closeSidebarOnMobile()">
              <i class="fas fa-tasks"></i>
              Tasks
              <span class="badge bg-warning ms-auto" *ngIf="pendingCount > 0">{{pendingCount}}</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/users" routerLinkActive="active" (click)="closeSidebarOnMobile()">
              <i class="fas fa-users"></i>
              Users
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/admin/payments" routerLinkActive="active" (click)="closeSidebarOnMobile()">
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
        <!-- Page Content -->
        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Sidebar Toggle Button -->
      <button class="btn btn-link sidebar-toggle-open d-lg-none" (click)="toggleSidebar()" [class.inside]="sidebarOpen">
        <i [class]="sidebarOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
      </button>
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
      overflow-y: hidden;
      z-index: 102;
      left: 0;
      top: 80px;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-header h4 {
      margin: 0;
      font-weight: 700;
      color: white;
    }

    .nav {
      flex: 1;
      padding: 0.5rem 0;
      overflow-y: auto;
      min-height: 0;
    }

    .nav-link {
      color: rgba(255, 255, 255, 0.8);
      padding: 0.6rem 1.5rem;
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
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .user-avatar {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .user-name {
      font-weight: 600;
      color: white;
      font-size: 0.9rem;
    }

    .user-details small {
      font-size: 0.75rem;
    }

    .admin-main {
      flex: 1;
      margin-left: 280px;
    }



    .admin-content {
      background: #f8f9fa;
      min-height: 100vh;
    }



    .sidebar-toggle-open {
      color: white;
      background: linear-gradient(135deg, #FF6B35, #F7931E);
      font-size: 1.2rem;
      position: fixed;
      top: 5.5rem;
      z-index: 103;
      transition: all 0.3s ease;
      border-radius: 0 0.25rem 0.25rem 0;
      padding: .4rem 0.1rem;
      left: 0;
    }

    .sidebar-toggle-open.inside {
      left: -1.7rem;
      border-radius: 0.25rem;
      transform: translateX(0);
    }

    .backdrop {
      position: fixed;
      top: 80px;
      left: 0;
      width: 100%;
      height: calc(100vh - 80px);
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      z-index: 99;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .backdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .collapse.navbar-collapse {
      display: none !important;
    }

    .collapse.navbar-collapse.show {
      display: block !important;
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

      .sidebar-toggle-open.inside {
        transform: translateX(280px);
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

      .collapse.navbar-collapse {
        display: none !important;
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
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 992) {
      this.sidebarOpen = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
