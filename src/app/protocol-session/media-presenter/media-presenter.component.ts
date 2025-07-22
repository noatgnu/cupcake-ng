import {Component, ElementRef, Input, ViewChild, ChangeDetectorRef} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {parse} from "@plussub/srt-vtt-parser";
import {NgClass, TitleCasePipe, DatePipe} from "@angular/common";
import {NgbModal, NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkButton, NgbNavOutlet, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {TextScriptEditorModalComponent} from "../text-scsript-editor-modal/text-script-editor-modal.component";
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-media-presenter',
    imports: [
        NgClass,
        NgbNav,
        NgbNavItem,
        NgbNavOutlet,
        NgbNavLinkButton,
        NgbNavContent,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbTooltip,
        TitleCasePipe,
        FormsModule,
        DatePipe
    ],
    templateUrl: './media-presenter.component.html',
    styleUrl: './media-presenter.component.scss'
})
export class MediaPresenterComponent {
  @ViewChild('audioControlElement') audioControlElement?: ElementRef;
  @ViewChild('videoControlElement') videoControlElement?: ElementRef;
  @ViewChild('videoWrapper') videoWrapper?: ElementRef;
  
  // Navigation and content
  active = 'transcription'
  _annotation?: Annotation;
  mediaURL: string = ''

  // Transcript data
  transcription: string = ''
  translation: string = ''
  summary: string = ''
  subtitles: {entries: {from: number, id: string, text: string, to: number}[]} = {entries: []}
  translationSubtitles: {entries: {from: number, id: string, text: string, to: number}[]} = {entries: []}
  currentSubtitleID: number = -1
  
  // Media state
  currentTime: number = 0;
  duration: number = 0;
  isLoading: boolean = false;
  mediaError: boolean = false;
  
  // Enhanced controls
  playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  playbackRate: number = 1;
  isMuted: boolean = false;
  isLooping: boolean = false;
  videoWidth: number = 800;
  videoHeight: number = 450;
  
  // Search and filtering
  searchTerm: string = '';
  searchResults: any[] = [];
  translationSearchResults: any[] = [];
  currentSearchIndex: number = 0;
  transcriptFilter: 'all' | 'current' | 'search' = 'all';
  transcriptMaxHeight: number = 400;
  
