import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreMetadataComponent } from './explore-metadata.component';

describe('ExploreMetadataComponent', () => {
  let component: ExploreMetadataComponent;
  let fixture: ComponentFixture<ExploreMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreMetadataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
