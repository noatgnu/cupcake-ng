import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataNotificationModalComponent } from './metadata-notification-modal.component';

describe('MetadataNotificationModalComponent', () => {
  let component: MetadataNotificationModalComponent;
  let fixture: ComponentFixture<MetadataNotificationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataNotificationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataNotificationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
