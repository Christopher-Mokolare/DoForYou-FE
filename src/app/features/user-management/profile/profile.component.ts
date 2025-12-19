import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { UserPreferencesService, UserPreferences, BankDetails } from '../../../services/user-preferences.service';
import { AddressAutocompleteComponent } from '../../../shared/components/address-autocomplete/address-autocomplete.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AddressAutocompleteComponent],
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
  editingPersonal = false;
  editingBank = false;
  showIdValidationMessage = false;

  constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private userPreferencesService: UserPreferencesService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadPreferences();
    this.loadVerificationStatus();
    this.loadStats();
  }

  private loadUserProfile() {
    // Always try to load from current user first
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('Loading profile from current user:', currentUser);
      const user = currentUser as any;
      this.profile = {
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        email: user.email || '',
        phone: user.contact || user.phoneNumber || '',
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

    // Then try to load from API (will override if successful)
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const userData = response.data;
          this.profile = {
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || this.profile.name,
            email: userData.email || this.profile.email,
            phone: userData.phoneNumber || userData.contact || this.profile.phone,
            username: userData.username || '',
            idNumber: userData.idNumber || '',
            address: userData.address || '',
            dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
            bankName: '',
            accountNumber: '',
            branchCode: '',
            accountHolderName: ''
          };
          
          // Validate ID number after loading from API without showing messages
          if (this.profile.idNumber) {
            this.validateIdNumberSilently();
          }
          
          console.log('Profile updated from API:', userData);
        }
      },
      error: (error) => {
        console.log('API profile load failed, using current user data');
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
    // Load real stats from backend using HttpClient
    this.http.get<any>(`${environment.apiUrl}/api/v1/tasks/dashboard/stats`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = {
            tasksCreated: response.data.tasksCreated || 0,
            tasksCompleted: response.data.tasksCompleted || 0,
            rating: response.data.averageRating || 0,
            totalEarnings: response.data.totalEarnings || 0
          };
        } else {
          this.setDefaultStats();
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.setDefaultStats();
      }
    });
  }

  private setDefaultStats() {
    this.stats = {
      tasksCreated: 0,
      tasksCompleted: 0,
      rating: 0,
      totalEarnings: 0
    };
  }

  verifyEmail() {
    this.updating = true;
    this.authService.verifyEmail().subscribe({
      next: (response) => {
        this.updating = false;
        if (response.success) {
          this.modalService.showModal({
            type: 'success',
            title: 'Email Verified',
            message: 'Your email has been verified successfully.'
          });
          this.loadUserProfile();
        }
      },
      error: () => this.updating = false
    });
  }

  verifyPhone() {
    this.updating = true;
    this.authService.verifyPhone().subscribe({
      next: (response) => {
        this.updating = false;
        if (response.success) {
          this.modalService.showModal({
            type: 'success',
            title: 'Phone Verified',
            message: 'Your phone number has been verified successfully.'
          });
          this.loadUserProfile();
        }
      },
      error: () => this.updating = false
    });
  }

  updateProfile() {
    this.updating = true;
    
    const nameParts = this.profile.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const updateData = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: this.profile.phone,
      userType: 'both',
      username: this.profile.username,
      idNumber: this.profile.idNumber,
      address: this.profile.address,
      dateOfBirth: this.profile.dateOfBirth ? new Date(this.profile.dateOfBirth).toISOString() : null
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.updating = false;
        if (response.success) {
          // Fetch updated user profile from server
          this.authService.getProfile().subscribe({
            next: (profileResponse: any) => {
              if (profileResponse.success && profileResponse.data) {
                const updatedUser = profileResponse.data;
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                this.authService.refreshCurrentUser();
                
                // Update form fields with fresh data
                this.profile = {
                  ...this.profile,
                  name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
                  phone: updatedUser.phoneNumber || updatedUser.contact || this.profile.phone
                };
              }
            },
            error: (error) => console.error('Error fetching updated profile:', error)
          });
          
          this.modalService.showModal({
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully.'
          });
          this.editingPersonal = false;
          this.showIdValidationMessage = false;
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
          this.editingBank = false;
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
    if (this.userType === 'creator') {
      this.preferences.canCreateTasks = true;
      this.preferences.canAcceptTasks = false;
    } else if (this.userType === 'runner') {
      this.preferences.canCreateTasks = false;
      this.preferences.canAcceptTasks = true;
    }
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
    this.showIdValidationMessage = true;
    this.validateIdNumberSilently();
  }

  private validateIdNumberSilently() {
    if (this.profile.idNumber && this.profile.idNumber.length === 13) {
      const isValid = this.validateSouthAfricanId(this.profile.idNumber);
      if (isValid) {
        this.verificationStatus.idNumberVerified = true;
      } else {
        this.verificationStatus.idNumberVerified = false;
      }
      // Extract date regardless of validation for display purposes
      const dateOfBirth = this.extractDateFromIdNumber(this.profile.idNumber);
      if (dateOfBirth) {
        this.profile.dateOfBirth = dateOfBirth;
      }
    } else if (this.profile.idNumber && this.profile.idNumber.length > 0 && this.profile.idNumber.length < 13) {
      this.verificationStatus.idNumberVerified = false;
    } else {
      // Empty or null ID number - don't show as invalid
      this.verificationStatus.idNumberVerified = false;
    }
  }

  private validateSouthAfricanId(idNumber: string): boolean {
    if (idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
      return false;
    }
    
    // Luhn algorithm check
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(idNumber[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(idNumber[12]);
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

  onAddressSelected(address: string) {
    this.profile.address = address;
    this.validateAddress();
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

  toggleEditPersonal() {
    this.editingPersonal = !this.editingPersonal;
  }

  toggleEditBank() {
    this.editingBank = !this.editingBank;
  }
}