  // Computed filtered data
  filteredSubtitles: any[] = [];
  filteredTranslationSubtitles: any[] = [];
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    //this.web.getAnnotationImageBlobUrl(value.id).subscribe((url) => {
    //  this.mediaURL = url
    //})
    console.log(value)
    if (value.transcribed) {
      // convert value.transcription text to ObjectURL
      const blob = new Blob([value.transcription], {type: 'text/plain'})
      this.transcription = URL.createObjectURL(blob)
      this.subtitles = parse(value.transcription)
      console.log(this.subtitles)
    }
    if (value.translation) {
      const blob = new Blob([value.translation], {type: 'text/plain'})
      this.translation = URL.createObjectURL(blob)
      this.translationSubtitles = parse(value.translation)
    }
    if (value.summary) {
      this.summary = value.summary
    }
    this.web.getSignedURL(value.id).subscribe((token: any) => {
      this.mediaURL = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`
    })
    
    this.updateFilteredSubtitles();
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  constructor(
    private web: WebService, 
    private modal: NgbModal,
    private cdr: ChangeDetectorRef
  ) { 
    this.updateFilteredSubtitles();
  }

  msToTime(duration: number) {
    const milliseconds = Math.floor((duration % 1000) / 100)
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

    hours = (hours < 10) ? 0 + hours : hours
    minutes = (minutes < 10) ? 0 + minutes : minutes
    seconds = (seconds < 10) ? 0 + seconds : seconds
    let strHours = hours.toString()
    if (strHours.length === 1) {
      strHours = "0" + strHours
    }
    let strMinutes = minutes.toString()
    if (strMinutes.length === 1) {
      strMinutes = "0"+strMinutes
    }
    let strSeconds = seconds.toString()

    if (strSeconds.length === 1) {
      strSeconds = "0"+strSeconds
    }
    return strHours + ":" + strMinutes + ":" + strSeconds + "." + milliseconds
  }


  seekToTimePosition(time: number) {
    if (this.annotation?.annotation_type === "audio") {
      if (this.audioControlElement) {
        this.audioControlElement.nativeElement.currentTime = time / 1000
      }
    } else {
      if (this.videoControlElement) {
        this.videoControlElement.nativeElement.currentTime = time / 1000
      }
    }
  }
  editText(type: 'transcription'|'translation') {
    const ref  = this.modal.open(TextScriptEditorModalComponent)
    if (type === 'transcription') {
      ref.componentInstance.text = this.annotation.transcription
    } else {
      ref.componentInstance.text = this.annotation.translation
    }
    ref.closed.subscribe((result) => {
      if (type === 'transcription') {
        this.annotation.transcription = result
        const blob = new Blob([result], {type: 'text/plain'})
        this.transcription = URL.createObjectURL(blob)
        this.subtitles = parse(result)
        this.web.updateTranscription(this.annotation.id, result).subscribe(
          (result) => {
            console.log(result)
          }
        )
      } else {
        this.annotation.translation = result
        const blob = new Blob([result], {type: 'text/plain'})
        this.translation = URL.createObjectURL(blob)
        this.translationSubtitles = parse(result)
        this.web.updateTranslation(this.annotation.id, result).subscribe(
          (result) => {
            console.log(result)
          }
        )
      }
    })
  }

  // Enhanced media controls
  formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatDuration(ms: number): string {
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.audioControlElement?.nativeElement) {
      this.audioControlElement.nativeElement.playbackRate = rate;
    }
    if (this.videoControlElement?.nativeElement) {
      this.videoControlElement.nativeElement.playbackRate = rate;
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.audioControlElement?.nativeElement) {
      this.audioControlElement.nativeElement.muted = this.isMuted;
    }
    if (this.videoControlElement?.nativeElement) {
      this.videoControlElement.nativeElement.muted = this.isMuted;
    }
  }

  toggleLoop(): void {
    this.isLooping = !this.isLooping;
    if (this.audioControlElement?.nativeElement) {
      this.audioControlElement.nativeElement.loop = this.isLooping;
    }
    if (this.videoControlElement?.nativeElement) {
      this.videoControlElement.nativeElement.loop = this.isLooping;
    }
  }

  toggleFullscreen(): void {
    if (this.videoWrapper?.nativeElement) {
      if (!document.fullscreenElement) {
        this.videoWrapper.nativeElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  }

  // Media event handlers
  onMediaLoaded(event: Event): void {
    const media = event.target as HTMLMediaElement;
    this.duration = media.duration;
    this.isLoading = false;
    this.mediaError = false;
    this.cdr.detectChanges();
  }

  onMediaLoadStart(): void {
    this.isLoading = true;
    this.mediaError = false;
    this.cdr.detectChanges();
  }

  onMediaError(event: Event): void {
    this.isLoading = false;
    this.mediaError = true;
    console.error('Media loading error:', event);
    this.cdr.detectChanges();
  }

  onMediaCanPlay(): void {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onVolumeChange(event: Event): void {
    const media = event.target as HTMLMediaElement;
    this.isMuted = media.muted;
    this.cdr.detectChanges();
  }

  retryMediaLoad(): void {
    this.isLoading = true;
    this.mediaError = false;
    
    if (this.audioControlElement?.nativeElement) {
      this.audioControlElement.nativeElement.load();
    }
    if (this.videoControlElement?.nativeElement) {
      this.videoControlElement.nativeElement.load();
    }
    this.cdr.detectChanges();
  }

  // Enhanced transcript search and filtering
  onSearchTermChange(): void {
    this.updateSearchResults();
    this.currentSearchIndex = 0;
    this.updateFilteredSubtitles();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.translationSearchResults = [];
    this.currentSearchIndex = 0;
    this.updateFilteredSubtitles();
  }

  private updateSearchResults(): void {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      this.translationSearchResults = [];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    
    this.searchResults = this.subtitles.entries.filter(entry => 
      entry.text.toLowerCase().includes(searchLower)
    );
    
    this.translationSearchResults = this.translationSubtitles.entries.filter(entry => 
      entry.text.toLowerCase().includes(searchLower)
    );
  }

  setTranscriptFilter(filter: 'all' | 'current' | 'search'): void {
    this.transcriptFilter = filter;
    this.updateFilteredSubtitles();
  }

  getFilterLabel(): string {
    switch (this.transcriptFilter) {
      case 'all': return 'All Entries';
      case 'current': return 'Current Time';
      case 'search': return `Search (${this.searchResults.length})`;
      default: return 'All Entries';
    }
  }

  private updateFilteredSubtitles(): void {
    switch (this.transcriptFilter) {
      case 'all':
        this.filteredSubtitles = [...this.subtitles.entries];
        this.filteredTranslationSubtitles = [...this.translationSubtitles.entries];
        break;
      case 'current':
        const currentTime = this.currentTime * 1000;
        this.filteredSubtitles = this.subtitles.entries.filter(entry => 
          currentTime >= entry.from && currentTime <= entry.to
        );
        this.filteredTranslationSubtitles = this.translationSubtitles.entries.filter(entry => 
          currentTime >= entry.from && currentTime <= entry.to
        );
        break;
      case 'search':
        this.filteredSubtitles = this.searchResults;
        this.filteredTranslationSubtitles = this.translationSearchResults;
        break;
    }
  }

  nextSearchResult(): void {
    if (this.currentSearchIndex < this.searchResults.length - 1) {
      this.currentSearchIndex++;
      this.seekToCurrentSearchResult();
    }
  }

  previousSearchResult(): void {
    if (this.currentSearchIndex > 0) {
      this.currentSearchIndex--;
      this.seekToCurrentSearchResult();
    }
  }

  private seekToCurrentSearchResult(): void {
    const currentResults = this.active === 'transcription' ? this.searchResults : this.translationSearchResults;
    if (currentResults[this.currentSearchIndex]) {
      this.seekToTimePosition(currentResults[this.currentSearchIndex].from);
    }
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${this.searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Helper methods for template
  getOriginalIndex(entry: any): number {
    return this.subtitles.entries.findIndex(e => e.id === entry.id);
  }

  getOriginalTranslationIndex(entry: any): number {
    return this.translationSubtitles.entries.findIndex(e => e.id === entry.id);
  }

  isSearchResult(entry: any): boolean {
    return this.searchResults.some(result => result.id === entry.id);
  }

  isTranslationSearchResult(entry: any): boolean {
    return this.translationSearchResults.some(result => result.id === entry.id);
  }

  getCurrentSearchResult(): any {
    return this.searchResults[this.currentSearchIndex];
  }

  getCurrentTranslationSearchResult(): any {
    return this.translationSearchResults[this.currentSearchIndex];
  }

  getTotalDuration(): number {
    if (!this.subtitles.entries.length) return 0;
    return Math.max(...this.subtitles.entries.map(e => e.to)) / 1000;
  }

  getTranslationTotalDuration(): number {
    if (!this.translationSubtitles.entries.length) return 0;
    return Math.max(...this.translationSubtitles.entries.map(e => e.to)) / 1000;
  }

  exportTranscript(type: 'transcription' | 'translation'): void {
    const data = type === 'transcription' ? this.annotation.transcription : this.annotation.translation;
    if (!data) return;

    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.annotation.annotation_name || 'transcript'}_${type}.srt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  formatSummary(summary: string): string {
    // Simple formatting for summary text
    return summary
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>');
  }

  // Enhanced highlightSubtitle method to update currentTime
  highLightSubtitle(event: any) {
    this.currentTime = event.target.currentTime;
    
    const currentTime = event.target.currentTime * 1000;
    if (this.active === 'transcription') {
      const currentSubtitle = this.subtitles.entries.findIndex((entry) => {
        return currentTime >= entry.from && currentTime <= entry.to
      })
      if (currentSubtitle > -1) {
        this.currentSubtitleID = currentSubtitle
      }
    } else {
      const currentSubtitle = this.translationSubtitles.entries.findIndex((entry) => {
        return currentTime >= entry.from && currentTime <= entry.to
      })
      if (currentSubtitle > -1) {
        this.currentSubtitleID = currentSubtitle
      }
    }

    // Update filtered results if using current time filter
    if (this.transcriptFilter === 'current') {
      this.updateFilteredSubtitles();
    }
  }
}
