import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container text-center py-5">
      <h1 class="display-1">404</h1>
      <p class="lead">Page not found.</p>
      <a routerLink="/" class="btn btn-primary">Go Home</a>
    </div>
  `
})
export class NotFoundComponent {}
