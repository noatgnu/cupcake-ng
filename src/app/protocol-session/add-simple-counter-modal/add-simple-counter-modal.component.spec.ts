import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSimpleCounterModalComponent } from './add-simple-counter-modal.component';

describe('AddSimpleCounterModalComponent', () => {
  let component: AddSimpleCounterModalComponent;
  let fixture: ComponentFixture<AddSimpleCounterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSimpleCounterModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddSimpleCounterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
