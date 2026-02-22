import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CotizacionForm } from './cotizacion-form';

describe('CotizacionForm', () => {
  let component: CotizacionForm;
  let fixture: ComponentFixture<CotizacionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CotizacionForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CotizacionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
