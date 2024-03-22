import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolSessionComponent } from './protocol-session.component';

describe('ProtocolSessionComponent', () => {
  let component: ProtocolSessionComponent;
  let fixture: ComponentFixture<ProtocolSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtocolSessionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProtocolSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
