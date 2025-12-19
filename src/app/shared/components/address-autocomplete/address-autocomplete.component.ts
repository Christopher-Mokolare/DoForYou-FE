import { Component, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AddressAutocompleteService, AddressSuggestion } from '../../../services/address-autocomplete.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressAutocompleteComponent),
      multi: true
    }
  ],
  templateUrl: './address-autocomplete.component.html',
  styleUrls: ['./address-autocomplete.component.scss']
})
export class AddressAutocompleteComponent implements ControlValueAccessor, OnDestroy {
  @Input() placeholder = 'Enter your address';
  @Input() inputClass = 'form-control';
  @Input() showFormatHint = true;
  @Input() formatHint = 'e.g. 123 Main Street, Sandton, Johannesburg, 2196';
  @Input() disabled = false;
  @Output() addressSelected = new EventEmitter<string>();

  inputValue = '';
  suggestions: AddressSuggestion[] = [];
  showSuggestions = false;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private addressService: AddressAutocompleteService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.addressService.getAddressSuggestions(query)),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.suggestions = suggestions;
      this.showSuggestions = suggestions.length > 0;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: any) {
    const value = event.target.value;
    this.inputValue = value;
    this.onChange(value);
    
    if (value.length >= 3) {
      this.searchSubject.next(value);
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }

  onFocus() {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
      this.onTouched();
    }, 200);
  }

  selectSuggestion(suggestion: AddressSuggestion) {
    // Handle fallback suggestions
    if (suggestion.placeId.startsWith('fallback_')) {
      this.inputValue = suggestion.description;
      this.onChange(suggestion.description);
      this.addressSelected.emit(suggestion.description);
      this.showSuggestions = false;
      this.suggestions = [];
      return;
    }

    this.addressService.getPlaceDetails(suggestion.placeId).subscribe({
      next: (place) => {
        const formattedAddress = this.addressService.formatAddress(place);
        this.inputValue = formattedAddress;
        this.onChange(formattedAddress);
        this.addressSelected.emit(formattedAddress);
        this.showSuggestions = false;
        this.suggestions = [];
      },
      error: () => {
        this.inputValue = suggestion.description;
        this.onChange(suggestion.description);
        this.addressSelected.emit(suggestion.description);
        this.showSuggestions = false;
        this.suggestions = [];
      }
    });
  }

  trackBySuggestion(index: number, suggestion: AddressSuggestion): string {
    return suggestion.placeId;
  }

  writeValue(value: string): void {
    this.inputValue = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}