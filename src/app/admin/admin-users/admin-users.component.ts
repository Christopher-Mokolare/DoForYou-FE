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
    totalPages: 0,
    verifiedCount: 0,
    unverifiedCount: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  get verifiedCount(): number {
    return this.pagination.verifiedCount;
  }

  get unverifiedCount(): number {
    return this.pagination.unverifiedCount;
  }

  loadUsers() {
    this.loading = true;
    const query: any = {
      role: this.filters.role || undefined,
      search: this.filters.search || undefined,
      page: this.pagination.page,
      pageSize: this.pagination.pageSize
    };

    // Only add isVerified if it has a valid value
    if (this.filters.isVerified !== '') {
      query.isVerified = this.filters.isVerified === 'true';
    }

    // Remove undefined values
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') {
        delete query[key];
      }
    });

    this.adminService.getUsers(query).subscribe({
      next: (response) => {
        // Handle nested data structure
        const data = response.data || response;
        this.users = data.users || [];
        this.pagination = {
          page: data.page || 1,
          pageSize: data.pageSize || 20,
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 0,
          verifiedCount: data.verifiedCount || 0,
          unverifiedCount: data.unverifiedCount || 0
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
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
        console.error('Failed to update user status');
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
        console.error('Failed to update user role');
        this.updating = this.updating.filter(id => id !== user.id);
      }
    });
  }

  viewUserDetails(user: AdminUser) {
    console.log('Viewing user details');
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