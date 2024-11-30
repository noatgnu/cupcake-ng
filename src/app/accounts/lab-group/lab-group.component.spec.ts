import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabGroupComponent } from './lab-group.component';

describe('LabGroupComponent', () => {
  let component: LabGroupComponent;
  let fixture: ComponentFixture<LabGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
