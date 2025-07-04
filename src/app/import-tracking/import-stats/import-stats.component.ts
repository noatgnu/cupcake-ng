import { Component, Input } from '@angular/core';
import { ImportStats } from '../../import-tracking';
import {DecimalPipe, NgClass} from "@angular/common";

@Component({
  selector: 'app-import-stats',
  templateUrl: './import-stats.component.html',
  imports: [
    NgClass,
    DecimalPipe
  ],
  styleUrls: ['./import-stats.component.scss']
})
export class ImportStatsComponent {
  @Input() stats: ImportStats | null = null;

  constructor() { }

  getSuccessRateColor(): string {
    if (!this.stats) return 'text-secondary';

    if (this.stats.success_rate >= 90) return 'text-success';
    if (this.stats.success_rate >= 70) return 'text-warning';
    return 'text-danger';
  }

  getProgressBarClass(): string {
    if (!this.stats) return 'bg-secondary';

    if (this.stats.success_rate >= 90) return 'bg-success';
    if (this.stats.success_rate >= 70) return 'bg-warning';
    return 'bg-danger';
  }
}
