import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageWithSlideMenuComponent } from './page-with-slide-menu.component';

describe('PageWithSlideMenuComponent', () => {
  let component: PageWithSlideMenuComponent;
  let fixture: ComponentFixture<PageWithSlideMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PageWithSlideMenuComponent]
    });
    fixture = TestBed.createComponent(PageWithSlideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
