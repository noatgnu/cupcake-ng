import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
// @ts-ignore
import {MODE_DRAW, MODE_ERASE, MODE_DISABLED} from 'atrament';
// @ts-ignore
import Atrament from 'atrament';
@Component({
  selector: 'app-handwritten-annotation',
  standalone: true,
  imports: [],
  templateUrl: './handwritten-annotation.component.html',
  styleUrl: './handwritten-annotation.component.scss'
})
export class HandwrittenAnnotationComponent implements AfterViewInit{
  @ViewChild('sketchpad') handwrittenSketchpad?: ElementRef;
  canvas: any;
  _data: any = {width: 300, height: 400, strokes: []};
  @Input() width: number = 300;
  @Input() height: number = 400;
  @Input() disabled: boolean = false;
  @Input() set data(value: any) {
    this._data = value;
    if (value.width) {
      this.width = value.width;
    }
    if (value.height) {
      this.height = value.height;
    }
    if (value.strokes) {
      this.strokes = value.strokes;
    } else {
      this.strokes = value
    }
  }

  get data() {
    return this._data;
  }
  strokes: any[] = [];
  currentMode: string = 'draw';
  @Output() sketch: EventEmitter<any> = new EventEmitter<any>();
  ngAfterViewInit() {
    if (this.data.length > 0) {
      this.initialize();
      this.canvas["#dirty"] = true;
      const segs = this.strokes.slice(0, this.strokes.length);
      this.strokes = [];
      for (const seg of segs) {

        const segments = seg.segments.slice()
        this.canvas.adaptiveStroke = seg.adaptiveStroke;
        this.canvas.color = seg.color;
        this.canvas.weight = seg.weight;
        this.canvas.smoothing = seg.smoothing;
        if (!seg.mode) {
          this.canvas.mode = MODE_DRAW;
        } else {
          if (seg.mode === MODE_DRAW) {
            this.canvas.mode = MODE_DRAW;
          } else {
            this.canvas.mode = MODE_ERASE;
          }
        }
        const firstPoint = segments.shift().point;
        const prevPoint = firstPoint;
        this.canvas.beginStroke(firstPoint.x, firstPoint.y);
        while (segments.length > 0) {
          const point = segments.shift().point;
          const {x, y} = this.canvas.draw(point.x, point.y, prevPoint.x, prevPoint.y)
          prevPoint.x = x;
          prevPoint.y = y;
        }
        this.canvas.endStroke(prevPoint.x, prevPoint.y);
      }
      console.log(this.strokes)

    } else {
      this.initialize();
    }
    if (this.disabled) {
      this.canvas.mode = MODE_DISABLED;
    }

    console.log(this.canvas);
  }

  clear() {
    this.canvas.clear();
    this.strokes = [];
  }

  changeMode(mode: string) {
    this.currentMode = mode;
    switch (mode) {
      case 'draw':
        this.canvas.mode = MODE_DRAW;
        break;
      case 'erase':
        this.canvas.mode = MODE_ERASE;
        break;
    }
  }

  changeSize(size: number) {
    this.canvas.weight = size;
  }

  downloadImage() {
    const dataUrl = this.handwrittenSketchpad?.nativeElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  undo() {
    this.canvas.destroy();
    this.initialize();

    if (this.strokes.length === 0) {
      return;
    }
    if (this.strokes.length === 1) {
      this.strokes = [];
      return;
    }
    this.canvas["#dirty"] = true;
    const segs = this.strokes.slice(0, this.strokes.length-1);
    this.strokes = [];
    for (const seg of segs) {
      const segments = seg.segments.slice()
      this.canvas.adaptiveStroke = seg.adaptiveStroke;
      this.canvas.color = seg.color;
      this.canvas.weight = seg.weight;
      this.canvas.smoothing = seg.smoothing;
      if (!seg.mode) {
        this.canvas.mode = MODE_DRAW;
      } else {
        if (seg.mode === MODE_DRAW) {
          this.canvas.mode = MODE_DRAW;
        } else {
          this.canvas.mode = MODE_ERASE;
        }
      }
      const firstPoint = segments.shift().point;
      const prevPoint = firstPoint;
      this.canvas.beginStroke(firstPoint.x, firstPoint.y);
      while (segments.length > 0) {
        const point = segments.shift().point;
        const {x, y} = this.canvas.draw(point.x, point.y, prevPoint.x, prevPoint.y)
        prevPoint.x = x;
        prevPoint.y = y;
      }
      this.canvas.endStroke(prevPoint.x, prevPoint.y);
    }
  }

  initialize() {

    this.canvas = new Atrament(this.handwrittenSketchpad?.nativeElement, {
      color: '#000',
      width: this.width,
      height: this.height,
    });
    const scale = window.devicePixelRatio
    //this.canvas.width = Math.floor(this.width * scale);
    //this.canvas.height = Math.floor(this.height * scale);
    this.canvas.canvas.style.width = `${this.width * scale}px`;
    this.canvas.canvas.style.height = `${this.height * scale}px`;

    const context = this.canvas.canvas.getContext('2d');
    console.log(scale)
    context.scale(scale, scale)
    console.log(this.canvas.width, this.canvas.height)
    console.log(this.canvas.canvas.style.width, this.canvas.canvas.style.height)

    this.canvas.recordStrokes = true;
    this.canvas.addEventListener('strokerecorded', (event: any) => {
      this.strokes.push(event.stroke)
      console.log(event.stroke)
    })
    this.changeMode(this.currentMode);
  }

  save() {
    if (this.strokes.length === 0) {
      return;
    }
    this.sketch.emit(
      {
        width: this.width,
        height: this.height,
        strokes: this.strokes
      }
    );
  }
}
