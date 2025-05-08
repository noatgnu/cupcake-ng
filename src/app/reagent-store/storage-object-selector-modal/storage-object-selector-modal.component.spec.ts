import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageObjectSelectorModalComponent } from './storage-object-selector-modal.component';

describe('StorageObjectSelectorModalComponent', () => {
  let component: StorageObjectSelectorModalComponent;
  let fixture: ComponentFixture<StorageObjectSelectorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageObjectSelectorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageObjectSelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
