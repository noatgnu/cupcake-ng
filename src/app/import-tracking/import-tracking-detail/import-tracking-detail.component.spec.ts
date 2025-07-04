import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTrackingDetailComponent } from './import-tracking-detail.component';

describe('ImportTrackingDetailComponent', () => {
  let component: ImportTrackingDetailComponent;
  let fixture: ComponentFixture<ImportTrackingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportTrackingDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportTrackingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});