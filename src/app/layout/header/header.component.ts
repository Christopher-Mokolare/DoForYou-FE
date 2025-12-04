import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.models';
import { ProfileCompletionModalComponent } from '../../shared/components/profile-completion-modal/profile-completion-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ProfileCompletionModalComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit, OnInit {
  isMenuCollapsed = false;
  isLoggedIn = false;
  isAdmin = false;
  currentUser: User | null = null;
  showProfileModal = false;
  private hamburgerAnimation!: GSAPTimeline;
  private hamburgerInitialized = false;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      // Updated: Use proper role checking
      this.isAdmin = this.checkIfAdmin(user);
      console.log('Header - Auth status:', this.isLoggedIn, 'User:', user, 'Is Admin:', this.isAdmin, 'UserType:', (user as any)?.userType);
    });
  }

  ngAfterViewInit() {
    this.initializeHamburger();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    if (!this.authService.canCreateTasks()) {
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
    const user = this.authService.getCurrentUser();
    const userType = (user as any)?.userType;
    return userType === 'creator' || userType === 'both';
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
}