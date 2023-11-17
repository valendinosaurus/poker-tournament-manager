import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMissingEntriesComponent } from './add-missing-entries.component';

describe('AddMissingEntriesComponent', () => {
  let component: AddMissingEntriesComponent;
  let fixture: ComponentFixture<AddMissingEntriesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddMissingEntriesComponent]
    });
    fixture = TestBed.createComponent(AddMissingEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
