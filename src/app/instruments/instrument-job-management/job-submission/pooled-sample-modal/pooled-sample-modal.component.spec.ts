import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PooledSampleModalComponent } from './pooled-sample-modal.component';

describe('PooledSampleModalComponent', () => {
  let component: PooledSampleModalComponent;
  let fixture: ComponentFixture<PooledSampleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PooledSampleModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PooledSampleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});