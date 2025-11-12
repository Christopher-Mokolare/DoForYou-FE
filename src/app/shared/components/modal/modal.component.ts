import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService, ModalConfig } from '../../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  config: ModalConfig | null = null;
  isVisible = false;
  private subscription?: Subscription;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.subscription = this.modalService.modal$.subscribe(config => {
      this.config = config;
      this.isVisible = !!config;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getHeaderClass(): string {
    if (!this.config) return '';
    switch (this.config.type) {
      case 'success': return 'bg-success text-white';
      case 'warning': return 'bg-warning text-dark';
      case 'error': return 'bg-danger text-white';
      case 'confirm': return 'bg-primary text-white';
      default: return 'bg-info text-white';
    }
  }

  getIconClass(): string {
    if (!this.config) return '';
    switch (this.config.type) {
      case 'success': return 'fas fa-check-circle me-2';
      case 'warning': return 'fas fa-exclamation-triangle me-2';
      case 'error': return 'fas fa-times-circle me-2';
      case 'confirm': return 'fas fa-question-circle me-2';
      default: return 'fas fa-info-circle me-2';
    }
  }

  getButtonClass(): string {
    if (!this.config) return 'btn btn-primary';
    switch (this.config.type) {
      case 'success': return 'btn btn-success';
      case 'warning': return 'btn btn-warning';
      case 'error': return 'btn btn-danger';
      case 'confirm': return 'btn btn-primary';
      default: return 'btn btn-info';
    }
  }

  confirm() {
    if (this.config?.onConfirm) {
      this.config.onConfirm();
    }
    this.close();
  }

  cancel() {
    if (this.config?.onCancel) {
      this.config.onCancel();
    }
    this.close();
  }

  close() {
    this.modalService.close();
  }
}