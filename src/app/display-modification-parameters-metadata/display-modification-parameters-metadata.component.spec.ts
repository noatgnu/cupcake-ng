import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayModificationParametersMetadataComponent } from './display-modification-parameters-metadata.component';

describe('DisplayModificationParametersMetadataComponent', () => {
  let component: DisplayModificationParametersMetadataComponent;
  let fixture: ComponentFixture<DisplayModificationParametersMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayModificationParametersMetadataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayModificationParametersMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
