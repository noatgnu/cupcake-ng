import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLabGroupModalComponent } from './edit-lab-group-modal.component';

describe('EditLabGroupModalComponent', () => {
  let component: EditLabGroupModalComponent;
  let fixture: ComponentFixture<EditLabGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLabGroupModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditLabGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
