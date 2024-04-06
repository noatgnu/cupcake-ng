import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebrtcVideoComponent } from './webrtc-video.component';

describe('WebrtcVideoComponent', () => {
  let component: WebrtcVideoComponent;
  let fixture: ComponentFixture<WebrtcVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebrtcVideoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WebrtcVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
