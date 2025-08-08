import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { TestimonialsComponent } from "../testimonials/testimonials.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TestimonialsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    isMenuCollapsed = true;

  features = [
    {
      title: 'Post an errand',
      description: 'Need it done? We have people lined to do your errand at a price set by YOU! Post your errand today and have it done by a verified DFY Runner!',
      image: 'assets/images/feature1.jpg'
    },
    {
      title: 'Run an errand',
      description: 'Browse errands and if you are happy with the job, price and location, simply select the errand, run the errand and get paid for your efforts.',
      image: 'assets/images/feature2.jpg'
    },
    {
      title: 'It goes both ways',
      description: 'You can both run and post errands, as many times as you want! You set the fees and you get paid. You\'re your own boss!',
      image: 'assets/images/feature3.jpg'
    }
  ];

  constructor(private dataService: DataService) {}

    postErrand() {
    // Open in new tab with security best practices
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSd_uoW_FP3Q3qTSZmDpsR1aqqXK35Os2EWCKJrKnQKoPUeTrg/viewform', '_blank', 'noopener,noreferrer');
    
    // Optional: Close mobile menu if open
    this.isMenuCollapsed = true;
  }
}