import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillRadar } from './skill-radar';

describe('SkillRadar', () => {
  let component: SkillRadar;
  let fixture: ComponentFixture<SkillRadar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillRadar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillRadar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
