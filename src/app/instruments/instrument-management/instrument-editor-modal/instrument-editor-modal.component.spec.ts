import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentEditorModalComponent } from './instrument-editor-modal.component';

describe('InstrumentEditorModalComponent', () => {
  let component: InstrumentEditorModalComponent;
  let fixture: ComponentFixture<InstrumentEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentEditorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
