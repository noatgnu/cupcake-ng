import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataPlaygroundComponent } from './metadata-playground.component';

describe('MetadataPlaygroundComponent', () => {
  let component: MetadataPlaygroundComponent;
  let fixture: ComponentFixture<MetadataPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataPlaygroundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
