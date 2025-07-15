import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface MCPAnalysisRequest {
  step_id: number;
  use_anthropic?: boolean;
  anthropic_api_key?: string;
  use_async?: boolean;
}

export interface MCPTaskResponse {
  success: boolean;
  task_id: string;
  job_id: string;
  step_id?: number;
  protocol_id?: number;
  status: string;
  message: string;
}

export interface MCPTaskUpdate {
  task_id: string;
  step_id?: number;
  protocol_id?: number;
  status: string;
  message: string;
  progress: number;
  data?: any;
}

export interface MCPAnalysisResponse {
  success: boolean;
  step_id: number;
  sdrf_suggestions?: { [key: string]: SDRFSuggestion[] };
  analysis_summary?: {
    total_matches: number;
    high_confidence_matches: number;
    sdrf_specific_suggestions?: number;
    ontology_breakdown?: { [key: string]: number };
  };
  detailed_analysis?: any;
  claude_analysis?: {
    biological_insights?: any;
    sdrf_relevance?: { [key: string]: string[] };
    quality_assessment?: any;
    raw_claude_response?: string;
  };
  biological_insights?: any;
  analyzer_type?: 'standard_nlp' | 'mcp_claude';
  enhanced_terms?: any[];
  sdrf_suggestions_enhanced?: any;
  analysis_metadata?: {
    analyzer_type: string;
    total_terms_extracted: number;
    total_ontology_matches: number;
    high_confidence_matches: number;
    claude_insights?: any;
    quality_assessment?: any;
  };
  extracted_terms?: any[];
  // Cache-related fields
  cached?: boolean;
  cache_created_at?: string;
  cache_updated_at?: string;
  error?: string;
}

export interface GenerateMetadataRequest {
  step_id: number;
  auto_create?: boolean;
  use_anthropic?: boolean;
  anthropic_api_key?: string;
}

export interface GenerateMetadataResponse {
  success: boolean;
  step_id: number;
  metadata_specifications?: any[];
  created_columns?: number;
  auto_created?: boolean;
  column_details?: any[];
  analysis_summary?: any;
  error?: string;
}

