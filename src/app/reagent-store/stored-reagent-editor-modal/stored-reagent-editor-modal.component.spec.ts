import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentEditorModalComponent } from './stored-reagent-editor-modal.component';

describe('StoredReagentEditorModalComponent', () => {
  let component: StoredReagentEditorModalComponent;
  let fixture: ComponentFixture<StoredReagentEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentEditorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoredReagentEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
