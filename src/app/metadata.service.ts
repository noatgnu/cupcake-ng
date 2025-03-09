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
  metadataNameAutocomplete: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Instrument", "Label", "Cleavage agent details", "Dissociation method", "Modification parameters", "Cell type", "Enrichment process"]
  metadataOtherAutocomplete: string[] = ["Source name", "Material type", "Assay name", "Technology type"]
  metadataCharacteristics: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Cell type", "Cell line", "Developmental stage", "Ancestry category", "Sex", "Age", "Biological replicate", "Enrichment process"]
  metadataComment: string[] = ["Data file", "File URI", "Technical replicate", "Fraction identifier", "Label", "Cleavage agent details", "Instrument", "Modification parameters", "Dissociation method", "Precursor mass tolerance", "Fragment mass tolerance", ""]
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

  optionsArray: Unimod[] = [];
  availableSpecs: any[] = []
  constructor(private web: WebService) { }

  metadataTypeAheadDataGetter(name: string, term: string) {
    let searchObservable: Observable<any[]>;
    if (name === "subcellular location") {
      searchObservable = this.web.getSubcellularLocations(undefined, 5, 0, term).pipe(
        map((response) => response.results.map((location) => location.location_identifier))
      );
    } else if (name === "disease") {
      searchObservable = this.web.getHumandDiseases(undefined, 5, 0, term).pipe(
        map((response) => response.results.map((disease) => disease.identifier))
      );
    } else if (name === "tissue") {
      searchObservable = this.web.getTissues(undefined, 5, 0, term).pipe(
        map((response) => response.results.map((tissue) => tissue.identifier))
      );
    } else if (name === "organism") {
      searchObservable = this.web.getSpecies(undefined, 5, 0, term).pipe(
        map((response) => response.results.map((species) => species.official_name))
      );
    } else if (["mass analyzer type", "alkylation reagent", "reduction reagent", "proteomics data acquisition method", "cleavage agent details", "instrument", "dissociation method", "enrichment process"].includes(name)) {
      searchObservable = this.web.getMSVocab(undefined, 5, 0, term, name).pipe(
        map((response) => response.results.map((vocab) => vocab.name))
      );
    } else if (name === "label") {
      searchObservable = this.web.getMSVocab(undefined, 5, 0, term, "sample attribute").pipe(
        map((response) => response.results.map((vocab) => vocab.name))
      );
    } else if (name === "cell type") {
      searchObservable = this.web.getMSVocab(undefined, 5, 0, term, "cell line").pipe(
        map((response) => response.results.map((vocab) => vocab.name))
      );
    } else if (name === "modification parameters") {
      searchObservable = this.web.getUnimod(undefined, 5, 0, term).pipe(
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
}
