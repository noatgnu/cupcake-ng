import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTrackingListComponent } from './import-tracking-list.component';

describe('ImportTrackingListComponent', () => {
  let component: ImportTrackingListComponent;
  let fixture: ComponentFixture<ImportTrackingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportTrackingListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportTrackingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});