import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DataService} from "../../data.service";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {Annotation} from "../../annotation";
import {NgbAlert, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from '@angular/common';

interface HistoryEntry {
  id: string;
  data: any;
  operationType: string;
  result: number;
  timestamp: Date;
  preset?: string;
  calculatedField?: string;
  scratched?: boolean;
}

interface CompoundPreset {
  name: string;
  mw: number;
}

@Component({
    selector: 'app-molarity-calculator',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        NgbAlert,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbTooltip,
        NgClass
    ],
    templateUrl: './molarity-calculator.component.html',
    styleUrl: './molarity-calculator.component.scss'
})
export class MolarityCalculatorComponent {
  selectedForm: 'dynamic'|'massFromVolumeAndConcentration'| 'volumeFromMassAndConcentration'| 'concentrationFromMassAndVolume'| 'volumeFromStockVolumeAndConcentration' = 'dynamic'
  private _annotation?: Annotation
  private idCounter: number = 0

  // UI State
  showSettings: boolean = false
  showCustomPresets: boolean = false
  showHistory: boolean = true
  
  // Settings
  decimalPlaces: number = 3
  defaultVolumeUnit: string = 'mL'

  // Custom preset
  customPreset: CompoundPreset = { name: '', mw: 0 }

  // Common compound presets
  commonPresets: CompoundPreset[] = [
    { name: 'NaCl', mw: 58.44 },
    { name: 'KCl', mw: 74.55 },
    { name: 'CaCl₂', mw: 110.98 },
    { name: 'MgCl₂', mw: 95.21 },
    { name: 'Glucose', mw: 180.16 },
    { name: 'Sucrose', mw: 342.30 },
    { name: 'HEPES', mw: 238.30 },
    { name: 'Tris', mw: 121.14 },
    { name: 'EDTA', mw: 292.24 },
    { name: 'DTT', mw: 154.25 },
    { name: 'BSA', mw: 66430 },
    { name: 'Glycerol', mw: 92.09 },
    { name: 'Ethanol', mw: 46.07 },
    { name: 'DMSO', mw: 78.13 },
    { name: 'ATP', mw: 507.18 },
    { name: 'NADH', mw: 664.43 }
  ]

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    if (value.annotation) {
      const annotation = JSON.parse(value.annotation)
      if (annotation) {
        if (Object.keys(annotation).length === 0) {
          this.dataLog = []
          return
        }
        // Ensure all entries have required properties
        this.dataLog = annotation.map((entry: any, index: number) => ({
          ...entry,
          id: entry.id || this.generateUniqueId(),
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          scratched: entry.scratched || false
        }))
      } else {
        this.dataLog = []
      }
    } else {
      this.dataLog = []
    }
    this.loadSettings()
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>();

  // Enhanced form groups with validation
  formDynamicsFormula = this.fb.group({
    concentration: [null],
    concentrationUnit: [this.defaultVolumeUnit === 'mL' ? 'mM' : 'M'],
    volume: [null],
    volumeUnit: [this.defaultVolumeUnit],
    molecularWeight: [null],
    weight: [null],
    weightUnit: ['mg']
  })

  formMassFromVolumeAndConcentration = this.fb.group({
    concentration: [null, Validators.required],
    concentrationUnit: ['mM'],
    volume: [null, Validators.required],
    volumeUnit: [this.defaultVolumeUnit],
    molecularWeight: [null, Validators.required],
    weightUnit: ['mg']
  })

  formVolumeFromMassAndConcentration = this.fb.group({
    weight: [null, Validators.required],
    weightUnit: ['mg'],
    concentration: [null, Validators.required],
    concentrationUnit: ['mM'],
    molecularWeight: [null, Validators.required],
    volumeUnit: [this.defaultVolumeUnit]
  })

  formConcentrationFromMassAndVolume = this.fb.group({
    weight: [null, Validators.required],
    weightUnit: ['mg'],
    volume: [null, Validators.required],
    volumeUnit: [this.defaultVolumeUnit],
    molecularWeight: [null, Validators.required],
    concentrationUnit: ['mM']
  })

