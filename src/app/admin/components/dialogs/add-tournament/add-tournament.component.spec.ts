import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTournamentComponent } from './add-tournament.component';

describe('AddTournamentComponent', () => {
  let component: AddTournamentComponent;
  let fixture: ComponentFixture<AddTournamentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddTournamentComponent]
    });
    fixture = TestBed.createComponent(AddTournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
