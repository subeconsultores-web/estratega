import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChurnRadar } from './churn-radar';

describe('ChurnRadar', () => {
  let component: ChurnRadar;
  let fixture: ComponentFixture<ChurnRadar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChurnRadar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChurnRadar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
