import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements AfterViewInit {
  currentYear = new Date().getFullYear();

  ngAfterViewInit() {
    // Only initialize GSAP animations if we're in the browser
    if (typeof window !== 'undefined') {
      this.initAnimations();
    }
  }

  private initAnimations() {
    try {
      gsap.registerPlugin(ScrollTrigger);
      
      // Animate footer elements on scroll into view
      gsap.from('.footer-brand, .links-column', {
        scrollTrigger: {
          trigger: '.site-footer',
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
      });
      
      // Animate social icons with a slight delay
      gsap.from('.social-icon', {
        scrollTrigger: {
          trigger: '.site-footer',
          start: 'top 70%',
          toggleActions: 'play none none none'
        },
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.3,
        ease: 'back.out'
      });
      
      // Floating animation for decorative shapes
      gsap.to('.footer-shape-1', {
        y: 20,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      
      gsap.to('.footer-shape-2', {
        y: -20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5
      });
    } catch (e) {
      console.error('GSAP animation error:', e);
    }
  }
}