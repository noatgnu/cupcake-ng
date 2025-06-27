import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ProtocolSection, ProtocolStep} from "../../protocol";
import {TimerService} from "../../timer.service";
import {SiteSettingsService} from "../../site-settings.service";

@Component({
    selector: 'app-section-list',
    imports: [],
    templateUrl: './section-list.component.html',
    styleUrl: './section-list.component.scss'
})
export class SectionListComponent {
  @Input() sections: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}[] = [];
  currentSection: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number} | undefined = undefined;
  @Output() sectionChange: EventEmitter<{data: ProtocolSection, steps: ProtocolStep[], currentStep: number}> = new EventEmitter<{data: ProtocolSection, steps: ProtocolStep[], currentStep: number}>();
  constructor(public timer: TimerService, public siteSettings: SiteSettingsService) {
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }

  handleSectionClick(section: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}) {
    this.currentSection = section;
    this.sectionChange.emit(section);
  }


}
