import {AfterViewInit, Component, ElementRef, Input, QueryList, ViewChildren} from '@angular/core';

@Component({
  selector: 'app-flap-text',
  imports: [],
  templateUrl: './flap-text.component.html',
  styleUrl: './flap-text.component.scss'
})
export class FlapTextComponent implements AfterViewInit {
  @Input() text = '';
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+[]{}|;:,.<>? ';
  @ViewChildren('charSpan') charSpan!: QueryList<ElementRef>;

  ngAfterViewInit() {
    this.charSpan.forEach((elRef, i) => {
      const span = elRef.nativeElement;
      let index = 0;
      const target = this.text[i];

      const interval = setInterval(() => {
        const currentChar = this.characters[index % this.characters.length];
        span.textContent = currentChar;

        if (currentChar === target) {
          clearInterval(interval);
        } else {
          index++;
        }
      }, 1 + i * 10);
    });
  }
}
