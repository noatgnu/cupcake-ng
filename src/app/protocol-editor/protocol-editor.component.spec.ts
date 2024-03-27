import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolEditorComponent } from './protocol-editor.component';

describe('ProtocolEditorComponent', () => {
  let component: ProtocolEditorComponent;
  let fixture: ComponentFixture<ProtocolEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtocolEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProtocolEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
