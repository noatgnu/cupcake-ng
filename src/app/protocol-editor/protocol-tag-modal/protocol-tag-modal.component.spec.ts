import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolTagModalComponent } from './protocol-tag-modal.component';

describe('ProtocolTagModalComponent', () => {
  let component: ProtocolTagModalComponent;
  let fixture: ComponentFixture<ProtocolTagModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtocolTagModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProtocolTagModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
