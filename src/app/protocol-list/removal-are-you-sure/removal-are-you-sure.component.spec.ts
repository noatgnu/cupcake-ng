import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemovalAreYouSureComponent } from './removal-are-you-sure.component';

describe('RemovalAreYouSureComponent', () => {
  let component: RemovalAreYouSureComponent;
  let fixture: ComponentFixture<RemovalAreYouSureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemovalAreYouSureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RemovalAreYouSureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
