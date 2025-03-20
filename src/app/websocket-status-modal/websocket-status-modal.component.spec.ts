import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsocketStatusModalComponent } from './websocket-status-modal.component';

describe('WebsocketStatusModalComponent', () => {
  let component: WebsocketStatusModalComponent;
  let fixture: ComponentFixture<WebsocketStatusModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsocketStatusModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebsocketStatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
