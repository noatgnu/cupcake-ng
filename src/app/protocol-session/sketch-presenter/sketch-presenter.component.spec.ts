import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SketchPresenterComponent } from './sketch-presenter.component';

describe('SketchPresenterComponent', () => {
  let component: SketchPresenterComponent;
  let fixture: ComponentFixture<SketchPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SketchPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SketchPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
