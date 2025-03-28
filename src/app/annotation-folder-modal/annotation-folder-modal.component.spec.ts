import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationFolderModalComponent } from './annotation-folder-modal.component';

describe('AnnotationFolderModalComponent', () => {
  let component: AnnotationFolderModalComponent;
  let fixture: ComponentFixture<AnnotationFolderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationFolderModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationFolderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
