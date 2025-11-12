import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink,Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  isMenuCollapsed = true;
  currentYear = new Date().getFullYear();
  constructor(private router: Router, public authService: AuthService) {}
  
 scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateTo(route: string) {
    this.router.navigate([route]).then(() => {
      this.scrollToTop();
    });
  }
    postErrand() {
    if (!this.authService.canPostErrands()) {
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/post-errand' } });
      }
      return;
    }
    this.router.navigate(['/post-errand']);
    this.isMenuCollapsed = true;
  }
}