import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabUserCreationModalComponent } from './lab-user-creation-modal.component';

describe('LabUserCreationModalComponent', () => {
  let component: LabUserCreationModalComponent;
  let fixture: ComponentFixture<LabUserCreationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabUserCreationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabUserCreationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
