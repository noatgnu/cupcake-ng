import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextScriptEditorModalComponent } from './text-script-editor-modal.component';

describe('TextScsriptEditorModalComponent', () => {
  let component: TextScriptEditorModalComponent;
  let fixture: ComponentFixture<TextScriptEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextScriptEditorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextScriptEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
