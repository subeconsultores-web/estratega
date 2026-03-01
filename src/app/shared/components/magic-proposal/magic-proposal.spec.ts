import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagicProposal } from './magic-proposal';

describe('MagicProposal', () => {
  let component: MagicProposal;
  let fixture: ComponentFixture<MagicProposal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagicProposal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MagicProposal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
