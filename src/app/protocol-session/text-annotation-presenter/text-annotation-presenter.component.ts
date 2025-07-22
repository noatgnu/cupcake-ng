import {Component, Input, Output, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Annotation} from '../../annotation';
import {WebService} from '../../web.service';
import {ToastService} from '../../toast.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-text-annotation-presenter',
  imports: [
    NgbDropdown,
    NgbDropdownMenu, 
    NgbDropdownToggle,
    NgbTooltip,
    NgClass,
    FormsModule
  ],
  templateUrl: './text-annotation-presenter.component.html',
  styleUrl: './text-annotation-presenter.component.scss'
})
export class TextAnnotationPresenterComponent {
  @ViewChild('textContent') textContent!: ElementRef<HTMLDivElement>;
  
  private _annotation?: Annotation;
  
  // Display modes
  displayMode: 'formatted' | 'raw' | 'preview' = 'formatted';
  
  // Text statistics
  wordCount: number = 0;
  charCount: number = 0;
  lineCount: number = 0;
  
  // Search functionality
  searchTerm: string = '';
  searchResults: {index: number, text: string}[] = [];
  currentSearchIndex: number = -1;
  
  // Settings
  fontSize: 'small' | 'normal' | 'large' = 'normal';
  lineSpacing: 'compact' | 'normal' | 'relaxed' = 'normal';
  
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    this.updateTextStatistics();
  }
  
  get annotation(): Annotation {
    return this._annotation!;
  }
  
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>();

  constructor(
    private web: WebService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer,
    private modal: NgbModal
  ) {
    this.loadSettings();
  }

  // Text processing and display
  get sanitizedContent(): SafeHtml {
    if (!this.annotation?.annotation) return '';
    
    let content = this.annotation.annotation;
    
    // Apply search highlighting if there's a search term
    if (this.searchTerm.trim() && this.displayMode === 'formatted') {
      content = this.highlightSearchTerm(content, this.searchTerm);
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
  
  get plainTextContent(): string {
    if (!this.annotation?.annotation) return '';
    
    // Strip HTML tags and decode entities
    const div = document.createElement('div');
    div.innerHTML = this.annotation.annotation;
    return div.textContent || div.innerText || '';
  }
  
  private highlightSearchTerm(text: string, term: string): string {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Text analysis
  private updateTextStatistics(): void {
    if (!this.annotation?.annotation) {
      this.wordCount = 0;
      this.charCount = 0;
      this.lineCount = 0;
      return;
    }
    
    const plainText = this.plainTextContent;
    this.charCount = plainText.length;
    this.wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    this.lineCount = plainText.split('\n').length;
  }
  
  // Search functionality
  performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      this.currentSearchIndex = -1;
      return;
    }
    
    const plainText = this.plainTextContent.toLowerCase();
    const searchLower = this.searchTerm.toLowerCase();
    const results: {index: number, text: string}[] = [];
    
    let index = 0;
    while ((index = plainText.indexOf(searchLower, index)) !== -1) {
      const contextStart = Math.max(0, index - 20);
      const contextEnd = Math.min(plainText.length, index + searchLower.length + 20);
      const context = this.plainTextContent.substring(contextStart, contextEnd);
      
      results.push({
        index,
        text: contextStart > 0 ? '...' + context : context
      });
      
      index += searchLower.length;
    }
    
    this.searchResults = results;
    this.currentSearchIndex = results.length > 0 ? 0 : -1;
    
    if (results.length === 0) {
      this.toastService.show('Search', 'No matches found');
    } else {
      this.toastService.show('Search', `Found ${results.length} match${results.length === 1 ? '' : 'es'}`);
    }
  }
  
  nextSearchResult(): void {
    if (this.searchResults.length === 0) return;
    this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchResults.length;
  }
  
  previousSearchResult(): void {
    if (this.searchResults.length === 0) return;
    this.currentSearchIndex = this.currentSearchIndex === 0 
      ? this.searchResults.length - 1 
      : this.currentSearchIndex - 1;
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.currentSearchIndex = -1;
  }

  // Display settings
  setDisplayMode(mode: 'formatted' | 'raw' | 'preview'): void {
    this.displayMode = mode;
    this.saveSettings();
  }
  
  setFontSize(size: 'small' | 'normal' | 'large'): void {
    this.fontSize = size;
    this.saveSettings();
  }
  
  setLineSpacing(spacing: 'compact' | 'normal' | 'relaxed'): void {
    this.lineSpacing = spacing;
    this.saveSettings();
  }

  // Export functionality
  exportAsText(): void {
    const content = this.plainTextContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.annotation.annotation_name || 'annotation'}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.toastService.show('Export', 'Text exported successfully');
  }
  
  exportAsHtml(): void {
    const content = this.annotation.annotation;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.annotation.annotation_name || 'Annotation'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .metadata { background: #f8f9fa; padding: 1rem; margin-bottom: 2rem; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="metadata">
        <h1>${this.annotation.annotation_name || 'Untitled Annotation'}</h1>
        <p><strong>Created:</strong> ${new Date(this.annotation.created_at).toLocaleDateString()}</p>
        <p><strong>Words:</strong> ${this.wordCount} | <strong>Characters:</strong> ${this.charCount}</p>
    </div>
    <div class="content">
        ${content}
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.annotation.annotation_name || 'annotation'}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.toastService.show('Export', 'HTML exported successfully');
  }

  // Copy functionality
  copyToClipboard(): void {
    const content = this.displayMode === 'raw' ? this.annotation.annotation : this.plainTextContent;
    navigator.clipboard.writeText(content).then(() => {
      this.toastService.show('Copied', 'Content copied to clipboard');
    }).catch(() => {
      this.toastService.show('Copy Failed', 'Could not copy to clipboard');
    });
  }

  // Settings persistence
  private saveSettings(): void {
    const settings = {
      displayMode: this.displayMode,
      fontSize: this.fontSize,
      lineSpacing: this.lineSpacing
    };
    localStorage.setItem('text-annotation-settings', JSON.stringify(settings));
  }
  
  private loadSettings(): void {
    const saved = localStorage.getItem('text-annotation-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.displayMode = settings.displayMode || 'formatted';
        this.fontSize = settings.fontSize || 'normal';
        this.lineSpacing = settings.lineSpacing || 'normal';
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }

  // Reading time estimation (average 200 words per minute)
  get estimatedReadingTime(): number {
    return Math.ceil(this.wordCount / 200);
  }
  
  // Content complexity score (simple heuristic)
  get complexityScore(): 'Simple' | 'Moderate' | 'Complex' {
    const avgWordsPerSentence = this.wordCount / Math.max(1, this.annotation.annotation.split(/[.!?]+/).length);
    if (avgWordsPerSentence < 15) return 'Simple';
    if (avgWordsPerSentence < 25) return 'Moderate';
    return 'Complex';
  }
}