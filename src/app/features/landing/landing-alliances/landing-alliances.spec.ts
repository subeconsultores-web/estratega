import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingAlliances } from './landing-alliances';

describe('LandingAlliances', () => {
  let component: LandingAlliances;
  let fixture: ComponentFixture<LandingAlliances>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingAlliances]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingAlliances);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
