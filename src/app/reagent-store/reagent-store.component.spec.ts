import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReagentStoreComponent } from './reagent-store.component';

describe('ReagentStoreComponent', () => {
  let component: ReagentStoreComponent;
  let fixture: ComponentFixture<ReagentStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReagentStoreComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReagentStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
