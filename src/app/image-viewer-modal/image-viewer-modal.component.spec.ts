import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageViewerModalComponent } from './image-viewer-modal.component';

describe('ImageViewerModalComponent', () => {
  let component: ImageViewerModalComponent;
  let fixture: ComponentFixture<ImageViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageViewerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
