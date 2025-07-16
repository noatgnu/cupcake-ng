import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbTooltip, NgbModal, NgbNav, NgbNavContent, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { McpSdrfService, MCPAnalysisResponse, SDRFSuggestion } from '../../mcp-sdrf.service';
import { ProtocolStep } from '../../protocol';
import { McpModificationParameterModalComponent } from '../mcp-modification-parameter-modal/mcp-modification-parameter-modal.component';
import { WebService } from '../../web.service';
import { forkJoin } from 'rxjs';

interface DisplaySuggestion extends SDRFSuggestion {
  sdrf_column: string;
}

@Component({
  selector: 'app-mcp-sdrf-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTooltip, NgbNav, NgbNavContent, NgbNavItem, NgbNavLink, NgbNavLinkBase, NgbNavOutlet],
  templateUrl: './mcp-sdrf-suggestions.component.html',
  styleUrls: ['./mcp-sdrf-suggestions.component.scss']
})
export class McpSdrfSuggestionsComponent implements OnInit, OnDestroy {
  @Input() step!: ProtocolStep;
  @Input() sessionId!: string;
  @Output() annotationCreated = new EventEmitter<any>();
  @Output() metadataCreated = new EventEmitter<any>();

  // Results storage for both analyzer types
  standardResults: {
    suggestions: { [key: string]: SDRFSuggestion[] };
    analysisResult: MCPAnalysisResponse | null;
    flatSuggestions: DisplaySuggestion[];
    error: string | null;
  } = {
    suggestions: {},
    analysisResult: null,
    flatSuggestions: [],
    error: null
  };

  aiResults: {
    suggestions: { [key: string]: SDRFSuggestion[] };
    analysisResult: MCPAnalysisResponse | null;
    flatSuggestions: DisplaySuggestion[];
    error: string | null;
  } = {
    suggestions: {},
    analysisResult: null,
    flatSuggestions: [],
    error: null
  };

  // Current UI state
  activeTabId = 'standard';
  isAnalyzing = false;
  isCreatingAnnotation = false;
  selectedAnalyzerType: 'standard_nlp' | 'mcp_claude' = 'standard_nlp';

  // Computed properties for current tab
  get suggestions(): { [key: string]: SDRFSuggestion[] } {
    return this.activeTabId === 'standard' ? this.standardResults.suggestions : this.aiResults.suggestions;
  }

  get analysisResult(): MCPAnalysisResponse | null {
    return this.activeTabId === 'standard' ? this.standardResults.analysisResult : this.aiResults.analysisResult;
  }

  get flatSuggestions(): DisplaySuggestion[] {
    return this.activeTabId === 'standard' ? this.standardResults.flatSuggestions : this.aiResults.flatSuggestions;
  }

  get error(): string | null {
    return this.activeTabId === 'standard' ? this.standardResults.error : this.aiResults.error;
  }

  get showSuggestions(): boolean {
    return this.flatSuggestions.length > 0;
  }

  // Helper methods for template
  getStandardUniModCount(): number {
    return this.standardResults.flatSuggestions.filter(s => this.isUniModSuggestion(s)).length;
  }

  getStandardHighConfidenceCount(): number {
    return this.standardResults.flatSuggestions.filter(s => s.confidence >= 0.8).length;
  }

  getAiUniModCount(): number {
    return this.aiResults.flatSuggestions.filter(s => this.isUniModSuggestion(s)).length;
  }

  getAiHighConfidenceCount(): number {
    return this.aiResults.flatSuggestions.filter(s => s.confidence >= 0.8).length;
  }

  getAiEnhancedCount(): number {
    return this.aiResults.flatSuggestions.filter(s => this.isEnhancedOntology(s)).length;
  }

  getAiValidCount(): number {
    return this.aiResults.flatSuggestions.filter(s =>
      s.ontology_type &&
      s.ontology_name &&
      s.confidence >= 0.5
    ).length;
  }