export interface SDRFSuggestion {
  ontology_type: string;
  ontology_id: string;
  ontology_name: string;
  accession: string;
  confidence: number;
  extracted_term: string;
  reasoning?: string;
  biological_context?: string;
  match_type?: string;
  // Enhanced ontology fields
  definition?: string;
  synonyms?: string;
  xrefs?: string;
  parent_terms?: string;
  // Claude-specific fields
  claude_reasoning?: string;
  suggested_ontology?: string;
  combined_confidence?: number;
  // For enhanced display
  ontology_source?: 'legacy' | 'enhanced';
  category?: string;
  // SDRF-specific fields
  key_value_format?: any;
  source?: string;
  suggested_value?: string;
  // Enhanced UniMod fields
  target_aa?: string;
  monoisotopic_mass?: string;
  modification_type?: string;
  position?: string;
  unimod_specs?: any;
  chemical_formula?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McpSdrfService {
  private baseURL = environment.baseURL;
  
  // Observable for real-time analysis updates
  private analysisUpdates = new BehaviorSubject<any>(null);
  public analysisUpdates$ = this.analysisUpdates.asObservable();

  // WebSocket connections for different task types
  private analysisWebSocket: WebSocket | null = null;
  private metadataWebSocket: WebSocket | null = null;
  private validationWebSocket: WebSocket | null = null;
  private exportWebSocket: WebSocket | null = null;

  // Subject for task updates
  private taskUpdates = new Subject<MCPTaskUpdate>();
  public taskUpdates$ = this.taskUpdates.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Analyze a protocol step using MCP SDRF analysis
   */
  analyzeProtocolStep(request: MCPAnalysisRequest): Observable<MCPAnalysisResponse | MCPTaskResponse> {
    return this.http.post<MCPAnalysisResponse | MCPTaskResponse>(
      `${this.baseURL}/api/mcp/analyze-step/`,
      request
    );
  }

  /**
   * Get task status for async operations
   */
  getTaskStatus(taskId: string, jobId?: string): Observable<any> {
    const params: any = { task_id: taskId };
    if (jobId) {
      params.job_id = jobId;
    }
    
    return this.http.get(`${this.baseURL}/api/mcp/task-status/`, { params });
  }

  /**
   * Generate SDRF metadata columns from analysis
   */
  generateMetadata(request: GenerateMetadataRequest): Observable<GenerateMetadataResponse> {
    return this.http.post<GenerateMetadataResponse>(
      `${this.baseURL}/api/mcp/generate-metadata/`,
      request
    );
  }

  /**
   * Match terms to ontology vocabularies
   */
  matchTerms(terms: string[], ontology_types?: string[], min_confidence?: number): Observable<any> {
    const request = {
      terms,
      ontology_types,
      min_confidence: min_confidence || 0.5
    };
    
    return this.http.post(
      `${this.baseURL}/api/mcp/match-terms/`,
      request
    );
  }

  /**
   * Validate SDRF compliance for a protocol step
   */
  validateCompliance(step_id: number): Observable<any> {
    return this.http.post(
      `${this.baseURL}/api/mcp/validate-compliance/`,
      { step_id }
    );
  }

  /**
   * Export protocol as SDRF file
   */
  exportSDRF(protocol_id: number): Observable<any> {
    return this.http.post(
      `${this.baseURL}/api/mcp/export-sdrf/`,
      { protocol_id }
    );
  }

  /**
   * Analyze full protocol (all steps)
   */
  analyzeFullProtocol(protocol_id: number, use_anthropic?: boolean, anthropic_api_key?: string): Observable<any> {
    const request: any = { protocol_id };
    if (use_anthropic) {
      request.use_anthropic = true;
      if (anthropic_api_key) {
        request.anthropic_api_key = anthropic_api_key;
      }
    }
    
    return this.http.post(
      `${this.baseURL}/api/mcp/analyze-protocol/`,
      request
    );
  }

  /**
   * Create a text annotation from SDRF suggestions
   */
  createAnnotationFromSuggestions(
    step_id: number,
    session_id: string | null,
    suggestions: { [key: string]: SDRFSuggestion[] },
    analyzer_type: string = 'regex'
  ): Observable<any> {
    // Format the suggestions into a readable annotation
    const annotationText = this.formatSuggestionsAsText(suggestions, analyzer_type);
    
    // Use the existing annotation service method
    const form = new FormData();
    form.append('annotation', annotationText);
    form.append('annotation_type', 'text');
    form.append('step', step_id.toString());
    if (session_id) {
      form.append('session', session_id);
    }
    // Add metadata to indicate this is an MCP-generated annotation
    form.append('annotation_name', `SDRF Analysis (${analyzer_type})`);
    
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      { responseType: 'json', observe: 'body' }
    );
  }

