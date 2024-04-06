import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebrtcModalComponent } from './webrtc-modal.component';

describe('WebrtcModalComponent', () => {
  let component: WebrtcModalComponent;
  let fixture: ComponentFixture<WebrtcModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebrtcModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WebrtcModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