  formVolumeFromStockVolumeAndConcentration = this.fb.group({
    volumeUnit: [this.defaultVolumeUnit],
    stockConcentration: [null, Validators.required],
    stockConcentrationUnit: ['mM'],
    targetConcentration: [null, Validators.required],
    targetConcentrationUnit: ['mM'],
    stockVolume: [null, Validators.required],
    stockVolumeUnit: [this.defaultVolumeUnit]
  })

  dataLog: HistoryEntry[] = []

  constructor(private fb: FormBuilder, private toastService: ToastService, private web: WebService, public dataService: DataService) {
    this.loadSettings()
  }

  private generateUniqueId(): string {
    return `molarity-${Date.now()}-${++this.idCounter}`
  }

  trackByHistoryId(index: number, item: HistoryEntry): string {
    return item.id
  }

  // Settings management
  toggleSettings(): void {
    this.showSettings = !this.showSettings
    if (this.showSettings) {
      this.showCustomPresets = false
    }
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('molarity-calculator-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        this.decimalPlaces = settings.decimalPlaces || 3
        this.defaultVolumeUnit = settings.defaultVolumeUnit || 'mL'
        this.showHistory = settings.showHistory !== false
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }

  private saveSettings(): void {
    const settings = {
      decimalPlaces: this.decimalPlaces,
      defaultVolumeUnit: this.defaultVolumeUnit,
      showHistory: this.showHistory
    }
    localStorage.setItem('molarity-calculator-settings', JSON.stringify(settings))
  }

  // Preset management
  applyPreset(preset: CompoundPreset): void {
    const currentForm = this.getCurrentForm()
    if (currentForm) {
      const molecularWeightControl = currentForm.get('molecularWeight')
      if (molecularWeightControl) {
        currentForm.patchValue({ molecularWeight: preset.mw })
        this.toastService.show('Preset Applied', `${preset.name} (${preset.mw} g/mol) applied`)
      }
    }
  }

  saveCustomPreset(): void {
    if (this.customPreset.name && this.customPreset.mw > 0) {
      const customPresets = this.getCustomPresets()
      customPresets.push({ ...this.customPreset })
      localStorage.setItem('molarity-custom-presets', JSON.stringify(customPresets))
      
      // Add to current presets list
      this.commonPresets.push({ ...this.customPreset })
      
      this.toastService.show('Preset Saved', `${this.customPreset.name} added to presets`)
      this.customPreset = { name: '', mw: 0 }
      this.showCustomPresets = false
    }
  }

  private getCustomPresets(): CompoundPreset[] {
    const saved = localStorage.getItem('molarity-custom-presets')
    return saved ? JSON.parse(saved) : []
  }

  // Form utilities
  private getCurrentForm(): any {
    switch (this.selectedForm) {
      case 'dynamic': return this.formDynamicsFormula
      case 'massFromVolumeAndConcentration': return this.formMassFromVolumeAndConcentration
      case 'volumeFromMassAndConcentration': return this.formVolumeFromMassAndConcentration
      case 'concentrationFromMassAndVolume': return this.formConcentrationFromMassAndVolume
      case 'volumeFromStockVolumeAndConcentration': return this.formVolumeFromStockVolumeAndConcentration
      default: return null
    }
  }

  clearForm(formType: string): void {
    switch (formType) {
      case 'dynamic':
        this.formDynamicsFormula.patchValue({
          concentration: null,
          volume: null,
          molecularWeight: null,
          weight: null
        })
        break
      case 'massFromVolumeAndConcentration':
        this.formMassFromVolumeAndConcentration.patchValue({
          concentration: null,
          volume: null,
          molecularWeight: null
        })
        break
      case 'volumeFromMassAndConcentration':
        this.formVolumeFromMassAndConcentration.patchValue({
          weight: null,
          concentration: null,
          molecularWeight: null
        })
        break
      case 'concentrationFromMassAndVolume':
        this.formConcentrationFromMassAndVolume.patchValue({
          weight: null,
          volume: null,
          molecularWeight: null
        })
        break
      case 'volumeFromStockVolumeAndConcentration':
        this.formVolumeFromStockVolumeAndConcentration.patchValue({
          stockConcentration: null,
          targetConcentration: null,
          stockVolume: null
        })
        break
    }
  }

  // Dynamic calculator utilities
  getFilledCount(): number {
    const form = this.formDynamicsFormula.value
    return [form.concentration, form.volume, form.molecularWeight, form.weight]
      .filter(value => value !== null && value !== undefined && value !== '').length
  }

  // Calculation methods
  calculateDynamic(): void {
    const values = this.formDynamicsFormula.value
    const filledFields = {
      concentration: values.concentration,
      volume: values.volume,
      molecularWeight: values.molecularWeight,
      weight: values.weight
    }

    // Find which field to calculate (the empty one)
    let calculateField = ''
    let filledCount = 0
    
    Object.entries(filledFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filledCount++
      } else if (calculateField === '') {
        calculateField = key
      }
    })

