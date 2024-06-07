import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentItemComponent } from './stored-reagent-item.component';

describe('StoredReagentItemComponent', () => {
  let component: StoredReagentItemComponent;
  let fixture: ComponentFixture<StoredReagentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoredReagentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
