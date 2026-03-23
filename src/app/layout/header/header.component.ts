import { Component, AfterViewInit, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { GlobalStateService } from '../../services/global-state.service';
import { User } from '../../models/auth.models';
import { ProfileCompletionModalComponent } from '../../shared/components/profile-completion-modal/profile-completion-modal.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ProfileCompletionModalComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit, OnInit {
  isMenuCollapsed = true;
  isLoggedIn = false;
  isAdmin = false;
  currentUser: User | null = null;
  showProfileModal = false;
  canShowPostErrandButton = false;
  canShowMyPostedTasks = false;
  canShowMyActiveTasks = false;
  unreadCount = 0;
  private hamburgerAnimation!: GSAPTimeline;
  private hamburgerInitialized = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private globalState: GlobalStateService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
      
      // Update menu visibility when admin status changes
      this.updateMenuVisibility();
      
      // Load unread count if logged in
      if (user) {
        this.loadUnreadCount();
      }
    });
    
    // Subscribe to global state for menu visibility
    this.globalState.canCreateTasks$.subscribe(canCreate => {
      this.updateMenuVisibility();
    });
    
    this.globalState.canAcceptTasks$.subscribe(canAccept => {
      this.updateMenuVisibility();
    });
  }
  
  private updateMenuVisibility(): void {
    const canCreate = this.globalState.canCreateTasks();
    const canAccept = this.globalState.canAcceptTasks();
    
    this.canShowPostErrandButton = canCreate && !this.isAdmin;
    this.canShowMyPostedTasks = canCreate && !this.isAdmin;
    this.canShowMyActiveTasks = canAccept && !this.isAdmin;
  }
  
  private loadUnreadCount(): void {
    this.http.get<any>(`${environment.apiUrl}/notifications/unread-count`).subscribe({
      next: (response) => {
        this.unreadCount = response.data || 0;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  ngAfterViewInit() {
    this.initializeHamburger();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  collapseMenu() {
    if (!this.isMenuCollapsed) {
      this.isMenuCollapsed = true;
      this.animateHamburger();
    }
  }

  initializeHamburger() {
    this.hamburgerAnimation = gsap.timeline({ paused: true });
    
    this.hamburgerAnimation.to(".hamburger-inner", {
      duration: 0.3,
      rotate: 45,
      y: 6,
      ease: "power2.inOut"
    }, 0);
    
    this.hamburgerAnimation.to(".hamburger-inner:before", {
      duration: 0.3,
      opacity: 0,
      ease: "power2.inOut"
    }, 0);
    
    this.hamburgerAnimation.to(".hamburger-inner:after", {
      duration: 0.3,
      rotate: -45,
      y: -6,
      ease: "power2.inOut"
    }, 0);
    
    this.hamburgerInitialized = true;
  }

  animateHamburger() {
    if (!this.hamburgerInitialized) return;
    
    if (this.isMenuCollapsed) {
      this.hamburgerAnimation.reverse();
    } else {
      this.hamburgerAnimation.play();
    }
  }

  postErrand() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/post-errand' } 
      });
      return;
    }
    
    if (!this.globalState.canCreateTasks()) {
      this.router.navigate(['/profile'], {
        queryParams: { message: 'Enable task creation in your profile to post errands' }
      });
      return;
    }
    
    if (this.authService.isProfileIncomplete()) {
      this.showProfileModal = true;
      return;
    }
    
    this.router.navigate(['/post-errand']);
    this.scrollToTop();
  }

  private checkIfAdmin(user: User | null): boolean {
    return this.authService.isAdmin();
  }

  canShowPostErrand(): boolean {
    return this.canShowPostErrandButton;
  }

  onModalClosed() {
    this.showProfileModal = false;
  }

  logout() {
    console.log('Logging out user');
    this.authService.logout();
    this.router.navigate(['/']);
    this.scrollToTop();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar') && !this.isMenuCollapsed) {
      this.isMenuCollapsed = true;
      this.animateHamburger();
    }
    
    const isDropdownItem = target.closest('.dropdown-item');
    const isNavLink = target.closest('.nav-link') && !target.closest('.dropdown-toggle');
    
    if ((isNavLink || isDropdownItem) && !this.isMenuCollapsed) {
      this.collapseMenu();
    }
  }
}