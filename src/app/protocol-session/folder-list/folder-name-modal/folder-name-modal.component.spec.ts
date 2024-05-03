import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderNameModalComponent } from './folder-name-modal.component';

describe('FolderNameModalComponent', () => {
  let component: FolderNameModalComponent;
  let fixture: ComponentFixture<FolderNameModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderNameModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FolderNameModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
