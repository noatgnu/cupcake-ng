import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePresenterComponent } from './table-presenter.component';

describe('TablePresenterComponent', () => {
  let component: TablePresenterComponent;
  let fixture: ComponentFixture<TablePresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablePresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
