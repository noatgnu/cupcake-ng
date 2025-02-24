import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageObjectAccessControlModalComponent } from './storage-object-access-control-modal.component';

describe('StorageObjectAccessControlModalComponent', () => {
  let component: StorageObjectAccessControlModalComponent;
  let fixture: ComponentFixture<StorageObjectAccessControlModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageObjectAccessControlModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageObjectAccessControlModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
