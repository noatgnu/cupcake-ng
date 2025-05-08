import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionExportModalComponent } from './action-export-modal.component';

describe('ActionExportModalComponent', () => {
  let component: ActionExportModalComponent;
  let fixture: ComponentFixture<ActionExportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionExportModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionExportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
