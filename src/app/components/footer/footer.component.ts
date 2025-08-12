import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink,Router } from '@angular/router';

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
  constructor(private router: Router) {}
  
 scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateTo(route: string) {
    this.router.navigate([route]).then(() => {
      this.scrollToTop();
    });
  }
    postErrand() {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSd_uoW_FP3Q3qTSZmDpsR1aqqXK35Os2EWCKJrKnQKoPUeTrg/viewform',
      '_blank',
      'noopener,noreferrer'
    );
    this.isMenuCollapsed = true;
  }
}