import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationMetadataModalComponent } from './annotation-metadata-modal.component';

describe('AnnotationMetadataModalComponent', () => {
  let component: AnnotationMetadataModalComponent;
  let fixture: ComponentFixture<AnnotationMetadataModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationMetadataModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationMetadataModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
