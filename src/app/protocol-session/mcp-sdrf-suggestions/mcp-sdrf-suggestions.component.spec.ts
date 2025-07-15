import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { McpSdrfSuggestionsComponent } from './mcp-sdrf-suggestions.component';
import { McpSdrfService } from '../../mcp-sdrf.service';
import { ProtocolStep } from '../../protocol';

describe('McpSdrfSuggestionsComponent', () => {
  let component: McpSdrfSuggestionsComponent;
  let fixture: ComponentFixture<McpSdrfSuggestionsComponent>;
  let mockMcpSdrfService: jasmine.SpyObj<McpSdrfService>;
  let mockModalService: jasmine.SpyObj<NgbModal>;

  beforeEach(async () => {
    const mcpSdrfServiceSpy = jasmine.createSpyObj('McpSdrfService', [
      'analyzeProtocolStep',
      'createAnnotationFromSuggestions', 
      'generateMetadata'
    ]);
    const modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      imports: [McpSdrfSuggestionsComponent, NgbTooltip],
      providers: [
        { provide: McpSdrfService, useValue: mcpSdrfServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(McpSdrfSuggestionsComponent);
    component = fixture.componentInstance;
    mockMcpSdrfService = TestBed.inject(McpSdrfService) as jasmine.SpyObj<McpSdrfService>;
    mockModalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

    // Set up component inputs
    component.step = {
      step_id: 1,
      step_description: 'Test step description',
      reagents: []
    } as ProtocolStep;
    component.sessionId = 123;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should analyze step on initialization if step has description', () => {
    const analysisResult = {
      step_id: 1,
      suggestions: [],
      analysis_metadata: {
        total_suggestions: 0,
        high_confidence_count: 0,
        processing_time: 100,
        analysis_method: 'regex'
      }
    };
    
    mockMcpSdrfService.analyzeProtocolStep.and.returnValue(Promise.resolve(analysisResult));
    
    component.ngOnInit();
    
    expect(mockMcpSdrfService.analyzeProtocolStep).toHaveBeenCalledWith(
      1, 
      'Test step description', 
      123
    );
  });

  it('should handle analysis error gracefully', async () => {
    mockMcpSdrfService.analyzeProtocolStep.and.returnValue(
      Promise.reject(new Error('Analysis failed'))
    );

    await component.analyzeStep();

    expect(component.error).toBe('Failed to analyze step for SDRF annotations');
    expect(component.isAnalyzing).toBe(false);
  });

  it('should accept suggestion and emit events', async () => {
    const suggestion = {
      ontology_type: 'species',
      ontology_term: 'Homo sapiens',
      ontology_id: 'NCBITaxon:9606',
      confidence: 0.95,
      context: 'human samples',
      sdrf_column: 'organism',
      suggested_value: 'Homo sapiens'
    };

    const mockAnnotation = { id: 1, content: 'Test annotation' };
    const mockMetadata = { id: 1, columns: [] };

    mockMcpSdrfService.createAnnotationFromSuggestions.and.returnValue(
      Promise.resolve(mockAnnotation)
    );
    mockMcpSdrfService.generateMetadata.and.returnValue(
      Promise.resolve(mockMetadata)
    );

    spyOn(component.annotationCreated, 'emit');
    spyOn(component.metadataCreated, 'emit');

    component.suggestions = [suggestion];
    await component.acceptSuggestion(suggestion);

    expect(component.annotationCreated.emit).toHaveBeenCalledWith(mockAnnotation);
    expect(component.metadataCreated.emit).toHaveBeenCalledWith(mockMetadata);
    expect(component.suggestions.length).toBe(0);
  });

  it('should get correct confidence color', () => {
    expect(component.getConfidenceColor(0.9)).toBe('text-success');
    expect(component.getConfidenceColor(0.7)).toBe('text-warning');
    expect(component.getConfidenceColor(0.5)).toBe('text-danger');
  });

  it('should get correct confidence label', () => {
    expect(component.getConfidenceLabel(0.9)).toBe('High');
    expect(component.getConfidenceLabel(0.7)).toBe('Medium');
    expect(component.getConfidenceLabel(0.5)).toBe('Low');
  });

  it('should format SDRF column correctly', () => {
    expect(component.formatSdrfColumn('organism_part')).toBe('Organism Part');
    expect(component.formatSdrfColumn('sample_name')).toBe('Sample Name');
  });

  it('should track suggestions correctly', () => {
    const suggestion = {
      ontology_type: 'species',
      ontology_id: 'NCBITaxon:9606',
      confidence: 0.95
    } as any;

    const trackingId = component.trackBySuggestion(0, suggestion);
    expect(trackingId).toBe('species-NCBITaxon:9606-0.95');
  });
});