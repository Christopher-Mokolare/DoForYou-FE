import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  ngAfterViewInit() {
    this.initializeHamburger();
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
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSd_uoW_FP3Q3qTSZmDpsR1aqqXK35Os2EWCKJrKnQKoPUeTrg/viewform', '_blank', 'noopener,noreferrer');
    this.isMenuCollapsed = true;
    if (this.hamburgerInitialized && !this.isMenuCollapsed) {
      this.hamburgerAnimation.reverse();
    }
  }
}