import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlignmentSegmentComponent } from './alignment-segment.component';

describe('AlignmentSegmentComponent', () => {
  let component: AlignmentSegmentComponent;
  let fixture: ComponentFixture<AlignmentSegmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlignmentSegmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlignmentSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
