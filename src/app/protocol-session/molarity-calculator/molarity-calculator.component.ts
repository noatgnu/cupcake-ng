import {Component, Input} from '@angular/core';
import {DataService} from "../../data.service";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Annotation} from "../../annotation";
import {NgbAlert} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-molarity-calculator',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgbAlert
  ],
  templateUrl: './molarity-calculator.component.html',
  styleUrl: './molarity-calculator.component.scss'
})
export class MolarityCalculatorComponent {
  selectedForm: 'dynamic'|'massFromVolumeAndConcentration'| 'volumeFromMassAndConcentration'| 'concentrationFromMassAndVolume'| 'volumeFromStockVolumeAndConcentration' = 'dynamic'
  private _annotation?: Annotation

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    if (value.annotation) {
      const annotation = JSON.parse(value.annotation)
      if (annotation) {
        if (Object.keys(annotation).length === 0) {
          this.dataLog = []
          return
        }
        this.dataLog = annotation
      } else {
        this.dataLog = []
      }
    } else {
      this.dataLog = []
    }
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  formDynamicsFormula = this.fb.group({
    concentration: [],
    concentrationUnit: ["uM"],
    volume: [],
    volumeUnit: ["mL"],
    molecularWeight: [],
    weight: [],
    weightUnit: ["g"]
  })

  formMassFromVolumeAndConcentration = this.fb.group({
    concentration: [],
    concentrationUnit: ["uM"],
    volume: [],
    volumeUnit: ["mL"],
    molecularWeight: [],
    weightUnit: ["g"]
  })

  formVolumeFromMassAndConcentration = this.fb.group({
    weight: [],
    weightUnit: ["g"],
    concentration: [],
    concentrationUnit: ["uM"],
    molecularWeight: [],
    volumeUnit: ["mL"]
  })

  formConcentrationFromMassAndVolume = this.fb.group({
    weight: [],
    weightUnit: ["g"],
    volume: [],
    volumeUnit: ["mL"],
    molecularWeight: [],
    concentrationUnit: ["uM"]
  })

  formVolumeFromStockVolumeAndConcentration = this.fb.group({
    volumeUnit: ["mL"],
    stockConcentration: [],
    stockConcentrationUnit: ["uM"],
    targetConcentration: [],
    targetConcentrationUnit: ["uM"],
    stockVolume: [],
    stockVolumeUnit: ["mL"]
  })

  dataLog: {data: any, operationType: string, result: number}[] = []

  constructor(private fb: FormBuilder, private toastService: ToastService, private web: WebService, public dataService: DataService) {
  }

  calculate() {
    switch (this.selectedForm) {
      case 'massFromVolumeAndConcentration':
        this.calculateMassFromVolumeAndConcentration()
        break
      case 'volumeFromMassAndConcentration':
        this.calculateVolumeFromMassAndConcentration()
        break
      case 'concentrationFromMassAndVolume':
        this.calculateConcentrationFromMassAndVolume()
        break
      case 'volumeFromStockVolumeAndConcentration':
        this.calculateVolumeFromStockVolumeAndConcentration()
        break
    }
  }

  calculateMassFromVolumeAndConcentration() {
    const concentration = this.formMassFromVolumeAndConcentration.value.concentration
    const volume = this.formMassFromVolumeAndConcentration.value.volume
    const molecularWeight = this.formMassFromVolumeAndConcentration.value.molecularWeight
    const concentrationUnit = this.formMassFromVolumeAndConcentration.value.concentrationUnit
    const volumeUnit = this.formMassFromVolumeAndConcentration.value.volumeUnit
    const weightUnit = this.formMassFromVolumeAndConcentration.value.weightUnit
    if (concentration && volume && concentrationUnit && volumeUnit && molecularWeight && weightUnit) {
      const concentrationInMolar = this.dataService.convertMolarity(concentration, concentrationUnit, "M")
      const volumeInLiters = this.dataService.convertVolume(volume, volumeUnit, "L")
      const mass = concentrationInMolar * volumeInLiters * molecularWeight
      // convert to target weight unit
      const finalWeight = this.dataService.convertMass(mass, "g", weightUnit)
      this.dataLog.push({
        data: {concentration, volume, molecularWeight, concentrationUnit, volumeUnit, weightUnit},
        operationType: 'massFromVolumeAndConcentration',
        result: finalWeight
      })
    }
  }

