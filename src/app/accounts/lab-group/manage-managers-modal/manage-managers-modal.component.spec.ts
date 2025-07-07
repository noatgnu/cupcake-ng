import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageManagersModalComponent } from './manage-managers-modal.component';

describe('ManageManagersModalComponent', () => {
  let component: ManageManagersModalComponent;
  let fixture: ComponentFixture<ManageManagersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageManagersModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageManagersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});