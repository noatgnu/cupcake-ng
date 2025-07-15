import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { MetadataService } from '../../metadata.service';
import { WebService } from '../../web.service';
import { SDRFSuggestion } from '../../mcp-sdrf.service';
import { Observable, debounceTime, distinctUntilChanged, switchMap, map, of, catchError } from 'rxjs';

interface ModificationSpec {
  id: string;
  aa: string;
  classification: string;
  mono_mass: number;
  position: string;
  target_site?: string;
  accession?: string;
}

@Component({
  selector: 'app-mcp-modification-parameter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeahead],
  templateUrl: './mcp-modification-parameter-modal.component.html',
  styleUrls: ['./mcp-modification-parameter-modal.component.scss']
})
export class McpModificationParameterModalComponent implements OnInit {
  @Input() suggestion!: SDRFSuggestion;
  
  form: FormGroup;
  selectedSpecs: ModificationSpec[] = [];
  allowMultipleSpecSelection = true;
  availableSpecs: ModificationSpec[] = [];
  
  modificationPositions = [
    'Any N-term',
    'Any C-term', 
    'Anywhere',
    'Protein N-term',
    'Protein C-term'
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    public metadataService: MetadataService,
    private webService: WebService
  ) {
    this.form = this.fb.group({
      metadataName: ['Modification parameters'],
      metadataMT: ['Variable'],
      metadataValue: ['']
    });
  }

  ngOnInit() {
    // Initialize from suggestion first
    if (this.suggestion) {
      this.parseAndPrePopulate();
    }
    
    // Load UniMod specifications from database like JobMetadataCreationModalComponent
    this.loadInitialUnimodSpecs();
  }

  private loadInitialUnimodSpecs() {
    // Load UniMod specs if suggestion has a modification name
    const termName = this.suggestion?.ontology_name || this.suggestion?.extracted_term || '';
    if (termName) {
      this.webService.getUnimod(undefined, 20, 0, termName, 'startswith').subscribe({
        next: (response) => {
          this.metadataService.optionsArray = response.results;
          // Process the response to generate availableSpecs like in JobMetadataCreationModalComponent
          this.processUnimodSpecs(response.results);
        },
        error: (error) => {
          console.error('Error loading UniMod specs:', error);
          // Fall back to existing metadata service specs
          this.availableSpecs = this.metadataService.availableSpecs || [];
        }
      });
    } else {
      // Load general modification parameters if no specific term
      this.webService.getUnimod(undefined, 50, 0).subscribe({
        next: (response) => {
          this.metadataService.optionsArray = response.results;
          this.processUnimodSpecs(response.results);
        },
        error: (error) => {
          console.error('Error loading UniMod specs:', error);
          this.availableSpecs = this.metadataService.availableSpecs || [];
        }
      });
    }
  }

  private processUnimodSpecs(unimodResults: any[]) {
    // Process UniMod results to generate availableSpecs following the same pattern as MetadataService
    const mapData: any = {};
    
    for (const unimod of unimodResults) {
      if (unimod.additional_data) {
        let deltaMonoMass = 0;
        
        // First pass: get delta_mono_mass from the main UniMod object
        for (const additional of unimod.additional_data) {
          if (additional.id === 'delta_mono_mass') {
            deltaMonoMass = parseFloat(additional.description) || 0;
            break;
          }
        }
        
        // Second pass: process spec data - use the same deltaMonoMass for ALL specs
        for (const additional of unimod.additional_data) {
          if (additional.id?.startsWith('spec_')) {
            const nameSplitted = additional.id.split('_');
            const specName = `spec_${nameSplitted[1]}`;
            
            if (!mapData[specName]) {
              mapData[specName] = {
                name: specName,
                target_site: '',
                id: unimod.accession,
                classification: unimod.name,
                mono_mass: deltaMonoMass, // Use the main delta_mono_mass, not spec-specific mass
                accession: unimod.accession
              };
            }
            
            if (additional.id.endsWith('position')) {
              if (additional.description.includes('Anywhere') || 
                  additional.description.includes('N-term') || 
                  additional.description.includes('C-term')) {
                mapData[specName].position = additional.description;
              }
            } else if (additional.id.endsWith('site')) {
              mapData[specName].aa = additional.description;
            } else if (additional.id.endsWith('classification')) {
              mapData[specName].classification = additional.description;
            }
            
            // Ensure mono_mass is always set to the main delta_mono_mass
            mapData[specName].mono_mass = deltaMonoMass;
          }
        }
      }
    }
    
    this.availableSpecs = Object.values(mapData);
    this.metadataService.availableSpecs = this.availableSpecs;
    
    // Update selected specs with loaded data
    this.updateSelectedSpecsFromAvailable();
  }

  // Update selected specs when availableSpecs are loaded
  private updateSelectedSpecsFromAvailable() {
    if (this.selectedSpecs.length > 0 && this.availableSpecs.length > 0) {
      const currentSpec = this.selectedSpecs[0];
      const termName = this.suggestion.ontology_name || this.suggestion.extracted_term || '';
      
      // Look for matching specs based on term name or accession
      const matchingSpecs = this.availableSpecs.filter(spec => {
        if (this.suggestion.accession && spec.id === this.suggestion.accession) {
          return true;
        }
        return termName.toLowerCase().includes(spec.classification.toLowerCase()) ||
               spec.classification.toLowerCase().includes(termName.toLowerCase());
      });

      if (matchingSpecs.length > 0) {
        // Update with matched data, but preserve any existing values
        const matchedSpec = matchingSpecs[0];
        this.selectedSpecs[0] = {
          ...matchedSpec,
          position: currentSpec.position || matchedSpec.position || 'Anywhere',
          aa: currentSpec.aa || matchedSpec.aa,
          mono_mass: currentSpec.mono_mass || matchedSpec.mono_mass,
          target_site: currentSpec.target_site || matchedSpec.target_site
        };
      }
    }
  }

