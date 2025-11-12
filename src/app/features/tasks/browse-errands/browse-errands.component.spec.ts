import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseErrandsComponent } from './browse-errands.component';

describe('BrowseErrandsComponent', () => {
  let component: BrowseErrandsComponent;
  let fixture: ComponentFixture<BrowseErrandsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseErrandsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowseErrandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