  constructor(
    private mcpSdrfService: McpSdrfService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private webService: WebService
  ) {}

  ngOnInit() {
    // Initialize with default analyzer type, but don't auto-trigger analysis
    // Users can now choose between Standard and AI Enhanced analysis
    this.activeTabId = 'standard';
  }

  ngOnDestroy() {
    // Clean up WebSocket connections
    this.mcpSdrfService.disconnectAllWebSockets();
  }


  formatKeyValue(keyValueFormat: any): { key: string; value: string }[] {
    if (!keyValueFormat) return [];

    return Object.entries(keyValueFormat).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }

  close() {
    this.activeModal.close();
  }

  onTabChange(event: any) {
    const newTabId = event.nextId;
    console.log('Tab changed to:', newTabId);
    this.activeTabId = newTabId;
    this.selectedAnalyzerType = newTabId === 'standard' ? 'standard_nlp' : 'mcp_claude';
    console.log('Active tab ID is now:', this.activeTabId);
  }

  async analyzeStep() {
    if (!this.step || this.isAnalyzing) return;

    this.isAnalyzing = true;

    // Determine which analyzer type to use based on active tab
    const analyzerType = this.activeTabId === 'standard' ? 'standard_nlp' : 'mcp_claude';
    this.selectedAnalyzerType = analyzerType as 'standard_nlp' | 'mcp_claude';

    // Get current results object
    const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;

    // Clear current results
    currentResults.error = null;
    currentResults.suggestions = {};
    currentResults.flatSuggestions = [];

    try {
      const request = {
        step_id: this.step.id,
        use_anthropic: analyzerType === 'mcp_claude',
        use_async: true  // Enable async processing
      };

      this.mcpSdrfService.analyzeProtocolStep(request).subscribe({
        next: (response: any) => {
          // Check if this is an async task response
          if (response.task_id && response.status === 'queued') {
            // Handle async task
            this.handleAsyncTask(response, currentResults);
          } else {
            // Handle synchronous response
            this.handleSyncResponse(response, currentResults);
          }
        },
        error: (error) => {
          console.error('Error analyzing step:', error);
          currentResults.error = 'Failed to analyze step for SDRF annotations';
          currentResults.suggestions = {};
          currentResults.flatSuggestions = [];
          this.isAnalyzing = false;
        }
      });
    } catch (error) {
      console.error('Error analyzing step:', error);
      currentResults.error = 'Failed to analyze step for SDRF annotations';
      currentResults.suggestions = {};
      currentResults.flatSuggestions = [];
      this.isAnalyzing = false;
    }
  }

  private handleAsyncTask(response: any, currentResults: any) {
    console.log('Starting async task:', response.task_id);

    // Connect to WebSocket for progress updates
    this.mcpSdrfService.connectAnalysisWebSocket();

    // Subscribe to task updates for this specific task
    this.mcpSdrfService.getTaskUpdatesForTask(response.task_id).subscribe({
      next: (update: any) => {
        console.log('Task update:', update);

        if (update.status === 'completed') {
          // Task completed successfully
          if (update.data && update.data.result) {
            this.handleSyncResponse(update.data.result, currentResults);
          }
          this.isAnalyzing = false;
        } else if (update.status === 'error') {
          // Task failed
          currentResults.error = update.message || 'Analysis task failed';
          this.isAnalyzing = false;
        }
        // For 'started' and 'processing' status, keep showing progress
      },
      error: (error) => {
        console.error('WebSocket error:', error);
        currentResults.error = 'Failed to receive task updates';
        this.isAnalyzing = false;
      }
    });
  }

  private handleSyncResponse(response: any, currentResults: any) {
    currentResults.analysisResult = response;

    if (response.success && response.sdrf_suggestions) {
      // Normalize SDRF suggestions to the expected format
      currentResults.suggestions = this.mcpSdrfService.normalizeSdrfSuggestions(response.sdrf_suggestions);
      currentResults.flatSuggestions = this.flattenSuggestions(currentResults.suggestions);
    } else {
      currentResults.suggestions = {};
      currentResults.flatSuggestions = [];
      if (response.error) {
        currentResults.error = response.error;
      }
    }
    this.isAnalyzing = false;
  }

