import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  teamMembers = [
    {
      name: 'Ashwin Mokoena',
      position: 'Founder and CEO',
      image: 'assets/images/ashwin.PNG'
    },
    // {
    //   name: 'Whoopi Dinko',
    //   position: 'Customer Relations and Success',
    //   image: 'assets/images/dinko.PNG'
    // },
  ];
}