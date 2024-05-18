import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadLargeFileModalComponent } from './upload-large-file-modal.component';

describe('UploadLargeFileModalComponent', () => {
  let component: UploadLargeFileModalComponent;
  let fixture: ComponentFixture<UploadLargeFileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadLargeFileModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadLargeFileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
