import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdaptiveGreeting } from './adaptive-greeting';

describe('AdaptiveGreeting', () => {
  let component: AdaptiveGreeting;
  let fixture: ComponentFixture<AdaptiveGreeting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdaptiveGreeting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdaptiveGreeting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
