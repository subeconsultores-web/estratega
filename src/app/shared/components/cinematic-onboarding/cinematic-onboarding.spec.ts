import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CinematicOnboarding } from './cinematic-onboarding';

describe('CinematicOnboarding', () => {
  let component: CinematicOnboarding;
  let fixture: ComponentFixture<CinematicOnboarding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CinematicOnboarding]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CinematicOnboarding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
