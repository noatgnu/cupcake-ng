import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationRenameModalComponent } from './annotation-rename-modal.component';

describe('AnnotationRenameModalComponent', () => {
  let component: AnnotationRenameModalComponent;
  let fixture: ComponentFixture<AnnotationRenameModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationRenameModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnnotationRenameModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
