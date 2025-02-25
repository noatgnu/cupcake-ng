import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  metadataTypeAutocomplete: string[] = ["Characteristics", "Comment", "Factor value", "Other"]
  metadataNameAutocomplete: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Instrument", "Label", "Cleavage agent details", "Dissociation method", "Modification parameters", "Cell type", "Enrichment process"]
  metadataOtherAutocomplete: string[] = ["Source name", "Material type", "Assay name", "Technology type"]
  metadataCharacteristics: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Cell type", "Cell line", "Developmental stage", "Ancestry category", "Sex", "Age", "Biological replicate", "Enrichment process"]
  metadataComment: string[] = ["Data file", "File uri", "Technical replicate", "Fraction identifier", "Label", "Cleavage agent details", "Instrument", "Modification parameters", "Dissociation method", "Precursor mass tolerance", "Fragment mass tolerance", ""]

  metadataTemplate = [{
    "name": "Source name", "type": ""
  },
    {
      "name": "Organism", "type": "Characteristics"
    }, {
      "name": "Tissue", "type": "Characteristics"
    }, {
      "name": "Disease", "type": "Characteristics"
    }, {
      "name": "Cell type", "type": "Characteristics"
    }, {
      "name": "Biological replicate", "type": "Characteristics"
    },{
      "name": "Material type", "type": ""
    },
    {
      "name": "Assay name", "type": ""
    }, {
      "name": "Technology type", "type": ""
    },  {
      "name": "Technical replicate", "type": "Comment"
    },
    {"name": "Label", "type": "Comment"},
    {"name": "Fraction identifier", "type": "Comment"},
    {"name": "Instrument", "type": "Comment"},
    {"name": "Data file", "type": "Comment"},
    {"name": "Cleavage agent details", "type": "Comment"},
    {"name": "Modification parameters", "type": "Comment"},
    {"name": "Dissociation method", "type": "Comment"},
    {"name": "Precursor mass tolerance", "type": "Comment"},
    {"name": "Fragment mass tolerance", "type": "Comment"},
  ]

  userMetadataTemplate = [
    {
      "name": "Organism", "type": "Characteristics"
    }, {
      "name": "Tissue", "type": "Characteristics"
    }, {
      "name": "Disease", "type": "Characteristics"
    }, {
      "name": "Cell type", "type": "Characteristics"
    },{
      "name": "Material type", "type": ""
    },
    {"name": "Cleavage agent details", "type": "Comment"},
    {"name": "Modification parameters", "type": "Comment"},
    {"name": "Dissociation method", "type": "Comment"},
    {"name": "Enrichment process", "type": "Comment"}
  ]

  constructor() { }
}
