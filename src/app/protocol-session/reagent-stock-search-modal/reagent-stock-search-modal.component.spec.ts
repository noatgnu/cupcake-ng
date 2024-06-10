import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReagentStockSearchModalComponent } from './reagent-stock-search-modal.component';

describe('ReagentStockSearchModalComponent', () => {
  let component: ReagentStockSearchModalComponent;
  let fixture: ComponentFixture<ReagentStockSearchModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReagentStockSearchModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReagentStockSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