  async acceptSuggestion(suggestion: DisplaySuggestion, skipConfig: boolean = false) {
    if (this.isCreatingAnnotation) return;

    // Special handling for modification parameters (using unified SDRF column name)
    if ((suggestion.ontology_type === 'modification parameters' || suggestion.key_value_format) && !skipConfig) {
      this.openModificationParameterModal(suggestion);
      return;
    }

    this.isCreatingAnnotation = true;

    try {
      // Create single suggestion object for annotation
      const singleSuggestion: { [key: string]: SDRFSuggestion[] } = {
        [suggestion.sdrf_column]: [suggestion]
      };

      // Create enhanced annotation with acceptance summary
      this.createAcceptanceSummaryAnnotation(suggestion, singleSuggestion);

    } catch (error) {
      console.error('Error accepting suggestion:', error);
      const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;
      currentResults.error = 'Failed to accept suggestion';
      this.isCreatingAnnotation = false;
    }
  }

  private createAcceptanceSummaryAnnotation(acceptedSuggestion: DisplaySuggestion, suggestions: { [key: string]: SDRFSuggestion[] }) {
    // Create annotation with detailed acceptance summary
    this.mcpSdrfService.createAnnotationFromSuggestions(
      this.step.id,
      this.sessionId || null,
      suggestions,
      this.analysisResult?.analyzer_type || 'standard'
    ).subscribe({
      next: (annotation) => {
        this.annotationCreated.emit(annotation);

        // Create SDRF metadata columns from the accepted suggestions
        this.createSdrfMetadataColumns(annotation, acceptedSuggestion, suggestions);

        // Remove accepted suggestion from list
        this.removeSuggestionFromList(acceptedSuggestion);
        this.isCreatingAnnotation = false;
      },
      error: (error) => {
        console.error('Error creating annotation:', error);
        const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;
        currentResults.error = 'Failed to create annotation from suggestion';
        this.isCreatingAnnotation = false;
      }
    });
  }

  private createSdrfMetadataColumns(annotation: any, acceptedSuggestion: DisplaySuggestion, suggestions: { [key: string]: SDRFSuggestion[] }) {
    // Create metadata columns using existing metadata column creation API
    // Convert SDRF suggestions to metadata column format
    const metadataColumns = this.convertSuggestionsToMetadataColumns(acceptedSuggestion, suggestions);
    
    if (metadataColumns.length === 0) {
      console.warn('No metadata columns to create from suggestions');
      this.emitMetadataCreatedEvent(acceptedSuggestion, false, 'No metadata columns could be created from suggestions');
      return;
    }

    // Use existing WebService to create metadata columns
    const creationObservables = metadataColumns.map(column => 
      this.webService.createMetaDataColumn(annotation.id, column, 'annotation')
    );

    forkJoin(creationObservables).subscribe({
      next: (createdColumns) => {
        const enrichedMetadata = {
          success: true,
          created_columns: createdColumns.length,
          columns: createdColumns,
          acceptance_summary: {
            accepted_suggestion: {
              ontology_name: acceptedSuggestion.ontology_name,
              sdrf_column: acceptedSuggestion.sdrf_column,
              confidence: acceptedSuggestion.confidence,
              ontology_type: acceptedSuggestion.ontology_type,
              accession: acceptedSuggestion.accession,
              match_type: acceptedSuggestion.match_type,
              ontology_source: acceptedSuggestion.ontology_source
            },
            analyzer_type: this.analysisResult?.analyzer_type || 'standard',
            accepted_at: new Date().toISOString(),
            total_suggestions_available: this.flatSuggestions.length,
            high_confidence_suggestions: this.getHighConfidenceSuggestions()
          }
        };

        this.metadataCreated.emit(enrichedMetadata);
      },
      error: (error) => {
        console.error('Error creating metadata columns:', error);
        this.emitMetadataCreatedEvent(acceptedSuggestion, false, 'Failed to create metadata columns: ' + error.message);
      }
    });
  }

