import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReagentImportFileFormatInstructionsComponent } from './reagent-import-file-format-instructions.component';

describe('ReagentImportFileFormatInstructionsComponent', () => {
  let component: ReagentImportFileFormatInstructionsComponent;
  let fixture: ComponentFixture<ReagentImportFileFormatInstructionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReagentImportFileFormatInstructionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReagentImportFileFormatInstructionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
