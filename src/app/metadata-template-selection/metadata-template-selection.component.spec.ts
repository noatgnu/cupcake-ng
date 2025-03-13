import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTemplateSelectionComponent } from './metadata-template-selection.component';

describe('MetadataTemplateSelectionComponent', () => {
  let component: MetadataTemplateSelectionComponent;
  let fixture: ComponentFixture<MetadataTemplateSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTemplateSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTemplateSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
