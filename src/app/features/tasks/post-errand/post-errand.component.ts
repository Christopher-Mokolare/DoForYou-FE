import { Component, OnInit, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ErrandsService, CreateTaskData } from '../../../services/errands.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/auth.models';
import { GlobalStateService } from '../../../services/global-state.service';
import { LoadingService } from '../../../services/loading.service';
import { WalletService } from '../../../services/wallet.service';

@Component({
  selector: 'app-post-errand',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './post-errand.component.html',
  styleUrls: ['./post-errand.component.scss']
})
export class PostErrandComponent implements OnInit, AfterViewInit {
  @ViewChild('locationInput', { static: false }) locationInput!: ElementRef;
  
  taskForm: FormGroup;
  isSubmitting = false;
  submitted = false;
  currentUser$: Observable<User | null>;
  categoryOptions: any[] = [];
  showCustomCategory = false;
  currentStep = 1;
  totalSteps = 3;
  autocomplete: any;
  isEditMode = false;
  taskId: string | null = null;
  
  commissionBreakdown = { commission: 0, payout: 0, total: 0 };

  constructor(
    private fb: FormBuilder,
    private errandsService: ErrandsService,
    private authService: AuthService,
    private globalState: GlobalStateService,
    private loadingService: LoadingService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private walletService: WalletService
  ) {
    this.taskForm = this.createForm();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    
    // Debug: Log current user
    this.currentUser$.subscribe(user => {
      console.log('Current user in post-errand:', user);
    });
    
    // Check for edit mode
    this.taskId = this.route.snapshot.paramMap.get('taskId');
    this.isEditMode = !!this.taskId;
    
    // Skip to last step in edit mode to show all fields
    if (this.isEditMode) {
      this.currentStep = this.totalSteps;
    }
    
    // Check if user preferences allow task creation using GlobalStateService
    if (!this.isEditMode && !this.globalState.canCreateTasks()) {
      alert('You have selected "Task Runner" mode. To post errands, please update your preferences to "Task Creator" or "Both" in your profile settings.');
      this.router.navigate(['/profile/preferences']);
      return;
    }

    // Check if profile is complete
    if (!this.isEditMode && this.authService.isProfileIncomplete()) {
      alert('Please complete your profile before posting tasks. Your profile is only ' + this.authService.getProfileCompletion() + '% complete.');
      this.router.navigate(['/profile']);
      return;
    }

    // Load category options
    this.loadCategoryOptions();
    
    // Watch budget changes to update commission
    this.taskForm.get('budget')?.valueChanges.subscribe(budget => {
      if (budget && budget > 0) {
        this.commissionBreakdown = this.walletService.calculateCommission(budget);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize location autocomplete after view is ready
    this.initializeNominatimAutocomplete();
  }

  private initializeNominatimAutocomplete(): void {
    if (this.locationInput?.nativeElement) {
      const input = this.locationInput.nativeElement;
      let debounceTimer: any;
      
      input.addEventListener('input', (e: any) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchLocations(e.target.value);
        }, 300);
      });
      
      // Hide suggestions when clicking outside
      document.addEventListener('click', (e: any) => {
        if (!input.contains(e.target)) {
          const suggestions = document.querySelector('.location-suggestions');
          if (suggestions) {
            suggestions.remove();
          }
        }
      });
    }
  }

