import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRemoveUserFromGroupModalComponent } from './add-remove-user-from-group-modal.component';

describe('AddRemoveUserFromGroupModalComponent', () => {
  let component: AddRemoveUserFromGroupModalComponent;
  let fixture: ComponentFixture<AddRemoveUserFromGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRemoveUserFromGroupModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRemoveUserFromGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
