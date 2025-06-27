import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratoryNotebookComponent } from './laboratory-notebook.component';

describe('LaboratoryNotebookComponent', () => {
  let component: LaboratoryNotebookComponent;
  let fixture: ComponentFixture<LaboratoryNotebookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaboratoryNotebookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaboratoryNotebookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
