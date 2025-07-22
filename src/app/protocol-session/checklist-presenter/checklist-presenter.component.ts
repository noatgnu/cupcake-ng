import {Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {Annotation} from "../../annotation";
import {FormBuilder, FormsModule} from "@angular/forms";
import {WebService} from "../../web.service";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from "@angular/common";

interface ChecklistItem {
  checked: boolean;
  content: string;
  id?: string;
  order?: number;
}

@Component({
    selector: 'app-checklist-presenter',
    imports: [
        FormsModule,
        NgbTooltip,
        NgClass
    ],
    templateUrl: './checklist-presenter.component.html',
    styleUrl: './checklist-presenter.component.scss'
})
export class ChecklistPresenterComponent implements AfterViewInit {
  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;
  
  _annotation?: Annotation;
  data: {name: string, checkList: ChecklistItem[]} = {name: "", checkList: []};
  
  // UI state
  sortMode: boolean = false;
  editingIndex: number = -1;
  originalEditContent: string = '';
  draggedItemIndex: number = -1;

  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    this.data = JSON.parse(value.annotation);
    
    // Ensure each item has an ID for tracking
    this.data.checkList = this.data.checkList.map((item, index) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${index}`,
      order: item.order || index
    }));
  }
  
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>();

  get annotation(): Annotation {
    return this._annotation!;
  }

  constructor(private web: WebService, private fb: FormBuilder) {}

  ngAfterViewInit(): void {
    // Focus edit input when editing starts
    if (this.editInput && this.editingIndex >= 0) {
      setTimeout(() => this.editInput.nativeElement.focus(), 0);
    }
  }

  // Progress tracking methods
  getCompletedCount(): number {
    return this.data.checkList.filter(item => item.checked).length;
  }

  getRemainingCount(): number {
    return this.data.checkList.filter(item => !item.checked).length;
  }

  getProgressPercentage(): number {
    if (this.data.checkList.length === 0) return 0;
    return (this.getCompletedCount() / this.data.checkList.length) * 100;
  }

  // Sorting and filtering
  getSortedItems(): ChecklistItem[] {
    // Always maintain original order unless explicitly in sort mode
    return [...this.data.checkList].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Bulk actions
  checkAll(): void {
    this.data.checkList.forEach(item => item.checked = true);
    this.saveChanges();
  }

  uncheckAll(): void {
    this.data.checkList.forEach(item => item.checked = false);
    this.saveChanges();
  }

  areAllChecked(): boolean {
    return this.data.checkList.length > 0 && this.data.checkList.every(item => item.checked);
  }

  areAllUnchecked(): boolean {
    return this.data.checkList.every(item => !item.checked);
  }

  // Item management
  addNewItem(): void {
    const newItem: ChecklistItem = {
      checked: false,
      content: 'New item',
      id: `item-${Date.now()}`,
      order: this.data.checkList.length
    };
    
    this.data.checkList.push(newItem);
    this.startEditing(this.data.checkList.length - 1);
    this.saveChanges();
  }

  deleteItem(index: number): void {
    this.data.checkList.splice(index, 1);
    this.saveChanges();
  }

  // Editing functionality
  startEditing(index: number): void {
    this.editingIndex = index;
    this.originalEditContent = this.data.checkList[index].content;
    
    // Focus the input after the view updates
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      }
    }, 0);
  }

  finishEditing(): void {
    if (this.editingIndex >= 0) {
      // Trim whitespace and check if content is empty
      const content = this.data.checkList[this.editingIndex].content.trim();
      if (content === '') {
        this.data.checkList[this.editingIndex].content = this.originalEditContent;
      }
      
      this.editingIndex = -1;
      this.originalEditContent = '';
      this.saveChanges();
    }
  }

  cancelEditing(): void {
    if (this.editingIndex >= 0) {
      this.data.checkList[this.editingIndex].content = this.originalEditContent;
      this.editingIndex = -1;
      this.originalEditContent = '';
    }
  }

  // Sort mode and drag & drop
  toggleSortMode(): void {
    this.sortMode = !this.sortMode;
    if (this.editingIndex >= 0) {
      this.cancelEditing();
    }
  }

  onDragStart(event: DragEvent, index: number): void {
    this.draggedItemIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    
    if (this.draggedItemIndex >= 0 && this.draggedItemIndex !== dropIndex) {
      // Reorder the items
      const draggedItem = this.data.checkList[this.draggedItemIndex];
      this.data.checkList.splice(this.draggedItemIndex, 1);
      this.data.checkList.splice(dropIndex, 0, draggedItem);
      
      // Update order values
      this.data.checkList.forEach((item, index) => {
        item.order = index;
      });
      
      this.saveChanges();
    }
    
    this.draggedItemIndex = -1;
  }

  // Change handling
  onItemChange(index: number): void {
    this.saveChanges();
  }

  onChange(event: any): void {
    this.saveChanges();
  }

  private saveChanges(): void {
    this.web.updateAnnotation(JSON.stringify(this.data), "checklist", this.annotation.id).subscribe((data) => {
      this._annotation = data;
      this.change.emit(data);
    });
  }
}