  private convertSuggestionsToMetadataColumns(acceptedSuggestion: DisplaySuggestion, suggestions: { [key: string]: SDRFSuggestion[] }) {
    const metadataColumns: any[] = [];
    
    // Convert each SDRF suggestion to a metadata column
    for (const [sdrfColumn, suggestionList] of Object.entries(suggestions)) {
      for (const suggestion of suggestionList) {
        const metadataColumn = {
          name: sdrfColumn.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: suggestion.ontology_name || suggestion.extracted_term || '',
          type: 'text', // Default type, could be enhanced based on suggestion type
          // Add SDRF-specific metadata in the description field
          description: `SDRF ${sdrfColumn} | ${suggestion.ontology_type} | Confidence: ${(suggestion.confidence * 100).toFixed(1)}% | Analyzer: ${this.analysisResult?.analyzer_type || 'standard'}`,
          // Add special handling for modification parameters (WebService handles MM, PP, TA, TS, MT fields)
          ...(suggestion.key_value_format && {
            MM: suggestion.key_value_format.MM,
            PP: suggestion.key_value_format.PP,
            TA: suggestion.key_value_format.TA,
            TS: suggestion.key_value_format.TS,
            MT: suggestion.key_value_format.MT
          })
        };
        
        metadataColumns.push(metadataColumn);
      }
    }
    
    return metadataColumns;
  }

  private emitMetadataCreatedEvent(acceptedSuggestion: DisplaySuggestion, success: boolean, errorMessage?: string) {
    this.metadataCreated.emit({
      success: success,
      error: errorMessage,
      acceptance_summary: {
        accepted_suggestion: {
          ontology_name: acceptedSuggestion.ontology_name,
          sdrf_column: acceptedSuggestion.sdrf_column,
          confidence: acceptedSuggestion.confidence
        }
      }
    });
  }

