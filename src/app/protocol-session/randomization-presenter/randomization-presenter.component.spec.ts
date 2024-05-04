import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomizationPresenterComponent } from './randomization-presenter.component';

describe('RandomizationPresenterComponent', () => {
  let component: RandomizationPresenterComponent;
  let fixture: ComponentFixture<RandomizationPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomizationPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RandomizationPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
