import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostErrandComponent } from './post-errand.component';

describe('PostErrandComponent', () => {
  let component: PostErrandComponent;
  let fixture: ComponentFixture<PostErrandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostErrandComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostErrandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
