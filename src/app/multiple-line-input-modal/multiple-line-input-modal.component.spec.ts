import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleLineInputModalComponent } from './multiple-line-input-modal.component';

describe('MultipleLineInputModalComponent', () => {
  let component: MultipleLineInputModalComponent;
  let fixture: ComponentFixture<MultipleLineInputModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleLineInputModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleLineInputModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
