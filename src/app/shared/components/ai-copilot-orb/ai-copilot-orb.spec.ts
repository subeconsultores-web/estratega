import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiCopilotOrb } from './ai-copilot-orb';

describe('AiCopilotOrb', () => {
  let component: AiCopilotOrb;
  let fixture: ComponentFixture<AiCopilotOrb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiCopilotOrb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiCopilotOrb);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
