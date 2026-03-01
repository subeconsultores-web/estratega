import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataNodeGraph } from './data-node-graph';

describe('DataNodeGraph', () => {
  let component: DataNodeGraph;
  let fixture: ComponentFixture<DataNodeGraph>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataNodeGraph]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataNodeGraph);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
