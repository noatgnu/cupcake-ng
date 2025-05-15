import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentSubscriptionModalComponent } from './stored-reagent-subscription-modal.component';

describe('StoredReagentSubscriptionModalComponent', () => {
  let component: StoredReagentSubscriptionModalComponent;
  let fixture: ComponentFixture<StoredReagentSubscriptionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentSubscriptionModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoredReagentSubscriptionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
