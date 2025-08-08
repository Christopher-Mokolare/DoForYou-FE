import { Injectable } from '@angular/core';
import { Testimonial } from '../models/testimonial.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private testimonials: Testimonial[] = [
    {
      quote: "Smooth process, clean finish, and just enough effort to keep me satisfied. Must say that the platform has stellar runners. Keep the standard.",
      name: "Hopolang",
      role: "DoForYou Task Poster"
    },
    {
      quote: "Danko for the opportunity, would 100% do it again.",
      name: "Qenehelo",
      role: "DoForYou Runner"
    },
    {
      quote: "It was amazing. Enjoyed having assistance at the tip of my fingers. Thank you for helping.",
      name: "Keke",
      role: "DoForYou Poster"
    },
    {
      quote: "Thank you very much, you help me a lot.",
      name: "Lucky",
      role: "DoForYou Runner"
    }
  ];

  getTestimonials(): Testimonial[] {
    return this.testimonials;
  }
}