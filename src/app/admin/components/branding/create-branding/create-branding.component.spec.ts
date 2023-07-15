import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBrandingComponent } from './create-branding.component';

describe('CreateBrandingComponent', () => {
  let component: CreateBrandingComponent;
  let fixture: ComponentFixture<CreateBrandingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateBrandingComponent]
    });
    fixture = TestBed.createComponent(CreateBrandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
