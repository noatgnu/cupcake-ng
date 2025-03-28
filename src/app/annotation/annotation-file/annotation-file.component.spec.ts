import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationFileComponent } from './annotation-file.component';

describe('AnnotationFileComponent', () => {
  let component: AnnotationFileComponent;
  let fixture: ComponentFixture<AnnotationFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
