"use client"

import { FormWithSubmission, FormField } from "@/types/tagesdetail"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface DynamicFormRendererProps {
  formWithSubmission: FormWithSubmission
  editMode?: boolean
  showChanges?: boolean
  onFieldChange?: (fieldId: string, value: any) => void
  pendingChanges?: Record<string, any>  // Unsaved changes for this submission
}

export function DynamicFormRenderer({
  formWithSubmission,
  editMode = false,
  showChanges = false,
  onFieldChange,
  pendingChanges = {},
}: DynamicFormRendererProps) {
  const { formDefinition, data, originalData } = formWithSubmission

  // Debug: Log data structure
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('DynamicFormRenderer - Form:', formDefinition.name)
    console.log('DynamicFormRenderer - Data keys:', Object.keys(data))
    console.log('DynamicFormRenderer - Data sample:', Object.keys(data).slice(0, 3).reduce((acc, key) => {
      acc[key] = data[key]
      return acc
    }, {} as Record<string, any>))
    console.log('DynamicFormRenderer - Fields:', formDefinition.fields.map(f => ({ id: f.id, label: f.label })))
    
    // Check for mismatched keys
    const fieldIds = new Set(formDefinition.fields.map(f => f.id))
    const dataKeys = new Set(Object.keys(data))
    const missingInData = formDefinition.fields.filter(f => !dataKeys.has(f.id))
    const extraInData = Object.keys(data).filter(key => !fieldIds.has(key))
    
    if (missingInData.length > 0) {
      console.warn('Fields without data:', missingInData.map(f => ({ id: f.id, label: f.label })))
    }
    if (extraInData.length > 0) {
      console.log('Data keys without fields:', extraInData)
    }
  }

  const renderField = (field: FormField) => {
    // Merge pending changes into current value for display
    const displayValue = field.id in pendingChanges ? pendingChanges[field.id] : data[field.id]
    const originalValue = originalData?.[field.id]
    
    // Debug: Log field value lookup for missing values
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (displayValue === undefined && !(field.id in pendingChanges)) {
        console.log(`Field ${field.id} (${field.label}): value not found in data`)
        console.log(`  Available keys:`, Object.keys(data).filter(k => k.toLowerCase().includes(field.id.toLowerCase().substring(0, 8))))
      }
    }
    
    // Check if value differs from original (saved correction exists)
    const hasSavedCorrection = data[field.id] !== originalValue
    
    // Check if this field has unsaved changes (yellow border)
    const hasUnsavedChange = field.id in pendingChanges

    const handleChange = (value: any) => {
      if (onFieldChange) {
        onFieldChange(field.id, value)
      }
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-montron-text dark:text-white">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {editMode ? (
          <FieldInput
            field={field}
            value={displayValue}
            onChange={handleChange}
            hasChanged={hasUnsavedChange}
          />
        ) : (
          <div className="text-sm text-montron-text dark:text-white py-2">
            {formatValue(displayValue, field.type)}
          </div>
        )}

        {/* Always show original value if there's a saved correction */}
        {hasSavedCorrection && (
          <div className="text-xs text-montron-contrast dark:text-montron-extra line-through">
            Original: {formatValue(originalValue, field.type)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {formDefinition.fields.map((field) => renderField(field))}
    </div>
  )
}

interface FieldInputProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  hasChanged: boolean
}

function FieldInput({ field, value, onChange, hasChanged }: FieldInputProps) {
  const inputClassName = cn(
    "bg-white dark:bg-montron-text border-montron-contrast/30 dark:border-montron-contrast/50",
    hasChanged && "border-yellow-500 dark:border-yellow-500"
  )

  switch (field.type) {
    case "TEXT":
    case "EMAIL":
    case "PHONE":
      return (
        <Input
          id={field.id}
          type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClassName}
          required={field.required}
        />
      )

    case "NUMBER":
      return (
        <Input
          id={field.id}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || null)}
          placeholder={field.placeholder}
          className={inputClassName}
          required={field.required}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      )

    case "DATE":
      return (
        <Input
          id={field.id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          required={field.required}
        />
      )

    case "TIME":
      return (
        <Input
          id={field.id}
          type="time"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          required={field.required}
        />
      )

    case "DATETIME":
      return (
        <Input
          id={field.id}
          type="datetime-local"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          required={field.required}
        />
      )

    case "TEXTAREA":
      return (
        <Textarea
          id={field.id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(inputClassName, "min-h-[100px]")}
          required={field.required}
          maxLength={field.validation?.maxLength}
        />
      )

    case "DROPDOWN":
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder={field.placeholder || "Auswählen..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "CHECKBOX":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            checked={!!value}
            onCheckedChange={onChange}
            className="border-montron-contrast/30 dark:border-montron-contrast/50"
          />
          <label
            htmlFor={field.id}
            className="text-sm text-montron-text dark:text-white cursor-pointer"
          >
            {field.placeholder || field.label}
          </label>
        </div>
      )

    case "FILE":
      return (
        <Input
          id={field.id}
          type="file"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className={inputClassName}
          required={field.required}
        />
      )

    default:
      return (
        <Input
          id={field.id}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClassName}
          required={field.required}
        />
      )
  }
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  // Handle arrays (e.g., multi-select or repeated fields)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "-"
    }
    // Format array items
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        // For objects in array, try to find a displayable property
        const displayValue = item.value || item.label || item.text || JSON.stringify(item)
        return String(displayValue)
      }
      return String(item)
    }).join(", ")
  }

  switch (type) {
    case "CHECKBOX":
      return value ? "Ja" : "Nein"
    case "DATE":
      try {
        return new Date(value).toLocaleDateString("de-DE")
      } catch {
        return String(value)
      }
    case "TIME":
      return value
    case "DATETIME":
      try {
        return new Date(value).toLocaleString("de-DE")
      } catch {
        return String(value)
      }
    case "FILE":
    case "IMAGE":
    case "SIGNATURE":
      // For base64 images/files, don't display the full base64 string
      if (typeof value === 'string' && value.startsWith('data:')) {
        return "[Datei/Bild]"
      }
      return String(value)
    default:
      return String(value)
  }
}

