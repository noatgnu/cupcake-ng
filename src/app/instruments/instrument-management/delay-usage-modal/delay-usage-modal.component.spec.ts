import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayUsageModalComponent } from './delay-usage-modal.component';

describe('DelayUsageModalComponent', () => {
  let component: DelayUsageModalComponent;
  let fixture: ComponentFixture<DelayUsageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DelayUsageModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelayUsageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
