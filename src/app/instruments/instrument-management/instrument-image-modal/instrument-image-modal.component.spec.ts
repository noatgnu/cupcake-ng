import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentImageModalComponent } from './instrument-image-modal.component';

describe('InstrumentImageModalComponent', () => {
  let component: InstrumentImageModalComponent;
  let fixture: ComponentFixture<InstrumentImageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentImageModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentImageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
