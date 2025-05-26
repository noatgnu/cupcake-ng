import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleInformationComponent } from './sample-information.component';

describe('SampleInformationComponent', () => {
  let component: SampleInformationComponent;
  let fixture: ComponentFixture<SampleInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleInformationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
