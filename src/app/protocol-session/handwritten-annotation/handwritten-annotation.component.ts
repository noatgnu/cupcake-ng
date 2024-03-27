import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
// @ts-ignore
import {MODE_DRAW, MODE_ERASE} from 'atrament';
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
  _data: any[] = [];
  @Input() set data(value: any[]) {
    this._data = value;
    this.strokes = value
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
      width: 400*window.devicePixelRatio,
      height: 800*window.devicePixelRatio,
    });

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
    this.sketch.emit(this.strokes);
  }
}
