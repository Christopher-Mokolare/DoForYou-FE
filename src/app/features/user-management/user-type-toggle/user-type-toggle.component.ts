import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-type-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-type-toggle.component.html',
  styleUrls: ['./user-type-toggle.component.scss']
})
export class UserTypeToggleComponent {
  @Input() userType: 'creator' | 'runner' = 'creator';
  @Output() userTypeChange = new EventEmitter<'creator' | 'runner'>();

  selectType(type: 'creator' | 'runner') {
    this.userType = type;
    this.userTypeChange.emit(type);
  }
}