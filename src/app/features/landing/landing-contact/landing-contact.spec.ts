import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingContact } from './landing-contact';

describe('LandingContact', () => {
  let component: LandingContact;
  let fixture: ComponentFixture<LandingContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
