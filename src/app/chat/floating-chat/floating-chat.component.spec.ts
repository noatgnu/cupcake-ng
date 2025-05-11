import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingChatComponent } from './floating-chat.component';

describe('FloatingChatComponent', () => {
  let component: FloatingChatComponent;
  let fixture: ComponentFixture<FloatingChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
