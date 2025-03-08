import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFavouriteModalComponent } from './add-favourite-modal.component';

describe('AddFavouriteModalComponent', () => {
  let component: AddFavouriteModalComponent;
  let fixture: ComponentFixture<AddFavouriteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFavouriteModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFavouriteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
