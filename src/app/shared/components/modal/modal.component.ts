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
    return '';
  }

  getIconClass(): string {
    if (!this.config) return '';
    switch (this.config.type) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'error': return 'fas fa-times-circle text-danger';
      case 'confirm': return 'fas fa-question-circle text-primary';
      default: return 'fas fa-info-circle text-info';
    }
  }

  getButtonClass(): string {
    if (!this.config) return 'btn-primary';
    switch (this.config.type) {
      case 'success': return 'btn-success';
      case 'warning': return 'btn-warning';
      case 'error': return 'btn-danger';
      case 'confirm': return 'btn-primary';
      default: return 'btn-primary';
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