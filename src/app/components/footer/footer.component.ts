import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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

    postErrand() {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSd_uoW_FP3Q3qTSZmDpsR1aqqXK35Os2EWCKJrKnQKoPUeTrg/viewform',
      '_blank',
      'noopener,noreferrer'
    );
    this.isMenuCollapsed = true;
  }
}