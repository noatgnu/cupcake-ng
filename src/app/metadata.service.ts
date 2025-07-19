import { Injectable } from '@angular/core';
import {map, Observable, of} from "rxjs";
import {Unimod} from "./unimod";
import {WebService} from "./web.service";
import {MetadataColumn} from "./metadata-column";
import {Workbook, Column, Worksheet, CellValue} from "exceljs";
import {
  SamplePool,
  SamplePoolCreateRequest,
  SamplePoolUpdateRequest,
  SamplePoolOverview,
  SampleStatusOverview,
  AddSampleResponse,
  RemoveSampleResponse
} from "./sample-pool";

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
  metadataNameAutocomplete: string[] = ["Disease", "Organism part", "Subcellular location", "Organism", "Instrument", "Reduction reagent", "Alkylation reagent", "Label", "Cleavage agent details", "Dissociation method", "Modification parameters", "Cell type", "Enrichment process", "MS2 analyzer type", "Proteomics data acquisition method", "Biological replicate", "Technical replicate", "Fraction identifier", "Data file", "File uri", "Scan window lower limit", "Scan window upper limit", "Proteomexchange accession number"]
  metadataOtherAutocomplete: string[] = ["Source name", "Material type", "Assay name", "Technology type"]
  metadataCharacteristics: string[] = ["Disease", "Organism part", "Subcellular location", "Organism", "Cell type", "Cell line", "Developmental stage", "Ancestry category", "Sex", "Age", "Biological replicate", "Enrichment process"]
  metadataComment: string[] = ["Data file", "File URI", "Technical replicate", "Fraction identifier", "Label", "Cleavage agent details", "Instrument", "Modification parameters", "Dissociation method", "Precursor mass tolerance", "Fragment mass tolerance", "MS2 analyzer type", "Scan window lower limit", "Scan window upper limit", "Proteomexchange accession number", "Proteomics data acquisition method", "Collision energy", "MS1 scan range", "Position", "Enrichment process", "Depletion", "Reduction reagent", "Alkylation reagent"]
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
      "MS2 analyzer type",
      "Position",
      "Scan window lower limit",
      "Scan window upper limit",
      "Proteomexchange accession number"
    ]
  metadataTemplate = [{
    "name": "Source name", "type": ""
  },
    {
      "name": "Organism", "type": "Characteristics"
    }, {
      "name": "Organism part", "type": "Characteristics"
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
      "name": "Source name", "type": ""
    },
    {
      "name": "Organism", "type": "Characteristics"
    }, {
      "name": "Organism part", "type": "Characteristics"
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
    {"name": "Technical replicate", "type": "Comment"},
    {"name": "Label", "type": "Comment"},
    {"name": "Fraction identifier", "type": "Comment"},
    {"name": "Instrument", "type": "Comment"},
    {"name": "Data file", "type": "Comment"},
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
    "Organism part": "Tissue or Organism part. The part of organism’s anatomy or substance arising from an organism from which the biomaterial was derived, (e.g., liver)",
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
    "Scan window lower limit": "Lower limit of the scan window in m/z for DIA experiments",
    "Scan window upper limit": "Upper limit of the scan window in m/z for DIA experiments",
    "Proteomexchange accession number": "ProteomeXchange accession number for public datasets",
    "Depletion": "Depletion methods used to remove unwanted components from the sample",
    "Collision energy": "Collision energy used for fragmentation in MS/MS experiments",
    "Position": "Position of the sample in the instrument (e.g., well position in a plate)",
    "File uri": "URI or URL to the data file location",
    "Material type": "Type of material analyzed (e.g., cell lysate, tissue extract)",
    "Developmental stage": "Developmental stage of the organism when the sample was collected",
    "Ancestry category": "Ancestry or ethnicity category of the sample donor",
    "Sex": "Biological sex of the sample donor (male, female, unknown)",
  }

  requiredColumnNames = [
    "Source name",
    "Organism",
    "Disease",
    "Organism part",
    "Cell type",
    "Assay name",
    "Fraction identifier",
    "Label",
    "Instrument",
    "Technical replicate",
    "Biological replicate",
    "Cleavage agent details",
    "Technology type",
    "Data file"
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
    } else if ((name === "tissue")||(name === "organism part")) {
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
          let deltaMonoMass = 0
          formDetails["metadataAC"] = selectedData.accession
          
          // First pass: get the main delta_mono_mass
          for (const a of selectedData.additional_data) {
            if (a["id"] === "delta_mono_mass") {
              deltaMonoMass = parseFloat(a["description"])
              formDetails["metadataMM"] = deltaMonoMass
              break
            }
          }
          
          // Second pass: process specs with the main delta_mono_mass
          for (const a of selectedData.additional_data) {
            if (a["id"].startsWith("spec_")) {
              const nameSplitted = a["id"].split("_")
              const name = `spec_${nameSplitted[1]}`
              if (!mapData[name]) {
                mapData[name] = {name: name, target_site: "", mono_mass: deltaMonoMass}
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
              }
              // Note: Removed mono_mass handling here since we use delta_mono_mass for all specs
              // Ensure all specs use the main delta_mono_mass, not individual spec masses
              mapData[name]["mono_mass"] = deltaMonoMass
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

  parse_sample_indices_from_modifier_string(modifier: string) {
    const samples: string[] = modifier.split(",")
    const sample_indices = []
    for (const sample of samples) {
      if (sample.includes("-")) {
        const range = sample.split("-")
        for (let i = parseInt(range[0]); i <= parseInt(range[1]); i++) {
          sample_indices.push(i-1)
        }
      } else {
        sample_indices.push(parseInt(sample)-1)
      }
    }
    // return sorted array from smallest to largest
    return sample_indices.sort((a, b) => a - b)
  }

  async convert_metadata_column_value_to_sdrf(column_name: string, value: string, required_metadata_name: string[]) {
    if (!value) {
      return ""
    }

    if (column_name === "subcellular location") {
      if (value) {
        const v = await this.web.getSubcellularLocations(undefined, 1, 0, undefined, "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "organism") {
      if (value) {
        const v = await this.web.getSpecies(undefined, 1, 0, undefined, "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            return value
          } else {
            return value
          }
        } else {
          return value
        }
      }
    }

    if (column_name === "label") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "sample attribute", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "instrument") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "instrument", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "dissociation method") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "dissociation method", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "cleavage agent details") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "cleavage agent", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "enrichment process") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "enrichment process", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "fractionation method") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "fractionation method", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "proteomics data acquisition method") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "proteomics data acquisition method", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "reduction reagent") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "reduction reagent", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "alkylation reagent") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "alkylation reagent", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "modification parameters") {
      if (value) {
        const parseName = value.split(";")[0]
        const v = await this.web.getUnimod(undefined, 1, 0, undefined, "startswith", parseName).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.toLowerCase().includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          }  else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    if (column_name === "ms2 analyzer type") {
      if (value) {
        const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "mass analyzer type", "startswith", value).toPromise()
        if (v) {
          if (v.results.length > 0) {
            if (value.includes("AC=")) {
              return `NT=${value}`
            } else {
              return `NT=${value};AC=${v.results[0].accession}`
            }
          } else {
            return `${value}`
          }
        } else {
          return `${value}`
        }
      }
    }

    return value
  }

  async sort_metadata_updated(metadata: MetadataColumn[], sample_number: number) {
    const headers: string[] = [];
    const default_columns_list = [
      { "name": "Source name", "type": "" },
      { "name": "Organism", "type": "Characteristics" },
      { "name": "Organism part", "type": "Characteristics" },
      { "name": "Disease", "type": "Characteristics" },
      { "name": "Cell type", "type": "Characteristics" },
      { "name": "Biological replicate", "type": "Characteristics" },
      { "name": "Material type", "type": "" },
      { "name": "Assay name", "type": "" },
      { "name": "Technology type", "type": "" },
      { "name": "Technical replicate", "type": "Comment" },
      { "name": "Label", "type": "Comment" },
      { "name": "Fraction identifier", "type": "Comment" },
      { "name": "Instrument", "type": "Comment" },
      { "name": "Data file", "type": "Comment" },
      { "name": "Cleavage agent details", "type": "Comment" },
      { "name": "Modification parameters", "type": "Comment" },
      {"name": "Dissociation method", "type": "Comment"},
      {"name": "Precursor mass tolerance", "type": "Comment"},
      {"name": "Fragment mass tolerance", "type": "Comment"},
    ];

    const metadata_column_map: { [key: string]: MetadataColumn[] } = {};
    const factor_value_columns: MetadataColumn[] = [];
    const metadata_cache: { [key: string]: { [value: string]: string } } = {};

    for (const m of metadata) {
      const metad: MetadataColumn = { ...m };
      if (!metadata_cache[m.name]) {
        metadata_cache[m.name] = {};
      }
      if (!metadata_cache[m.name][m.value]) {
        metadata_cache[m.name][m.value] = await this.convert_metadata_column_value_to_sdrf(m.name.toLowerCase(), m.value, this.requiredColumnNames);
      }
      metad.value = metadata_cache[m.name][m.value];
      for (let i = 0; i < metad.modifiers.length; ++i) {
        if (!metadata_cache[m.name][metad.modifiers[i].value]) {
          metadata_cache[m.name][metad.modifiers[i].value] = await this.convert_metadata_column_value_to_sdrf(m.name.toLowerCase(), metad.modifiers[i].value, this.requiredColumnNames);
        }
        metad.modifiers[i].value = metadata_cache[m.name][metad.modifiers[i].value];
      }

      if (m.type !== "Factor value") {
        if (!metadata_column_map[m.name]) {
          metadata_column_map[m.name] = [];
        }
        metadata_column_map[m.name].push(metad);
      } else {
        factor_value_columns.push(metad);
      }
    }

    const new_metadata: MetadataColumn[] = [];
    const non_default_columns: MetadataColumn[] = [];
    const default_column_map: { [key: string]: any } = {};

    for (const m of default_columns_list) {
      default_column_map[m.name] = m;
      if (m.name in metadata_column_map && !["Assay name", "Source name", "Material type", "Technology type"].includes(m.name)) {
        new_metadata.push(...metadata_column_map[m.name]);
      }
    }

    for (const n in metadata_column_map) {
      if (!default_column_map[n] && !["Assay name", "Source name", "Material type", "Technology type"].includes(n)) {
        non_default_columns.push(...metadata_column_map[n]);
      }
    }

    const col_count = new_metadata.length + non_default_columns.length + factor_value_columns.length + 4;
    const data = Array.from({ length: sample_number }, () => Array(col_count).fill(""));

    let last_characteristics = 0;
    const add_metadata_to_data = (metadata: MetadataColumn, index: number) => {
      headers.push(metadata.name.toLowerCase());
      if (metadata.modifiers) {
        for (const modifier of metadata.modifiers) {
          const samples = this.parse_sample_indices_from_modifier_string(modifier.samples);
          for (const s of samples) {
            data[s][index] = modifier.value;
          }
        }
      }
      for (let i = 0; i < sample_number; i++) {
        if (data[i][index] === "") {
          data[i][index] = metadata.value;
        }
      }
    };

    const add_default_metadata = (metadata: MetadataColumn | null, name: string) => {
      if (metadata) {
        headers.push(name);
        add_metadata_to_data(metadata, last_characteristics);
        last_characteristics += 1;
      }
    };

    add_default_metadata(metadata_column_map["Source name"]?.[0], "source name");
    new_metadata.forEach((m, i) => {
      if (m.type === "Characteristics") {
        add_metadata_to_data(m, last_characteristics);
        last_characteristics += 1;
      }
    });

    non_default_columns.forEach((m, i) => {
      if (m.type === "Characteristics") {
        add_metadata_to_data(m, last_characteristics);
        last_characteristics += 1;
      }
    });

    let last_non_type = last_characteristics;
    add_default_metadata(metadata_column_map["Material type"]?.[0], "material type");
    add_default_metadata(metadata_column_map["Assay name"]?.[0], "assay name");
    add_default_metadata(metadata_column_map["Technology type"]?.[0], "technology type");

    new_metadata.forEach((m, i) => {
      if (m.type === "") {
        add_metadata_to_data(m, last_non_type);
        last_non_type += 1;
      }
    });

    non_default_columns.forEach((m, i) => {
      if (m.type === "") {
        add_metadata_to_data(m, last_non_type);
        last_non_type += 1;
      }
    });

    let last_comment = last_non_type;
    new_metadata.forEach((m, i) => {
      if (m.type === "Comment") {
        add_metadata_to_data(m, last_comment);
        last_comment += 1;
      }
    });

    non_default_columns.forEach((m, i) => {
      if (m.type === "Comment") {
        add_metadata_to_data(m, last_comment);
        last_comment += 1;
      }
    });

    factor_value_columns.forEach((m, i) => {
      headers.push(`factor value[${m.name.toLowerCase()}]`);
      add_metadata_to_data(m, last_comment);
      last_comment += 1;
    });

    return [headers, ...data];
  }

  async sort_metadata(metadata: MetadataColumn[], sample_number: number) {
    const headers: string[] = []
    const id_metadata_map: any = {}
    const default_columns_list = [{
      "name": "Source name", "type": ""
    },
      {
        "name": "Organism", "type": "Characteristics"
      }, {
        "name": "Organism part", "type": "Characteristics"
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
    const metadata_column_map: any = {}
    let source_name_metadata: MetadataColumn|null = null
    let assay_name_metadata: MetadataColumn|null = null
    let material_type_metadata: MetadataColumn|null = null
    let technology_type_metadata: MetadataColumn|null = null
    const factor_value_columns: MetadataColumn[] = []
    let data: string[][] = []
    // set up cache for convert_metadata_column_value_to_sdrf
    const metadata_cache: any = {}

    const required_metadata_name = this.requiredColumnNames.map((name) => name.toUpperCase())
    for (const m of metadata){
      const metad: MetadataColumn = JSON.parse(JSON.stringify(m))
      if (!metadata_cache[m.name]) {
        metadata_cache[m.name] = {}
      }
      if (!metadata_cache[m.name][m.value]) {
        metadata_cache[m.name][m.value] = await this.convert_metadata_column_value_to_sdrf(m.name.toLowerCase(), m.value, required_metadata_name)
      }
      metad.value = metadata_cache[m.name][m.value]
      for (let i = 0; i < metad.modifiers.length; ++i) {
        if (!metadata_cache[m.name][metad.modifiers[i].value]) {
          metadata_cache[m.name][metad.modifiers[i].value] = await this.convert_metadata_column_value_to_sdrf(m.name.toLowerCase(), metad.modifiers[i].value, required_metadata_name)
        }
        metad.modifiers[i].value = metadata_cache[m.name][metad.modifiers[i].value]
      }

      if (m.type !== "Factor value") {
        if (!metadata_column_map[m.name]) {
          metadata_column_map[m.name] = []
        }
        metadata_column_map[m.name].push(metad)
      } else {
        factor_value_columns.push(metad)
      }
    }

    const new_metadata: MetadataColumn[] = []
    const non_default_columns: MetadataColumn[] = []

    const default_column_map: any = {}

    for (const m of default_columns_list) {
      default_column_map[m.name] = m
      if (m.name in metadata_column_map && m.name !== "Assay name" && m.name !== "Source name" && m.name !== "Material type" && m.name !== "Technology type") {
        new_metadata.push(...metadata_column_map[m.name])
      }
      if (m.name === "Assay name") {
        if ("Assay name" in metadata_column_map) {
          assay_name_metadata = metadata_column_map["Assay name"][0]
        }
      } else if (m.name === "Source name") {
        if ("Source name" in metadata_column_map) {
          source_name_metadata = metadata_column_map["Source name"][0]
        }
      } else if (m.name === "Material type") {
        if ("Material type" in metadata_column_map) {
          material_type_metadata = metadata_column_map["Material type"][0]
        }
      } else if (m.name === "Technology type") {
        if ("Technology type" in metadata_column_map) {
          technology_type_metadata = metadata_column_map["Technology type"][0]
        }
      }
    }

    for (const n in metadata_column_map) {
      if (!default_column_map[n] && n !== "Assay name" && n !== "Source name" && n !== "Material type" && n !== "Technology type") {
        non_default_columns.push(...metadata_column_map[n])
      }
    }

    let col_count = new_metadata.length + non_default_columns.length
    if (source_name_metadata){
      col_count +=1
    }
    if (assay_name_metadata){
      col_count +=1
    }
    if (factor_value_columns.length > 0){
      col_count += factor_value_columns.length
    }
    if (material_type_metadata){
      col_count +=1
    }
    if (technology_type_metadata){
      col_count +=1
    }

    data = new Array(sample_number).fill(0).map(() => new Array(col_count).fill(""))

    let last_characteristics = 0
    if (source_name_metadata){
      headers.push("source name")
      if (source_name_metadata.modifiers){
        for (const modifier of source_name_metadata.modifiers){
          const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
          for (const s of samples) {
            data[s][0] = modifier.value
          }
        }
      }
      for (let i = 0; i < sample_number; i++) {
        if (data[i][0] === "") {
          data[i][0] = source_name_metadata.value
        }
      }
      id_metadata_map[source_name_metadata.id] = {column: 0, name: "source name", type: "", hidden: source_name_metadata.hidden}
      last_characteristics += 1
    }

    for (let i = 0; i < new_metadata.length; i ++) {
      const m = new_metadata[i]
      if (m.type === "Characteristics") {
        if (m.name.toLowerCase() === "tissue"|| m.name.toLowerCase() === "organism part") {
          headers.push("characteristics[organism part]")
        } else {
          headers.push(`characteristics[${m.name.toLowerCase()}]`)
        }
        if (m.modifiers) {
          for (const modifier of m.modifiers) {
            const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
            for (const s of samples) {
              data[s][last_characteristics] = modifier.value
            }
          }
        }
        for (let j=0; j < sample_number; j++) {
          if (data[j][last_characteristics] === "") {
            data[j][last_characteristics] = m.value
          }
        }
        id_metadata_map[m.id] = {column: last_characteristics, name: headers[last_characteristics], type: "characteristics", hidden: m.hidden}
        last_characteristics += 1
      }
    }

    for (let i = 0; i < non_default_columns.length; i++) {
      const m = non_default_columns[i]
      if (m.type === "Characteristics") {
        headers.push(`characteristics[${m.name.toLowerCase()}]`)
        if (m.modifiers) {
          for (const modifier of m.modifiers) {
            const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
            for (const s of samples) {
              data[s][last_characteristics] = modifier.value
            }
          }
        }
        for (let j=0; j < sample_number; j++) {
          if (data[j][last_characteristics] === "") {
            data[j][last_characteristics] = m.value
          }
        }
        id_metadata_map[m.id] = {column: last_characteristics, name: headers[last_characteristics], type: "characteristics", hidden: m.hidden};
        last_characteristics += 1
      }
    }

    let last_non_type = last_characteristics

    if (material_type_metadata) {
      headers.push("material type")
      if (material_type_metadata.modifiers) {
        for (const modifier of material_type_metadata.modifiers) {
          const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
          for (const s of samples) {
            data[s][last_non_type] = modifier.value
          }
        }
      }
      for (let j=0; j < sample_number; j++) {
        if (data[j][last_non_type] === "") {
          data[j][last_non_type] = material_type_metadata.value
        }
      }
      id_metadata_map[material_type_metadata.id] = {
        column: last_non_type,
        name: headers[last_non_type],
        type: "",
        hidden: material_type_metadata.hidden
      }
      last_non_type += 1
    }

    if (assay_name_metadata) {
      headers.push("assay name")
      if (assay_name_metadata.modifiers) {
        for (const modifier of assay_name_metadata.modifiers) {
          const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
          for (const s of samples) {
            data[s][last_non_type] = modifier.value
          }
        }
      }
      for (let j=0; j < sample_number; j++) {
        if (data[j][last_non_type] === "") {
          data[j][last_non_type] = assay_name_metadata.value
        }
      }
      id_metadata_map[assay_name_metadata.id] = {
        column: last_non_type,
        name: headers[last_non_type],
        type: "",
        hidden: assay_name_metadata.hidden
      }
      last_non_type += 1
    }

    if (technology_type_metadata) {
      headers.push("technology type")
      if (technology_type_metadata.modifiers) {
        for (const modifier of technology_type_metadata.modifiers) {
          const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
          for (const s of samples) {
            data[s][last_non_type] = modifier.value
          }
        }
      }
      for (let j=0; j < sample_number; j++) {
        if (data[j][last_non_type] === "") {
          data[j][last_non_type] = technology_type_metadata.value
        }
      }
      id_metadata_map[technology_type_metadata.id] = {
        column: last_non_type,
        name: headers[last_non_type],
        type: "",
        hidden: technology_type_metadata.hidden
      }
      last_non_type += 1
    }

    for (let i = 0; i < new_metadata.length; i++) {
      const m = new_metadata[i]
      if (m.type === "") {
        headers.push(m.name.toLowerCase())
        if (m.modifiers) {
          for (const modifier of m.modifiers) {
            const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
            for (const s of samples) {
              data[s][last_non_type] = modifier.value
            }
          }
        }
        for (let j=0; j < sample_number; j++) {
          if (data[j][last_non_type] === "") {
            data[j][last_non_type] = m.value
          }
        }
        id_metadata_map[m.id] = {
          column: last_non_type,
          name: headers[last_non_type],
          type: "",
          hidden: m.hidden
        }
        last_non_type += 1
      }
    }

    for (let i = 0; i < non_default_columns.length; i++) {
      const m = non_default_columns[i]
      if (m.type === "") {
        headers.push(m.name.toLowerCase())
        if (m.modifiers) {
          for (const modifier of m.modifiers) {
            const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
            for (const s of samples) {
              data[s][last_non_type] = modifier.value
            }
          }
        }
        for (let j=0; j < sample_number; j++) {
          if (data[j][last_non_type] === "") {
            data[j][last_non_type] = m.value
          }
        }
        id_metadata_map[m.id] = {
          column: last_non_type,
          name: headers[last_non_type],
          type: "",
          hidden: m.hidden
        }
        last_non_type += 1
      }
    }

    let last_comment = last_non_type

    for (let i=0; i < new_metadata.length; i++) {
      const m = new_metadata[i]
      if (m.type === "Comment") {
        headers.push(`comment[${m.name.toLowerCase()}]`)
        if (m.modifiers) {
          for (const modifier of m.modifiers) {
            const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
            for (const s of samples) {
              data[s][last_comment] = modifier.value
            }
          }
        }
        for (let j=0; j < sample_number; j++) {
          if (data[j][last_comment] === "") {
            data[j][last_comment] = m.value
          }
        }
        id_metadata_map[m.id] = {
          column: last_comment,
          name: headers[last_comment],
          type: "comment",
          hidden: m.hidden
        }
        last_comment += 1
      }
    }

    for (let i=0; i < non_default_columns.length; i++) {
      const m = non_default_columns[i]
      if (m.type === "Comment") {
        headers.push(`comment[${m.name.toLowerCase()}]`)
        if (m.modifiers) {
          for (const modifier of m.modifiers) {
            const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
            for (const s of samples) {
              data[s][last_comment] = modifier.value
            }
          }
        }
        for (let j=0; j < sample_number; j++) {
          if (data[j][last_comment] === "") {
            data[j][last_comment] = m.value
          }
        }
        id_metadata_map[m.id] = {
          column: last_comment,
          name: headers[last_comment],
          type: "comment",
          hidden: m.hidden
        }
        last_comment += 1
      }
    }

    for (let i=0; i < factor_value_columns.length; i++) {
      const m = factor_value_columns[i]
      if (m.name.toLowerCase() === "tissue"|| m.name.toLowerCase() === "organism part") {
        headers.push("factor value[organism part]")
      } else {
        headers.push(`factor value[${m.name.toLowerCase()}]`)
      }
      if (m.modifiers) {
        for (const modifier of m.modifiers) {
          const samples = this.parse_sample_indices_from_modifier_string(modifier.samples)
          for (const s of samples) {
            data[s][last_comment] = modifier.value
          }
        }
      }
      for (let j=0; j < sample_number; j++) {
        if (data[j][last_comment] === "") {
          data[j][last_comment] = m.value
        }
      }
      id_metadata_map[m.id] = {
        column: last_comment,
        name: headers[last_comment],
        type: "factor value",
        hidden: m.hidden
      }
      last_comment += 1
    }

    return [[headers, ...data], id_metadata_map]
  }

  async convert_sdrf_to_metadata(name: string, value: string) {
    const data = value.split(";")
    if (name === "subcellular location") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getSubcellularLocations(undefined, 1, 0, undefined, "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].location_identifier
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getSubcellularLocations(undefined, 1, 0, undefined, "startswith", undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].location_identifier
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "organism") {
      for (const d of data) {
        if (d.startsWith("http")) {
          const metadata_tx = d.split("_")[1]
          const v = await this.web.getSpecies(undefined, 1, 0, undefined, "startswith", undefined, metadata_tx).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].official_name
            } else {
              return d
            }
          }
        } else {
          const v = await this.web.getSpecies(undefined, 1, 0, undefined, "startswith", d).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].official_name
            } else {
              return d
            }
          }
        }
      }
    }
    if (name === "label") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "sample attribute", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "sample attribute", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "instrument") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "instrument", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "instrument", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "dissociation method") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "dissociation method", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "dissociation method", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "cleavage agent details") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "cleavage agent", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "cleavage agent", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "enrichment process") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "enrichment process", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "enrichment process", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "fractionation method") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "fractionation method", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "fractionation method", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "proteomics data acquisition method") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "proteomics data acquisition method", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "proteomics data acquisition method", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "reduction reagent") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "reduction reagent", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "reduction reagent", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "alkylation reagent") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "alkylation reagent", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "alkylation reagent", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "modification parameters") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getUnimod(undefined, 1, 0, undefined, "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getUnimod(undefined, 1, 0, undefined, undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "ms2 analyzer type") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "mass analyzer type", "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getMSVocab(undefined, 1, 0, undefined, "mass analyzer type", undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].name
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    if (name === "tissue" || name === "organism part") {
      for (const d of data) {
        const upper_d = d.toUpperCase()
        if (upper_d.startsWith("NT=")) {
          const metadata_nt = d.replace("NT=", "").replace("nt=", "")
          const v = await this.web.getTissues(undefined, 1, 0, undefined, "startswith", metadata_nt).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].identifier
            } else {
              return metadata_nt
            }
          }
        }
        if (upper_d.startsWith("AC=")) {
          const metadata_ac = d.replace("AC=", "").replace("ac=", "")
          const v = await this.web.getTissues(undefined, 1, 0, undefined, undefined, undefined, metadata_ac).toPromise()
          if (v) {
            if (v.results.length > 0) {
              return v.results[0].identifier
            } else {
              return metadata_ac
            }
          }
        }
      }
    }
    return value
  }

  async convert_metadata_to_excel(user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[], sample_number: number, user_id: number, service_lab_group_id: number, field_masks: {name: string, mask: string}[] = [], pools: any[] = [], progressCallback?: (progress: number, status: string) => void) {
    if (progressCallback) progressCallback(5, 'Preparing metadata...');
    
    const metadata = user_metadata.concat(staff_metadata)
    let main_metadata = metadata.filter((m) => !m.hidden)
    let hidden_metadata = metadata.filter((m) => m.hidden)
    
    if (progressCallback) progressCallback(10, 'Sorting main metadata...');
    let [result_main, id_metadata_column_map_main] = await this.sort_metadata(main_metadata, sample_number)
    let result_hidden: string[][] = []
    let id_metadata_column_map_hidden: any = {}
    let field_mask_map: {[key: string]: string} = {}
    for (const field_mask of field_masks) {
      field_mask_map[field_mask.name] = field_mask.mask
    }
    if (hidden_metadata.length > 0) {
      if (progressCallback) progressCallback(15, 'Sorting hidden metadata...');
      [result_hidden, id_metadata_column_map_hidden] = await this.sort_metadata(hidden_metadata, sample_number)
    }
    const favourites: any = {}
    if (service_lab_group_id > 0) {
      if (progressCallback) progressCallback(20, 'Loading metadata favourites...');
      for (const m of main_metadata) {
        favourites[m.name.toLowerCase()] = []
        const response = await this.web.getFavouriteMetadataOptions(10, 0, undefined, 'service_lab_group', service_lab_group_id, m.name).toPromise()
        if (response) {
          for (const r of response.results) {
            favourites[m.name.toLowerCase()].push(`${r.display_value}[**]`)
          }
        }
        const global_response = await this.web.getFavouriteMetadataOptions(10, 0, undefined, undefined, undefined, m.name, undefined, true).toPromise()
        if (global_response) {
          for (const r of global_response.results) {
            favourites[m.name.toLowerCase()].push(`${r.display_value}[***]`)
          }
        }
      }
    }
    
    if (progressCallback) progressCallback(40, 'Creating Excel workbook...');
    const wb = new Workbook()
    const main_ws: Worksheet = wb.addWorksheet('main')
    const hidden_ws: Worksheet = wb.addWorksheet('hidden')
    const id_metadata_column_map_ws = wb.addWorksheet('id_metadata_column_map')
    id_metadata_column_map_ws.addRow(["id", "column", "name", "type", "hidden"])
    // fill id_metadata_column_map_ws with a table of id, column, name, type, hidden
    for (const m_id in id_metadata_column_map_main) {
      const row = id_metadata_column_map_main[m_id]
      id_metadata_column_map_ws.addRow([m_id, row.column, row.name, row.type, row.hidden])
    }
    for (const m_id in id_metadata_column_map_hidden) {
      const row = id_metadata_column_map_hidden[m_id]
      id_metadata_column_map_ws.addRow([m_id, row.column, row.name, row.type, row.hidden])
    }

    const required_metadata = this.requiredColumnNames.map((name) => name.toLowerCase())
    const fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {argb: 'FFFF99'}
    }

    const border = {
      top: {style: 'thin'},
      left: {style: 'thin'},
      bottom: {style: 'thin'},
      right: {style: 'thin'}
    }

    main_ws.addRow(result_main[0])


    for (const row of result_main.slice(1)) {
      main_ws.addRow(row)
    }
    const rows = main_ws.getRows(1, sample_number+1)
    if (rows) {
      for (const row of rows) {
        row.eachCell((cell: any) => {
          cell.border = border
          cell.fill = fill
        })
      }
    }


    for (const col of main_ws.columns) {
      // define column width based on the longest cell in the column
      let max_length = 0
      if (col.number && col.values) {
        for (const cell of col.values) {
          if (typeof cell === 'string' && cell.length > max_length) {
            max_length = cell.length;
          }
        }
        if (max_length > 0) {
          main_ws.getColumn(col.number).width = max_length
        }
      }

    }
    const note_texts = [
      "Note: Cells that are empty will automatically be filled with 'not applicable' or 'no available' depending on the column when submitted.",
      "[*] User-specific favourite options.",
      "[**] Facility-recommended options.",
      "[***] Global recommendations."
    ]

    let start_row = sample_number + 2
    for (let i = 0; i < note_texts.length; i++) {
      const lastColumn = main_ws.getColumn(main_ws.columnCount).letter
      const main_ws_range = `A${start_row}:${lastColumn}${start_row}`
      
      // Check if cells are already merged before attempting to merge
      try {
        main_ws.mergeCells(main_ws_range)
      } catch (error) {
        console.warn(`Skipping merge for range ${main_ws_range} - cells may already be merged:`, error)
      }
      
      const note_cell = main_ws.getCell(`A${start_row}`)
      note_cell.value = note_texts[i]
      note_cell.font = {bold: true}
      start_row++ // Increment start_row for next iteration
    }

    if (result_hidden.length > 0) {
      hidden_ws.addRow(result_hidden[0])
      for (const row of result_hidden.slice(1)) {
        hidden_ws.addRow(row)
      }
      const rows = hidden_ws.getRows(1, sample_number+1)
      if (rows) {
        for (const row of rows) {
          row.eachCell((cell: any) => {
            cell.border = border
            cell.fill = fill
          })
        }
      }

      for (const col of hidden_ws.columns) {
        if (col.number) {
          let max_length = 0
          if (col.values) {
            for (const cell of col.values) {
              if (typeof cell === 'string' && cell.length > max_length) {
                max_length = cell.length;
              }
            }
          }
          if (max_length > 0) {
            hidden_ws.getColumn(col.number).width = max_length
          }
        }

      }
    }


    for (let i = 0; i < result_main[0].length; i++) {
      const name_splitted = result_main[0][i].split("[")
      let required_column = false
      let col_name = ''
      if (name_splitted.length > 1) {
        col_name = name_splitted[1].replace("]", "")
      } else {
        col_name = name_splitted[0]
      }
      const col_name_capitalized = (col_name.charAt(0).toUpperCase() + col_name.slice(1)).replace("Ms1", "MS1").replace("Ms2", "MS2")
      if (field_mask_map[col_name_capitalized]) {
        col_name = field_mask_map[col_name_capitalized]
        let new_header_name = col_name_capitalized
        if (name_splitted.length > 1) {
          new_header_name = result_main[0][i].replace(name_splitted[1].replace("]", ""), col_name.toLowerCase())
        } else {
          new_header_name = col_name.toLowerCase()
        }
        // replace the header row at index 0 with the new header name at index i in the worksheet
        main_ws.getRow(1).getCell(i+1).value = new_header_name
      }
      if (required_metadata.includes(col_name)) {
        required_column = true
      }
      let option_list: string[] = []
      if (required_column) {
        option_list.push("not applicable")
      } else {
        option_list.push("not available")
      }
      if (favourites[col_name.toLowerCase()]) {
        option_list.push(...favourites[col_name.toLowerCase()])
      }
      const col: Column = main_ws.getColumn(i+1)
      col.eachCell((cell: any, rowNumber: number) => {
        if (rowNumber > 1) {
          cell.dataValidation = {
            type: 'list',
            formulae: [`"${option_list.join(',')}"`],
            allowBlank: true
          }
        }
      })
    }

    if (result_hidden.length > 0) {
      if (result_hidden[0].length > 0) {
        for (let i = 0; i < result_hidden[0].length; i++) {
          const name_splitted = result_hidden[0][i].split("[")
          let required_column = false
          let col_name = ''
          if (name_splitted.length > 1) {
            col_name = name_splitted[1].replace("]", "")
          } else {
            col_name = name_splitted[0]
          }
          const col_name_capitalized = (col_name.charAt(0).toUpperCase() + col_name.slice(1)).replace("Ms1", "MS1").replace("Ms2", "MS2")
          if (field_mask_map[col_name_capitalized]) {
            col_name = field_mask_map[col_name_capitalized]
            let new_header_name = col_name_capitalized
            if (name_splitted.length > 1) {
              new_header_name = result_hidden[0][i].replace(name_splitted[1].replace("]", ""), col_name.toLowerCase())
            } else {
              new_header_name = col_name.toLowerCase()
            }
            hidden_ws.getRow(1).getCell(i+1).value = new_header_name
          }
          if (required_metadata.includes(col_name)) {
            required_column = true
          }
          let option_list: string[] = []
          if (required_column) {
            option_list.push("not applicable")
          } else {
            option_list.push("not available")
          }

          if (favourites[col_name.toLowerCase()]) {
            option_list.push(...favourites[col_name.toLowerCase()])
          }
          const col: Column = hidden_ws.getColumn(i+1)
          if (option_list.length > 0) {
            col.eachCell((cell: any, rowNumber: number) => {
              if (rowNumber > 1) {
                cell.dataValidation = {
                  type: 'list',
                  formulae: [`"${option_list.join(',')}"`],
                  allowBlank: true,
                }
              }
            })
          }
        }
      }
    }

    // Add pool worksheets if pools are provided
    if (pools && pools.length > 0) {
      if (progressCallback) progressCallback(70, 'Creating pool worksheets...');
      // Create pool main worksheet
      const pool_main_ws = wb.addWorksheet('pool_main');
      const pool_hidden_ws = wb.addWorksheet('pool_hidden');
      const pool_object_map_ws = wb.addWorksheet('pool_object_map');

      // Create pool object mapping
      pool_object_map_ws.addRow(['pool_id', 'pool_name', 'is_reference', 'pooled_only_samples', 'pooled_and_independent_samples']);
      pools.forEach(pool => {
        pool_object_map_ws.addRow([
          pool.id || '',
          pool.pool_name || '',
          pool.is_reference || false,
          (pool.pooled_only_samples || []).join(','),
          (pool.pooled_and_independent_samples || []).join(',')
        ]);
      });

      // Get unique pool metadata
      const all_pool_metadata: any[] = [];
      pools.forEach(pool => {
        if (pool.user_metadata) all_pool_metadata.push(...pool.user_metadata);
        if (pool.staff_metadata) all_pool_metadata.push(...pool.staff_metadata);
      });

      // Remove duplicates based on name and type
      const unique_pool_metadata = all_pool_metadata.filter((metadata, index, self) => 
        index === self.findIndex(m => m.name === metadata.name && m.type === metadata.type)
      );

      const pool_main_metadata = unique_pool_metadata.filter(m => !m.hidden);
      const pool_hidden_metadata = unique_pool_metadata.filter(m => m.hidden);

      // Sort pool metadata
      if (pool_main_metadata.length > 0) {
        const [pool_result_main, pool_id_map_main] = await this.sort_pool_metadata(pool_main_metadata, pools);
        
        // Add headers and data to pool main worksheet
        pool_main_ws.addRow(pool_result_main[0]); // Headers
        pool_result_main.slice(1).forEach(row => pool_main_ws.addRow(row)); // Data rows

        // Add to id_metadata_column_map_ws
        for (const m_id in pool_id_map_main) {
          const row = pool_id_map_main[m_id];
          id_metadata_column_map_ws.addRow([m_id, row.column, row.name, row.type, row.hidden]);
        }
      }

      if (pool_hidden_metadata.length > 0) {
        const [pool_result_hidden, pool_id_map_hidden] = await this.sort_pool_metadata(pool_hidden_metadata, pools);
        
        // Add headers and data to pool hidden worksheet
        pool_hidden_ws.addRow(pool_result_hidden[0]); // Headers
        pool_result_hidden.slice(1).forEach(row => pool_hidden_ws.addRow(row)); // Data rows

        // Add to id_metadata_column_map_ws
        for (const m_id in pool_id_map_hidden) {
          const row = pool_id_map_hidden[m_id];
          id_metadata_column_map_ws.addRow([m_id, row.column, row.name, row.type, row.hidden]);
        }
      }

      // Add pooled sample information to metadata for samples
      this.addPooledSampleColumn(result_main, pools, sample_number);
    }

    if (progressCallback) progressCallback(100, 'Excel export complete!');
    return wb
  }

  // Helper method to sort pool metadata
  async sort_pool_metadata(metadata_list: any[], pools: any[]): Promise<[string[][], any]> {
    const headers: string[] = [];
    const id_metadata_column_map: any = {};
    
    if (!metadata_list || metadata_list.length === 0) {
      return [[], {}];
    }
    
    const pool_count = pools.length;
    const col_count = metadata_list.length;
    const data: string[][] = Array(pool_count).fill(null).map(() => Array(col_count).fill(''));
    
    metadata_list.forEach((m, col_idx) => {
      headers.push(m.name);
      
      // Fill default value for all pools
      for (let pool_idx = 0; pool_idx < pool_count; pool_idx++) {
        data[pool_idx][col_idx] = m.value || '';
      }
      
      id_metadata_column_map[m.id] = {
        column: col_idx,
        name: m.name,
        type: m.type?.toLowerCase() || '',
        hidden: m.hidden || false
      };
    });
    
    return [[headers, ...data], id_metadata_column_map];
  }

  // Helper method to add pooled sample column to main metadata
  addPooledSampleColumn(result_main: string[][], pools: any[], sample_number: number): void {
    if (!result_main || result_main.length === 0) return;
    
    // Find or add the pooled sample column
    const headers = result_main[0];
    let pooled_column_index = headers.findIndex(h => h.toLowerCase().includes('pooled sample'));
    
    if (pooled_column_index === -1) {
      // Add new column
      pooled_column_index = headers.length;
      headers.push('characteristics[pooled sample]');
      
      // Add empty cells for existing rows
      for (let i = 1; i < result_main.length; i++) {
        result_main[i].push('');
      }
    }
    
    // Populate pooled sample values
    for (let sample_idx = 1; sample_idx <= sample_number; sample_idx++) {
      const data_row_idx = sample_idx; // Assuming 1-based sample indexing maps to 1-based row indexing
      if (data_row_idx < result_main.length) {
        const pooled_status = this.getPooledStatusForSample(sample_idx, pools);
        result_main[data_row_idx][pooled_column_index] = pooled_status;
      }
    }
  }

  // Helper method to determine pooled status for a sample
  getPooledStatusForSample(sample_index: number, pools: any[]): string {
    for (const pool of pools) {
      if (pool.pooled_only_samples?.includes(sample_index) || 
          pool.pooled_and_independent_samples?.includes(sample_index)) {
        return 'pooled';
      }
    }
    return 'not pooled';
  }

  // Helper method to generate SN= format for pools
  generatePoolSdrfValue(pool: any): string {
    if (!pool.pooled_only_samples || pool.pooled_only_samples.length === 0) {
      return 'not pooled';
    }
    
    const sampleNames = pool.pooled_only_samples.map((index: number) => `Sample${index}`);
    return `SN=${sampleNames.join(',')}`;
  }

  async read_metadata_from_excel(data: ArrayBuffer, user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[], sample_number: number, user_id: number, service_lab_group_id: number, field_masks: {name: string, mask: string}[] = [], pools: any[] = []) {
    const workbook = new Workbook();
    await workbook.xlsx.load(data)
    const main_ws = workbook.getWorksheet('main')
    const hidden_ws = workbook.getWorksheet('hidden')
    const id_metadata_column_map_ws = workbook.getWorksheet('id_metadata_column_map')
    const id_metadata_column_map: any = {}
    let id_metadata_column_map_list: any[][] = []
    let field_mask_map: {[key: string]: string} = {}
    for (const field_mask of field_masks) {
      field_mask_map[field_mask.mask] = field_mask.name
    }
    if (id_metadata_column_map_ws) {
      // convert id_metadata_column_map_ws to id_metadata_column_map_list
      id_metadata_column_map_ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip the header row
          const id = row.getCell(1).value as string;
          const column = row.getCell(2).value as number;
          const name = row.getCell(3).value as string;
          const type = row.getCell(4).value as string;
          const hidden = row.getCell(5).value as boolean;
          id_metadata_column_map_list.push([parseInt(id), column, name, type, hidden]);
          id_metadata_column_map[parseInt(id)] = {column: column, name: name, type: type, hidden: hidden};
        }
      });
    }
    const user_metadata_field_map: any = {}
    const staff_metadata_field_map: any = {}
    for (const m of user_metadata) {
      if (!user_metadata_field_map[m.type]) {
        user_metadata_field_map[m.type] = {}
      }
      if (!user_metadata_field_map[m.type][m.name]) {
        user_metadata_field_map[m.type][m.name] = []
      }
      user_metadata_field_map[m.type][m.name].push(JSON.parse(JSON.stringify(m)))
    }
    for (const m of staff_metadata) {
      if (!staff_metadata_field_map[m.type]) {
        staff_metadata_field_map[m.type] = {}
      }
      if (!staff_metadata_field_map[m.type][m.name]) {
        staff_metadata_field_map[m.type][m.name] = []
      }
      staff_metadata_field_map[m.type][m.name].push(JSON.parse(JSON.stringify(m)))
    }
    let main_metadata: MetadataColumn[] = []
    const m_headers: string[] = []
    
    // Find the highest ID from existing user and staff metadata to avoid conflicts
    let maxExistingId = 0;
    [...user_metadata, ...staff_metadata].forEach(m => {
      if (m.id > maxExistingId) {
        maxExistingId = m.id;
      }
    });
    let currentID = maxExistingId + 1;
    if (main_ws) {
      const main_headers = main_ws.getRow(1).values
      if (main_headers){
        if (Array.isArray(main_headers)) {
          main_headers.forEach((h: CellValue, ind: number) => {
            console.log(ind)
            if (typeof h === 'string') {
              let column_id = 0
              for (const row of id_metadata_column_map_list) {
                if (row[1] === ind -1 && !row[4]) {
                  column_id = row[0]
                  break
                }
              }
              // Note: Don't update currentID with Excel mapping IDs to avoid conflicts
              if (column_id > 0) {
                const foundCol = user_metadata.find((m) => {
                  if (m.id === column_id) {
                    main_metadata.push(m)
                    m_headers.push(m.name)
                    return true
                  }
                  return false
                })
                if (!foundCol) {
                  const foundStaffCol = staff_metadata.find((m) => {
                    if (m.id === column_id) {
                      main_metadata.push(m)
                      m_headers.push(m.name)
                      return true
                    }
                    return false
                  })
                  if (!foundStaffCol) {
                    console.log("Column not found in metadata", h, column_id)
                    console.log("Available user metadata IDs:", user_metadata.map(m => m.id))
                    console.log("Available staff metadata IDs:", staff_metadata.map(m => m.id))
                    
                    // Column ID exists but no matching metadata found - create new metadata column
                    const header = h.toLowerCase();
                    let metadata_type = "";
                    let metadata_name = "";
                    if (header.includes("[")) {
                      metadata_type = header.split("[")[0];
                      metadata_name = header.split("[")[1].replace("]", "");
                    } else {
                      metadata_name = header;
                    }
                    const metadata_name_capitalized = (metadata_name.charAt(0).toUpperCase() + metadata_name.slice(1)).replace("Ms1", "MS1").replace("Ms2", "MS2")
                    if (field_mask_map[metadata_name_capitalized]) {
                      metadata_name = field_mask_map[metadata_name_capitalized]
                    }
                    const metadata: MetadataColumn = {
                      name: metadata_name_capitalized,
                      type: metadata_type.charAt(0).toUpperCase() + metadata_type.slice(1),
                      value: "",
                      modifiers: [],
                      hidden: false,
                      column_position: 0,
                      stored_reagent: null,
                      id: ++currentID,
                      created_at: new Date(),
                      updated_at: new Date(),
                      not_applicable: false,
                      mandatory: false,
                      auto_generated: false,
                      readonly: false
                    };
                    console.log("Creating new metadata column from mismatched ID:", metadata);
                    main_metadata.push(metadata);
                    m_headers.push(metadata.name);
                  }
                }
              } else {
                const header = h.toLowerCase();
                let metadata_type = "";
                let metadata_name = "";
                if (header.includes("[")) {
                  metadata_type = header.split("[")[0];
                  metadata_name = header.split("[")[1].replace("]", "");
                } else {
                  metadata_name = header;
                }
                const metadata_name_capitalized = (metadata_name.charAt(0).toUpperCase() + metadata_name.slice(1)).replace("Ms1", "MS1").replace("Ms2", "MS2")
                if (field_mask_map[metadata_name_capitalized]) {
                  metadata_name = field_mask_map[metadata_name_capitalized]
                }
                const metadata: MetadataColumn = {
                  name: metadata_name,
                  type: metadata_type.charAt(0).toUpperCase() + metadata_type.slice(1),
                  value: "",
                  modifiers: [],
                  hidden: false,
                  column_position: 0,
                  stored_reagent: null,
                  id: ++currentID,
                  created_at: new Date(),
                  updated_at: new Date(),
                  not_applicable: false,
                  mandatory: false,
                  auto_generated: false,
                  readonly: false
                };
                console.log("Creating new metadata column:", metadata);
                main_metadata.push(metadata);
                m_headers.push(metadata.name);
              }
            }
          });
        }
      }
    }
    let hidden_metadata: MetadataColumn[] = []
    const h_headers: string[] = []
    if (hidden_ws) {
      const hidden_headers = hidden_ws.getRow(1).values
      if (hidden_headers) {
        if (Array.isArray(hidden_headers)) {
          hidden_headers.forEach((h: CellValue, ind: number) => {
            if (typeof h === 'string') {
              let column_id = 0
              for (const row of id_metadata_column_map_list) {
                if (row[1] === ind -1 && row[4]) {
                  column_id = row[0]
                  break
                }
              }
              // Note: Don't update currentID with Excel mapping IDs to avoid conflicts

              if (column_id > 0) {
                const foundCol = user_metadata.find((m) => {
                  if (m.id === column_id) {
                    hidden_metadata.push(m)
                    h_headers.push(m.name)
                    return true
                  }
                  return false
                })
                if (!foundCol) {
                  staff_metadata.find((m) => {
                    if (m.id === column_id) {
                      hidden_metadata.push(m)
                      h_headers.push(m.name)
                      return true
                    }
                    return false
                  })
                }
              } else {
                const header = h.toLowerCase();
                let metadata_type = "";
                let metadata_name = "";
                if (header.includes("[")) {
                  metadata_type = header.split("[")[0];
                  metadata_name = header.split("[")[1].replace("]", "");
                } else {
                  metadata_name = header;
                }
                const metadata_name_capitalized = (metadata_name.charAt(0).toUpperCase() + metadata_name.slice(1)).replace("Ms1", "MS1").replace("Ms2", "MS2")
                if (field_mask_map[metadata_name_capitalized]) {
                  metadata_name = field_mask_map[metadata_name_capitalized]
                }
                const metadata: MetadataColumn = {
                  name: metadata_name,
                  type: metadata_type.charAt(0).toUpperCase() + metadata_type.slice(1),
                  value: "",
                  modifiers: [],
                  hidden: true,
                  column_position: 0,
                  stored_reagent: null,
                  id: ++currentID,
                  created_at: new Date(),
                  updated_at: new Date(),
                  not_applicable: false,
                  mandatory: false,
                  auto_generated: false,
                  readonly: false
                };
                hidden_metadata.push(metadata);
                h_headers.push(metadata.name);
              }
            }
          });
        }
      }
    }
    let main_data: any[] = []
    if (main_ws) {
      const m_rows = main_ws.getRows(2, sample_number+1)
      if (m_rows) {
        main_data = m_rows
      }
    }
    let hidden_data: any[] = []
    if (hidden_ws) {
      const h_rows = hidden_ws.getRows(2, sample_number+1)
      if (h_rows) {
        hidden_data = h_rows
      }
    }
    let headers: string[] = []
    let fin_data: string[][] = []
    const result: {user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[], pools?: any[]} = {
      user_metadata: [],
      staff_metadata: []
    }

    if (hidden_data) {
      headers = m_headers.concat(h_headers);
      for (let i = 0; i < sample_number; i++) {
        fin_data[i] = [];
        for (let j = 0; j < headers.length; j++) {
          if (j < m_headers.length) {
            fin_data[i][j] = main_data[i] ? main_data[i].getCell(j + 1).value : "";
          } else {
            fin_data[i][j] = hidden_data[i] ? hidden_data[i].getCell(j - m_headers.length + 1).value : "";
          }
        }
      }
    } else {
      headers = m_headers;
      for (let i = 0; i < sample_number; i++) {
        fin_data[i] = [];
        for (let j = 0; j < headers.length; j++) {
          fin_data[i][j] = main_data[i] ? main_data[i].getCell(j + 1).value : "";
        }
      }
    }
    let combined_metadata: MetadataColumn[] = main_metadata.concat(hidden_metadata)

    for (let i = 0; i< combined_metadata.length; i++ ) {
      const metadata_value_map: any = {}
      if (combined_metadata[i].readonly) {
        if (user_metadata_field_map[combined_metadata[i].type]) {
          if (user_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name]) {
            const m = user_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name].find((m: MetadataColumn) => m.id === combined_metadata[i].id)
            if (m) {
              user_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name] = user_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name].filter((m: MetadataColumn) => m.id !== combined_metadata[i].id)
              result.user_metadata.push(combined_metadata[i])
              continue
            }

          }
        }
        if (staff_metadata_field_map[combined_metadata[i].type]) {
          if (staff_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name]) {
            const m = staff_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name].find((m: MetadataColumn) => m.id === combined_metadata[i].id)
            if (m) {
              staff_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name] = staff_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name].filter((m: MetadataColumn) => m.id !== combined_metadata[i].id)
              result.staff_metadata.push(staff_metadata[i])
              continue
            }
          }
        }
      }
      for (let j = 0; j < sample_number; j++) {
        const metadata_name = combined_metadata[i].name.toLowerCase()
        let value = ""
        if (!fin_data[j][i]) {
          fin_data[j][i] = ""
        }

        if (fin_data[j][i] === "") {
          if (metadata_name === "tissue" || this.requiredColumnNames.includes(combined_metadata[i].name)) {
            fin_data[j][i] = "not applicable"
          } else {
            fin_data[j][i] = "not available"
          }
        }

        if (fin_data[j][i] === "not applicable" || fin_data[j][i] === "not available") {
          value = fin_data[j][i]
        } else if (fin_data[j][i].endsWith("[**]")) {
          value = fin_data[j][i].replace("[**]", "")
          const value_query = await this.web.getFavouriteMetadataOptions(1, 0, undefined, 'service_lab_group', service_lab_group_id, combined_metadata[i].name, value).toPromise()
          if (value_query) {
            if (value_query.results.length > 0) {
              value = value_query.results[0].value
            }
          }
          value = await this.convert_sdrf_to_metadata(metadata_name, value)
        } else if (fin_data[j][i].endsWith("[***]")) {
          value = fin_data[j][i].replace("[***]", "")
          const value_query = await this.web.getFavouriteMetadataOptions(1, 0, undefined, undefined, undefined, combined_metadata[i].name, value, true).toPromise()
          if (value_query) {
            if (value_query.results.length > 0) {
              value = value_query.results[0].value
            }
          }
          value = await this.convert_sdrf_to_metadata(metadata_name, value)
        } else {
          value = fin_data[j][i]
        }
        if (!metadata_value_map[value]) {
          metadata_value_map[value] = []
        }
        metadata_value_map[value].push(j)
      }
      let max_count = 0
      let max_value = null
      for (const v in metadata_value_map) {
        if (metadata_value_map[v].length > max_count) {
          max_count = metadata_value_map[v].length
          max_value = v
        }
      }
      if (max_value) {
        combined_metadata[i].value = max_value
      }
      const modifiers: any[] = []
      for (const v in metadata_value_map) {
        if (v !== max_value) {
          const modifier: any = {
            value: v,
            samples: []
          }
          const samples = metadata_value_map[v]
          samples.sort((a: number, b: number) => a - b)
          let start:number = samples[0]
          let end:number = samples[0]
          for (let k = 1; k < samples.length; k++) {
            if (samples[k] === end + 1) {
              end = samples[k]
            } else {
              if (start === end) {
                modifier.samples.push(`${start+1}`)
              } else {
                modifier.samples.push(`${start+1}-${end+1}`)
              }
              start = samples[k]
              end = samples[k]
            }
          }
          if (start === end) {
            modifier.samples.push(`${start+1}`)
          } else {
            modifier.samples.push(`${start+1}-${end+1}`)
          }
          if (modifier.samples.length === 1) {
            modifier.samples = modifier.samples[0]
          } else {
            modifier.samples = modifier.samples.join(",")
          }
          modifiers.push(modifier)
        }
      }
      if (modifiers.length > 0) {
        combined_metadata[i].modifiers = modifiers
      }
      if (combined_metadata[i].type === "Factor value") {
        result.staff_metadata.push(combined_metadata[i])
      } else {
        if (staff_metadata_field_map[combined_metadata[i].type]) {
          if (staff_metadata_field_map[combined_metadata[i].type][combined_metadata[i].name]) {
            result.staff_metadata.push(combined_metadata[i])
          } else {
            result.user_metadata.push(combined_metadata[i])
          }
        } else {
          result.user_metadata.push(combined_metadata[i])
        }
      }
    }

    // Check for pool data if pools parameter is provided
    if (pools && pools.length >= 0) {
      const detected_pools = this.detectPoolsFromExcel(workbook);
      if (detected_pools.length > 0) {
        result.pools = detected_pools;
      }
    }

    // Import pool data if pool worksheets exist
    const pool_object_map_ws = workbook.getWorksheet('pool_object_map');
    if (pool_object_map_ws) {
      console.log("Found pool worksheets, importing pool data...");
      const imported_pools = this.importPoolsFromExcel(workbook);
      if (imported_pools.length > 0) {
        result.pools = imported_pools;
        console.log("Imported pools:", imported_pools);
      }
    }

    console.log("Final Excel import result:", {
      user_metadata_count: result.user_metadata.length,
      staff_metadata_count: result.staff_metadata.length,
      pools_count: result.pools?.length || 0,
      user_metadata: result.user_metadata.map(m => ({ id: m.id, name: m.name, type: m.type })),
      staff_metadata: result.staff_metadata.map(m => ({ id: m.id, name: m.name, type: m.type })),
      pools: result.pools || []
    });

    return result
  }

  // Helper method to import pools from Excel workbook
  importPoolsFromExcel(workbook: any): any[] {
    const pools: any[] = [];
    const pool_object_map_ws = workbook.getWorksheet('pool_object_map');
    
    if (!pool_object_map_ws) {
      return pools;
    }
    
    // Read pool object mapping
    pool_object_map_ws.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 1) { // Skip header row
        const pool_id = row.getCell(1).value;
        const pool_name = row.getCell(2).value;
        const is_reference = row.getCell(3).value;
        const pooled_only_samples_str = row.getCell(4).value;
        const pooled_and_independent_samples_str = row.getCell(5).value;
        
        // Parse sample arrays
        const pooled_only_samples = pooled_only_samples_str ? 
          pooled_only_samples_str.toString().split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)) : [];
        const pooled_and_independent_samples = pooled_and_independent_samples_str ? 
          pooled_and_independent_samples_str.toString().split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)) : [];
        
        const pool = {
          id: pool_id || Date.now() + Math.random(), // Generate ID if missing
          pool_name: pool_name || `Pool ${rowNumber - 1}`,
          is_reference: is_reference === true || is_reference === 'true',
          pooled_only_samples: pooled_only_samples,
          pooled_and_independent_samples: pooled_and_independent_samples,
          user_metadata: [],
          staff_metadata: []
        };
        
        pools.push(pool);
      }
    });
    
    console.log("Imported pools from Excel:", pools);
    return pools;
  }

  // Helper method to detect pools from Excel workbook
  detectPoolsFromExcel(workbook: any): any[] {
    const pools: any[] = [];
    
    try {
      const pool_object_map_ws = workbook.getWorksheet('pool_object_map');
      if (pool_object_map_ws) {
        const rows = pool_object_map_ws.getRows();
        if (rows && rows.length > 1) { // Skip header row
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.values && row.values.length >= 5) {
              const pool = {
                id: row.values[1] || Date.now() + i,
                pool_name: row.values[2] || '',
                is_reference: row.values[3] === true || row.values[3] === 'true',
                pooled_only_samples: this.parseNumberList(row.values[4]),
                pooled_and_independent_samples: this.parseNumberList(row.values[5]),
                user_metadata: [],
                staff_metadata: []
              };
              pools.push(pool);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error detecting pools from Excel:', error);
    }
    
    return pools;
  }

  // Helper method to parse comma-separated number lists
  parseNumberList(value: any): number[] {
    if (!value || typeof value !== 'string') return [];
    return value.split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
  }

  async export_metadata_to_sdrf(user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[], sample_number: number, user_id: number = 0, service_lab_group_id: number = 0, pools: any[] = []) {
    const metadata = user_metadata.concat(staff_metadata)
    const [result, _] = await this.sort_metadata(metadata, sample_number)
    const headers = result[0]
    const data = result.slice(1)
    for (let i = 0; i < headers.length; i++) {
      let metadata_name = headers[i].toLowerCase()
      let metadata_type = ""
      if (metadata_name.includes("[")) {
        metadata_type = metadata_name.split("[")[0]
        metadata_name = metadata_name.split("[")[1].replace("]", "")
      }
      const capitalised = metadata_name.charAt(0).toUpperCase() + metadata_name.slice(1);

      for (let j = 0; j < data.length; j++) {
        if (!data[j][i]) {
          if (this.requiredColumnNames.includes(capitalised) || capitalised === "Organism part") {
            data[j][i] = "not applicable";
          } else {
            data[j][i] = "not available";
          }
        } else if (data[j][i] === "") {
          if (this.requiredColumnNames.includes(capitalised) || capitalised === "Organism part") {
            data[j][i] = "not applicable";
          } else {
            data[j][i] = "not available";
          }
        }
      }
    }

    // Remove any trailing empty columns
    for (let j = 0; j < data.length; j++) {
      while (data[j].length > headers.length) {
        data[j].pop();
      }
    }

    // Add pool information to SDRF if pools are provided (only reference pools)
    if (pools && pools.length > 0) {
      const reference_pools = pools.filter(p => p.is_reference);
      if (reference_pools.length > 0) {
        this.addPooledSampleColumnToSdrf([headers, ...data], reference_pools, sample_number);
      }
    }

    return [headers, ...data]
  }

  // Helper method to add pooled sample column to SDRF
  addPooledSampleColumnToSdrf(sdrf_data: string[][], pools: any[], sample_number: number): void {
    if (!sdrf_data || sdrf_data.length === 0) return;
    
    const headers = sdrf_data[0];
    let pooled_column_index = headers.findIndex(h => h.toLowerCase().includes('pooled sample'));
    
    if (pooled_column_index === -1) {
      // Add new column
      pooled_column_index = headers.length;
      headers.push('characteristics[pooled sample]');
      
      // Add empty cells for existing rows
      for (let i = 1; i < sdrf_data.length; i++) {
        sdrf_data[i].push('');
      }
    }
    
    // Populate pooled sample values - for reference pools, add SN= format
    for (let sample_idx = 1; sample_idx <= sample_number; sample_idx++) {
      const data_row_idx = sample_idx; // Assuming 1-based sample indexing
      if (data_row_idx < sdrf_data.length) {
        let pooled_value = 'not pooled';
        
        // Check if sample is in any reference pool
        for (const pool of pools) {
          if (pool.pooled_only_samples?.includes(sample_idx) || 
              pool.pooled_and_independent_samples?.includes(sample_idx)) {
            pooled_value = this.generatePoolSdrfValue(pool);
            break;
          }
        }
        
        sdrf_data[data_row_idx][pooled_column_index] = pooled_value;
      }
    }
  }

  async import_metadata_from_sdrf(data_string: string, user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[], sample_number: number = 0, user_id: number = 0, service_lab_group_id: number = 0, pools: any[] = []) {
    const data = data_string.split("\n")
    const headers = data[0].split("\t")
    const data_values = data.slice(1)
    let values: string[][] = []
    for (let i = 0; i < data_values.length; i++) {
      values.push(data_values[i].split("\t"))
    }
    const user_metadata_field_map: any = {}
    const staff_metadata_field_map: any = {}
    const user_hidden_metadata: MetadataColumn[] = []
    for (const m of user_metadata) {
      if (!user_metadata_field_map[m.type]) {
        user_metadata_field_map[m.type] = {}
      }
      if (!user_metadata_field_map[m.type][m.name]) {
        user_metadata_field_map[m.type][m.name] = []
      }
      user_metadata_field_map[m.type][m.name].push(JSON.parse(JSON.stringify(m)))
      if (m.hidden) {
        user_hidden_metadata.push(JSON.parse(JSON.stringify(m)))
      }
    }
    const staff_hidden_metadata: MetadataColumn[] = []
    for (const m of staff_metadata) {
      if (!staff_metadata_field_map[m.type]) {
        staff_metadata_field_map[m.type] = {}
      }
      if (!staff_metadata_field_map[m.type][m.name]) {
        staff_metadata_field_map[m.type][m.name] = []
      }
      staff_metadata_field_map[m.type][m.name].push(JSON.parse(JSON.stringify(m)))
      if (m.hidden) {
        staff_hidden_metadata.push(JSON.parse(JSON.stringify(m)))
      }
    }

    let user_columns: MetadataColumn[] = []
    let staff_columns: MetadataColumn[] = []

    for (let i = 0; i < headers.length; i++) {
      let metadata_name = headers[i].toLowerCase()
      let metadata_type = ""
      if (metadata_name.includes("[")) {
        metadata_type = metadata_name.split("[")[0]
        metadata_name = metadata_name.split("[")[1].replace("]", "")
      }
      if (metadata_name === "organism part") {
        metadata_name = "tissue"
      }

      const metadata: MetadataColumn = {
        name: (metadata_name.charAt(0).toUpperCase() + metadata_name.slice(1)).replace("Ms1", "MS1").replace("Ms2", "MS2"),
        type: metadata_type.charAt(0).toUpperCase() + metadata_type.slice(1),
        value: "",
        modifiers: [],
        hidden: false,
        column_position: 0,
        stored_reagent: null,
        id: i+1,
        created_at: new Date(),
        updated_at: new Date(),
        not_applicable: false,
        mandatory: false,
        auto_generated: false,
        readonly: false
      }

      let max_count = 0
      let max_value = null
      const metadata_value_map: any = {}
      for (let j = 0; j < sample_number; j++) {
        const value = values[j][i]
        if (!metadata_value_map[value]) {
          metadata_value_map[value] = []
        }
        metadata_value_map[value].push(j)
      }

      for (const v in metadata_value_map) {
        if (metadata_value_map[v].length > max_count) {
          max_count = metadata_value_map[v].length
          max_value = v
        }
      }

      if (max_value) {
        metadata.value = max_value
      }

      const modifiers: any[] = []

      for (const v in metadata_value_map) {
        if (v !== max_value) {
          const modifier: any = {
            value: v,
            samples: []
          }
          const samples = metadata_value_map[v]
          samples.sort((a: number, b: number) => a - b)
          let start:number = samples[0]
          let end:number = samples[0]
          for (let k = 1; k < samples.length; k++) {
            if (samples[k]) {
              if (samples[k] === end + 1) {
                end = samples[k]
              } else {
                if (start === end) {
                  modifier.samples.push(`${start+1}`)
                } else {
                  modifier.samples.push(`${start+1}-${end+1}`)
                }
                start = samples[k]
                end = samples[k]
              }
            }

          }
          if (start === end) {
            modifier.samples.push(`${start+1}`)
          } else {
            modifier.samples.push(`${start+1}-${end+1}`)
          }
          if (modifier.samples.length === 1) {
            modifier.samples = modifier.samples[0]
          } else {
            modifier.samples = modifier.samples.join(",")
          }
          modifiers.push(modifier)
        }
      }

      if (modifiers.length > 0) {
        metadata.modifiers = modifiers
      } else {
        metadata.modifiers = []
      }
      // Enhanced metadata sorting logic for SDRF import
      if ("factor value" === metadata.type.toLowerCase()) {
        // Factor value type always goes to staff metadata
        staff_columns.push(metadata)
      } else {
        // Check for exact match in existing hidden metadata
        const staffHiddenMatch = staff_hidden_metadata.findIndex((v) => {
          return v.name === metadata.name && v.type === metadata.type
        }) > -1;
        
        const userHiddenMatch = user_hidden_metadata.findIndex((v) => {
          return v.name === metadata.name && v.type === metadata.type
        }) > -1;
        
        if (staffHiddenMatch) {
          metadata.hidden = true
          staff_columns.push(metadata)
        } else if (userHiddenMatch) {
          metadata.hidden = true
          user_columns.push(metadata)
        } else {
          // Check for exact match in existing staff metadata (type + name)
          const staffExactMatch = staff_metadata_field_map[metadata.type] && 
                                 staff_metadata_field_map[metadata.type][metadata.name];
          
          // Check for exact match in existing user metadata (type + name)  
          const userExactMatch = user_metadata_field_map[metadata.type] && 
                                user_metadata_field_map[metadata.type][metadata.name];
          
          if (staffExactMatch) {
            // Exact match found in staff metadata
            staff_columns.push(metadata)
          } else if (userExactMatch) {
            // Exact match found in user metadata
            user_columns.push(metadata)
          } else {
            // No exact match found - check for partial matches
            
            // Check if same name exists in staff metadata (any type)
            const staffNameMatch = Object.values(staff_metadata_field_map).some((typeMap: any) => 
              typeMap[metadata.name]
            );
            
            // Check if same name exists in user metadata (any type)
            const userNameMatch = Object.values(user_metadata_field_map).some((typeMap: any) => 
              typeMap[metadata.name]
            );
            
            if (staffNameMatch && !userNameMatch) {
              // Name exists only in staff metadata
              staff_columns.push(metadata)
            } else if (userNameMatch && !staffNameMatch) {
              // Name exists only in user metadata
              user_columns.push(metadata)
            } else if (staff_metadata_field_map[metadata.type]) {
              // Type exists in staff metadata but name doesn't match exactly
              staff_columns.push(metadata)
            } else {
              // Default: new columns go to user metadata unless they are factor values
              user_columns.push(metadata)
            }
          }
        }
      }

    }

    // Detect pools from SDRF if pools parameter is provided
    const result: any = {user_metadata: user_columns, staff_metadata: staff_columns};
    if (pools !== undefined) {
      const detected_pools = this.detectPoolsFromSdrf(headers, values);
      if (detected_pools.length > 0) {
        result.pools = detected_pools;
      }
    }

    return result;
  }

  // Helper method to detect pools from SDRF data
  detectPoolsFromSdrf(headers: string[], values: string[][]): any[] {
    const pools: any[] = [];
    
    try {
      // Find pooled sample column
      const pooled_column_index = headers.findIndex(h => h.toLowerCase().includes('pooled sample'));
      if (pooled_column_index === -1) return pools;
      
      // Collect samples with SN= format (indicates pooled samples)
      const pool_map = new Map<string, any>();
      
      values.forEach((row, sample_index) => {
        if (row[pooled_column_index] && row[pooled_column_index].startsWith('SN=')) {
          const sn_value = row[pooled_column_index];
          const sample_names = sn_value.substring(3).split(',').map(s => s.trim());
          
          // Create or update pool
          if (!pool_map.has(sn_value)) {
            pool_map.set(sn_value, {
              id: Date.now() + Math.random(),
              pool_name: `Pool_${pool_map.size + 1}`,
              is_reference: true, // SN= format indicates reference pool
              pooled_only_samples: [],
              pooled_and_independent_samples: [],
              user_metadata: [],
              staff_metadata: []
            });
          }
          
          const pool = pool_map.get(sn_value);
          pool.pooled_only_samples.push(sample_index + 1); // Convert to 1-based indexing
        }
      });
      
      pools.push(...pool_map.values());
    } catch (error) {
      console.warn('Error detecting pools from SDRF:', error);
    }
    
    return pools;
  }

  async validateMetadata(user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[], sample_number: number = 0, user_id: number = 0, service_lab_group_id: number = 0, pools: any[] = []) {
    const data_values = await this.export_metadata_to_sdrf(user_metadata, staff_metadata, sample_number, user_id, service_lab_group_id, pools)
    const errors = await this.web.validateMetadataTemplateSDRF(data_values).toPromise()
    return errors
  }

  checkMissingColumn(userColumnNames: string[], staffColumnNames: string[]) {
    const missingColumns: string[] = []
    for (const n of this.requiredColumnNames) {
      if (!userColumnNames.includes(n) && !staffColumnNames.includes(n)) {
        missingColumns.push(n)
      }
    }
    return missingColumns
  }

  checkMissingColumnMetadata(user_metadata: MetadataColumn[], staff_metadata: MetadataColumn[]) {
    const userColumnNames = user_metadata.map((m) => m.name)
    const staffColumnNames = staff_metadata.map((m) => m.name)
    return this.checkMissingColumn(userColumnNames, staffColumnNames)
  }

  randomizeFile(metadata: MetadataColumn[], sample_number: number) {
    const headers = metadata.map((m) => m.name)
    const rowData: {[key: number]: string[]} = {}
    for (let i = 0; i < metadata.length; i++) {
      const modifiers = metadata[i].modifiers
      const modifierMap: any = {}

      for (let j = 0; j < modifiers.length; j++) {
        const samples = this.parseSampleRanges(modifiers[j].samples)
        for (const s of samples) {
          modifierMap[s] = modifiers[j].value
        }
      }
      for (let j = 0; j < sample_number; j++) {
        if (!rowData[j]) {
          rowData[j] = []
        }
        if (modifierMap[j+1]) {
          rowData[j].push(modifierMap[j+1])
        } else {
          rowData[j].push(metadata[i].value)
        }
      }
    }
    const data = []
    for (let i = 0; i < sample_number; i++) {
      data.push(rowData[i])
    }

    // randomize the rows of the metadata
    data.sort(() => Math.random() - 0.5)
    return [headers, ...data]
  }

  convertInjectionFile(dataFileCol: MetadataColumn, positionCol: MetadataColumn, injection_vol: number, sample_number: number) {
    const data = this.randomizeFile([dataFileCol, positionCol], sample_number)
    let content = "Bracket Type=4\n"
    content += "Sample Type\tFile Name\tPosition\tInj Vol\n"
    const result = data.slice(1)
    for (let i = 0; i < result.length; i++) {
      content += `Unknown\t${result[i][0]}\t${result[i][1]}\t${injection_vol}\n`
    }
    return content
  }

  parseSampleRanges(samples: string): number[] {
    const result: number[] = [];
    const ranges = samples.split(',');
    ranges.forEach(range => {
      const [start, end] = range.split('-').map(Number);
      if (end !== undefined) {
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
      } else {
        result.push(start);
      }
    });
    return result;
  }

  // Pooled sample methods
  getSamplePools(instrumentJobId: number): Observable<SamplePool[]> {
    return this.web.getSamplePools(instrumentJobId);
  }

  createSamplePool(instrumentJobId: number, poolData: SamplePoolCreateRequest): Observable<SamplePool> {
    return this.web.createSamplePool(instrumentJobId, poolData);
  }

  getSamplePoolOverview(instrumentJobId: number): Observable<SamplePoolOverview> {
    return this.web.getSamplePoolOverview(instrumentJobId);
  }

  updateSamplePool(poolId: number, poolData: SamplePoolUpdateRequest): Observable<SamplePool> {
    return this.web.updateSamplePool(poolId, poolData);
  }

  deleteSamplePool(poolId: number): Observable<void> {
    return this.web.deleteSamplePool(poolId);
  }

  addSampleToPool(poolId: number, sampleIndex: number, status: string): Observable<AddSampleResponse> {
    return this.web.addSampleToPool(poolId, sampleIndex, status);
  }

  removeSampleFromPool(poolId: number, sampleIndex: number): Observable<RemoveSampleResponse> {
    return this.web.removeSampleFromPool(poolId, sampleIndex);
  }

  getSampleStatusOverview(instrumentJobId: number): Observable<SampleStatusOverview[]> {
    return this.web.getSampleStatusOverview(instrumentJobId);
  }

  updatePoolMetadata(poolId: number, metadataColumnId: number, value: string): Observable<any> {
    return this.web.updatePoolMetadata(poolId, metadataColumnId, value);
  }
}
