import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineKanban } from './pipeline-kanban';

describe('PipelineKanban', () => {
  let component: PipelineKanban;
  let fixture: ComponentFixture<PipelineKanban>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipelineKanban]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PipelineKanban);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
