import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlapTextComponent } from './flap-text.component';

describe('FlapTextComponent', () => {
  let component: FlapTextComponent;
  let fixture: ComponentFixture<FlapTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlapTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlapTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
