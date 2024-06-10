import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReagentTableComponent } from './reagent-table.component';

describe('ReagentTableComponent', () => {
  let component: ReagentTableComponent;
  let fixture: ComponentFixture<ReagentTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReagentTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReagentTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
