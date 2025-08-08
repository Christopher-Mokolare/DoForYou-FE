import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  contactData = {
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  };

  onSubmit() {
    console.log('Form submitted:', this.contactData);
    // Add your form submission logic here
    // Example: Call a service to send the data
  }
}