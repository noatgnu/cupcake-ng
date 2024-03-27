import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPresenterComponent } from './media-presenter.component';

describe('MediaPresenterComponent', () => {
  let component: MediaPresenterComponent;
  let fixture: ComponentFixture<MediaPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
