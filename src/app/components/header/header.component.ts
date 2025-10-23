import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit, OnInit {
  isMenuCollapsed = false;
  isLoggedIn = false;
  isAdmin = false;
  currentUser: User | null = null;
  private hamburgerAnimation!: GSAPTimeline;
  private hamburgerInitialized = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      // Updated: Use proper role checking
      this.isAdmin = this.checkIfAdmin(user);
      console.log('Header - Auth status:', this.isLoggedIn, 'User:', user, 'Is Admin:', this.isAdmin);
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
    console.log('Post errand clicked - Auth status:', this.isLoggedIn);
    if (this.isLoggedIn) {
      this.router.navigate(['/post-errand']);
    } else {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/post-errand' } 
      });
    }
    this.scrollToTop();
  }

  // UPDATED: Proper admin check using roles from backend
  private checkIfAdmin(user: User | null): boolean {
    if (!user) return false;
    
    // Check if user has Admin role
    if (user.roles && user.roles.includes('Admin')) {
      return true;
    }
    
    // Check computed isAdmin property
    if (user.isAdmin) {
      return true;
    }
    
    // Fallback: Check by name (from your backend seed)
    if (user.name === 'System Administrator') {
      return true;
    }
    
    // Fallback: Check by email
    if (user.email === 'admin@doforyou.co.za') {
      return true;
    }
    
    return false;
  }

  logout() {
    console.log('Logging out user');
    this.authService.logout();
    this.router.navigate(['/']);
    this.scrollToTop();
  }
}