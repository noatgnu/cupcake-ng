import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemMetadataComponent } from './item-metadata.component';

describe('ItemMetadataComponent', () => {
  let component: ItemMetadataComponent;
  let fixture: ComponentFixture<ItemMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemMetadataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
