import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPlayersAndBlindsComponent } from './edit-players-and-blinds.component';

describe('EditPlayersAndBlindsComponent', () => {
  let component: EditPlayersAndBlindsComponent;
  let fixture: ComponentFixture<EditPlayersAndBlindsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditPlayersAndBlindsComponent]
    });
    fixture = TestBed.createComponent(EditPlayersAndBlindsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
