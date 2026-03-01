import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProofOfCompetenceReplay } from './proof-of-competence-replay';

describe('ProofOfCompetenceReplay', () => {
  let component: ProofOfCompetenceReplay;
  let fixture: ComponentFixture<ProofOfCompetenceReplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProofOfCompetenceReplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProofOfCompetenceReplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
