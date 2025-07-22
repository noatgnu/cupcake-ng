import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {FormBuilder, FormsModule} from "@angular/forms";
import {SpeechService} from "../../speech.service";
import {ToastService} from "../../toast.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from '@angular/common';

@Component({
    selector: 'app-counter-presenter',
    imports: [
        NgbDropdown,
        NgbDropdownMenu, 
        NgbDropdownToggle,
        NgbTooltip,
        FormsModule,
        NgClass
    ],
    templateUrl: './counter-presenter.component.html',
    styleUrl: './counter-presenter.component.scss'
})
export class CounterPresenterComponent {
  _annotation?: Annotation

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.data = JSON.parse(value.annotation)
    this.initializeEnhancedData()
    console.log(this.data)
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>()
  data: {name: string, total: number, current: number} = {name: "", total: 0, current: 0}

  // Enhanced properties
  customIncrement: number = 1;
  editMode: boolean = false;
  editingCurrent: number = 0;
  editingTarget: number = 0;
  quickIncrements: number[] = [1, 5, 10, 25, 50];
  sessionChanges: number = 0;
  lastChanged: Date = new Date();
  minValue: number = 0;
  maxValue: number = 9999;
  
  // Make Math available in template
  Math = Math;

  private _commandTranscript = ""
  speechRecognition: any;
  @Input() set commandTranscript(value: string) {
    this._commandTranscript = value.toLowerCase()
    console.log(this._commandTranscript.slice())

    this.processVoiceCommand(this._commandTranscript);
  }



  constructor(private web: WebService, private fb: FormBuilder, public speech: SpeechService, private toastService: ToastService) {
    this.speech.transcriptSubject.subscribe((transcript) => {
      if (this.annotation.id === this.speech.currentAnnotation) {
        this.toastService.show("Voice Command", transcript, 1000)
        this.commandTranscript = transcript
      }
    })
  }
  
  private initializeEnhancedData(): void {
    this.editingCurrent = this.data.current;
    this.editingTarget = this.data.total;
    this.lastChanged = new Date();
    this.sessionChanges = 0;
  }

  updateAnnotation() {
    this.sessionChanges++;
    this.lastChanged = new Date();
    this.web.updateAnnotation(JSON.stringify(this.data), "counter", this.annotation.id).subscribe((data) => {
      this._annotation = data;
      this.change.emit(data)
    })
  }

  // Enhanced voice command processing
  private processVoiceCommand(command: string): void {
    const cmd = command.toLowerCase();
    
    // Parse numeric values from command
    const numbers = cmd.match(/\d+/g);
    const value = numbers ? parseInt(numbers[0]) : 1;
    
    if (cmd.includes("increas") || cmd.includes("add") || cmd.includes("plus")) {
      this.adjustCounter(value);
      this.toastService.show("Voice Command", `Increased by ${value}`, 1500);
    } else if (cmd.includes("decreas") || cmd.includes("subtract") || cmd.includes("minus")) {
      this.adjustCounter(-value);
      this.toastService.show("Voice Command", `Decreased by ${value}`, 1500);
    } else if (cmd.includes("set to") || cmd.includes("make it")) {
      if (numbers) {
        this.setDirectValue(value);
        this.toastService.show("Voice Command", `Set to ${value}`, 1500);
      }
    } else if (cmd.includes("reset") || cmd.includes("zero")) {
      this.resetCounter();
      this.toastService.show("Voice Command", "Reset to 0", 1500);
    } else if (cmd.includes("target") || cmd.includes("complete")) {
      this.setToTarget();
      this.toastService.show("Voice Command", "Set to target", 1500);
    }
  }

  // Counter operations
  incrementCounter(): void {
    if (this.canIncrement()) {
      this.adjustCounter(this.customIncrement);
    }
  }

  decrementCounter(): void {
    if (this.canDecrement()) {
      this.adjustCounter(-this.customIncrement);
    }
  }

  adjustCounter(amount: number): void {
    const newValue = this.data.current + amount;
    if (newValue >= this.minValue && newValue <= this.maxValue) {
      this.data.current = newValue;
      this.updateAnnotation();
      
      // Show achievement notifications
      if (this.isCompleted() && amount > 0) {
        this.toastService.show("Achievement!", "Target reached! 🎉", 3000);
      }
    } else {
      this.toastService.show("Limit Reached", `Value must be between ${this.minValue} and ${this.maxValue}`, 2000);
    }
  }

  resetCounter(): void {
    this.data.current = 0;
    this.updateAnnotation();
  }

  setToTarget(): void {
    this.data.current = this.data.total;
    this.updateAnnotation();
  }

  setDirectValue(value: number): void {
    if (value >= this.minValue && value <= this.maxValue) {
      this.data.current = value;
      this.updateAnnotation();
    }
  }

  // Custom increment management
  setCustomIncrement(value: number): void {
    this.customIncrement = Math.max(1, Math.min(100, value));
  }

  incrementCustomIncrement(): void {
    if (this.customIncrement < 100) {
      this.customIncrement++;
    }
  }

  decrementCustomIncrement(): void {
    if (this.customIncrement > 1) {
      this.customIncrement--;
    }
  }

  validateCustomIncrement(): void {
    this.customIncrement = Math.max(1, Math.min(100, this.customIncrement || 1));
  }

  // Edit mode
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.editingCurrent = this.data.current;
      this.editingTarget = this.data.total;
    }
  }

  applyDirectValue(type: 'current' | 'target'): void {
    if (type === 'current') {
      const newValue = Math.max(this.minValue, Math.min(this.maxValue, this.editingCurrent || 0));
      this.data.current = newValue;
      this.editingCurrent = newValue;
    } else {
      const newValue = Math.max(1, this.editingTarget || 1);
      this.data.total = newValue;
      this.editingTarget = newValue;
    }
    this.updateAnnotation();
  }

  // Validation and state checks
  canIncrement(): boolean {
    return this.data.current + this.customIncrement <= this.maxValue;
  }

  canDecrement(): boolean {
    return this.data.current - this.customIncrement >= this.minValue;
  }

  isCompleted(): boolean {
    return this.data.current >= this.data.total;
  }

  isOverTarget(): boolean {
    return this.data.current > this.data.total;
  }

  getProgressPercentage(): number {
    if (this.data.total === 0) return 0;
    return Math.round((this.data.current / this.data.total) * 100);
  }

  // Statistics and analytics
  getSessionChanges(): number {
    return this.sessionChanges;
  }

  getLastChanged(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.lastChanged.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  getEfficiency(): number {
    if (this.data.total === 0) return 100;
    if (this.sessionChanges === 0) return 100;
    
    // Calculate efficiency based on direct progress vs. total changes
    const directProgress = Math.min(this.data.current, this.data.total);
    const efficiency = Math.round((directProgress / this.sessionChanges) * 100);
    return Math.min(100, Math.max(0, efficiency));
  }

}