  /**
   * Format SDRF suggestions as readable text for annotation
   */
  private formatSuggestionsAsText(
    suggestions: { [key: string]: SDRFSuggestion[] },
    analyzer_type: string
  ): string {
    let text = `## SDRF Analysis Results - Accepted Suggestions (${analyzer_type})\n\n`;
    text += `Generated on: ${new Date().toLocaleString()}\n`;
    text += `Status: ✅ ACCEPTED\n\n`;

    // Calculate summary statistics
    const allSuggestions = Object.values(suggestions).flat();
    const totalSuggestions = allSuggestions.length;
    const highConfidence = allSuggestions.filter(s => s.confidence >= 0.8).length;
    const mediumConfidence = allSuggestions.filter(s => s.confidence >= 0.6 && s.confidence < 0.8).length;
    const lowConfidence = allSuggestions.filter(s => s.confidence < 0.6).length;
    const enhancedSuggestions = allSuggestions.filter(s => s.ontology_source === 'enhanced').length;
    
    // Add summary section
    text += `### 📊 Acceptance Summary\n`;
    text += `- **Total Accepted:** ${totalSuggestions} suggestion${totalSuggestions !== 1 ? 's' : ''}\n`;
    text += `- **Confidence Distribution:**\n`;
    text += `  - High (≥80%): ${highConfidence} suggestions\n`;
    text += `  - Medium (60-79%): ${mediumConfidence} suggestions\n`;
    text += `  - Low (<60%): ${lowConfidence} suggestions\n`;
    text += `- **SDRF Columns:** ${Object.keys(suggestions).length} column type${Object.keys(suggestions).length !== 1 ? 's' : ''}\n\n`;

    // Group suggestions by SDRF column type
    const columnTypes = Object.keys(suggestions);
    
    if (columnTypes.length === 0) {
      text += "No SDRF suggestions found for this protocol step.\n";
      return text;
    }

    // Add ontology breakdown
    const ontologyBreakdown: { [key: string]: number } = {};
    allSuggestions.forEach(suggestion => {
      const ontologyType = suggestion.ontology_type;
      ontologyBreakdown[ontologyType] = (ontologyBreakdown[ontologyType] || 0) + 1;
    });
    
    text += `### 🔬 Ontology Breakdown\n`;
    Object.entries(ontologyBreakdown).forEach(([ontology, count]) => {
      text += `- **${ontology}:** ${count} suggestion${count !== 1 ? 's' : ''}\n`;
    });
    text += `\n`;

    // Detailed suggestions
    text += `### 📋 Detailed Accepted Suggestions\n\n`;
    
    for (const columnType of columnTypes) {
      const columnSuggestions = suggestions[columnType];
      if (columnSuggestions.length === 0) continue;

      text += `#### ${columnType.toUpperCase()}\n`;
      
      for (const suggestion of columnSuggestions) {
        text += `- **${suggestion.ontology_name}**\n`;
        text += `  - **Extracted Term:** "${suggestion.extracted_term}"\n`;
        text += `  - **Ontology:** ${suggestion.ontology_type}\n`;
        text += `  - **Accession:** ${suggestion.accession}\n`;
        text += `  - **Confidence Score:** ${(suggestion.confidence * 100).toFixed(1)}%\n`;
        
        if (suggestion.match_type) {
          text += `  - **Match Type:** ${suggestion.match_type}\n`;
        }
        
        
        // Add key-value format for modification parameters
        if (suggestion.key_value_format) {
          text += `  - **SDRF Format:** `;
          const kvPairs = Object.entries(suggestion.key_value_format).map(([k, v]) => `${k}=${v}`);
          text += kvPairs.join('; ') + '\n';
        }
        
        if (suggestion.definition) {
          text += `  - **Definition:** ${suggestion.definition}\n`;
        }
        
        if (suggestion.reasoning || suggestion.claude_reasoning) {
          text += `  - **Reasoning:** ${suggestion.reasoning || suggestion.claude_reasoning}\n`;
        }
        
        if (suggestion.biological_context) {
          text += `  - **Biological Context:** ${suggestion.biological_context}\n`;
        }
        
        if (suggestion.synonyms) {
          text += `  - **Synonyms:** ${suggestion.synonyms}\n`;
        }
        
        text += '\n';
      }
    }

    text += '\n---\n';
    text += `*This annotation represents accepted SDRF suggestions from the MCP analysis system.*\n`;
    text += `*Analyzer: ${analyzer_type}*\n`;
    text += `*${totalSuggestions} suggestion${totalSuggestions !== 1 ? 's' : ''} accepted*\n`;
    
    return text;
  }

  /**
   * Get analysis status for UI updates
   */
  getAnalysisStatus(): Observable<any> {
    return this.analysisUpdates$;
  }

  /**
   * Update analysis status (for WebSocket integration)
   */
  updateAnalysisStatus(status: any): void {
    this.analysisUpdates.next(status);
  }