  parseAndPrePopulate() {
    // Handle key_value_format suggestions (modification parameters with semicolon format)
    if (this.suggestion.key_value_format) {
      const kvFormat = this.suggestion.key_value_format;
      this.selectedSpecs = [{
        id: kvFormat.AC || 'custom',
        aa: kvFormat.TA || '',
        classification: kvFormat.NT || this.suggestion.ontology_name || 'Custom',
        mono_mass: parseFloat(kvFormat.MM) || 0,
        position: kvFormat.PP || 'Anywhere',
        target_site: kvFormat.TS || '',
        accession: kvFormat.AC || this.suggestion.accession
      }];
      
      // Set form values from key_value_format
      if (kvFormat.MT) {
        this.form.patchValue({ metadataMT: kvFormat.MT });
      }
    } else {
      // Handle regular suggestions - create a placeholder that will be matched later
      const termName = this.suggestion.ontology_name || this.suggestion.extracted_term || '';
      this.selectedSpecs = [{
        id: this.suggestion.accession || 'custom',
        aa: '', // Will be filled when UniMod specs load
        classification: termName,
        mono_mass: 0, // Will be filled when UniMod specs load
        position: 'Anywhere',
        target_site: '',
        accession: this.suggestion.accession
      }];
    }
  }

  addSpec() {
    this.selectedSpecs.push({
      id: 'custom',
      aa: '',
      classification: 'Custom',
      mono_mass: 0,
      position: 'Anywhere'
    });
  }

  removeSpec(index: number) {
    this.selectedSpecs.splice(index, 1);
  }

  onSpecSelectionChange(event: any) {
    const selectedValues = Array.from(event.target.selectedOptions, (option: any) => option.value);
    this.selectedSpecs = this.availableSpecs
      .filter(spec => selectedValues.includes(spec.id))
      .map(spec => ({ ...spec, position: 'Anywhere' }));
  }

  save() {
    const result: any[] = [];
    
    for (const spec of this.selectedSpecs) {
      const formResult = {
        metadataName: 'Modification parameters',
        metadataType: '',
        metadataMT: this.form.value.metadataMT,
        metadataPP: spec.position,
        metadataTA: spec.aa,
        metadataMM: spec.mono_mass,
        metadataTS: spec.target_site || '',
        metadataAC: spec.accession || spec.id,
        metadataValue: this.buildModificationString(spec),
        samples: '',
        characteristics: false,
        auto_generated: true,
        hidden: false,
        readonly: false
      };
      result.push(formResult);
    }
    
    this.activeModal.close(result);
  }

  buildModificationString(spec: ModificationSpec): string {
    // Build modification string following SDRF key=value format
    const parts: string[] = [];
    
    // Add the modification name as NT (name/term)
    if (spec.classification) {
      parts.push(`NT=${spec.classification}`);
    }
    
    if (this.form.value.metadataMT) {
      parts.push(`MT=${this.form.value.metadataMT}`);
    }
    if (spec.position) {
      parts.push(`PP=${spec.position}`);
    }
    if (spec.aa) {
      parts.push(`TA=${spec.aa}`);
    }
    if (spec.mono_mass) {
      parts.push(`MM=${spec.mono_mass}`);
    }
    if (spec.accession || spec.id) {
      parts.push(`AC=${spec.accession || spec.id}`);
    }
    if (spec.target_site) {
      parts.push(`TS=${spec.target_site}`);
    }
    
    return parts.join(';');
  }

  // Typeahead search for modification names
  searchModifications = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          return of([]);
        }
        return this.webService.getUnimod(undefined, 10, 0, term, 'startswith').pipe(
          map(response => response.results.map((unimod: any) => unimod.name)),
          catchError(() => of([]))
        );
      })
    );
  };

  // Handle modification selection from typeahead
  onModificationSelect(event: any, spec: ModificationSpec, index: number) {
    const selectedName = event.item;
    
    // Load detailed data for the selected modification
    this.webService.getUnimod(undefined, 1, 0, undefined, 'startswith', selectedName).subscribe({
      next: (response) => {
        if (response.results.length > 0) {
          const selectedUnimod = response.results[0];
          
          // Get delta_mono_mass from the main UniMod object, not from MetadataService processing
          let deltaMonoMass = 0;
          if (selectedUnimod.additional_data) {
            for (const additional of selectedUnimod.additional_data) {
              if (additional.id === 'delta_mono_mass') {
                deltaMonoMass = parseFloat(additional.description) || 0;
                break;
              }
            }
          }
          
          // Update the spec with the selected data using delta_mono_mass
          this.selectedSpecs[index] = {
            ...this.selectedSpecs[index],
            classification: selectedUnimod.name,
            id: selectedUnimod.accession,
            accession: selectedUnimod.accession,
            mono_mass: deltaMonoMass // Use the main delta_mono_mass from UniMod object
          };
          
          // Update availableSpecs if this generates new specs
          this.processUnimodSpecs([selectedUnimod]);
        }
      },
      error: (error) => {
        console.error('Error loading modification details:', error);
      }
    });
  }

  close() {
    this.activeModal.dismiss();
  }
}