  calculateVolumeFromMassAndConcentration() {
    const weight = this.formVolumeFromMassAndConcentration.value.weight
    const concentration = this.formVolumeFromMassAndConcentration.value.concentration
    const molecularWeight = this.formVolumeFromMassAndConcentration.value.molecularWeight
    const weightUnit = this.formVolumeFromMassAndConcentration.value.weightUnit
    const concentrationUnit = this.formVolumeFromMassAndConcentration.value.concentrationUnit
    const volumeUnit = this.formVolumeFromMassAndConcentration.value.volumeUnit
    if (weight && concentration && molecularWeight && weightUnit && concentrationUnit && volumeUnit) {
      const weightInGrams = this.dataService.convertMass(weight, weightUnit, "g")
      const concentrationInMolar = this.dataService.convertMolarity(concentration, concentrationUnit, "M")
      const volume = weightInGrams / (concentrationInMolar * molecularWeight)
      // convert to target volume unit
      const finalVolume = this.dataService.convertVolume(volume, "L", volumeUnit)
      this.dataLog.push({
        data: {weight, concentration, molecularWeight, weightUnit, concentrationUnit, volumeUnit},
        operationType: 'volumeFromMassAndConcentration',
        result: finalVolume
      })
    }
  }

  calculateConcentrationFromMassAndVolume() {
    const weight = this.formConcentrationFromMassAndVolume.value.weight
    const volume = this.formConcentrationFromMassAndVolume.value.volume
    const molecularWeight = this.formConcentrationFromMassAndVolume.value.molecularWeight
    const weightUnit = this.formConcentrationFromMassAndVolume.value.weightUnit
    const volumeUnit = this.formConcentrationFromMassAndVolume.value.volumeUnit
    const concentrationUnit = this.formConcentrationFromMassAndVolume.value.concentrationUnit
    if (weight && volume && molecularWeight && weightUnit && volumeUnit && concentrationUnit) {
      const weightInGrams = this.dataService.convertMass(weight, weightUnit, "g")
      const volumeInLiters = this.dataService.convertVolume(volume, volumeUnit, "L")
      const concentration = weightInGrams / (volumeInLiters * molecularWeight)
      // convert to target concentration unit
      const finalConcentration = this.dataService.convertMolarity(concentration, "M", concentrationUnit)
      this.dataLog.push({
        data: {weight, volume, molecularWeight, weightUnit, volumeUnit, concentrationUnit},
        operationType: 'concentrationFromMassAndVolume',
        result: finalConcentration
      })
    }
  }

  calculateVolumeFromStockVolumeAndConcentration() {
    const volumeUnit = this.formVolumeFromStockVolumeAndConcentration.value.volumeUnit
    const stockConcentration = this.formVolumeFromStockVolumeAndConcentration.value.stockConcentration
    const stockConcentrationUnit = this.formVolumeFromStockVolumeAndConcentration.value.stockConcentrationUnit
    const targetConcentration = this.formVolumeFromStockVolumeAndConcentration.value.targetConcentration
    const targetConcentrationUnit = this.formVolumeFromStockVolumeAndConcentration.value.targetConcentrationUnit
    const stockVolume = this.formVolumeFromStockVolumeAndConcentration.value.stockVolume
    const stockVolumeUnit = this.formVolumeFromStockVolumeAndConcentration.value.stockVolumeUnit
    if (volumeUnit && stockVolume && stockVolumeUnit && stockConcentration && stockConcentrationUnit && targetConcentration && targetConcentrationUnit) {
      const stockConcentrationInMolar = this.dataService.convertMolarity(stockConcentration, stockConcentrationUnit, "M")
      const targetConcentrationInMolar = this.dataService.convertMolarity(targetConcentration, targetConcentrationUnit, "M")
      const stockVolumeInLiters = this.dataService.convertVolume(stockVolume, stockVolumeUnit, "L")
      const volume = stockVolumeInLiters / stockConcentrationInMolar * targetConcentrationInMolar
      // convert to target volume unit
      const finalVolume = this.dataService.convertVolume(volume, "L", volumeUnit)
      this.dataLog.push({
        data: {volumeUnit, stockConcentration, stockConcentrationUnit, targetConcentration, targetConcentrationUnit, stockVolume, stockVolumeUnit},
        operationType: 'volumeFromStockVolumeAndConcentration',
        result: finalVolume
      })
    }
  }

