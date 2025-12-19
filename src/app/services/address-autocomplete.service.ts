import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

declare var google: any;

export interface AddressSuggestion {
  description: string;
  placeId: string;
  formattedAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressAutocompleteService {
  private autocompleteService: any;
  private placesService: any;
  private isLoaded = false;

  constructor() {
    this.loadGoogleMapsAPI();
  }

  private loadGoogleMapsAPI(): void {
    console.log('Loading Google Maps API...');
    if (typeof google !== 'undefined' && google.maps) {
      console.log('Google Maps already loaded');
      this.initializeServices();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      this.initializeServices();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  }

  private initializeServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      console.log('Initializing Google Maps services...');
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
      this.isLoaded = true;
      console.log('Google Maps services initialized successfully');
    } else {
      console.error('Google Maps not available for initialization');
    }
  }

  getAddressSuggestions(input: string): Observable<AddressSuggestion[]> {
    const subject = new Subject<AddressSuggestion[]>();
    console.log('AddressService: getAddressSuggestions called with:', input);
    console.log('AddressService: isLoaded =', this.isLoaded);

    if (!input || input.length < 3) {
      console.log('AddressService: Input too short, returning empty');
      subject.next([]);
      subject.complete();
      return subject.asObservable();
    }

    // Force fallback for testing - remove this line when Google API works
    if (!this.isLoaded || true) {
    // if (!this.isLoaded) {
      console.log('AddressService: Google Maps not loaded, using fallback');
      // Fallback: return basic suggestions for common SA areas
      const fallbackSuggestions = this.getFallbackSuggestions(input);
      console.log('AddressService: Fallback suggestions:', fallbackSuggestions);
      subject.next(fallbackSuggestions);
      subject.complete();
      return subject.asObservable();
    }

    const request = {
      input: input,
      componentRestrictions: { country: 'za' }, // Restrict to South Africa
      types: ['address']
    };

    this.autocompleteService.getPlacePredictions(request, (predictions: any[], status: any) => {
      console.log('Google Places API response - Status:', status, 'Predictions:', predictions);
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        const suggestions: AddressSuggestion[] = predictions.map(prediction => ({
          description: prediction.description,
          placeId: prediction.place_id
        }));
        console.log('Mapped suggestions:', suggestions);
        subject.next(suggestions);
      } else {
        console.log('Google Places API failed, using fallback. Status:', status);
        const fallbackSuggestions = this.getFallbackSuggestions(input);
        console.log('Using fallback suggestions:', fallbackSuggestions);
        subject.next(fallbackSuggestions);
      }
      subject.complete();
    });

    return subject.asObservable();
  }

  private getFallbackSuggestions(input: string): AddressSuggestion[] {
    const inputLower = input.toLowerCase();
    const isNumeric = /^\d+/.test(input);
    
    let suggestions: string[] = [];
    
    if (isNumeric) {
      // Generate street address suggestions for numeric input
      const commonStreets = ['Main Street', 'Church Street', 'Market Street', 'High Street'];
      const commonAreas = ['Sandton, Johannesburg, 2196', 'Cape Town City Centre, Cape Town, 8001', 'Rosebank, Johannesburg, 2196'];
      
      commonStreets.forEach(street => {
        commonAreas.forEach(area => {
          suggestions.push(`${input} ${street}, ${area}`);
        });
      });
    }
    
    // Add common areas that match the input
    const commonAreas = [
      'Sandton, Johannesburg, 2196',
      'Cape Town City Centre, Cape Town, 8001', 
      'Durban Central, Durban, 4001',
      'Pretoria Central, Pretoria, 0002',
      'Rosebank, Johannesburg, 2196',
      'Camps Bay, Cape Town, 8005',
      'Umhlanga, Durban, 4320',
      'Hatfield, Pretoria, 0028'
    ];
    
    suggestions.push(...commonAreas.filter(area => area.toLowerCase().includes(inputLower)));

    return suggestions
      .slice(0, 5) // Limit to 5 suggestions
      .map((suggestion, index) => ({
        description: suggestion,
        placeId: `fallback_${index}`
      }));
  }

  getPlaceDetails(placeId: string): Observable<any> {
    const subject = new Subject<any>();

    if (!this.isLoaded) {
      subject.error('Google Maps API not loaded');
      return subject.asObservable();
    }

    const request = {
      placeId: placeId,
      fields: ['formatted_address', 'address_components', 'geometry']
    };

    this.placesService.getDetails(request, (place: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        subject.next(place);
      } else {
        subject.error('Failed to get place details');
      }
      subject.complete();
    });

    return subject.asObservable();
  }

  formatAddress(place: any): string {
    if (!place || !place.address_components) {
      return place?.formatted_address || '';
    }

    const components = place.address_components;
    let streetNumber = '';
    let route = '';
    let sublocality = '';
    let locality = '';
    let postalCode = '';

    components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        sublocality = component.long_name;
      } else if (types.includes('locality')) {
        locality = component.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    const parts = [];
    if (streetNumber && route) {
      parts.push(`${streetNumber} ${route}`);
    } else if (route) {
      parts.push(route);
    }
    if (sublocality) parts.push(sublocality);
    if (locality) parts.push(locality);
    if (postalCode) parts.push(postalCode);

    return parts.join(', ') || place.formatted_address;
  }
}