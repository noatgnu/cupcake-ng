import { Injectable } from '@angular/core';
import {map, Observable, of} from "rxjs";
import {Unimod} from "./unimod";
import {WebService} from "./web.service";
import {NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  dataAcquisitionMethods: string[] = []
  alkylationReagents: string[] = []
  reductionReagents: string[] = []
  enrichmentProcesses: string[] = []
  labelTypes: string[] = []
  ms2AnalyzerTypes: string[] = []
  metadataTypeAutocomplete: string[] = ["Characteristics", "Comment", "Factor value", "Other"]
  metadataNameAutocomplete: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Instrument", "Reduction reagent", "Alkylation reagent", "Label", "Cleavage agent details", "Dissociation method", "Modification parameters", "Cell type", "Enrichment process", "MS2 analyzer type", "Proteomics data acquisition method"]
  metadataOtherAutocomplete: string[] = ["Source name", "Material type", "Assay name", "Technology type"]
  metadataCharacteristics: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Cell type", "Cell line", "Developmental stage", "Ancestry category", "Sex", "Age", "Biological replicate", "Enrichment process"]
  metadataComment: string[] = ["Data file", "File URI", "Technical replicate", "Fraction identifier", "Label", "Cleavage agent details", "Instrument", "Modification parameters", "Dissociation method", "Precursor mass tolerance", "Fragment mass tolerance", "MS2 analyzer type",""]
  staffMetadataSpecific: string[] =
    [
      "Fraction identifier",
      "Dissociation method",
      "Precursor mass tolerance",
      "Fragment mass tolerance",
      "Data file",
      "File uri",
      "Proteomics data acquisition method",
      "Collision energy",
      "Instrument",
      "MS1 scan range",
      "MS2 analyzer type"
    ]
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
    {
      "name": "Developmental stage", "type": "Characteristics",
    },
    {
      "name": "Ancestry category", "type": "Characteristics",
    },
    {
      "name": "Sex", "type": "Characteristics",
    },
    {"name": "Phenotype", "type": "Characteristics"},
    {"name": "Age", "type": "Characteristics"},
    {"name": "Cleavage agent details", "type": "Comment"},
    {"name": "Modification parameters", "type": "Comment"},
    {"name": "Dissociation method", "type": "Comment"},
    {"name": "Enrichment process", "type": "Comment"},
    {"name": "Depletion", "type": "Comment"},
    {"name": "Reduction reagent", "type": "Comment"},
    {"name": "Alkylation reagent", "type": "Comment"},
    {"name": "Spiked compound", "type": "Characteristics"},
    {"name": "Mass", "type": "Characteristics"},
  ]

  helpData: any = {
    "Source name": "Unique sample name (it can be present multiple times if the same sample is used several times in the same dataset)",
    "Organism": "The organism of the Sample of origin.",
    "Tissue": "or Organism part. The part of organism’s anatomy or substance arising from an organism from which the biomaterial was derived, (e.g., liver)",
    "Cell type": "A cell type is a distinct morphological or functional form of cell. Examples are epithelial, glial etc",
    "Disease": "The disease under study in the Sample.",
    "Assay name": "Examples of assay names are: “run 1”, “run_fraction_1_2”.",
    "Fraction identifier": "The fraction identifier allows recording the number of a given fraction. The fraction identifier corresponds to this ontology term. It MUST start from 1, and if the experiment is not fractionated, 1 MUST be used for each MSRun (assay)",
    "Label": ": label describes the label applied to each Sample (if any). In the case of multiplex experiments such as TMT, SILAC, and/or ITRAQ the corresponding label SHOULD be added. For Label-free experiments the label-free sample term MUST be used.",
    "Data file": "The data file provides the name of the raw file generated by the instrument. The data files can be instrument raw files but also converted peak lists such as mzML, MGF or result files like mzIdentML.",
    "Instrument": "Instrument model used to capture the sample",
    "MS2 analyzer type": "for example, with Orbitrap models where MS2 scans can be acquired either in the Orbitrap or in the ion trap. Setting this value allows differentiating high-resolution MS/MS data",
    "Technology type": "Technology type is used in SDRF and MAGE-TAB formats to specify the technology applied in the study to capture the data. Here please default it to “proteomic profiling by mass spectrometry”",
    "Cleavage agent details": "used to capture the enzyme information.",
    "Fragment mass tolerance": "in Da",
    "Precursor mass tolerance": "in ppm",
    "Technical replicate": "It is defined as repeated measurements of the same sample that represent independent measures of the random noise associated with protocols or equipment. If your data does not have more than 1 designated technical replicate, assign 1 to all of them",
    "Biological replicate": "parallel measurements of biologically distinct samples that capture biological variation, which may itself be a subject of study or a source of noise.",
    "Reduction reagent": "The chemical reagent that is used to break disulfide bonds in proteins.",
    "Alkylation reagent": "The alkylation reagent that is used to covalently modify cysteine SH-groups after reduction",
    "Fractionation method": "The fraction method used to separate the sample",
    "Dissociation method": "This property will provide information about the fragmentation method, like HCD, CID",
    "Proteomics data acquisition method": "common values are DDA or DIA.",
    "Modification parameters": "Sample modifications, (including both chemical modifications and post-translational modifications, PTMs) are originated from multiple sources: artifact modifications, isotope labeling, adducts that are encoded as PTMs (e.g. sodium) or the most biologically relevant PTMs.",
    "Enrichment process": "for example in PTM-enriched experiments, “enrichment of phosphorylated Protein”",
    "Pooled samples": "multiple samples are pooled into one, the general approach is to annotate them separately, abiding by the general rule: one row stands for one sample-to-file relationship. Example: for not pooled samples, “not pooled”. However for pooled samples, the value can be, “SN=sample 1,sample 2”",
    "Spiked compound": "Peptides, proteins, or mixtures can be added to the sample as controlled amounts to provide a standard or ground truth for quantification, or for retention time alignment, etc",
    "Mass": "The mass of the submitted sample in ng",
    "Phenotype": "Samples from healthy patients or individuals normally appear in manuscripts and annotations as healthy or normal. It is recommended to use “normal” for description of the typical healthy and normal phenotype.",
    "MS1 scan range": "example 400m/z - 1200m/z",
    "Age": "Should be written in the format of 0Y-0M-0D or 0Y for just years, 0M for just months, 0D for just days. Can also be a range like 0Y-0M-0D to 0Y-0M-1D",
  }

  requiredColumnNames = [
    "Source name",
    "Organism",
    "Disease",
    "Tissue",
    "Cell type",
    "Assay name",
    "Fraction identifier",
    "Label",
    "Instrument",
    "Technical replicate",
    "Biological replicate",
    "Cleavage agent details",
  ]

  optionsArray: Unimod[] = [];
  availableSpecs: any[] = []
  constructor(private web: WebService) { }

  metadataTypeAheadDataGetter(name: string, term: string, search_type: string = "startswith") {
    let searchObservable: Observable<any[]>;
    if (name === "subcellular location") {
      searchObservable = this.web.getSubcellularLocations(undefined, 5, 0, term, search_type).pipe(
        map((response) => response.results.map((location) => location.location_identifier))
      );
    } else if (name === "disease") {
      searchObservable = this.web.getHumandDiseases(undefined, 5, 0, term, search_type).pipe(
        map((response) => response.results.map((disease) => disease.identifier))
      );
    } else if (name === "tissue") {
      searchObservable = this.web.getTissues(undefined, 5, 0, term, search_type).pipe(
        map((response) => response.results.map((tissue) => tissue.identifier))
      );
    } else if (name === "organism") {
      searchObservable = this.web.getSpecies(undefined, 5, 0, term, search_type).pipe(
        map((response) => response.results.map((species) => species.official_name))
      );
    } else if (["mass analyzer type", "alkylation reagent", "reduction reagent", "proteomics data acquisition method", "cleavage agent details", "instrument", "dissociation method", "enrichment process"].includes(name)) {
      searchObservable = this.web.getMSVocab(undefined, 5, 0, term, name, search_type).pipe(
        map((response) => response.results.map((vocab) => vocab.name))
      );
    } else if (name === "label") {
      searchObservable = this.web.getMSVocab(undefined, 5, 0, term, "sample attribute", search_type).pipe(
        map((response) => response.results.map((vocab) => vocab.name))
      );
    } else if (name === "cell type") {
      searchObservable = this.web.getMSVocab(undefined, 5, 0, term, "cell line", search_type).pipe(
        map((response) => response.results.map((vocab) => vocab.name))
      );
    } else if (name === "modification parameters") {
      searchObservable = this.web.getUnimod(undefined, 5, 0, term, search_type).pipe(
        map((response) => {
          this.optionsArray = response.results;
          return response.results.map((unimod: Unimod) => unimod.name);
        })
      );
    } else {
      searchObservable = of([]);
    }
    return searchObservable;
  }

  getSelectedData(data: string, name: string) {
    const formDetails: any = {}
    if (name) {
      if (name.toLowerCase() === "modification parameters") {
        const selectedData = this.optionsArray.find((option) => option.name === data)
        if (selectedData) {
          const mapData: any = {}
          formDetails["metadataAC"] = selectedData.accession
          for (const a of selectedData.additional_data) {
            if (a["id"] === "delta_mono_mass") {
              formDetails["metadataMM"] = parseFloat(a["description"])
            }
            if (a["id"].startsWith("spec_")) {
              const nameSplitted = a["id"].split("_")
              const name = `spec_${nameSplitted[1]}`
              if (!mapData[name]) {
                mapData[name] = {name: name, target_site: ""}
              }
              if (a["id"].endsWith("position")) {
                // check if position include Anywhere, N-term, C-term
                if (a["description"].includes("Anywhere") || a["description"].includes("N-term") || a["description"].includes("C-term")) {
                  mapData[name]["position"] = a["description"].split(",")[0]
                }
              } else if (a["id"].endsWith("site")) {
                mapData[name]["aa"] = a["description"]
              } else if (a["id"].endsWith("classification")) {
                mapData[name]["classification"] = a["description"].split(",")[0]
              } else if (a["id"].endsWith("mono_mass")) {
                const mm = parseFloat(a["description"].split(",")[0])
                if (mm > 0) {
                  mapData[name]["mono_mass"] = mm
                }
              }
            }
          }
          this.availableSpecs = Object.values(mapData)
        }
      }
    }
    return formDetails
  }

  addMetadataToFavourite(name: string, type: string, value: string, display_name: string, mode: string|undefined|null, lab_group: number|undefined|null) {
    const payload: any = {
      name: name,
      type: type,
      value: value,
      display_name: display_name
    }
    if (mode) {
      payload["mode"] = mode
    }
    if (lab_group) {
      payload["lab_group"] = lab_group
    }
    return this.web.createFavouriteMetadataOption(payload)
  }

  parseLinesToMetadata(lines: string): any {
    const result = lines.split('\n').map(line => line.trim() === '' ? 'not available' : line.trim());
    const frequencyMap: { [key: string]: number } = {};
    result.forEach(line => {
      frequencyMap[line] = (frequencyMap[line] || 0) + 1;
    });

    const mostFrequentValue = Object.keys(frequencyMap).reduce((a, b) => frequencyMap[a] > frequencyMap[b] ? a : b);
    const modifiers = Object.keys(frequencyMap).filter(value => value !== mostFrequentValue).map(value => ({
      samples: result.map((line, index) => line === value ? index + 1 : null).filter(index => index !== null).join(','),
      value: value
    }));
    return {
      value: mostFrequentValue,
      modifiers: modifiers
    }
  }

  tranformMetadataValue(r: any, value: string) {
    if (r.metadataName === "Modification parameters") {
      if (r.metadataMT) {
        value += `;MT=${r.metadataMT}`
      }
      if (r.metadataPP) {
        value += `;PP=${r.metadataPP}`
      }
      if (r.metadataTA) {
        value += `;TA=${r.metadataTA}`
      }
      if (r.metadataTS) {
        value += `;TS=${r.metadataTS}`
      }
      if (r.metadataMM) {
        value += `;MM=${r.metadataMM}`
      }
      if (r.metadataAC) {
        value += `;AC=${r.metadataAC}`
      }
    } else if (r.metadataName === "Spiked compound") {
      value = ""
      if (r.metadataSP) {
        value += `SP=${r.metadataSP}`
      }
      if (r.metadataCT) {
        value += `;CT=${r.metadataCT}`
      }
      if (r.metadataQY) {
        value += `;QY=${r.metadataQY}`
      }
      if (r.metadataPS) {
        value += `;PS=${r.metadataPS}`
      }
      if (r.metadataAC) {
        value += `;AC=${r.metadataAC}`
      }
      if (r.metadataCN) {
        value += `;CN=${r.metadataCN}`
      }
      if (r.metadataCV) {
        value += `;CV=${r.metadataCV}`
      }
      if (r.metadataCS) {
        value += `;CS=${r.metadataCS}`
      }
      if (r.metadataCF) {
        value += `;CF=${r.metadataCF}`
      }
    } else if (r.metadataName === "Age") {
      let ageString = ""
      if (r.y1 > 0) {
        ageString += `${r.y1}Y`
      }
      if (r.m1 > 0) {
        ageString += `${r.m1}M`
      }
      if (r.d1 > 0) {
        ageString += `${r.d1}D`
      }
      if (r.ageRange) {
        ageString += "-"
        if (r.y2 > 0) {
          ageString += `${r.y2}Y`
        }
        if (r.m2 > 0) {
          ageString += `${r.m2}M`
        }
        if (r.d2 > 0) {
          ageString += `${r.d2}D`
        }
      }
      value = ageString
    }
    return value;
  }

}
