import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SostenibilidadValidator } from './sostenibilidad-validator';

describe('SostenibilidadValidator', () => {
  let component: SostenibilidadValidator;
  let fixture: ComponentFixture<SostenibilidadValidator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SostenibilidadValidator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SostenibilidadValidator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
