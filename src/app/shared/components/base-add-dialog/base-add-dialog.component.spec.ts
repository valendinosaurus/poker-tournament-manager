import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseAddDialogComponent } from './base-add-dialog.component';

describe('BaseAddDialogComponent', () => {
  let component: BaseAddDialogComponent;
  let fixture: ComponentFixture<BaseAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseAddDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BaseAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