  /**
   * Create WebSocket connection for real-time analysis
   */
  connectWebSocket(): WebSocket | null {
    if (typeof WebSocket === 'undefined') {
      console.warn('WebSocket not supported in this environment');
      return null;
    }

    const wsUrl = `${environment.baseURL.replace('http', 'ws')}/ws/mcp/analysis/`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('MCP WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateAnalysisStatus(data);
    };

    ws.onerror = (error) => {
      console.error('MCP WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('MCP WebSocket disconnected');
    };

    return ws;
  }

  /**
   * Check if Anthropic analysis is available
   */
  checkAnthropicAvailability(): boolean {
    // This could be enhanced to check server configuration
    return true; // Assume available for now
  }

  /**
   * Get suggested annotation name based on analysis results
   */
  getSuggestedAnnotationName(suggestions: { [key: string]: SDRFSuggestion[] }, analyzer_type: string): string {
    const suggestionCount = Object.values(suggestions).reduce((total, arr) => total + arr.length, 0);
    const mainTypes = Object.keys(suggestions).slice(0, 2).join(', ');
    
    // Count enhanced vs legacy ontologies
    const enhancedCount = Object.values(suggestions).flat().filter(s => s.ontology_source === 'enhanced').length;
    const legacyCount = suggestionCount - enhancedCount;
    
    if (suggestionCount === 0) {
      return `SDRF Analysis (${analyzer_type}) - No matches`;
    } else if (mainTypes) {
      const sourceInfo = enhancedCount > 0 ? ` (${enhancedCount} enhanced)` : '';
      return `SDRF Analysis (${analyzer_type}) - ${mainTypes}${sourceInfo}`;
    } else {
      return `SDRF Analysis (${analyzer_type}) - ${suggestionCount} suggestions`;
    }
  }

  /**
   * Normalize SDRF suggestions to the expected format
   */
  normalizeSdrfSuggestions(suggestions: { [key: string]: any[] }): { [key: string]: SDRFSuggestion[] } {
    const normalized: { [key: string]: SDRFSuggestion[] } = {};
    
    for (const [columnType, columnSuggestions] of Object.entries(suggestions)) {
      normalized[columnType] = columnSuggestions.map((suggestion, index) => {
        // Handle SDRF-specific format (like modification parameters)
        if (suggestion.key_value_format) {
          const keyValueFormat = suggestion.key_value_format;
          
          // Create display name with amino acid and mass info for modifications
          let displayName = keyValueFormat.NT || 'Unknown';
          if (keyValueFormat.TA && keyValueFormat.MM) {
            displayName += ` (${keyValueFormat.TA}: ${keyValueFormat.MM} Da)`;
          } else if (keyValueFormat.TA) {
            displayName += ` (${keyValueFormat.TA})`;
          }
          
          return {
            ontology_type: columnType,  // Use exact SDRF column name
            ontology_id: keyValueFormat.AC || `${columnType}_${index}`,
            ontology_name: displayName,
            accession: keyValueFormat.AC || '',
            confidence: suggestion.confidence || 0.8,
            extracted_term: keyValueFormat.NT || '',
            source: suggestion.source || 'text_analysis',
            key_value_format: keyValueFormat,
            match_type: 'exact',
            ontology_source: 'enhanced' as 'enhanced',
            // Additional fields for enhanced display
            target_aa: keyValueFormat.TA,
            monoisotopic_mass: keyValueFormat.MM,
            modification_type: keyValueFormat.MT,
            position: keyValueFormat.PP,
            unimod_specs: suggestion.unimod_specs
          };
        }
        
        // Handle direct suggested_value format
        if (suggestion.suggested_value) {
          return {
            ontology_type: columnType,  // Use exact SDRF column name
            ontology_id: `${columnType}_${index}`,
            ontology_name: suggestion.suggested_value,
            accession: '',
            confidence: suggestion.confidence || 0.8,
            extracted_term: suggestion.suggested_value,
            source: suggestion.source || 'text_analysis',
            suggested_value: suggestion.suggested_value,
            match_type: 'exact',
            ontology_source: 'enhanced' as 'enhanced'
          };
        }
        
        // Handle standard ontology match format
        if (suggestion.ontology_name) {
          // Use the columnType (e.g., "modification parameters") as the ontology_type if not provided
          const ontologyType = suggestion.ontology_type || columnType;
          const mappedType = this.mapToSdrfColumnName(ontologyType);
          return {
            ...suggestion,
            ontology_type: mappedType,
            ontology_source: this.isEnhancedOntologyType(mappedType) ? 'enhanced' as 'enhanced' : 'legacy' as 'legacy'
          };
        }
        
        // Fallback for unknown formats
        return {
          ontology_type: columnType,  // Use exact SDRF column name
          ontology_id: `unknown_${index}`,
          ontology_name: 'Unknown',
          accession: '',
          confidence: suggestion.confidence || 0.0,
          extracted_term: suggestion.term || suggestion.text || 'Unknown',
          source: suggestion.source || 'unknown',
          match_type: 'unknown',
          ontology_source: 'legacy' as 'legacy'
        };
      });
    }
    
    return normalized;
  }

  /**
   * Map legacy ontology types to SDRF column names
   */
  private mapToSdrfColumnName(ontologyType: string): string {
    const mapping: { [key: string]: string } = {
      // Legacy ontology types -> SDRF column names
      'species': 'organism',
      'tissue': 'organism part',
      'human_disease': 'disease',
      'subcellular_location': 'subcellular localization',
      'cell_type': 'cell type',
      'unimod': 'modification parameters',
      'ms_vocabularies': 'instrument',  // Default fallback
      'ms_mod': 'modification parameters',
      
      // Enhanced ontology types -> SDRF column names  
      'mondo_disease': 'disease',
      'uberon_anatomy': 'organism part',
      'ncbi_taxonomy': 'organism',
      'chebi_compound': 'reduction reagent',  // Default fallback
      'psims_ontology': 'instrument'  // Default fallback
    };
    
    return mapping[ontologyType] || ontologyType;
  }

  /**
   * Check if an ontology type is enhanced (based on SDRF column names)
   */
  private isEnhancedOntologyType(ontologyType: string): boolean {
    const enhancedTypes = [
      // Enhanced ontology SDRF columns
      'disease',  // mondo_disease -> disease
      'organism part',  // uberon_anatomy -> organism part
      'organism',  // ncbi_taxonomy -> organism  
      'cell type',  // cell_type -> cell type
      'modification parameters',  // unimod -> modification parameters
      'cleavage agent details',  // for cleavage agents
      'instrument',  // for instruments
      'reduction reagent',  // for reduction reagents
      'alkylation reagent',  // for alkylation reagents
      'label',  // for labeling
      'fraction identifier',  // for fractions
      'dissociation method',  // for fragmentation
      'enrichment process',  // for enrichment
      'fractionation method'  // for fractionation
    ];
    return enhancedTypes.includes(ontologyType);
  }

  /**
   * Get ontology display information
   */
  getOntologyDisplayInfo(ontologyType: string): { name: string; icon: string; color: string; description: string } {
    const ontologyInfo: { [key: string]: any } = {
      // SDRF characteristics columns
      'organism': {
        name: 'Organism',
        icon: 'bi bi-diagram-3',
        color: 'text-success',
        description: 'Sample organism from NCBI Taxonomy'
      },
      'disease': {
        name: 'Disease',
        icon: 'bi bi-person-badge',
        color: 'text-danger',
        description: 'Disease/condition from MONDO ontology'
      },
      'organism part': {
        name: 'Organism Part',
        icon: 'bi bi-eyedropper',
        color: 'text-primary',
        description: 'Anatomical structures from UBERON ontology'
      },
      'cell type': {
        name: 'Cell Type',
        icon: 'bi bi-circle-fill',
        color: 'text-secondary',
        description: 'Cell types and cell lines'
      },
      'subcellular localization': {
        name: 'Subcellular Localization',
        icon: 'bi bi-circle',
        color: 'text-info',
        description: 'Cellular components and locations'
      },
      'cell line': {
        name: 'Cell Line',
        icon: 'bi bi-circle-square',
        color: 'text-secondary',
        description: 'Cell line specifications'
      },
      'age': {
        name: 'Age',
        icon: 'bi bi-calendar',
        color: 'text-muted',
        description: 'Subject age information'
      },
      'sex': {
        name: 'Sex',
        icon: 'bi bi-gender-ambiguous',
        color: 'text-muted',
        description: 'Subject sex information'
      },
      'enrichment process': {
        name: 'Enrichment Process',
        icon: 'bi bi-funnel',
        color: 'text-info',
        description: 'Sample enrichment methods'
      },
      
      // SDRF comment columns
      'instrument': {
        name: 'Instrument',
        icon: 'bi bi-gear',
        color: 'text-primary',
        description: 'MS instrument specifications'
      },
      'label': {
        name: 'Label',
        icon: 'bi bi-tag',
        color: 'text-success',
        description: 'Sample labeling information'
      },
      'fraction identifier': {
        name: 'Fraction Identifier',
        icon: 'bi bi-layers',
        color: 'text-info',
        description: 'Sample fraction number'
      },
      'data file': {
        name: 'Data File',
        icon: 'bi bi-file-earmark',
        color: 'text-dark',
        description: 'Raw or processed data file'
      },
      'modification parameters': {
        name: 'Modification Parameters',
        icon: 'bi bi-atom',
        color: 'text-warning',
        description: 'Protein modifications with key-value format'
      },
      'cleavage agent details': {
        name: 'Cleavage Agent Details',
        icon: 'bi bi-scissors',
        color: 'text-info',
        description: 'Enzymatic cleavage specifications'
      },
      'reduction reagent': {
        name: 'Reduction Reagent',
        icon: 'bi bi-droplet',
        color: 'text-primary',
        description: 'Disulfide reduction agent'
      },
      'alkylation reagent': {
        name: 'Alkylation Reagent',
        icon: 'bi bi-droplet-fill',
        color: 'text-primary',
        description: 'Alkylation agent'
      },
      'dissociation method': {
        name: 'Dissociation Method',
        icon: 'bi bi-lightning',
        color: 'text-warning',
        description: 'Fragmentation method'
      },
      'fractionation method': {
        name: 'Fractionation Method',
        icon: 'bi bi-funnel-fill',
        color: 'text-info',
        description: 'Sample fractionation technique'
      },
      'MS2 analyzer type': {
        name: 'MS2 Analyzer Type',
        icon: 'bi bi-gear-wide',
        color: 'text-primary',
        description: 'Mass analyzer for MS2 scans'
      },
      'collision energy': {
        name: 'Collision Energy',
        icon: 'bi bi-lightning-charge',
        color: 'text-warning',
        description: 'Fragmentation collision energy'
      },
      'proteomics data acquisition method': {
        name: 'Data Acquisition Method',
        icon: 'bi bi-graph-up',
        color: 'text-success',
        description: 'DDA, DIA, PRM, SRM acquisition method'
      },
      'precursor mass tolerance': {
        name: 'Precursor Mass Tolerance',
        icon: 'bi bi-bullseye',
        color: 'text-info',
        description: 'Precursor mass tolerance'
      },
      'fragment mass tolerance': {
        name: 'Fragment Mass Tolerance',
        icon: 'bi bi-bullseye',
        color: 'text-info',
        description: 'Fragment mass tolerance'
      },
      
      // Legacy ontology types (backward compatibility)
      'species': {
        name: 'Species (Legacy)',
        icon: 'bi bi-diagram-3',
        color: 'text-success',
        description: 'Legacy species ontology'
      },
      'tissue': {
        name: 'Tissue (Legacy)',
        icon: 'bi bi-eyedropper',
        color: 'text-primary',
        description: 'Legacy tissue ontology'
      },
      'human_disease': {
        name: 'Human Disease (Legacy)',
        icon: 'bi bi-person-badge',
        color: 'text-danger',
        description: 'Legacy disease ontology'
      },
      'subcellular_location': {
        name: 'Subcellular Location (Legacy)',
        icon: 'bi bi-circle',
        color: 'text-info',
        description: 'Legacy subcellular location'
      },
      'unimod': {
        name: 'UniMod (Legacy)',
        icon: 'bi bi-atom',
        color: 'text-warning',
        description: 'Legacy UniMod modifications'
      },
      'ms_vocabularies': {
        name: 'MS Vocabularies (Legacy)',
        icon: 'bi bi-gear',
        color: 'text-info',
        description: 'Legacy MS vocabularies'
      }
    };

    return ontologyInfo[ontologyType] || {
      name: ontologyType,
      icon: 'bi bi-tag',
      color: 'text-muted',
      description: 'Unknown ontology type'
    };
  }

  /**
   * Connect to MCP analysis WebSocket for real-time updates
   */
  connectAnalysisWebSocket(): void {
    if (this.analysisWebSocket) {
      this.analysisWebSocket.close();
    }

    const wsUrl = `${environment.baseURL.replace('http', 'ws')}/ws/mcp/analysis/`;
    this.analysisWebSocket = new WebSocket(wsUrl);

    this.analysisWebSocket.onopen = () => {
      console.log('MCP Analysis WebSocket connected');
    };

    this.analysisWebSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'analysis_update') {
        this.taskUpdates.next(data.data);
      }
    };

