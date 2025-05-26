import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicJobInfoComponent } from './basic-job-info.component';

describe('BasicJobInfoComponent', () => {
  let component: BasicJobInfoComponent;
  let fixture: ComponentFixture<BasicJobInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicJobInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicJobInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
