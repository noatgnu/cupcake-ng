import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTrackingSummaryComponent } from './import-tracking-summary.component';

describe('ImportTrackingSummaryComponent', () => {
  let component: ImportTrackingSummaryComponent;
  let fixture: ComponentFixture<ImportTrackingSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportTrackingSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportTrackingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});