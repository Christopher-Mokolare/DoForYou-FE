import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
    isMenuCollapsed = true;
    
    constructor(private router: Router, public authService: AuthService) {}

  teamMembers = [
    {
      name: 'Ashwin Mokoena',
      position: 'Founder and CEO',
      image: 'assets/images/admin.jpg',
      bio: 'Visionary entrepreneur with a passion for empowering South Africans through technology and opportunity.'
    }
  ];


  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.initAnimations();
  }

  initAnimations(): void {
    // Hero animation
    gsap.from('.hero-content h1', {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: 'power3.out'
    });

    gsap.from('.hero-content p', {
      duration: 1,
      y: 50,
      opacity: 0,
      delay: 0.3,
      ease: 'power3.out'
    });

    // Section animations
    gsap.utils.toArray('.animate-section').forEach((section: any) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
    });

    // Team member animations
    gsap.utils.toArray('.team-card').forEach((card: any, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: "back.out"
      });
    });

    // Milestone animations
    gsap.utils.toArray('.milestone-item').forEach((item: any, i) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        x: i % 2 === 0 ? -50 : 50,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: "power2.out"
      });
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