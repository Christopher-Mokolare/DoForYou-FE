import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { FooterComponent } from "./layout/footer/footer.component";
import { HeaderComponent } from "./layout/header/header.component";
import { ModalComponent } from "./shared/components/modal/modal.component";
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { RealtimeService } from './services/realtime.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FooterComponent, HeaderComponent, ModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'doforyou';
  showFooter = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private realtimeService: RealtimeService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showFooter = !event.url.startsWith('/admin');
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const token = this.authService.getToken();
      if (token) {
        this.realtimeService.connect(token).catch(err => {
          console.error('Failed to connect to realtime service:', err);
        });
      }
    }
  }
}