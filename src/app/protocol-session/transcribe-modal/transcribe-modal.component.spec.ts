import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscribeModalComponent } from './transcribe-modal.component';

describe('TranscribeModalComponent', () => {
  let component: TranscribeModalComponent;
  let fixture: ComponentFixture<TranscribeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscribeModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TranscribeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
