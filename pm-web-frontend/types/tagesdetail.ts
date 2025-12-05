// Type definitions for Tagesdetail 3-column view

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: string[]
  validation?: ValidationRules
}

export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "DROPDOWN"
  | "CHECKBOX"
  | "TEXTAREA"
  | "FILE"
  | "EMAIL"
  | "PHONE"

export interface ValidationRules {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  errorMessage?: string
}

export interface FormDefinition {
  id: string
  name: string
  description?: string
  fields: FormField[]
}

export interface FormWithSubmission {
  formDefinition: FormDefinition
  submissionId: string
  data: Record<string, any>
  originalData: Record<string, any>
  hasChanges: boolean
  formId: string
  formVersion: string
  submittedAt: string
  submittedBy: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
}

export interface StreetwatchEntry {
  zeit: string
  ereignis: string
  ort: string
  kilometerstand?: number
}

export interface StreetwatchData {
  entries: StreetwatchEntry[]
}

export interface ValidationIssue {
  type: "success" | "warning" | "error"
  icon: string  // ✓, !, ✕
  message: string
  fieldId: string
  formType: "tagesbericht" | "regieschein"
}

export interface TagesdetailData {
  employeeId: string
  employeeName: string
  date: string
  tagesbericht: FormWithSubmission | null
  regiescheine: FormWithSubmission[]
  streetwatch: StreetwatchData
  validationIssues: ValidationIssue[]
}

