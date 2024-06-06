import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentCreatorModalComponent } from './stored-reagent-creator-modal.component';

describe('StoredReagentCreatorModalComponent', () => {
  let component: StoredReagentCreatorModalComponent;
  let fixture: ComponentFixture<StoredReagentCreatorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentCreatorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoredReagentCreatorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
