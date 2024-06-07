import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageObjectEditorModalComponent } from './storage-object-editor-modal.component';

describe('OpenStorageObjectEditorModalComponent', () => {
  let component: StorageObjectEditorModalComponent;
  let fixture: ComponentFixture<StorageObjectEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageObjectEditorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageObjectEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