    this.analysisWebSocket.onerror = (error) => {
      console.error('MCP Analysis WebSocket error:', error);
    };

    this.analysisWebSocket.onclose = () => {
      console.log('MCP Analysis WebSocket disconnected');
    };
  }

  /**
   * Connect to MCP metadata WebSocket for real-time updates
   */
  connectMetadataWebSocket(): void {
    if (this.metadataWebSocket) {
      this.metadataWebSocket.close();
    }

    const wsUrl = `${environment.baseURL.replace('http', 'ws')}/ws/mcp/metadata/`;
    this.metadataWebSocket = new WebSocket(wsUrl);

    this.metadataWebSocket.onopen = () => {
      console.log('MCP Metadata WebSocket connected');
    };

    this.metadataWebSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metadata_update') {
        this.taskUpdates.next(data.data);
      }
    };

    this.metadataWebSocket.onerror = (error) => {
      console.error('MCP Metadata WebSocket error:', error);
    };

    this.metadataWebSocket.onclose = () => {
      console.log('MCP Metadata WebSocket disconnected');
    };
  }

  /**
   * Connect to MCP validation WebSocket for real-time updates
   */
  connectValidationWebSocket(): void {
    if (this.validationWebSocket) {
      this.validationWebSocket.close();
    }

    const wsUrl = `${environment.baseURL.replace('http', 'ws')}/ws/mcp/validation/`;
    this.validationWebSocket = new WebSocket(wsUrl);

    this.validationWebSocket.onopen = () => {
      console.log('MCP Validation WebSocket connected');
    };

    this.validationWebSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'validation_update') {
        this.taskUpdates.next(data.data);
      }
    };

    this.validationWebSocket.onerror = (error) => {
      console.error('MCP Validation WebSocket error:', error);
    };

    this.validationWebSocket.onclose = () => {
      console.log('MCP Validation WebSocket disconnected');
    };
  }

  /**
   * Connect to MCP export WebSocket for real-time updates
   */
  connectExportWebSocket(): void {
    if (this.exportWebSocket) {
      this.exportWebSocket.close();
    }

    const wsUrl = `${environment.baseURL.replace('http', 'ws')}/ws/mcp/export/`;
    this.exportWebSocket = new WebSocket(wsUrl);

    this.exportWebSocket.onopen = () => {
      console.log('MCP Export WebSocket connected');
    };

    this.exportWebSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'export_update') {
        this.taskUpdates.next(data.data);
      }
    };

    this.exportWebSocket.onerror = (error) => {
      console.error('MCP Export WebSocket error:', error);
    };

    this.exportWebSocket.onclose = () => {
      console.log('MCP Export WebSocket disconnected');
    };
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAllWebSockets(): void {
    if (this.analysisWebSocket) {
      this.analysisWebSocket.close();
      this.analysisWebSocket = null;
    }
    if (this.metadataWebSocket) {
      this.metadataWebSocket.close();
      this.metadataWebSocket = null;
    }
    if (this.validationWebSocket) {
      this.validationWebSocket.close();
      this.validationWebSocket = null;
    }
    if (this.exportWebSocket) {
      this.exportWebSocket.close();
      this.exportWebSocket = null;
    }
  }

  /**
   * Check if analysis WebSocket is connected
   */
  isAnalysisWebSocketConnected(): boolean {
    return this.analysisWebSocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Filter task updates by task ID
   */
  getTaskUpdatesForTask(taskId: string): Observable<MCPTaskUpdate> {
    return this.taskUpdates$.pipe(
      filter((update: MCPTaskUpdate) => update.task_id === taskId)
    );
  }
}