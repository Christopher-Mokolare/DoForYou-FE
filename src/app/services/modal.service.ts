import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalConfig {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalConfig | null>(null);
  public modal$ = this.modalSubject.asObservable();

  showAlert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    this.modalSubject.next({
      id: 'alert-modal',
      title,
      message,
      type
    });
  }

  showConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText = 'Login', cancelText = 'Register') {
    this.modalSubject.next({
      id: 'confirm-modal',
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  }

  showModal(config: Partial<ModalConfig>) {
    this.modalSubject.next({
      id: config.id || 'modal',
      title: config.title || '',
      message: config.message || '',
      type: config.type || 'info',
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel
    });
  }

  close() {
    this.modalSubject.next(null);
  }
}