import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolCloneModalComponent } from './protocol-clone-modal.component';

describe('ProtocolCloneModalComponent', () => {
  let component: ProtocolCloneModalComponent;
  let fixture: ComponentFixture<ProtocolCloneModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtocolCloneModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProtocolCloneModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
