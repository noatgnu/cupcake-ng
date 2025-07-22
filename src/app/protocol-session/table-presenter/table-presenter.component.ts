import {Component, EventEmitter, Input, Output, ElementRef, ViewChild} from '@angular/core';
import {Annotation} from "../../annotation";
import {FormBuilder, FormsModule} from "@angular/forms";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {NgClass, DatePipe} from "@angular/common";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-table-presenter',
    imports: [
        FormsModule,
        NgClass,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbTooltip,
        DatePipe
    ],
    templateUrl: './table-presenter.component.html',
    styleUrl: './table-presenter.component.scss'
})
export class TablePresenterComponent {
  _annotation?: Annotation;
  data: {name: string, nRow: number, nCol: number, content: any[][], tracking?: boolean, trackingMap?: any} =
    {name: "", nRow: 0, nCol: 0, content: [], tracking: false, trackingMap: {}};
  segments: any[][] = [];
  originalData: any[][] = [];
  
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    this.data = JSON.parse(value.annotation)
    if (!('tracking' in this.data)) {
      this.data.tracking = false;
    }
    if (!('trackingMap' in this.data)) {
      this.data.trackingMap = {};
    }
    this.segments = JSON.parse(JSON.stringify(this.data.content))
    this.originalData = JSON.parse(JSON.stringify(this.data.content))
    this.initializeEnhancedData();
  }
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>();

  get annotation() {
    return this._annotation!;
  }
  
  // Enhanced properties
  editMode = false;
  editingHeaders = false;
  filterText = '';
  filteredRows: any[] = [];
  sortColumn = -1;
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedRows: Set<number> = new Set();
  selectedCells: Set<string> = new Set();
  columnHeaders: string[] = [];
  tableMaxHeight = 600;
  lastModified = new Date();
  
  // View state
  viewMode: 'view' | 'edit' = 'view';
  constructor(private web: WebService, private toast: ToastService) {
  }
  
  private initializeEnhancedData(): void {
    // Initialize column headers if not exist
    if (!this.columnHeaders || this.columnHeaders.length !== this.getColumnCount()) {
      this.columnHeaders = Array.from({length: this.getColumnCount()}, (_, i) => `Column ${i + 1}`);
    }
    
    // Initialize filtered rows
    this.applyFilter();
    
    // Reset selection
    this.selectedRows.clear();
    this.selectedCells.clear();
    
    this.lastModified = new Date();
  }

  save() {
    this.data.content = JSON.parse(JSON.stringify(this.segments))
    this.annotation.annotation = JSON.stringify(this.data)
    this.web.updateAnnotation(this.annotation.annotation, "table", this.annotation.id).subscribe((data) => {
      this._annotation = data
      this.change.emit(data)
      this.toast.show("Table", "Table updated successfully")
    })
  }

  clicked(row: number, col: number) {
    if (!this.data.tracking) {
      return
    }
    if (this.data.trackingMap[row + "," + col]) {
      delete this.data.trackingMap[row + "," + col]
    } else {
      this.data.trackingMap[row + "," + col] = true
    }
    this.save()
  }

  // Enhanced table operations
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.viewMode = 'edit';
    } else {
      this.viewMode = 'view';
      this.editingHeaders = false;
    }
  }

  // Data operations
  addRow(): void {
    const newRow = new Array(this.getColumnCount()).fill('');
    this.data.content.push(newRow);
    this.segments.push([...newRow]);
    this.data.nRow = this.data.content.length;
    this.applyFilter();
    this.toast.show('Table', 'Row added successfully');
  }

  addColumn(): void {
    // Add to existing data
    this.data.content.forEach(row => row.push(''));
    this.segments.forEach(row => row.push(''));
    this.originalData.forEach(row => row.push(''));
    
    // Update column count and headers
    this.data.nCol = this.data.content[0]?.length || 0;
    this.columnHeaders.push(`Column ${this.columnHeaders.length + 1}`);
    
    this.applyFilter();
    this.toast.show('Table', 'Column added successfully');
  }

  deleteRow(rowIndex: number): void {
    if (this.data.content.length <= 1) {
      this.toast.show('Warning', 'Cannot delete the last remaining row');
      return;
    }
    
    this.data.content.splice(rowIndex, 1);
    this.segments.splice(rowIndex, 1);
    this.originalData.splice(rowIndex, 1);
    this.data.nRow = this.data.content.length;
    
    // Clean up tracking map
    this.cleanupTrackingMap();
    
    this.applyFilter();
    this.toast.show('Table', 'Row deleted successfully');
  }

  deleteColumn(colIndex: number): void {
    if (this.getColumnCount() <= 1) {
      this.toast.show('Warning', 'Cannot delete the last remaining column');
      return;
    }
    
    this.data.content.forEach(row => row.splice(colIndex, 1));
    this.segments.forEach(row => row.splice(colIndex, 1));
    this.originalData.forEach(row => row.splice(colIndex, 1));
    this.columnHeaders.splice(colIndex, 1);
    this.data.nCol = this.data.content[0]?.length || 0;
    
    this.cleanupTrackingMap();
    this.applyFilter();
    this.toast.show('Table', 'Column deleted successfully');
  }

  deleteSelectedRows(): void {
    const rowsToDelete = Array.from(this.selectedRows).sort((a, b) => b - a); // Sort descending
    
    if (rowsToDelete.length >= this.data.content.length) {
      this.toast.show('Warning', 'Cannot delete all rows');
      return;
    }
    
    rowsToDelete.forEach(rowIndex => {
      this.data.content.splice(rowIndex, 1);
      this.segments.splice(rowIndex, 1);
      this.originalData.splice(rowIndex, 1);
    });
    
    this.data.nRow = this.data.content.length;
    this.selectedRows.clear();
    this.cleanupTrackingMap();
    this.applyFilter();
    
    this.toast.show('Table', `${rowsToDelete.length} rows deleted successfully`);
  }

  private cleanupTrackingMap(): void {
    const newTrackingMap: any = {};
    Object.keys(this.data.trackingMap).forEach(key => {
      const [row, col] = key.split(',').map(Number);
      if (row < this.data.content.length && col < this.getColumnCount()) {
        newTrackingMap[key] = this.data.trackingMap[key];
      }
    });
    this.data.trackingMap = newTrackingMap;
  }

  // Filtering and sorting
  applyFilter(): void {
    if (!this.filterText.trim()) {
      this.filteredRows = this.data.content.map((row, index) => ({
        data: row,
        originalIndex: index
      }));
    } else {
      const searchTerm = this.filterText.toLowerCase();
      this.filteredRows = this.data.content
        .map((row, index) => ({ data: row, originalIndex: index }))
        .filter(item => 
          item.data.some(cell => 
            String(cell).toLowerCase().includes(searchTerm)
          )
        );
    }
    
    this.applySorting();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  hasFilter(): boolean {
    return this.filterText.trim().length > 0;
  }

  setSortColumn(column: number): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  toggleSort(column: number): void {
    this.setSortColumn(column);
  }

  applySorting(): void {
    if (this.sortColumn === -1) return;
    
    this.filteredRows.sort((a, b) => {
      const aVal = String(a.data[this.sortColumn] || '');
      const bVal = String(b.data[this.sortColumn] || '');
      
      let result = aVal.localeCompare(bVal, undefined, { numeric: true });
      return this.sortDirection === 'desc' ? -result : result;
    });
  }

  getSortLabel(): string {
    if (this.sortColumn === -1) return 'Original Order';
    return `Column ${this.sortColumn + 1} ${this.sortDirection === 'asc' ? '↑' : '↓'}`;
  }

  getSortIcon(column: number): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  resetView(): void {
    this.filterText = '';
    this.sortColumn = -1;
    this.sortDirection = 'asc';
    this.applyFilter();
    this.toast.show('Table', 'View reset to default');
  }

  // Selection operations
  selectAll(): void {
    this.selectedRows.clear();
    this.selectedCells.clear();
    
    for (let i = 0; i < this.data.content.length; i++) {
      this.selectedRows.add(i);
      for (let j = 0; j < this.getColumnCount(); j++) {
        this.selectedCells.add(`${i},${j}`);
      }
    }
  }

  clearSelection(): void {
    this.selectedRows.clear();
    this.selectedCells.clear();
  }

  selectColumn(colIndex: number): void {
    this.selectedCells.clear();
    for (let i = 0; i < this.data.content.length; i++) {
      this.selectedCells.add(`${i},${colIndex}`);
    }
  }

  toggleRowSelection(rowIndex: number): void {
    if (this.selectedRows.has(rowIndex)) {
      this.selectedRows.delete(rowIndex);
      // Remove all cells in this row from selection
      for (let j = 0; j < this.getColumnCount(); j++) {
        this.selectedCells.delete(`${rowIndex},${j}`);
      }
    } else {
      this.selectedRows.add(rowIndex);
      // Add all cells in this row to selection
      for (let j = 0; j < this.getColumnCount(); j++) {
        this.selectedCells.add(`${rowIndex},${j}`);
      }
    }
  }

  toggleAllRows(event: any): void {
    if (event.target.checked) {
      this.selectAll();
    } else {
      this.clearSelection();
    }
  }

  // Cell operations
  handleCellClick(row: number, col: number, event: MouseEvent): void {
    if (this.data.tracking && !this.editMode) {
      this.clicked(row, col);
      return;
    }
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const key = `${row},${col}`;
      if (this.selectedCells.has(key)) {
        this.selectedCells.delete(key);
      } else {
        this.selectedCells.add(key);
      }
    } else {
      // Single select
      this.selectedCells.clear();
      this.selectedCells.add(`${row},${col}`);
    }
  }

  onCellChange(row: number, col: number): void {
    this.lastModified = new Date();
  }

  onCellKeyDown(event: KeyboardEvent, row: number, col: number): void {
    // Handle navigation with arrow keys
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Move to next row, same column
      const nextRow = row + 1;
      if (nextRow < this.data.content.length) {
        this.focusCell(nextRow, col);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      // Move to next cell
      let nextCol = col + 1;
      let nextRow = row;
      
      if (nextCol >= this.getColumnCount()) {
        nextCol = 0;
        nextRow = row + 1;
      }
      
      if (nextRow < this.data.content.length) {
        this.focusCell(nextRow, nextCol);
      }
    }
  }

  private focusCell(row: number, col: number): void {
    // This would require ViewChild references to focus specific cells
    // Implementation depends on your preferred approach
  }

  // Data export
  exportData(): void {
    const csvContent = this.generateCSV();
    this.downloadFile(csvContent, `${this.data.name || 'table'}.csv`, 'text/csv');
  }

  exportToJSON(): void {
    const jsonData = {
      name: this.data.name,
      headers: this.columnHeaders,
      data: this.data.content,
      metadata: {
        rows: this.data.nRow,
        columns: this.data.nCol,
        tracking: this.data.tracking,
        lastModified: this.lastModified
      }
    };
    
    const jsonContent = JSON.stringify(jsonData, null, 2);
    this.downloadFile(jsonContent, `${this.data.name || 'table'}.json`, 'application/json');
  }

  private generateCSV(): string {
    let csv = this.columnHeaders.join(',') + '\\n';
    
    this.data.content.forEach(row => {
      const escapedRow = row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('\"') || cellStr.includes('\\n')) {
          return '\"' + cellStr.replace(/\"/g, '\"\"') + '\"';
        }
        return cellStr;
      });
      csv += escapedRow.join(',') + '\\n';
    });
    
    return csv;
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.toast.show('Export', `${filename} downloaded successfully`);
  }

  // Helper methods for template
  getVisibleRows(): any[] {
    return this.filteredRows;
  }

  getColumnCount(): number {
    return this.data.content[0]?.length || 0;
  }

  getColumnHeaders(): string[] {
    return this.columnHeaders;
  }

  getColumnHeader(index: number): string {
    return this.columnHeaders[index] || `Column ${index + 1}`;
  }

  getRowId(row: any): string {
    return `row-${row.originalIndex}`;
  }

  getCellPlaceholder(col: number): string {
    return `Enter ${this.getColumnHeader(col).toLowerCase()}...`;
  }

  formatCellValue(value: any, col: number): string {
    if (value === null || value === undefined || value === '') {
      return '<span class=\"text-muted\">—</span>';
    }
    
    // Basic formatting - can be extended
    return String(value);
  }

  // State checking methods
  hasChanges(): boolean {
    return JSON.stringify(this.segments) !== JSON.stringify(this.originalData);
  }

  getChangeCount(): number {
    let changes = 0;
    for (let i = 0; i < this.segments.length; i++) {
      for (let j = 0; j < this.segments[i].length; j++) {
        if (this.segments[i][j] !== this.originalData[i]?.[j]) {
          changes++;
        }
      }
    }
    return changes;
  }

  isCellChanged(row: number, col: number): boolean {
    return this.segments[row]?.[col] !== this.originalData[row]?.[col];
  }

  isCellSelected(row: number, col: number): boolean {
    return this.selectedCells.has(`${row},${col}`);
  }

  isCellTracked(row: number, col: number): boolean {
    return !!this.data.trackingMap[`${row},${col}`];
  }

  isRowSelected(row: number): boolean {
    return this.selectedRows.has(row);
  }

  hasTrackedCells(row: number): boolean {
    for (let col = 0; col < this.getColumnCount(); col++) {
      if (this.isCellTracked(row, col)) {
        return true;
      }
    }
    return false;
  }

  isAllRowsSelected(): boolean {
    return this.selectedRows.size === this.data.content.length && this.data.content.length > 0;
  }

  isSomeRowsSelected(): boolean {
    return this.selectedRows.size > 0 && this.selectedRows.size < this.data.content.length;
  }

  getSelectedRows(): number[] {
    return Array.from(this.selectedRows);
  }

  getSelectedCellCount(): number {
    return this.selectedCells.size;
  }

  // Statistics
  getTotalCells(): number {
    return this.data.content.length * this.getColumnCount();
  }

  getFilledCells(): number {
    let filled = 0;
    for (const row of this.data.content) {
      for (const cell of row) {
        if (cell !== null && cell !== undefined && cell !== '') {
          filled++;
        }
      }
    }
    return filled;
  }

  getLastModified(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.lastModified.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }

}
