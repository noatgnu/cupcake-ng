import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobAnnotationsComponent } from './job-annotations.component';

describe('JobAnnotationsComponent', () => {
  let component: JobAnnotationsComponent;
  let fixture: ComponentFixture<JobAnnotationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobAnnotationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobAnnotationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
