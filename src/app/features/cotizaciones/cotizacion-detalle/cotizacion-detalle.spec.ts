import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CotizacionDetalle } from './cotizacion-detalle';

describe('CotizacionDetalle', () => {
  let component: CotizacionDetalle;
  let fixture: ComponentFixture<CotizacionDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CotizacionDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CotizacionDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
