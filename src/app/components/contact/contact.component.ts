// contact.component.ts
import { Component, OnInit } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactCards = [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Our Location',
      content: '69 General Hertzog Rd<br>Three Rivers, Vereeniging 1934'
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'Call Us',
      content: '<a href="tel:+27614317474" class="text-decoration-none hover-orange">+2761 431 7474</a>'
    },
    {
      icon: 'fas fa-envelope',
      title: 'Email Us',
      content: '<a href="mailto:info@doforyou.co.za" class="text-decoration-none hover-orange">info@doforyou.co.za</a>'
    }
  ];

  socialLinks = [
    { icon: 'fab fa-facebook-f', link: '#', color: '#3b5998' },
    { icon: 'fab fa-twitter', link: '#', color: '#1da1f2' },
    { icon: 'fab fa-instagram', link: '#', color: '#e1306c' },
    { icon: 'fab fa-linkedin-in', link: '#', color: '#0077b5' },
    { icon: 'fab fa-whatsapp', link: '#', color: '#25d366' }
  ];

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.initAnimations();
  }

  initAnimations(): void {
    // Hero animation
    gsap.from('.contact-hero .animate-section', {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: 'power3.out'
    });

    // Staggered card animations
    gsap.utils.toArray('.animate-section').forEach((section: any) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "back.out"
      });
    });

    // Special card delays
    gsap.from('.delay-1', { delay: 0.2 });
    gsap.from('.delay-2', { delay: 0.4 });
  }
}