  calculateDynamic() {
    const concentration = this.formDynamicsFormula.value.concentration
    const volume = this.formDynamicsFormula.value.volume
    const molecularWeight = this.formDynamicsFormula.value.molecularWeight
    const weight = this.formDynamicsFormula.value.weight
    const concentrationUnit = this.formDynamicsFormula.value.concentrationUnit
    const volumeUnit = this.formDynamicsFormula.value.volumeUnit
    const weightUnit = this.formDynamicsFormula.value.weightUnit
    if (concentrationUnit && volumeUnit && weightUnit) {
      if (concentration && volume && molecularWeight) {
        const concentrationInMolar = this.dataService.convertMolarity(concentration, concentrationUnit, "M")
        const volumeInLiters = this.dataService.convertVolume(volume, volumeUnit, "L")
        const mass = concentrationInMolar * volumeInLiters * molecularWeight
        // convert to target weight unit
        const finalWeight = this.dataService.convertMass(mass, "g", weightUnit)
        this.dataLog.push({
          data: {concentration, volume, molecularWeight, concentrationUnit, volumeUnit, weightUnit},
          operationType: 'dynamic',
          result: finalWeight
        })
      } else if (weight && volume && molecularWeight) {
        const weightInGrams = this.dataService.convertMass(weight, weightUnit, "g")
        const concentration = weightInGrams / (volume * molecularWeight)
        // convert to target concentration unit
        const finalConcentration = this.dataService.convertMolarity(concentration, "M", concentrationUnit)
        this.dataLog.push({
          data: {weight, volume, molecularWeight, weightUnit, volumeUnit, concentrationUnit},
          operationType: 'dynamic',
          result: finalConcentration
        })
      } else if (weight && concentration && molecularWeight) {
        const weightInGrams = this.dataService.convertMass(weight, weightUnit, "g")
        const concentrationInMolar = this.dataService.convertMolarity(concentration, concentrationUnit, "M")
        const volume = weightInGrams / (concentrationInMolar * molecularWeight)
        // convert to target volume unit
        const finalVolume = this.dataService.convertVolume(volume, "L", volumeUnit)
        this.dataLog.push({
          data: {weight, concentration, molecularWeight, weightUnit, concentrationUnit, volumeUnit},
          operationType: 'dynamic',
          result: finalVolume
        })
      }else if (weight && volume && concentration) {
        const weightInGrams = this.dataService.convertMass(weight, weightUnit, "g")
        const volumeInLiters = this.dataService.convertVolume(volume, volumeUnit, "L")
        const concentrationInMolar = this.dataService.convertMolarity(concentration, concentrationUnit, "M")
        const molecularWeight = weightInGrams / (volumeInLiters * concentrationInMolar)
        this.dataLog.push({
          data: {weight, volume, concentration, weightUnit, volumeUnit, concentrationUnit},
          operationType: 'dynamic',
          result: molecularWeight
        })

      }
    }
  }

  updateAnnotation() {
    if (this.dataLog.length > 0) {
      this.web.updateAnnotation(JSON.stringify(this.dataLog), 'mcalculator', this.annotation.id).subscribe((response) => {
        console.log(response)
      })
    }
  }


}
