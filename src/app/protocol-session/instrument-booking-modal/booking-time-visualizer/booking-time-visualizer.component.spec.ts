import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingTimeVisualizerComponent } from './booking-time-visualizer.component';

describe('BookingTimeVisualizerComponent', () => {
  let component: BookingTimeVisualizerComponent;
  let fixture: ComponentFixture<BookingTimeVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingTimeVisualizerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingTimeVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
