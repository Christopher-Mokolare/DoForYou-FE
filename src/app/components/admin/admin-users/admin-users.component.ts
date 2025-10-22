import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h1>Admin Users Management</h1>
          <p>User management interface coming soon...</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminUsersComponent {}