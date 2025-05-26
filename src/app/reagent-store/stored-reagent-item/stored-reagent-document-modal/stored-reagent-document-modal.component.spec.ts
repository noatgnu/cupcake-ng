import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentDocumentModalComponent } from './stored-reagent-document-modal.component';

describe('StoredReagentDocumentModalComponent', () => {
  let component: StoredReagentDocumentModalComponent;
  let fixture: ComponentFixture<StoredReagentDocumentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentDocumentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoredReagentDocumentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
