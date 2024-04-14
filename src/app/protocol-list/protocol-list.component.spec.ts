import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolListComponent } from './protocol-list.component';

describe('ProtocolListComponent', () => {
  let component: ProtocolListComponent;
  let fixture: ComponentFixture<ProtocolListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtocolListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProtocolListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
