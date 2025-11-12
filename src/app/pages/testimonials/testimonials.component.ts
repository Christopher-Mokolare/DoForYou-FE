import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Testimonial } from '../../models/testimonial.model';
import { DataService } from '../../services/data.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit, AfterViewInit {
  testimonials: Testimonial[] = [];

  constructor(
    private dataService: DataService,
    private el: ElementRef
  ) {
    gsap.registerPlugin(ScrollTrigger);
  }

  ngOnInit() {
    this.testimonials = this.dataService.getTestimonials();
  }

  ngAfterViewInit() {
    this.initAnimations();
  }

  initAnimations() {
    const section = this.el.nativeElement;
    const cards = section.querySelectorAll('.testimonial-card');
    
    // Set initial state (visible but ready to animate)
    gsap.set(cards, {
      opacity: 1,
      y: 0
    });

    // Create timeline for staggered animations
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
        markers: false // Set to true for debugging if needed
      }
    });

    // Staggered animation
    tl.from(cards, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.2)"
    });

    // Hover animations
    cards.forEach((card: HTMLElement) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.03,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }
}