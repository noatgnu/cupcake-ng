import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from '@angular/common';

@Component({
    selector: 'app-calculator-annotation',
    imports: [
        ReactiveFormsModule,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbTooltip,
        NgClass
    ],
    templateUrl: './calculator-annotation.component.html',
    styleUrl: './calculator-annotation.component.scss'
})
export class CalculatorAnnotationComponent {
  @Input() enableSave: boolean = false
  private idCounter: number = 0
  private _annotation?: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    const data = JSON.parse(this.annotation.annotation)
    if (Object.keys(data).length === 0) {
      this.dataLog = []
      return
    }
    this.dataLog = JSON.parse(this.annotation.annotation)
    // Add timestamps and IDs to existing entries if missing and ensure they're Date objects
    this.dataLog.forEach((entry, index) => {
      if (!entry.id) {
        entry.id = this.generateUniqueId()
      }
      if (!entry.timestamp) {
        // For legacy data without timestamps, create staggered timestamps based on index
        // This gives older entries progressively older timestamps
        const baseDate = new Date()
        baseDate.setTime(baseDate.getTime() - (this.dataLog.length - index) * 60000) // 1 minute apart
        entry.timestamp = baseDate
      } else if (typeof entry.timestamp === 'string') {
        // Parse the existing timestamp string to preserve the original time
        const parsedDate = new Date(entry.timestamp)
        entry.timestamp = isNaN(parsedDate.getTime()) ? new Date() : parsedDate
      } else if (!(entry.timestamp instanceof Date)) {
        // Handle any other invalid timestamp format
        entry.timestamp = new Date()
      }
    })
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>()
  
  // Calculator state
  executionMode: 'initial' | 'second' | 'operation' = 'initial'
  operation: '+' | '-' | '*' | '/' | '^' | null = null
  calculatorMode: 'standard' | 'scientific' = 'standard'
  displayExpression: string = ''
  lastResult: number = 0
  
  // Memory operations
  memoryValue: number = 0
  
  // History management
  showHistory: boolean = false
  
  // Angle mode for trigonometry
  angleMode: 'deg' | 'rad' = 'deg'
  
  // Constants
  readonly CONSTANTS = {
    pi: Math.PI,
    e: Math.E
  }

  form = this.fb.group({
    inputPromptFirstValue: new FormControl<string>("", Validators.required),
    inputPromptSecondValue: new FormControl<string>("", Validators.required),
  })

  dataLog: {
    id: string,
    inputPromptFirstValue: number, 
    inputPromptSecondValue: number, 
    operation: string, 
    result: number, 
    scratch: boolean,
    timestamp: Date
  }[] = []

  constructor(private fb: FormBuilder, private web: WebService, private toast: ToastService) {
    this.loadSettings()
  }

  private generateUniqueId(): string {
    return `calc-${Date.now()}-${++this.idCounter}`
  }

  trackByHistoryId(index: number, item: any): string {
    return item.id
  }

  formNumber(inputNumber: number) {
    console.log(inputNumber, this.executionMode)
    if (this.executionMode === 'initial') {
      const firstValue = this.form.controls.inputPromptFirstValue.value
      if (firstValue) {
        if (firstValue === "") {
          this.form.controls.inputPromptFirstValue.setValue(inputNumber.toString())
        } else if (firstValue.endsWith(".")) {
          this.form.controls.inputPromptFirstValue.setValue(firstValue + inputNumber.toString())
        } else {
          // @ts-ignore
          this.form.controls.inputPromptFirstValue.setValue((parseFloat(this.form.controls.inputPromptFirstValue.value)  * 10 + inputNumber).toString())
        }
      } else {
        this.form.controls.inputPromptFirstValue.setValue(inputNumber.toString())
      }

    } else if (this.executionMode === 'second') {
      const secondValue = this.form.controls.inputPromptSecondValue.value
      if (secondValue) {
        if (secondValue === "") {
          this.form.controls.inputPromptSecondValue.setValue(inputNumber.toString())
        } else if (secondValue.endsWith(".")) {
          this.form.controls.inputPromptSecondValue.setValue(secondValue + inputNumber.toString())
        } else {
          // @ts-ignore
          this.form.controls.inputPromptSecondValue.setValue((parseFloat(this.form.controls.inputPromptSecondValue.value)  * 10 + inputNumber).toString())
        }
      } else {
        this.form.controls.inputPromptSecondValue.setValue(inputNumber.toString())
      }
    }
  }

