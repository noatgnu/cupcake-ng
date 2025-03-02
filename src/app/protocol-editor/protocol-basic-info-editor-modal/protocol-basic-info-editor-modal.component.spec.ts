import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolBasicInfoEditorModalComponent } from './protocol-basic-info-editor-modal.component';

describe('ProtocolBasicInfoEditorModalComponent', () => {
  let component: ProtocolBasicInfoEditorModalComponent;
  let fixture: ComponentFixture<ProtocolBasicInfoEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtocolBasicInfoEditorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtocolBasicInfoEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
