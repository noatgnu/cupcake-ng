import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-runtime-splash',
  templateUrl: './runtime-splash.component.html',
  styleUrls: ['./runtime-splash.component.scss'],
  imports: [NgClass, TitleCasePipe],
  standalone: true
})
export class RuntimeSplashComponent implements OnInit {
  @Input() theme: string = 'default';
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    // Auto-focus for keyboard events
    if (this.visible) {
      setTimeout(() => {
        const element = document.querySelector('.runtime-splash-overlay') as HTMLElement;
        if (element) {
          element.focus();
        }
      }, 100);
    }
  }

  onClose() {
    this.close.emit();
  }

  onKeydown(event: KeyboardEvent) {
    // Close on Escape key
    if (event.key === 'Escape') {
      this.onClose();
    }
    // Close on Ctrl+Alt+S
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.onClose();
    }
  }
}