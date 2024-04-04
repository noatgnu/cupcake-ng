import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChecklistPresenterComponent } from './checklist-presenter.component';

describe('ChecklistPresenterComponent', () => {
  let component: ChecklistPresenterComponent;
  let fixture: ComponentFixture<ChecklistPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChecklistPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChecklistPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
