import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  updating: number[] = [];
  loading = true;
  
  filters = {
    role: '',
    isVerified: '',
    search: ''
  };

  pagination = {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  get verifiedCount(): number {
    return this.users.filter(u => u.isVerified).length;
  }

  get unverifiedCount(): number {
    return this.users.filter(u => !u.isVerified).length;
  }

  loadUsers() {
    this.loading = true;
    const query = {
      ...this.filters,
      page: this.pagination.page,
      pageSize: this.pagination.pageSize,
      isVerified: this.filters.isVerified === '' ? undefined : this.filters.isVerified === 'true'
    };

    this.adminService.getUsers(query).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data;
          this.pagination = response.pagination;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.pagination.page = 1;
    this.loadUsers();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.page = page;
      this.loadUsers();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.pagination.page - 2);
    const end = Math.min(this.pagination.totalPages, this.pagination.page + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  updateUserStatus(userId: number, isVerified: boolean) {
    this.updating.push(userId);
    
    this.adminService.updateUserStatus(userId, isVerified).subscribe({
      next: (response) => {
        if (response.success) {
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.isVerified = isVerified;
          }
        }
        this.updating = this.updating.filter(id => id !== userId);
      },
      error: () => {
        this.updating = this.updating.filter(id => id !== userId);
      }
    });
  }

  changeUserRole(user: AdminUser, newRole: string) {
    this.updating.push(user.id);
    
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (response) => {
        if (response.success) {
          user.role = newRole;
        }
        this.updating = this.updating.filter(id => id !== user.id);
      },
      error: () => {
        this.updating = this.updating.filter(id => id !== user.id);
      }
    });
  }

  viewUserDetails(user: AdminUser) {
  }

  getRoleClass(role: string): string {
    const classes: { [key: string]: string } = {
      'Admin': 'bg-admin',
      'User': 'bg-user',
      'Helper': 'bg-helper'
    };
    return classes[role] || 'bg-secondary';
  }
}