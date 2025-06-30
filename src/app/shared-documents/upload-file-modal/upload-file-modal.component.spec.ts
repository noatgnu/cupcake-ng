import { ComponentFixture, TestBed } from '@angular/core';

import { UploadFileModalComponent } from './upload-file-modal.component';

describe('UploadFileModalComponent', () => {
  let component: UploadFileModalComponent;
  let fixture: ComponentFixture<UploadFileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadFileModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadFileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});