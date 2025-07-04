import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportStatsComponent } from './import-stats.component';

describe('ImportStatsComponent', () => {
  let component: ImportStatsComponent;
  let fixture: ComponentFixture<ImportStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportStatsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});