import {Component, Input, ElementRef, ViewChild} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {AsyncPipe, NgClass, DatePipe} from "@angular/common";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";

interface Measurement {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  midX: number;
  midY: number;
  distance: number;
}

@Component({
    selector: 'app-image-presenter',
    imports: [
        AsyncPipe,
        NgbTooltip,
        NgClass,
        DatePipe
    ],
    templateUrl: './image-presenter.component.html',
    styleUrl: './image-presenter.component.scss'
})
export class ImagePresenterComponent {
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;
  
  _annotation?: Annotation;
  image: string = '';
  imageError: boolean = false;
  
  // Image properties
  imageWidth: number = 0;
  imageHeight: number = 0;
  
  // Zoom and pan properties
  zoomLevel: number = 1;
  minZoom: number = 0.1;
  maxZoom: number = 5;
  rotation: number = 0;
  panX: number = 0;
  panY: number = 0;
  
  // Interaction state
  isDragging: boolean = false;
  isFullscreen: boolean = false;
  measurementMode: boolean = false;
  
  // Mouse tracking for drag and measurement
  lastMouseX: number = 0;
  lastMouseY: number = 0;
  currentMeasurement: Partial<Measurement> | null = null;
  measurements: Measurement[] = [];
  
  // Make Math available in template
  Math = Math;

  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    if (value.file) {
      this.loadImage();
    }
  }
  
  private loadImage(): void {
    this.image = ''; // Clear previous image
    this.imageError = false; // Reset error state
    
    console.log('Loading image for annotation:', this._annotation?.id);
    
    this.web.getSignedURL(this._annotation!.id).subscribe({
      next: (token: any) => {
        const imageUrl = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`;
        console.log('Generated signed URL:', imageUrl);
        this.image = imageUrl;
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.image = ''; // Set empty string on error
        this.imageError = true; // Set error state
      }
    });
  }

  get annotation(): Annotation {
    return this._annotation!;
  }

  constructor(private web: WebService) {}

  // Image loading
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.imageWidth = img.naturalWidth;
    this.imageHeight = img.naturalHeight;
    console.log('Image loaded successfully:', img.src, `${this.imageWidth}x${this.imageHeight}`);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.error('Failed to load image:', img.src);
    this.image = ''; // Clear the image on error
    this.imageError = true; // Set error state
  }

  retryImageLoad(): void {
    if (this._annotation?.file) {
      this.loadImage();
    }
  }

  // Zoom controls
  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, this.maxZoom);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, this.minZoom);
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.rotation = 0;
  }

  // Rotation controls
  rotateLeft(): void {
    this.rotation -= 90;
  }

  rotateRight(): void {
    this.rotation += 90;
  }

  // Transform calculation
  getImageTransform(): string {
    return `scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px) rotate(${this.rotation}deg)`;
  }

  // Mouse wheel zoom
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel * delta));
  }

  // Mouse interaction for pan and measurement
  onMouseDown(event: MouseEvent): void {
    if (this.measurementMode) {
      this.startMeasurement(event);
    } else {
      this.isDragging = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.measurementMode && this.currentMeasurement) {
      this.updateMeasurement(event);
    } else if (this.isDragging) {
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;
      this.panX += deltaX / this.zoomLevel;
      this.panY += deltaY / this.zoomLevel;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (this.measurementMode && this.currentMeasurement) {
      this.finishMeasurement(event);
    } else {
      this.isDragging = false;
    }
  }

  onMouseLeave(): void {
    this.isDragging = false;
    if (this.measurementMode && this.currentMeasurement) {
      this.currentMeasurement = null;
    }
  }

  // Measurement functionality
  toggleMeasurementMode(): void {
    this.measurementMode = !this.measurementMode;
    if (!this.measurementMode) {
      this.currentMeasurement = null;
    }
  }

  startMeasurement(event: MouseEvent): void {
    const rect = this.imageElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.currentMeasurement = {
      id: Date.now().toString(),
      startX: x,
      startY: y,
      endX: x,
      endY: y
    };
  }

  updateMeasurement(event: MouseEvent): void {
    if (!this.currentMeasurement) return;
    
    const rect = this.imageElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.currentMeasurement.endX = x;
    this.currentMeasurement.endY = y;
  }

  finishMeasurement(event: MouseEvent): void {
    if (!this.currentMeasurement) return;
    
    const measurement = this.currentMeasurement as Measurement;
    measurement.midX = (measurement.startX + measurement.endX) / 2;
    measurement.midY = (measurement.startY + measurement.endY) / 2;
    measurement.distance = Math.sqrt(
      Math.pow(measurement.endX - measurement.startX, 2) + 
      Math.pow(measurement.endY - measurement.startY, 2)
    );
    
    this.measurements.push(measurement);
    this.currentMeasurement = null;
  }

  clearMeasurements(): void {
    this.measurements = [];
  }

  // Fullscreen functionality
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  private enterFullscreen(): void {
    const container = this.imageContainer.nativeElement;
    if (container.requestFullscreen) {
      container.requestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  // Utility functions
  getFileSize(): string {
    // This would need to be passed from the annotation metadata
    // For now, return placeholder
    return 'Unknown size';
  }
}
