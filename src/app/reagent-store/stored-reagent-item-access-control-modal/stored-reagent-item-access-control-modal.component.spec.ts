import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentItemAccessControlModalComponent } from './stored-reagent-item-access-control-modal.component';

describe('StoredReagentItemAccessControlModalComponent', () => {
  let component: StoredReagentItemAccessControlModalComponent;
  let fixture: ComponentFixture<StoredReagentItemAccessControlModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentItemAccessControlModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoredReagentItemAccessControlModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