    if (filledCount < 3) {
      this.toastService.show('Error', 'Please fill at least 3 values to calculate the 4th')
      return
    }

    let result = 0
    let resultUnit = ''

    try {
      // Convert all values to standard units
      const concentrationInM = values.concentration ? 
        this.dataService.convertMolarity(values.concentration, values.concentrationUnit!, 'M') : 0
      const volumeInL = values.volume ? 
        this.dataService.convertVolume(values.volume, values.volumeUnit!, 'L') : 0
      const weightInG = values.weight ? 
        this.dataService.convertMass(values.weight, values.weightUnit!, 'g') : 0
      const molecularWeight = values.molecularWeight || 0

      switch (calculateField) {
        case 'weight':
          // mass = concentration × volume × molecular weight
          result = concentrationInM * volumeInL * molecularWeight
          result = this.dataService.convertMass(result, 'g', values.weightUnit!)
          resultUnit = values.weightUnit!
          break
        case 'volume':
          // volume = mass / (concentration × molecular weight)
          result = weightInG / (concentrationInM * molecularWeight)
          result = this.dataService.convertVolume(result, 'L', values.volumeUnit!)
          resultUnit = values.volumeUnit!
          break
        case 'concentration':
          // concentration = mass / (volume × molecular weight)
          result = weightInG / (volumeInL * molecularWeight)
          result = this.dataService.convertMolarity(result, 'M', values.concentrationUnit!)
          resultUnit = values.concentrationUnit!
          break
        case 'molecularWeight':
          // molecular weight = mass / (concentration × volume)
          result = weightInG / (concentrationInM * volumeInL)
          resultUnit = 'g/mol'
          break
      }

      // Update the form with calculated value
      const updateValue: any = {}
      updateValue[calculateField] = result
      this.formDynamicsFormula.patchValue(updateValue)

      // Add to history
      const historyEntry: HistoryEntry = {
        id: this.generateUniqueId(),
        data: { ...values },
        operationType: 'dynamic',
        result: result,
        calculatedField: calculateField,
        timestamp: new Date(),
        scratched: false
      }

      this.dataLog.push(historyEntry)
      this.toastService.show('Calculation Complete', 
        `${calculateField.charAt(0).toUpperCase() + calculateField.slice(1)}: ${this.formatNumber(result)} ${resultUnit}`)

    } catch (error) {
      this.toastService.show('Calculation Error', 'Invalid input values')
    }
  }

  calculateMassFromVolumeAndConcentration(): void {
    const values = this.formMassFromVolumeAndConcentration.value
    if (!values.concentration || !values.volume || !values.molecularWeight) return

    try {
      const concentrationInM = this.dataService.convertMolarity(values.concentration, values.concentrationUnit!, 'M')
      const volumeInL = this.dataService.convertVolume(values.volume, values.volumeUnit!, 'L')
      const mass = concentrationInM * volumeInL * values.molecularWeight
      const finalWeight = this.dataService.convertMass(mass, 'g', values.weightUnit!)

      const historyEntry: HistoryEntry = {
        id: this.generateUniqueId(),
        data: { ...values },
        operationType: 'massFromVolumeAndConcentration',
        result: finalWeight,
        timestamp: new Date(),
        scratched: false
      }

      this.dataLog.push(historyEntry)
      this.toastService.show('Mass Calculated', 
        `Result: ${this.formatNumber(finalWeight)} ${values.weightUnit}`)

    } catch (error) {
      this.toastService.show('Calculation Error', 'Invalid input values')
    }
  }

  calculateVolumeFromMassAndConcentration(): void {
    const values = this.formVolumeFromMassAndConcentration.value
    if (!values.weight || !values.concentration || !values.molecularWeight) return

    try {
      const weightInG = this.dataService.convertMass(values.weight, values.weightUnit!, 'g')
      const concentrationInM = this.dataService.convertMolarity(values.concentration, values.concentrationUnit!, 'M')
      const volume = weightInG / (concentrationInM * values.molecularWeight)
      const finalVolume = this.dataService.convertVolume(volume, 'L', values.volumeUnit!)

      const historyEntry: HistoryEntry = {
        id: this.generateUniqueId(),
        data: { ...values },
        operationType: 'volumeFromMassAndConcentration',
        result: finalVolume,
        timestamp: new Date(),
        scratched: false
      }

      this.dataLog.push(historyEntry)
      this.toastService.show('Volume Calculated', 
        `Result: ${this.formatNumber(finalVolume)} ${values.volumeUnit}`)

    } catch (error) {
      this.toastService.show('Calculation Error', 'Invalid input values')
    }
  }

  calculateConcentrationFromMassAndVolume(): void {
    const values = this.formConcentrationFromMassAndVolume.value
    if (!values.weight || !values.volume || !values.molecularWeight) return

    try {
      const weightInG = this.dataService.convertMass(values.weight, values.weightUnit!, 'g')
      const volumeInL = this.dataService.convertVolume(values.volume, values.volumeUnit!, 'L')
      const concentration = weightInG / (volumeInL * values.molecularWeight)
      const finalConcentration = this.dataService.convertMolarity(concentration, 'M', values.concentrationUnit!)

      const historyEntry: HistoryEntry = {
        id: this.generateUniqueId(),
        data: { ...values },
        operationType: 'concentrationFromMassAndVolume',
        result: finalConcentration,
        timestamp: new Date(),
        scratched: false
      }

      this.dataLog.push(historyEntry)
      this.toastService.show('Concentration Calculated', 
        `Result: ${this.formatNumber(finalConcentration)} ${values.concentrationUnit}`)

    } catch (error) {
      this.toastService.show('Calculation Error', 'Invalid input values')
    }
  }

  calculateVolumeFromStockVolumeAndConcentration(): void {
    const values = this.formVolumeFromStockVolumeAndConcentration.value
    if (!values.stockConcentration || !values.targetConcentration || !values.stockVolume) return

    try {
      // C1V1 = C2V2, solve for V2
      const stockConcInM = this.dataService.convertMolarity(values.stockConcentration, values.stockConcentrationUnit!, 'M')
      const targetConcInM = this.dataService.convertMolarity(values.targetConcentration, values.targetConcentrationUnit!, 'M')
      const stockVolumeInL = this.dataService.convertVolume(values.stockVolume, values.stockVolumeUnit!, 'L')
      
      const finalVolumeInL = (stockConcInM * stockVolumeInL) / targetConcInM
      const finalVolume = this.dataService.convertVolume(finalVolumeInL, 'L', values.volumeUnit!)

      const historyEntry: HistoryEntry = {
        id: this.generateUniqueId(),
        data: { ...values },
        operationType: 'volumeFromStockVolumeAndConcentration',
        result: finalVolume,
        timestamp: new Date(),
        scratched: false
      }

      this.dataLog.push(historyEntry)
      this.toastService.show('Final Volume Calculated', 
        `Result: ${this.formatNumber(finalVolume)} ${values.volumeUnit}`)

    } catch (error) {
      this.toastService.show('Calculation Error', 'Invalid input values')
    }
  }

  // History management
  toggleHistory(): void {
    this.showHistory = !this.showHistory
    this.saveSettings()
  }

  getVisibleHistory(): HistoryEntry[] {
    return this.dataLog.slice().reverse()
  }

  clearHistory(): void {
    this.dataLog = []
    this.toastService.show('History Cleared', 'All calculations removed from history')
    this.updateAnnotation()
  }

  removeHistoryItem(index: number): void {
    const actualIndex = this.dataLog.length - 1 - index
    this.dataLog.splice(actualIndex, 1)
    this.updateAnnotation()
  }

  revertToCalculation(entry: HistoryEntry): void {
    // Switch to the appropriate form
    this.selectedForm = entry.operationType as any

    // Wait for form to be ready
    setTimeout(() => {
      const form = this.getCurrentForm()
      if (form) {
        form.patchValue(entry.data)
        this.toastService.show('Calculation Restored', 'Values restored from history')
      }
    }, 100)
  }

  copyToClipboard(entry: HistoryEntry): void {
    const result = `${this.formatNumber(entry.result)} ${this.getResultUnit(entry)}`
    navigator.clipboard.writeText(result).then(() => {
      this.toastService.show('Copied', `${result} copied to clipboard`)
    }).catch(() => {
      this.toastService.show('Copy Failed', 'Could not copy to clipboard')
    })
  }

  exportHistory(): void {
    if (this.dataLog.length === 0) {
      this.toastService.show('No Data', 'No calculations to export')
      return
    }

    const csvContent = this.generateHistoryCSV()
    this.downloadFile(csvContent, 'molarity-calculations.csv', 'text/csv')
  }

  private generateHistoryCSV(): string {
    let csv = 'Timestamp,Operation,Formula,Result,Unit,Notes\n'
    
    this.dataLog.forEach(entry => {
      const timestamp = entry.timestamp.toISOString()
      const operation = this.getOperationName(entry.operationType)
      const formula = this.getFormula(entry)
      const result = this.formatNumber(entry.result)
      const unit = this.getResultUnit(entry)
      const notes = entry.scratched ? 'Scratched' : ''
      
      csv += `"${timestamp}","${operation}","${formula}","${result}","${unit}","${notes}"\n`
    })
    
    return csv
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
    
    this.toastService.show('Export Complete', `${filename} downloaded successfully`)
  }

  // Utility methods
  formatNumber(value: number): string {
    return Number(value.toFixed(this.decimalPlaces)).toString()
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return timestamp.toLocaleDateString()
  }

  private getOperationName(operationType: string): string {
    const names: Record<string, string> = {
      'dynamic': 'Dynamic Calculation',
      'massFromVolumeAndConcentration': 'Mass Calculation',
      'volumeFromMassAndConcentration': 'Volume Calculation',
      'concentrationFromMassAndVolume': 'Concentration Calculation',
      'volumeFromStockVolumeAndConcentration': 'Dilution Calculation'
    }
    return names[operationType] || operationType
  }

  private getFormula(entry: HistoryEntry): string {
    switch (entry.operationType) {
      case 'massFromVolumeAndConcentration':
        return `${entry.data.concentration} ${entry.data.concentrationUnit} × ${entry.data.volume} ${entry.data.volumeUnit} × ${entry.data.molecularWeight} g/mol`
      case 'volumeFromMassAndConcentration':
        return `${entry.data.weight} ${entry.data.weightUnit} / (${entry.data.concentration} ${entry.data.concentrationUnit} × ${entry.data.molecularWeight} g/mol)`
      case 'concentrationFromMassAndVolume':
        return `${entry.data.weight} ${entry.data.weightUnit} / (${entry.data.volume} ${entry.data.volumeUnit} × ${entry.data.molecularWeight} g/mol)`
      case 'volumeFromStockVolumeAndConcentration':
        return `(${entry.data.stockConcentration} ${entry.data.stockConcentrationUnit} × ${entry.data.stockVolume} ${entry.data.stockVolumeUnit}) / ${entry.data.targetConcentration} ${entry.data.targetConcentrationUnit}`
      case 'dynamic':
        return `Dynamic: ${entry.calculatedField} calculated`
      default:
        return 'Unknown formula'
    }
  }

  private getResultUnit(entry: HistoryEntry): string {
    switch (entry.operationType) {
      case 'massFromVolumeAndConcentration':
        return entry.data.weightUnit
      case 'volumeFromMassAndConcentration':
        return entry.data.volumeUnit
      case 'concentrationFromMassAndVolume':
        return entry.data.concentrationUnit
      case 'volumeFromStockVolumeAndConcentration':
        return entry.data.volumeUnit
      case 'dynamic':
        switch (entry.calculatedField) {
          case 'weight': return entry.data.weightUnit
          case 'volume': return entry.data.volumeUnit
          case 'concentration': return entry.data.concentrationUnit
          case 'molecularWeight': return 'g/mol'
          default: return ''
        }
      default:
        return ''
    }
  }

  updateAnnotation(): void {
    if (this._annotation) {
      this.web.updateAnnotation(JSON.stringify(this.dataLog), 'mcalculator', this.annotation.id).subscribe(
        (response) => {
          this._annotation = response
          this.change.emit(response)
        }
      )
    }
  }
}