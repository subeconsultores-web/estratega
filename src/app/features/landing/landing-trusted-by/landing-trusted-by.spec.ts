import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingTrustedBy } from './landing-trusted-by';

describe('LandingTrustedBy', () => {
  let component: LandingTrustedBy;
  let fixture: ComponentFixture<LandingTrustedBy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingTrustedBy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingTrustedBy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
