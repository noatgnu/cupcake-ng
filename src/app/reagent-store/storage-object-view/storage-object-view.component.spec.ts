import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageObjectViewComponent } from './storage-object-view.component';

describe('StorageObjectViewComponent', () => {
  let component: StorageObjectViewComponent;
  let fixture: ComponentFixture<StorageObjectViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageObjectViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StorageObjectViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
