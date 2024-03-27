import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagePresenterComponent } from './image-presenter.component';

describe('ImagePresenterComponent', () => {
  let component: ImagePresenterComponent;
  let fixture: ComponentFixture<ImagePresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImagePresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
