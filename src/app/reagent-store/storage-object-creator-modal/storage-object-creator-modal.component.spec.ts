import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageObjectCreatorModalComponent } from './storage-object-creator-modal.component';

describe('StorageObjectCreatorModalComponent', () => {
  let component: StorageObjectCreatorModalComponent;
  let fixture: ComponentFixture<StorageObjectCreatorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageObjectCreatorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StorageObjectCreatorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
