import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankFormulaPageComponent } from './rank-formula-page.component';

describe('RankFormulaPageComponent', () => {
  let component: RankFormulaPageComponent;
  let fixture: ComponentFixture<RankFormulaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankFormulaPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RankFormulaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
