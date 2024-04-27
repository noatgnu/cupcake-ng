import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserViewerModalComponent } from './user-viewer-modal.component';

describe('UserViewerModalComponent', () => {
  let component: UserViewerModalComponent;
  let fixture: ComponentFixture<UserViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserViewerModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