  formDecimal() {
    if (this.executionMode === 'initial') {
      // @ts-ignore
      if (!this.form.controls.inputPromptFirstValue.value.includes('.')) {
        this.form.controls.inputPromptFirstValue.setValue(this.form.controls.inputPromptFirstValue.value + '.')
      }
    } else if (this.executionMode === 'second') {
      // @ts-ignore
      if (!this.form.controls.inputPromptSecondValue.value.includes('.')) {
        this.form.controls.inputPromptSecondValue.setValue(this.form.controls.inputPromptSecondValue.value + '.')
      }
    }
  }

  formOperation(operation: '+'|'-'|'*'|'/'| '='| 'log2' | 'log10' | 'sqrt' | 'abs' | '^' | 'clr') {
    if (operation === 'clr') {
      this.form.controls.inputPromptFirstValue.setValue('')
      this.form.controls.inputPromptSecondValue.setValue('')
      this.executionMode = 'initial'
      this.operation = null
      return
    }
    if (this.executionMode === 'initial') {
      if (operation === '=' || this.form.controls.inputPromptFirstValue.value === "") {
        return
      }
      if (operation === 'log2' || operation === 'log10' || operation === 'sqrt' || operation === 'abs') {
        // @ts-ignore
        let data = {id: this.generateUniqueId(), inputPromptFirstValue: parseFloat(this.form.controls.inputPromptFirstValue.value), inputPromptSecondValue: 0, operation: operation, result: 0, scratch: false, timestamp: new Date()}
        switch (operation) {
          case 'log2':
            // @ts-ignore
            data.result = Math.log2(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())

            break
          case 'log10':
            // @ts-ignore
            data.result = Math.log10(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
            break
          case 'sqrt':
            // @ts-ignore
            data.result = Math.sqrt(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
            break
          case 'abs':
            // @ts-ignore
            data.result = Math.abs(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
            break
        }
        this.dataLog.push(data)
        return;
      }
      this.executionMode = 'second'
      this.operation = operation
    } else {
      if (this.form.controls.inputPromptSecondValue.value === "") {
        return
      }
      // @ts-ignore
      let data = {id: this.generateUniqueId(), inputPromptFirstValue: parseFloat(this.form.controls.inputPromptFirstValue.value), inputPromptSecondValue: parseFloat(this.form.controls.inputPromptSecondValue.value), operation: this.operation!.slice(), result: 0, scratch: false, timestamp: new Date()}
      switch (this.operation) {
        case '+':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) + parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '-':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) - parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '*':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) * parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '/':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) / parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '^':
          // @ts-ignore
          data.result = Math.pow(parseFloat(this.form.controls.inputPromptFirstValue.value), parseFloat(this.form.controls.inputPromptSecondValue.value))
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
      }
      this.form.controls.inputPromptSecondValue.setValue('')
      if (operation === '=') {
        this.executionMode = 'initial'
        this.operation = null
      } else{
        if (operation === 'log2' || operation === 'log10' || operation === 'sqrt' || operation === 'abs') {
          return;
        }
        this.operation = operation
      }
      this.dataLog.push(data)
      console.log(this.dataLog)
    }
  }

  formDelete() {
    if (this.executionMode === 'initial') {
      if (this.form.controls.inputPromptFirstValue.value === "") {
        return
      }
      // @ts-ignore
      this.form.controls.inputPromptFirstValue.setValue(this.form.controls.inputPromptFirstValue.value.slice(0, -1))
    } else if (this.executionMode === 'second') {
      if (this.form.controls.inputPromptSecondValue.value === "") {
        return
      }
      // @ts-ignore
      this.form.controls.inputPromptSecondValue.setValue(this.form.controls.inputPromptSecondValue.value.slice(0, -1))
    }
  }

  formSave() {
    this.web.updateAnnotation(JSON.stringify(this.dataLog), 'calculator', this.annotation.id).subscribe(
      (response) => {
        this._annotation = response
        this.change.emit(response)

      }
    )
  }

  revertValueTo(data: {id: string, inputPromptFirstValue: number, inputPromptSecondValue: number, operation: string, result: number}) {
    // Use the result as the new starting point
    this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
    this.form.controls.inputPromptSecondValue.setValue('')
    this.executionMode = 'initial'
    this.operation = null
    this.displayExpression = ''
    this.updateDisplayExpression()
  }
  
  // Enhanced calculator operations
  private executeUnaryOperation(operation: 'log2' | 'log10' | 'sqrt' | 'abs' | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'ln' | 'exp' | 'factorial' | 'square' | 'cube' | 'reciprocal'): void {
    const value = parseFloat(this.form.controls.inputPromptFirstValue.value || '0')
    let result = 0
    let isValid = true
    
    try {
      switch (operation) {
        case 'log2':
          result = Math.log2(value)
          break
        case 'log10':
          result = Math.log10(value)
          break
        case 'ln':
          result = Math.log(value)
          break
        case 'sqrt':
          result = Math.sqrt(value)
          break
        case 'abs':
          result = Math.abs(value)
          break
        case 'sin':
          result = this.angleMode === 'deg' ? Math.sin(value * Math.PI / 180) : Math.sin(value)
          break
        case 'cos':
          result = this.angleMode === 'deg' ? Math.cos(value * Math.PI / 180) : Math.cos(value)
          break
        case 'tan':
          result = this.angleMode === 'deg' ? Math.tan(value * Math.PI / 180) : Math.tan(value)
          break
        case 'asin':
          result = this.angleMode === 'deg' ? Math.asin(value) * 180 / Math.PI : Math.asin(value)
          break
        case 'acos':
          result = this.angleMode === 'deg' ? Math.acos(value) * 180 / Math.PI : Math.acos(value)
          break
        case 'atan':
          result = this.angleMode === 'deg' ? Math.atan(value) * 180 / Math.PI : Math.atan(value)
          break
        case 'exp':
          result = Math.exp(value)
          break
        case 'factorial':
          if (value < 0 || !Number.isInteger(value) || value > 170) {
            isValid = false
          } else {
            result = this.factorial(value)
          }
          break
        case 'square':
          result = value * value
          break
        case 'cube':
          result = value * value * value
          break
        case 'reciprocal':
          if (value === 0) {
            isValid = false
          } else {
            result = 1 / value
          }
          break
      }
      
      if (!isValid || !isFinite(result)) {
        this.toast.show('Error', 'Invalid operation or result')
        return
      }
      
      const data = {
        id: this.generateUniqueId(),
        inputPromptFirstValue: value,
        inputPromptSecondValue: 0,
        operation: operation,
        result: result,
        scratch: false,
        timestamp: new Date()
      }
      
      this.form.controls.inputPromptFirstValue.setValue(result.toString())
      this.dataLog.push(data)
      this.lastResult = result
      this.displayExpression = ''
      
    } catch (error) {
      this.toast.show('Error', 'Calculation error')
    }
  }
  
  private executeBinaryOperation(): void {
    const firstValue = parseFloat(this.form.controls.inputPromptFirstValue.value || '0')
    const secondValue = parseFloat(this.form.controls.inputPromptSecondValue.value || '0')
    let result = 0
    let isValid = true
    
    try {
      switch (this.operation) {
        case '+':
          result = firstValue + secondValue
          break
        case '-':
          result = firstValue - secondValue
          break
        case '*':
          result = firstValue * secondValue
          break
        case '/':
          if (secondValue === 0) {
            this.toast.show('Error', 'Cannot divide by zero')
            return
          }
          result = firstValue / secondValue
          break
        case '^':
          result = Math.pow(firstValue, secondValue)
          break
        default:
          return
      }
      
      if (!isFinite(result)) {
        this.toast.show('Error', 'Result is not a finite number')
        return
      }
      
      const data = {
        id: this.generateUniqueId(),
        inputPromptFirstValue: firstValue,
        inputPromptSecondValue: secondValue,
        operation: this.operation!,
        result: result,
        scratch: false,
        timestamp: new Date()
      }
      
      this.form.controls.inputPromptFirstValue.setValue(result.toString())
      this.form.controls.inputPromptSecondValue.setValue('')
      this.dataLog.push(data)
      this.lastResult = result
      
    } catch (error) {
      this.toast.show('Error', 'Calculation error')
    }
  }
  
  // Scientific operations
  scientificOperation(operation: 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'ln' | 'exp' | 'factorial' | 'square' | 'cube' | 'reciprocal' | 'abs' | 'sqrt' | 'log2' | 'log10'): void {
    if (this.executionMode === 'second') {
      return // Disable during second operand input
    }
    this.executeUnaryOperation(operation)
  }
  
  // Memory operations
  memoryOperation(operation: 'MC' | 'MR' | 'M+' | 'M-' | 'MS'): void {
    switch (operation) {
      case 'MC': // Memory Clear
        this.memoryValue = 0
        this.toast.show('Memory', 'Memory cleared')
        break
      case 'MR': // Memory Recall
        this.form.controls.inputPromptFirstValue.setValue(this.memoryValue.toString())
        this.executionMode = 'initial'
        break
      case 'M+': // Memory Add
        this.memoryValue += this.getCurrentValue()
        this.toast.show('Memory', `Added to memory: ${this.formatNumber(this.memoryValue)}`)
        break
      case 'M-': // Memory Subtract
        this.memoryValue -= this.getCurrentValue()
        this.toast.show('Memory', `Subtracted from memory: ${this.formatNumber(this.memoryValue)}`)
        break
      case 'MS': // Memory Store
        this.memoryValue = this.getCurrentValue()
        this.toast.show('Memory', `Stored in memory: ${this.formatNumber(this.memoryValue)}`)
        break
    }
    this.saveSettings()
  }
  
  // Utility functions
  private factorial(n: number): number {
    if (n <= 1) return 1
    return n * this.factorial(n - 1)
  }
  
  insertConstant(constant: 'pi' | 'e'): void {
    if (this.executionMode === 'second') {
      return
    }
    
    const value = this.CONSTANTS[constant]
    this.form.controls.inputPromptFirstValue.setValue(value.toString())
    this.updateDisplayExpression()
  }
  
  getCurrentValue(): number {
    if (this.executionMode === 'second') {
      return parseFloat(this.form.controls.inputPromptSecondValue.value || '0')
    }
    return parseFloat(this.form.controls.inputPromptFirstValue.value || '0')
  }
  
  getCurrentDisplayValue(): string {
    if (this.executionMode === 'second') {
      return this.form.controls.inputPromptSecondValue.value || '0'
    }
    return this.form.controls.inputPromptFirstValue.value || '0'
  }
  
  private updateDisplayExpression(): void {
    if (this.executionMode === 'second' && this.operation) {
      const firstValue = this.form.controls.inputPromptFirstValue.value || '0'
      const operatorSymbol = this.getOperationSymbol(this.operation)
      this.displayExpression = `${firstValue} ${operatorSymbol}`
    } else {
      this.displayExpression = ''
    }
  }
  
  private getOperationSymbol(operation: string): string {
    switch (operation) {
      case '+': return '+'
      case '-': return '−'
      case '*': return '×'
      case '/': return '÷'
      case '^': return '^'
      default: return operation
    }
  }
  
  // Clear operations
  clearAll(): void {
    this.form.controls.inputPromptFirstValue.setValue('0')
    this.form.controls.inputPromptSecondValue.setValue('')
    this.executionMode = 'initial'
    this.operation = null
    this.displayExpression = ''
  }
  
  clearEntry(): void {
    if (this.executionMode === 'initial') {
      this.form.controls.inputPromptFirstValue.setValue('0')
    } else {
      this.form.controls.inputPromptSecondValue.setValue('0')
    }
    this.updateDisplayExpression()
  }
  
  // Calculator mode
  setCalculatorMode(mode: 'standard' | 'scientific'): void {
    this.calculatorMode = mode
    this.saveSettings()
  }
  
  toggleAngleMode(): void {
    this.angleMode = this.angleMode === 'deg' ? 'rad' : 'deg'
    this.saveSettings()
  }
  
  // History management
  toggleHistory(): void {
    this.showHistory = !this.showHistory
  }
  
  getVisibleHistory() {
    return this.dataLog.slice().reverse()
  }
  
  
  clearHistory(): void {
    this.dataLog = []
    this.showHistory = false
    this.toast.show('Calculator', 'History cleared')
  }
  
  removeHistoryItem(index: number): void {
    const actualIndex = this.dataLog.length - 1 - index
    this.dataLog.splice(actualIndex, 1)
    
    if (this.dataLog.length === 0) {
      this.showHistory = false
    }
  }
  
  exportHistory(): void {
    if (this.dataLog.length === 0) {
      this.toast.show('Warning', 'No calculations to export')
      return
    }
    
    const csvContent = this.generateHistoryCSV()
    this.downloadFile(csvContent, 'calculator-history.csv', 'text/csv')
  }
  
  private generateHistoryCSV(): string {
    let csv = 'Timestamp,Expression,Result,Notes\n'
    
    this.dataLog.forEach(entry => {
      const timestamp = entry.timestamp.toISOString()
      let expression = ''
      
      if (entry.inputPromptSecondValue !== 0) {
        expression = `${entry.inputPromptFirstValue} ${entry.operation} ${entry.inputPromptSecondValue}`
      } else {
        expression = `${entry.operation}(${entry.inputPromptFirstValue})`
      }
      
      const notes = entry.scratch ? 'Scratched' : ''
      csv += `"${timestamp}","${expression}","${entry.result}","${notes}"\n`
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
    
    this.toast.show('Export', `${filename} downloaded successfully`)
  }
  
  // Display helpers
  formatNumber(value: number): string {
    if (Math.abs(value) < 1e-10 && value !== 0) {
      return value.toExponential(6)
    }
    if (Math.abs(value) > 1e12) {
      return value.toExponential(6)
    }
    return parseFloat(value.toPrecision(12)).toString()
  }
  
  formatTimestamp(timestamp: Date): string {
    const now = new Date()
    const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp)
    const diffMs = now.getTime() - timestampDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return timestampDate.toLocaleDateString()
  }
  
  getOperationName(operation: string): string {
    const names: Record<string, string> = {
      '+': 'Add',
      '-': 'Subtract', 
      '*': 'Multiply',
      '/': 'Divide',
      '^': 'Power',
      'sqrt': 'Square Root',
      'log10': 'Log',
      'log2': 'Log₂',
      'ln': 'Natural Log',
      'sin': 'Sine',
      'cos': 'Cosine',
      'tan': 'Tangent',
      'abs': 'Absolute'
    }
    return names[operation] || operation
  }
  
  getOperationIcon(operation: string): string {
    const icons: Record<string, string> = {
      '+': 'bi-plus',
      '-': 'bi-dash',
      '*': 'bi-x',
      '/': 'bi-slash',
      '^': 'bi-superscript',
      '=': 'bi-equals'
    }
    return icons[operation] || 'bi-calculator'
  }
  
  // Settings persistence
  private saveSettings(): void {
    const settings = {
      calculatorMode: this.calculatorMode,
      angleMode: this.angleMode,
      memoryValue: this.memoryValue
    }
    localStorage.setItem('calculator-settings', JSON.stringify(settings))
  }
  
  private loadSettings(): void {
    const saved = localStorage.getItem('calculator-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        this.calculatorMode = settings.calculatorMode || 'standard'
        this.angleMode = settings.angleMode || 'deg'
        this.memoryValue = settings.memoryValue || 0
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }
}
