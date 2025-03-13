import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobTemplateManagementComponent } from './job-template-management.component';

describe('JobTemplateManagementComponent', () => {
  let component: JobTemplateManagementComponent;
  let fixture: ComponentFixture<JobTemplateManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobTemplateManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobTemplateManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
