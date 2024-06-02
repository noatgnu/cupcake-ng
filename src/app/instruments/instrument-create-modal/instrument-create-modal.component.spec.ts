import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentCreateModalComponent } from './instrument-create-modal.component';

describe('InstrumentCreateModalComponent', () => {
  let component: InstrumentCreateModalComponent;
  let fixture: ComponentFixture<InstrumentCreateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentCreateModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstrumentCreateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
