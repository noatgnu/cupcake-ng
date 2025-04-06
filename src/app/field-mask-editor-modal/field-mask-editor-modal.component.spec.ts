import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldMaskEditorModalComponent } from './field-mask-editor-modal.component';

describe('FieldMaskEditorModalComponent', () => {
  let component: FieldMaskEditorModalComponent;
  let fixture: ComponentFixture<FieldMaskEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldMaskEditorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldMaskEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
