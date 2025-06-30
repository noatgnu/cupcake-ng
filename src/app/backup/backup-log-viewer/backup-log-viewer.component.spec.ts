import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupLogViewerComponent } from './backup-log-viewer.component';

describe('BackupLogViewerComponent', () => {
  let component: BackupLogViewerComponent;
  let fixture: ComponentFixture<BackupLogViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupLogViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackupLogViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