  private searchLocations(query: string): void {
    if (query.length < 2) {
      const existingSuggestions = document.querySelector('.location-suggestions');
      if (existingSuggestions) {
        existingSuggestions.remove();
      }
      return;
    }
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=za&limit=8&addressdetails=1&q=${encodeURIComponent(query)}`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.showLocationSuggestions(data);
      })
      .catch(error => {
        console.error('Location search error:', error);
      });
  }

  private showLocationSuggestions(locations: any[]): void {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.location-suggestions');
    if (existingSuggestions) {
      existingSuggestions.remove();
    }

    if (locations.length === 0) {
      // Show "No locations found" message for misspellings
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'location-suggestions';
      suggestionsDiv.style.cssText = `
        position: absolute;
        top: calc(100% + 2px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: block;
        width: 100%;
      `;
      
      const noResultsItem = document.createElement('div');
      noResultsItem.style.cssText = `
        padding: 12px 15px;
        font-size: 14px;
        color: #666;
        font-style: italic;
      `;
      noResultsItem.textContent = 'No locations found. Please check spelling.';
      suggestionsDiv.appendChild(noResultsItem);
      
      const inputContainer = this.locationInput.nativeElement.parentElement;
      inputContainer.appendChild(suggestionsDiv);
      return;
    }

    // Create suggestions dropdown
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'location-suggestions';
    suggestionsDiv.style.cssText = `
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-height: 200px;
      overflow-y: auto;
      display: block;
      width: 100%;
    `;

    // Track unique locations to avoid duplicates
    const uniqueLocations = new Set();

    locations.forEach((location) => {
      // Extract meaningful location parts
      const parts = location.display_name.split(',').map((p: string) => p.trim());
      let displayName = '';
      let selectedValue = '';
      
      // First, try to find the main location name that matches the search
      const mainLocation = parts[0]; // This is usually the primary location name
      
      // Prioritize different location types
      if (location.address) {
        const road = location.address.road;
        const houseNumber = location.address.house_number;
        const city = location.address.city;
        const town = location.address.town;
        const village = location.address.village;
        const suburb = location.address.suburb;
        const county = location.address.county;
        const province = location.address.state;
        const postcode = location.address.postcode;
        
        // Handle complex addresses (intersections, corners, etc.)
        if (mainLocation && (mainLocation.includes('Cnr') || mainLocation.includes('&') || mainLocation.includes('Corner'))) {
          displayName = `${mainLocation}, ${suburb || city || town}, ${province || 'South Africa'}`;
          selectedValue = `${mainLocation}, ${suburb || city || town}`;
        }
        // Handle streets/roads with house numbers
        else if (road && houseNumber && (city || town || suburb)) {
          displayName = `${houseNumber} ${road}, ${suburb || city || town}, ${province || 'South Africa'}`;
          selectedValue = `${houseNumber} ${road}, ${suburb || city || town}`;
        }
        // Handle streets/roads without house numbers
        else if (road && (city || town || suburb)) {
          displayName = `${road}, ${suburb || city || town}, ${province || 'South Africa'}`;
          selectedValue = `${road}, ${suburb || city || town}`;
        }
        // Use the main location name (what user typed) as the primary option
        else if (mainLocation && mainLocation !== county && mainLocation !== province) {
          displayName = `${mainLocation}, ${province || county || 'South Africa'}`;
          selectedValue = mainLocation;
        } else if (city) {
          displayName = `${city}, ${province || county || 'South Africa'}`;
          selectedValue = city;
        } else if (town) {
          displayName = `${town}, ${province || county || 'South Africa'}`;
          selectedValue = town;
        } else if (suburb) {
          displayName = `${suburb}, ${city || town || province || 'South Africa'}`;
          selectedValue = suburb;
        } else if (village) {
          displayName = `${village}, ${province || county || 'South Africa'}`;
          selectedValue = village;
        } else {
          displayName = parts.slice(0, 2).join(', ');
          selectedValue = parts[0];
        }
      } else {
        displayName = parts.slice(0, 2).join(', ');
        selectedValue = parts[0];
      }
      
      // Skip duplicates
      if (uniqueLocations.has(displayName)) {
        return;
      }
      uniqueLocations.add(displayName);
      
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.style.cssText = `
        padding: 12px 15px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        font-size: 14px;
        color: #333;
        display: block;
      `;
      suggestionItem.textContent = displayName;
      
      suggestionItem.addEventListener('click', () => {
        this.ngZone.run(() => {
          this.taskForm.patchValue({ area: selectedValue });
          suggestionsDiv.remove();
        });
      });
      
      suggestionItem.addEventListener('mouseenter', () => {
        suggestionItem.style.backgroundColor = '#f8f9fa';
      });
      
      suggestionItem.addEventListener('mouseleave', () => {
        suggestionItem.style.backgroundColor = 'white';
      });
      
      suggestionsDiv.appendChild(suggestionItem);
    });

    // Ensure parent container has relative positioning
    const inputContainer = this.locationInput.nativeElement.parentElement;
    inputContainer.style.position = 'relative';
    inputContainer.style.zIndex = '1';
    inputContainer.appendChild(suggestionsDiv);
  }

  private loadCategoryOptions(): void {
    this.errandsService.getFilterOptions().subscribe({
      next: (options) => {
        console.log('Categories response:', options);
        // categories are in options.data.categories, not options.categories
        this.categoryOptions = options.data?.categories || options.categories || [];
        console.log('Category options:', this.categoryOptions);
        
        // Load task data after categories are loaded (for edit mode)
        if (this.isEditMode && this.taskId) {
          this.loadTaskData(this.taskId);
        }
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  private loadTaskData(taskId: string): void {
    this.loadingService.show();
    this.errandsService.getTaskById(taskId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const task = response.data;
          console.log('Task data loaded:', task);
          console.log('Category from task:', task.category);
          console.log('Available categories:', this.categoryOptions);
          
          // Convert dueDate to datetime-local format (YYYY-MM-DDTHH:mm)
          let dateTimeValue = '';
          if (task.dueDate) {
            const date = new Date(task.dueDate);
            dateTimeValue = date.toISOString().slice(0, 16); // Gets YYYY-MM-DDTHH:mm
          }
          
          this.taskForm.patchValue({
            taskDescription: task.description || task.taskDescription,
            category: task.category,
            area: task.location || task.area,
            priority: (task.priority || 'standard').toLowerCase(),
            dateNeeded: dateTimeValue,
            budget: task.budget,
            notes: task.notes || ''
          });
          
          console.log('Form values after patch:', this.taskForm.value);
          
          if (task.budget) {
            this.commissionBreakdown = this.walletService.calculateCommission(task.budget);
          }
        }
        this.loadingService.hide();
      },
      error: (error: any) => {
        console.error('Failed to load task:', error);
        this.loadingService.hide();
        alert('Failed to load task data');
        this.router.navigate(['/tasks/my-posted']);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', [Validators.required]],
      customCategory: [''],
      area: ['', [Validators.required]], // Remove custom validator, Google Places ensures valid locations
      priority: ['standard', [Validators.required]],
      dateNeeded: ['', [Validators.required, this.futureDateValidator]],
      budget: ['', [Validators.required, Validators.min(0)]],
      notes: [''],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  maxWordsValidator(maxWords: number) {
    return (control: any) => {
      if (!control.value) return null;
      const wordCount = control.value.trim().split(/\s+/).length;
      return wordCount > maxWords ? { maxWords: { actual: wordCount, max: maxWords } } : null;
    };
  }

  locationValidator(control: any) {
    if (!control.value) return null;
    
    const location = control.value.trim();
    
    // Check minimum length for meaningful location names
    if (location.length < 4) {
      return { invalidLocation: { message: 'Please enter a complete location name (minimum 4 characters)' } };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const validPattern = /^[a-zA-Z\s\-']+$/;
    if (!validPattern.test(location)) {
      return { invalidLocation: { message: 'Location can only contain letters, spaces, hyphens, and apostrophes' } };
    }
    
    // Check for reasonable length
    if (location.length > 50) {
      return { invalidLocation: { message: 'Location name is too long' } };
    }
    
    // Reject common abbreviations and invalid patterns
    const invalidPatterns = /^(CAP|JHB|DBN|PTA|CPT|GP|WC|KZN|EC|NC|NW|MP|LP|FS)$/i;
    if (invalidPatterns.test(location)) {
      return { invalidLocation: { message: 'Please enter the full location name, not an abbreviation' } };
    }
    
    // Check for at least one vowel (most real place names have vowels)
    if (!/[aeiouAEIOU]/.test(location)) {
      return { invalidLocation: { message: 'Please enter a valid location name' } };
    }
    
    return null;
  }

  futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { futureDate: true };
    }
    return null;
  }

  onCategoryChange(event: any): void {
    const selectedCategory = event.target.value;
    this.showCustomCategory = selectedCategory === 'Other';
    
    if (this.showCustomCategory) {
      this.taskForm.get('customCategory')?.setValidators([
        Validators.required,
        Validators.maxLength(30),
        this.maxWordsValidator(3)
      ]);
    } else {
      this.taskForm.get('customCategory')?.clearValidators();
      this.taskForm.get('customCategory')?.setValue('');
    }
    this.taskForm.get('customCategory')?.updateValueAndValidity();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps && this.isCurrentStepValid()) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      return !!(this.taskForm.get('taskDescription')?.valid && 
               this.taskForm.get('category')?.valid &&
               (!this.showCustomCategory || this.taskForm.get('customCategory')?.valid) &&
               this.taskForm.get('area')?.valid &&
               this.taskForm.get('priority')?.valid);
    }
    if (this.currentStep === 2) {
      return !!(this.taskForm.get('dateNeeded')?.valid && 
               this.taskForm.get('budget')?.valid);
    }
    return true;
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.loadingService.show();
      
      try {
        const selectedCategory = this.taskForm.value.category;
        const finalCategory = selectedCategory === 'Other' 
          ? this.sanitizeInput(this.taskForm.value.customCategory)
          : selectedCategory;
          
        const formData: CreateTaskData = {
          taskDescription: this.sanitizeInput(this.taskForm.value.taskDescription),
          category: finalCategory,
          area: this.sanitizeInput(this.taskForm.value.area),
          priority: this.taskForm.value.priority,
          dateNeeded: new Date(this.taskForm.value.dateNeeded).toISOString(),
          budget: this.validateBudget(this.taskForm.value.budget),
          notes: this.taskForm.value.notes ? this.sanitizeInput(this.taskForm.value.notes) : undefined,
          termsAccepted: this.taskForm.value.termsAccepted
        };

        if (this.isEditMode && this.taskId) {
          // Update existing task
          this.errandsService.updateTask(this.taskId, formData).subscribe({
            next: (response) => {
              this.loadingService.hide();
              this.isSubmitting = false;
              alert('Task updated successfully!');
              this.router.navigate(['/tasks/my-posted']);
            },
            error: (error) => {
              console.error('Error updating task:', error);
              this.loadingService.hide();
              this.isSubmitting = false;
              
              if (error.status === 405) {
                alert('Task update is not yet supported by the backend. The PUT /api/v1/tasks/{taskId} endpoint needs to be implemented.');
              } else {
                alert('Failed to update task. Please try again.');
              }
            }
          });
        } else {
          // Create new task
          this.errandsService.createTask(formData).subscribe({
            next: (response) => {
              console.log('Task created successfully:', response);
              this.loadingService.hide();
              this.isSubmitting = false;
              
              if (response.data?.paymentUrl) {
                window.location.href = response.data.paymentUrl;
              } else {
                alert('Payment URL not received. Please try again.');
              }
            },
            error: (error) => {
              console.error('Error creating task:', error);
              this.loadingService.hide();
              this.isSubmitting = false;
              alert('Failed to create task. Please try again.');
            }
          });
        }
      } catch (error) {
        console.error('Error processing task submission');
        this.loadingService.hide();
        this.isSubmitting = false;
        alert('Error processing your request. Please try again.');
      }
    } else {
      this.markFormGroupTouched();
      
      try {
        const firstInvalidControl = document.querySelector('.is-invalid');
        if (firstInvalidControl) {
          firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Error scrolling to invalid field');
      }
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check field validity
  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  // Helper to get specific error message
  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    
    const errors = field.errors;
    
    if (errors['required']) {
      if (fieldName === 'customCategory') return 'Please specify your custom category';
      return 'This field is required';
    }
    if (errors['invalidLocation']) return errors['invalidLocation'].message;
    if (errors['maxWords']) return `Maximum ${errors['maxWords'].max} words allowed`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['min']) return 'Budget must be at least R0';
    if (errors['futureDate']) return 'Please select a future date';
    if (errors['requiredTrue']) return 'You must accept the terms and conditions';
    
    return 'Invalid value';
  }



  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>"'&]/g, '');
  }

  private validateBudget(budget: any): number {
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      throw new Error('Invalid budget amount');
    }
    return numBudget;
  }

  getUserInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

}