  openModificationParameterModal(suggestion: DisplaySuggestion) {
    const modalRef = this.modalService.open(McpModificationParameterModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.suggestion = suggestion;

    modalRef.result.then((result) => {
      if (result && result.length > 0) {
        // Create metadata columns from the modification parameters
        this.createModificationMetadata(result, suggestion);
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  createModificationMetadata(modificationData: any[], suggestion: DisplaySuggestion) {
    // This would integrate with the existing metadata creation system
    // For now, emit the metadata creation event with the structured data
    this.metadataCreated.emit({
      type: 'modification_parameters',
      data: modificationData,
      suggestion: suggestion
    });

    // Remove the suggestion from the list since it's been processed
    this.removeSuggestionFromList(suggestion);
  }

  async acceptAllSuggestions() {
    if (this.isCreatingAnnotation || this.flatSuggestions.length === 0) return;

    this.isCreatingAnnotation = true;

    try {
      // Create comprehensive annotation with all suggestions
      this.createBulkAcceptanceSummaryAnnotation();

    } catch (error) {
      console.error('Error accepting all suggestions:', error);
      const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;
      currentResults.error = 'Failed to accept all suggestions';
      this.isCreatingAnnotation = false;
    }
  }

  private createBulkAcceptanceSummaryAnnotation() {
    // Create annotation for all suggestions with comprehensive summary
    this.mcpSdrfService.createAnnotationFromSuggestions(
      this.step.id,
      this.sessionId || null,
      this.suggestions,
      this.analysisResult?.analyzer_type || 'standard'
    ).subscribe({
      next: (annotation) => {
        this.annotationCreated.emit(annotation);

        // Create SDRF metadata columns for all suggestions
        this.createBulkSdrfMetadataColumns(annotation);

        // Clear all suggestions
        const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;
        currentResults.suggestions = {};
        currentResults.flatSuggestions = [];
        this.isCreatingAnnotation = false;
      },
      error: (error) => {
        console.error('Error creating bulk annotation:', error);
        const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;
        currentResults.error = 'Failed to create annotation from all suggestions';
        this.isCreatingAnnotation = false;
      }
    });
  }

  private createBulkSdrfMetadataColumns(annotation: any) {
    // Generate SDRF metadata columns for all suggestions
    const metadataRequest = {
      step_id: this.step.id,
      auto_create: true,
      use_anthropic: this.analysisResult?.analyzer_type === 'mcp_claude',
      // Include all suggestions for comprehensive metadata creation
      suggestions: this.suggestions
    };

    // Create metadata columns for all suggestions using existing WebService
    const allMetadataColumns: any[] = [];
    
    // Convert all suggestions to metadata column format
    for (const [sdrfColumn, suggestionList] of Object.entries(this.suggestions)) {
      for (const suggestion of suggestionList) {
        const metadataColumn = {
          name: sdrfColumn.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: suggestion.ontology_name || suggestion.extracted_term || '',
          type: 'text',
          description: `SDRF ${sdrfColumn} | ${suggestion.ontology_type} | Confidence: ${(suggestion.confidence * 100).toFixed(1)}% | Analyzer: ${this.analysisResult?.analyzer_type || 'standard'}`,
          // Add special handling for modification parameters
          ...(suggestion.key_value_format && {
            MM: suggestion.key_value_format.MM,
            PP: suggestion.key_value_format.PP,
            TA: suggestion.key_value_format.TA,
            TS: suggestion.key_value_format.TS,
            MT: suggestion.key_value_format.MT
          })
        };
        allMetadataColumns.push(metadataColumn);
      }
    }

    if (allMetadataColumns.length === 0) {
      this.metadataCreated.emit({
        success: false,
        error: 'No metadata columns to create from suggestions',
        bulk_acceptance_summary: {
          total_accepted: 0,
          analyzer_type: this.analysisResult?.analyzer_type || 'standard'
        }
      });
      return;
    }

    // Use existing WebService to create all metadata columns
    const creationObservables = allMetadataColumns.map(column => 
      this.webService.createMetaDataColumn(annotation.id, column, 'annotation')
    );

    forkJoin(creationObservables).subscribe({
      next: (createdColumns) => {
        // Create comprehensive acceptance summary for bulk operation
        const bulkAcceptanceSummary = {
          accepted_suggestions: this.flatSuggestions.map(suggestion => ({
            ontology_name: suggestion.ontology_name,
            sdrf_column: suggestion.sdrf_column,
            confidence: suggestion.confidence,
            ontology_type: suggestion.ontology_type,
            accession: suggestion.accession,
            match_type: suggestion.match_type,
            ontology_source: suggestion.ontology_source
          })),
          total_accepted: this.flatSuggestions.length,
          analyzer_type: this.analysisResult?.analyzer_type || 'standard',
          accepted_at: new Date().toISOString(),
          confidence_distribution: {
            high: this.getHighConfidenceSuggestions(),
            medium: this.flatSuggestions.filter(s => s.confidence >= 0.6 && s.confidence < 0.8).length,
            low: this.flatSuggestions.filter(s => s.confidence < 0.6).length
          },
          ontology_breakdown: this.getOntologyBreakdown()
        };

        // Create enriched metadata response
        const enrichedMetadata = {
          success: true,
          created_columns: createdColumns.length,
          columns: createdColumns,
          bulk_acceptance_summary: bulkAcceptanceSummary
        };

        this.metadataCreated.emit(enrichedMetadata);
      },
      error: (error) => {
        console.error('Error creating bulk SDRF metadata columns:', error);
        this.metadataCreated.emit({
          success: false,
          error: 'Failed to create SDRF metadata columns: ' + error.message,
          bulk_acceptance_summary: {
            total_accepted: this.flatSuggestions.length,
            analyzer_type: this.analysisResult?.analyzer_type || 'standard'
          }
        });
      }
    });
  }

  private getOntologyBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    this.flatSuggestions.forEach(suggestion => {
      const ontologyType = suggestion.ontology_type;
      breakdown[ontologyType] = (breakdown[ontologyType] || 0) + 1;
    });
    return breakdown;
  }

  dismissSuggestion(suggestion: DisplaySuggestion) {
    this.removeSuggestionFromList(suggestion);
  }

  dismissAllSuggestions() {
    const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;
    currentResults.suggestions = {};
    currentResults.flatSuggestions = [];
  }

  toggleSuggestions() {
    // This method is no longer needed with tab-based layout
    // Keep for compatibility but make it a no-op
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-danger';
  }

  getConfidenceLabel(confidence: number): string {
    if (!confidence && confidence !== 0) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  }

  getSuggestionIcon(ontologyType: string): string {
    if (!ontologyType) return 'bi bi-tag';
    const displayInfo = this.mcpSdrfService.getOntologyDisplayInfo(ontologyType);
    return displayInfo.icon;
  }

  getSuggestionColor(ontologyType: string): string {
    if (!ontologyType) return 'text-muted';
    const displayInfo = this.mcpSdrfService.getOntologyDisplayInfo(ontologyType);
    return displayInfo.color;
  }

  getOntologyDisplayName(ontologyType: string): string {
    if (!ontologyType) return 'Unknown';
    const displayInfo = this.mcpSdrfService.getOntologyDisplayInfo(ontologyType);
    return displayInfo.name;
  }

  getOntologyDescription(ontologyType: string): string {
    if (!ontologyType) return 'Unknown ontology type';
    const displayInfo = this.mcpSdrfService.getOntologyDisplayInfo(ontologyType);
    return displayInfo.description;
  }


  formatSdrfColumn(column: string): string {
    if (!column) return '';
    return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  trackBySuggestion(index: number, suggestion: DisplaySuggestion): string {
    return `${suggestion.ontology_type || 'unknown'}-${suggestion.ontology_id || 'unknown'}-${suggestion.confidence || 0}`;
  }

  flattenSuggestions(suggestions: { [key: string]: SDRFSuggestion[] }): DisplaySuggestion[] {
    const flattened: DisplaySuggestion[] = [];
    for (const [columnType, columnSuggestions] of Object.entries(suggestions)) {
      for (const suggestion of columnSuggestions) {
        // Add column type info to suggestion for UI purposes
        flattened.push({
          ...suggestion,
          sdrf_column: columnType
        });
      }
    }
    return flattened;
  }

  removeSuggestionFromList(suggestion: DisplaySuggestion) {
    const currentResults = this.activeTabId === 'standard' ? this.standardResults : this.aiResults;

    // Find and remove the suggestion from the grouped suggestions
    for (const [columnType, columnSuggestions] of Object.entries(currentResults.suggestions)) {
      const index = columnSuggestions.findIndex(s =>
        s.ontology_id === suggestion.ontology_id &&
        s.ontology_type === suggestion.ontology_type
      );
      if (index !== -1) {
        columnSuggestions.splice(index, 1);
        if (columnSuggestions.length === 0) {
          delete currentResults.suggestions[columnType];
        }
        break;
      }
    }

    // Update flat suggestions
    currentResults.flatSuggestions = this.flattenSuggestions(currentResults.suggestions);
  }

  getTotalSuggestions(): number {
    return this.flatSuggestions.length;
  }

  getHighConfidenceSuggestions(): number {
    return this.flatSuggestions.filter(s => s.confidence >= 0.8).length;
  }

  getEnhancedSuggestions(): number {
    return this.flatSuggestions.filter(s => this.isEnhancedOntology(s)).length;
  }

  shouldShowEnhancedFeatures(): boolean {
    return this.getEnhancedSuggestions() > 0 || this.hasClaudeAnalysis();
  }

  isEnhancedOntology(suggestion: DisplaySuggestion): boolean {
    return suggestion.ontology_source === 'enhanced' ||
           ['mondo_disease', 'uberon_anatomy', 'ncbi_taxonomy', 'chebi_compound', 'psims_ontology', 'cell_type'].includes(suggestion.ontology_type);
  }

  getAnalyzerTypeDisplay(): string {
    if (this.selectedAnalyzerType === 'mcp_claude') {
      return 'AI Enhanced';
    }
    return 'Standard';
  }

  hasClaudeAnalysis(): boolean {
    return this.analysisResult?.analyzer_type === 'mcp_claude' &&
           this.analysisResult?.claude_analysis !== undefined;
  }

  getClaudeInsights(): any {
    // Deprecated - no longer used after Claude prompt update
    return {};
  }

  getAnalyzerDisplayName(analyzerType?: string): string {
    switch (analyzerType) {
      case 'standard_nlp':
        return 'Standard NLP';
      case 'mcp_claude':
        return 'AI Enhanced (MCP)';
      default:
        return 'Unknown';
    }
  }

  isCachedResult(result: MCPAnalysisResponse | null): boolean {
    return result?.cached === true;
  }

  getCacheInfo(result: MCPAnalysisResponse | null): string {
    if (!result?.cached) return '';

    const cacheDate = result.cache_updated_at || result.cache_created_at;
    if (cacheDate) {
      const date = new Date(cacheDate);
      return `Cached ${date.toLocaleString()}`;
    }
    return 'Cached result';
  }

  getQualityAssessment(): any {
    // Deprecated - no longer used after Claude prompt update
    return {};
  }

  getOntologyDatabasesUsed(): string[] {
    const ontologyTypes = new Set(this.flatSuggestions.map(s => s.ontology_type));
    const databases: string[] = [];

    if (ontologyTypes.has('organism') || ontologyTypes.has('ncbi_taxonomy')) databases.push('NCBI Taxonomy');
    if (ontologyTypes.has('disease') || ontologyTypes.has('mondo_disease')) databases.push('MONDO');
    if (ontologyTypes.has('organism part') || ontologyTypes.has('uberon_anatomy')) databases.push('UBERON');
    if (ontologyTypes.has('modification parameters') || ontologyTypes.has('unimod')) databases.push('UniMod');
    if (ontologyTypes.has('cell type')) databases.push('Cell Ontology');
    if (ontologyTypes.has('subcellular localization')) databases.push('GO Cellular Component');
    if (ontologyTypes.has('instrument') || ontologyTypes.has('psims_ontology')) databases.push('PSI-MS');
    if (ontologyTypes.has('chebi_compound')) databases.push('ChEBI');

    return databases.length > 0 ? databases : ['None detected'];
  }

  getValidSdrfSuggestions(): number {
    return this.flatSuggestions.filter(s =>
      s.ontology_type &&
      s.ontology_name &&
      s.confidence >= 0.5
    ).length;
  }

  getSuggestionTooltip(suggestion: DisplaySuggestion): string {
    let tooltip = `${this.getOntologyDisplayName(suggestion.ontology_type)}\n`;
    tooltip += `Confidence: ${(suggestion.confidence * 100).toFixed(1)}%\n`;
    tooltip += `Match: ${suggestion.match_type || 'unknown'}\n`;

    if (suggestion.definition) {
      tooltip += `Definition: ${suggestion.definition}\n`;
    }

    if (suggestion.synonyms) {
      tooltip += `Synonyms: ${suggestion.synonyms}\n`;
    }

    // Add UniMod-specific information to tooltip
    if (this.isUniModSuggestion(suggestion)) {
      tooltip += `\n--- UniMod Details ---\n`;
      if (suggestion.target_aa) tooltip += `Target AA: ${suggestion.target_aa}\n`;
      if (suggestion.monoisotopic_mass) tooltip += `Mass: ${suggestion.monoisotopic_mass} Da\n`;
      if (suggestion.modification_type) tooltip += `Type: ${suggestion.modification_type}\n`;
      if (suggestion.position) tooltip += `Position: ${suggestion.position}\n`;
      if (suggestion.chemical_formula) tooltip += `Formula: ${suggestion.chemical_formula}\n`;
    }

    if (this.isEnhancedOntology(suggestion)) {
      tooltip += 'Enhanced Ontology';
    } else {
      tooltip += 'Legacy Ontology';
    }

    return tooltip;
  }

  /**
   * Check if suggestion is a UniMod modification
   */
  isUniModSuggestion(suggestion: DisplaySuggestion): boolean {
    return suggestion.ontology_type === 'modification parameters' ||
           suggestion.sdrf_column === 'modification parameters' ||
           (suggestion.key_value_format && (suggestion.target_aa || suggestion.monoisotopic_mass));
  }

  /**
   * Get count of UniMod suggestions
   */
  getUniModSuggestions(): number {
    return this.flatSuggestions.filter(s => this.isUniModSuggestion(s)).length;
  }

  /**
   * Format key-value object as a single string
   */
  formatKeyValueString(keyValueFormat: any): string {
    if (!keyValueFormat) return '';
    return Object.entries(keyValueFormat)
      .map(([key, value]) => `${key}=${value}`)
      .join(';');
  }

  /**
   * Get tooltip for key-value format keys
   */
  getKeyValueTooltip(key: string): string {
    const tooltips: { [key: string]: string } = {
      'NT': 'Name (NT) - Modification name from UniMod database used for identification',
      'AC': 'Accession (AC) - Unique UniMod accession number for this modification',
      'TA': 'Target AA (TA) - Target amino acid that can be modified (e.g., M, C, K)',
      'MM': 'Monoisotopic Mass (MM) - Exact mass change in Daltons when modification occurs',
      'MT': 'Modification Type (MT) - Variable (optional) or Fixed (required) modification',
      'PP': 'Position (PP) - Where modification can occur: Anywhere, N-term (protein N-terminus), or C-term (protein C-terminus)',
      'TS': 'Target Site (TS) - Specific target site or motif for the modification',
      'CS': 'Cleavage Site (CS) - Enzyme cleavage specificity for proteolytic modifications'
    };
    return tooltips[key] || `${key} - SDRF metadata parameter`;
  }

  /**
   * Get tooltip for UniMod detail badges
   */
  getUniModDetailTooltip(type: 'target_aa' | 'mass' | 'modification_type' | 'position'): string {
    switch (type) {
      case 'target_aa':
        return 'Target amino acid that can be modified by this modification (single letter code)';
      case 'mass':
        return 'Monoisotopic mass change in Daltons - the exact mass difference when this modification is applied';
      case 'modification_type':
        return 'Modification type: Variable (optional, depends on conditions) or Fixed (always present)';
      case 'position':
        return 'Position specificity: where on the protein this modification can occur (Anywhere, N-terminus, C-terminus)';
      default:
        return 'UniMod modification parameter';
    }
  }

  /**
   * Get detailed explanation for summary badges
   */
  getSummaryBadgeTooltip(type: 'high' | 'unimod' | 'enhanced' | 'valid'): string {
    switch (type) {
      case 'high':
        return 'High confidence suggestions (≥80% confidence score) - These are very reliable matches that can be accepted with confidence';
      case 'unimod':
        return 'Protein modification parameters from the UniMod database - These include mass changes, target amino acids, and modification types for proteomics analysis';
      case 'enhanced':
        return 'Enhanced ontology suggestions from modern databases (MONDO for diseases, UBERON for anatomy, NCBI for organisms, ChEBI for compounds, PSI-MS for instruments) - These provide more comprehensive and standardized annotations';
      case 'valid':
        return 'Suggestions that meet SDRF-Proteomics specification requirements with sufficient confidence (≥50%) and complete ontology information - Ready for SDRF file generation';
      default:
        return 'Summary statistic for SDRF analysis results';
    }
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}
