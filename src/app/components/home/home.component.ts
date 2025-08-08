import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { gsap } from 'gsap';
import { TestimonialsComponent } from "../testimonials/testimonials.component";

interface Ball {
  color: string;
  letterIndex: number;
}

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TestimonialsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('ballsContainer') ballsContainer!: ElementRef;
  balls: Ball[] = this.generateBalls();
  animationPlayed = false;
  isMenuCollapsed = false;

  private generateBalls(): Ball[] {
    const balls: Ball[] = [];
    // Only D, F, Y with matching ball counts
    const letters = [
      { char: 'D', count: 26 },
      { char: 'F', count: 7 },
      { char: 'Y', count: 6 }
    ];

    letters.forEach((letter, index) => {
      for (let i = 0; i < letter.count; i++) {
        balls.push({
          color: 'black',
          letterIndex: index
        });
      }
    });

    return balls;
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animationPlayed) {
          this.animateBalls();
          this.animationPlayed = true;
        }
      });
    }, { threshold: 0.1 });

    if (this.ballsContainer?.nativeElement) {
      observer.observe(this.ballsContainer.nativeElement);
    }
  }

  private animateBalls() {
    const container = this.ballsContainer.nativeElement;
    const balls = container.querySelectorAll('.ball');
    const logoPositions = this.calculateLogoPositions();

    if (balls.length !== logoPositions.length) {
      console.error('Balls and positions count mismatch!');
      return;
    }

    // Initialize balls at random positions above
    balls.forEach((ball: HTMLElement, index: number) => {
      gsap.set(ball, {
        x: Math.random() * 400 - 200,
        y: -50 - Math.random() * 100,
        opacity: 0
      });
    });

    // Drop balls with bounce and fade in
    balls.forEach((ball: HTMLElement, index: number) => {
      gsap.to(ball, {
        opacity: 1,
        duration: 0.3,
        delay: index * 0.05
      });

      gsap.to(ball, {
        y: gsap.utils.random(-10, 10),
        duration: 1,
        delay: index * 0.05,
        ease: "bounce.out"
      });
    });

    // Form the letters after drop
    gsap.delayedCall(this.balls.length * 0.05 + 1, () => {
      balls.forEach((ball: HTMLElement, index: number) => {
        gsap.to(ball, {
          x: logoPositions[index].x,
          y: logoPositions[index].y,
          duration: 1.5,
          ease: "elastic.out(1, 0.3)"
        });
      });
    });
  }

  private calculateLogoPositions(): Position[] {
    const positions: Position[] = [];
    const containerWidth = this.ballsContainer?.nativeElement?.offsetWidth || 500;

    const ballDiameter = 12;
    const minGap = 1;
    const scale = ballDiameter + minGap; // 13px spacing

    const letterD = [
      { x: 0, y: 0 }, { x: 0, y: 8 }, { x: 0, y: 16 }, { x: 0, y: 24 }, { x: 0, y: 32 },
      { x: 8, y: 0 }, { x: 8, y: 32 },
      { x: 16, y: 0 }, { x: 16, y: 8 }, { x: 16, y: 16 }, { x: 16, y: 24 }, { x: 16, y: 32 }
    ];

    const letterF = [
      { x: 50, y: 0 }, { x: 50, y: 8 }, { x: 50, y: 16 }, { x: 50, y: 24 }, { x: 50, y: 32 },
      { x: 58, y: 0 }, { x: 66, y: 0 }
    ];

    const letterY = [
      { x: 110, y: 0 }, { x: 118, y: 8 }, { x: 126, y: 0 },
      { x: 118, y: 16 }, { x: 118, y: 24 }, { x: 118, y: 32 }
    ];

    const allCoords = [
      ...letterD,
      ...letterF,
      ...letterY
    ];

    const maxX = Math.max(...allCoords.map(p => p.x));
    const totalWidth = maxX * scale;
    const centerX = (containerWidth - totalWidth) / 2;

    allCoords.forEach(pos => {
      positions.push({
        x: centerX + pos.x * scale,
        y: pos.y * scale
      });
    });

    return positions;
  }

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
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSd_uoW_FP3Q3qTSZmDpsR1aqqXK35Os2EWCKJrKnQKoPUeTrg/viewform', '_blank', 'noopener,noreferrer');
    this.isMenuCollapsed = true;
  }
}
