import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MethodMetadataModalComponent } from './method-metadata-modal.component';

describe('MethodMetadataModalComponent', () => {
  let component: MethodMetadataModalComponent;
  let fixture: ComponentFixture<MethodMetadataModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MethodMetadataModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MethodMetadataModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
