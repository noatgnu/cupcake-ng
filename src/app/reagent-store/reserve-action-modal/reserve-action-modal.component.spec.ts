import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReserveActionModalComponent } from './reserve-action-modal.component';

describe('ReserveActionModalComponent', () => {
  let component: ReserveActionModalComponent;
  let fixture: ComponentFixture<ReserveActionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReserveActionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReserveActionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
