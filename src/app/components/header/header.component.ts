import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { gsap } from 'gsap';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit {
  isMenuCollapsed = false;
  private hamburgerAnimation!: GSAPTimeline;
  private hamburgerInitialized = false;
  constructor(
    private router: Router
  ){}
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
  this.router.navigate(['/post-errand']);
    this.scrollToTop();
  }
}