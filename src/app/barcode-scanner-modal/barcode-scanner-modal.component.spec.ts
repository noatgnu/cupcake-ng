import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarcodeScannerModalComponent } from './barcode-scanner-modal.component';

describe('QrScannerModalComponent', () => {
  let component: BarcodeScannerModalComponent;
  let fixture: ComponentFixture<BarcodeScannerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodeScannerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarcodeScannerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
