import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DataService } from '../../services/data.service';
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TestimonialsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('viewportVideo') videoElement!: ElementRef<HTMLVideoElement>;
  isMenuCollapsed = true;
  @ViewChild('runnerSection') runnerSection!: ElementRef;
  @ViewChild('runnerImage') runnerImage!: ElementRef;
  @ViewChild('runnerContent') runnerContent!: ElementRef;

 scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateTo(route: string) {
    this.router.navigate([route]).then(() => {
      this.scrollToTop();
    });
  }

  features = [
    {
      title: 'Post an errand',
      description:
        'Need it done? We have people lined to do your errand at a price set by YOU! Post your errand today and have it done by a verified DFY Runner!',
      image: 'assets/images/image3.jpeg',
    },
    {
      title: 'Run an errand',
      description:
        'Browse errands and if you are happy with the job, price and location, simply select the errand, run the errand and get paid for your efforts.',
      image: 'assets/images/image2.jpeg',
    },
    {
      title: 'It goes both ways',
      description:
        "You can both run and post errands, as many times as you want! You set the fees and you get paid. You're your own boss!",
      image: 'assets/images/image1.jpeg',
    },
  ];

  constructor(private dataService: DataService, private router: Router, public authService: AuthService) {}

  ngAfterViewInit() {
    this.setupVideoIntersectionObserver();

    gsap.registerPlugin(ScrollTrigger);

    this.initRunnerAnimations();
    this.initFeaturesAnimations();
  }
    setupVideoIntersectionObserver() {
    const video = this.videoElement.nativeElement;

    // Ensure autoplay works by muting
    video.muted = true;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Restart video each time it comes into view
          video.currentTime = 0;
          video.play().catch(error => {
            console.warn('Autoplay prevented:', error);
          });
        } else {
          // Pause when leaving viewport
          video.pause();
        }
      });
    }, {
      threshold: 0.5 // Trigger when 50% visible
    });

    observer.observe(video);
  }

  private initRunnerAnimations(): void {
    // Runner section animation
    gsap.from(this.runnerSection.nativeElement, {
      scrollTrigger: {
        trigger: this.runnerSection.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      duration: 1,
      backgroundColor: 'rgba(0,0,0,0)',
      ease: 'power2.out',
    });

    // Image animation
    gsap.from(this.runnerImage.nativeElement, {
      scrollTrigger: {
        trigger: this.runnerImage.nativeElement,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
      duration: 1,
      x: 50,
      opacity: 0,
      rotationY: -30,
      ease: 'back.out(1.2)',
    });

    // Content animation
    gsap.from(this.runnerContent.nativeElement.querySelectorAll('h2, h4, a'), {
      scrollTrigger: {
        trigger: this.runnerContent.nativeElement,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.2,
      ease: 'power2.out',
    });

    // Continuous subtle floating animation for the image
    gsap.to(this.runnerImage.nativeElement, {
      y: 10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  private initFeaturesAnimations(): void {
    const featuresSection = document.querySelector('.features-section');
    if (!featuresSection) return;

    const featureCards = gsap.utils.toArray('.feature-card') as HTMLElement[];

    // First make cards visible but prepare for animation
    gsap.set(featureCards, {
      opacity: 1,
      y: 0,
    });

    // Then set initial state for animation
    gsap.from(featureCards, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.15,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: featuresSection,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Setup hover animations
    featureCards.forEach((card) => {
      const img = card.querySelector('img');

      // Hover in animation
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.03,
          boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
          duration: 0.3,
        });
        if (img) {
          gsap.to(img, {
            filter: 'saturate(1.1) brightness(1)',
            duration: 0.3,
          });
        }
      });

      // Hover out animation
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          duration: 0.3,
        });
        if (img) {
          gsap.to(img, {
            filter: 'saturate(0.9) brightness(0.95)',
            duration: 0.3,
          });
        }
      });
    });
  }

 postErrand(): void {
    // Always check authentication first
    if (!this.authService.isAuthenticated()) {
      // Redirect to login with return URL
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/post-errand' } });
      return;
    }
    
    // If authenticated, navigate to post errand page
    this.router.navigate(['/post-errand']);
    this.scrollToTop();
  }
}
