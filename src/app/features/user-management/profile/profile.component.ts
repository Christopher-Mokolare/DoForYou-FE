import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { UserPreferencesService, UserPreferences, BankDetails } from '../../../services/user-preferences.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile = {
    name: '',
    email: '',
    phone: '',
    username: '',
    idNumber: '',
    address: '',
    dateOfBirth: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountHolderName: ''
  };

  verificationStatus = {
    idNumberVerified: false,
    verificationStatus: 'Not Started'
  };

  addressError = '';

  preferences: UserPreferences = {
    canCreateTasks: true,
    canAcceptTasks: false,
    taskCreatorNotifications: true,
    taskRunnerNotifications: true,
    paymentNotifications: true,
    emailNotifications: true,
    smsNotifications: false
  };

  userType: 'creator' | 'runner' = 'creator';

  stats = {
    tasksCreated: 0,
    tasksCompleted: 0,
    rating: 0,
    totalEarnings: 0
  };

  updating = false;

  constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private userPreferencesService: UserPreferencesService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadPreferences();
    this.loadVerificationStatus();
    this.loadStats();
  }

  private loadUserProfile() {
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.profile) {
          this.profile = {
            name: response.profile.name || response.profile.fullName || response.profile.displayName || '',
            email: response.profile.email || '',
            phone: response.profile.phone || response.profile.contact || '',
            username: response.profile.username || '',
            idNumber: response.profile.idNumber || '',
            address: response.profile.address || '',
            dateOfBirth: response.profile.dateOfBirth || '',
            bankName: '',
            accountNumber: '',
            branchCode: '',
            accountHolderName: ''
          };
          console.log('Profile data received:', response.profile);
          this.verificationStatus = {
            idNumberVerified: response.profile.idNumberVerified || false,
            verificationStatus: response.profile.verificationStatus || 'Not Started'
          };
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          console.log('Current user data:', currentUser);
          const user = currentUser as any;
          this.profile = {
            name: user.name || user.fullName || user.displayName || '',
            email: user.email || '',
            phone: user.contact || user.phone || '',
            username: '',
            idNumber: '',
            address: '',
            dateOfBirth: '',
            bankName: '',
            accountNumber: '',
            branchCode: '',
            accountHolderName: ''
          };
        }
      }
    });
  }

  private loadPreferences() {
    this.userPreferencesService.getPreferences().subscribe({
      next: (response: UserPreferences) => {
        this.preferences = response;
        this.userType = response.canCreateTasks ? 'creator' : 'runner';
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
        const saved = localStorage.getItem('userPreferences');
        if (saved) {
          this.preferences = { ...this.preferences, ...JSON.parse(saved) };
          this.userType = this.preferences.canCreateTasks ? 'creator' : 'runner';
        }
      }
    });
  }

  private loadStats() {
    this.authService.getUserStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats = response.stats;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.stats = {
          tasksCreated: 0,
          tasksCompleted: 0,
          rating: 0,
          totalEarnings: 0
        };
      }
    });
  }

  updateProfile() {
    this.updating = true;
    
    const updateData = {
      name: this.profile.name,
      contact: this.profile.phone,
      username: this.profile.username,
      idNumber: this.profile.idNumber,
      address: this.profile.address,
      dateOfBirth: this.profile.dateOfBirth ? new Date(this.profile.dateOfBirth).toISOString() : null
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.updating = false;
        if (response.success) {
          this.modalService.showModal({
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully.'
          });
        } else {
          this.modalService.showModal({
            type: 'error',
            title: 'Update Failed',
            message: response.error || 'Failed to update profile.'
          });
        }
      },
      error: (error) => {
        this.updating = false;
        this.modalService.showModal({
          type: 'error',
          title: 'Update Failed',
          message: 'An error occurred while updating your profile.'
        });
      }
    });
  }

  updateBankDetails() {
    if (!this.profile.bankName || !this.profile.accountNumber || !this.profile.branchCode || !this.profile.accountHolderName) {
      this.modalService.showModal({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all bank details fields.'
      });
      return;
    }

    this.updating = true;
    const bankDetails: BankDetails = {
      bankName: this.profile.bankName,
      accountNumber: this.profile.accountNumber,
      branchCode: this.profile.branchCode,
      accountHolderName: this.profile.accountHolderName
    };

    this.userPreferencesService.updateBankDetails(bankDetails).subscribe({
      next: (response) => {
        this.updating = false;
        if (response.success) {
          this.modalService.showModal({
            type: 'success',
            title: 'Bank Details Updated',
            message: 'Your bank details have been updated successfully.'
          });
        } else {
          this.modalService.showModal({
            type: 'error',
            title: 'Update Failed',
            message: response.error || 'Failed to update bank details.'
          });
        }
      },
      error: (error) => {
        this.updating = false;
        this.modalService.showModal({
          type: 'error',
          title: 'Update Failed',
          message: 'An error occurred while updating bank details.'
        });
      }
    });
  }

  onUserTypeChange() {
    this.preferences.canCreateTasks = this.userType === 'creator';
    this.preferences.canAcceptTasks = this.userType === 'runner';
    this.updatePreferences();
  }

  updatePreferences() {
    this.userPreferencesService.updatePreferences(this.preferences).subscribe({
      next: (response) => {
        if (response.success) {
          this.userPreferencesService.saveToLocalStorage(this.preferences);
          this.modalService.showModal({
            type: 'success',
            title: 'Preferences Updated',
            message: 'Your preferences have been updated successfully.'
          });
        } else {
          this.modalService.showModal({
            type: 'error',
            title: 'Update Failed',
            message: response.error || 'Failed to update preferences.'
          });
        }
      },
      error: (error) => {
        console.error('Error updating preferences:', error);
        this.userPreferencesService.saveToLocalStorage(this.preferences);
        this.modalService.showModal({
          type: 'warning',
          title: 'Preferences Saved Locally',
          message: 'Preferences saved locally. They will sync when connection is restored.'
        });
      }
    });
  }

  onIdNumberChange() {
    if (this.profile.idNumber.length === 13) {
      const dateOfBirth = this.extractDateFromIdNumber(this.profile.idNumber);
      if (dateOfBirth) {
        this.profile.dateOfBirth = dateOfBirth;
      }
    }
  }

  private extractDateFromIdNumber(idNumber: string): string {
    if (idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
      return '';
    }
    
    const year = idNumber.substring(0, 2);
    const month = idNumber.substring(2, 4);
    const day = idNumber.substring(4, 6);
    
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const fullYear = parseInt(year) <= (currentYear % 100) ? currentCentury + parseInt(year) : currentCentury - 100 + parseInt(year);
    
    return `${fullYear}-${month}-${day}`;
  }

  isProfileComplete(): boolean {
    return this.authService.isProfileComplete();
  }

  private loadVerificationStatus() {
    this.verificationStatus = {
      idNumberVerified: false,
      verificationStatus: 'Not Started'
    };
  }

  validateAddress() {
    this.addressError = '';
    if (!this.profile.address) return;

    const address = this.profile.address.trim();
    
    if (address.length < 20) {
      this.addressError = 'Address too short. Please provide complete address.';
      return;
    }

    const parts = address.split(',').map((p: string) => p.trim());
    if (parts.length < 3) {
      this.addressError = 'Please include street, suburb, and city separated by commas.';
      return;
    }

    const postalCodePattern = /\b\d{4}\b/;
    if (!postalCodePattern.test(address)) {
      this.addressError = 'Please include a valid 4-digit postal code.';
      return;
    }
  }
}