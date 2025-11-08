export type WorkdayEmployeeDto = {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  department: string | null
}

export type TbDto = {
  id: string
  sourceSubmissionId: string | null
  startTime: string | null
  endTime: string | null
  breakMinutes: number | null
  travelMinutes: number | null
  licensePlate: string | null
  department: string | null
  overnight: boolean | null
  kmStart: number | null
  kmEnd: number | null
  comment: string | null
  extra: Record<string, unknown> | null
  version: number
}

export type RsPositionDto = {
  code: string | null
  description: string | null
  hours: number | null
  quantity: number | null
  unit: string | null
  pricePerUnit: number | null
}

export type RsDto = {
  id: string
  sourceSubmissionId: string | null
  customerId: string | null
  customerName: string | null
  startTime: string | null
  endTime: string | null
  breakMinutes: number | null
  positions: RsPositionDto[]
  pdfObjectKey: string | null
  version: number
}

export type StreetwatchEntryDto = {
  time: string | null
  km: number | null
  lat: number | null
  lon: number | null
}

export type StreetwatchDto = {
  licensePlate: string | null
  date: string
  entries: StreetwatchEntryDto[]
}

export type AttachmentDto = {
  id: string
  kind: string
  filename: string
  s3Key: string
  bytes: number
  sourceSubmissionId: string | null
}

export type ValidationIssueDto = {
  id: string
  code: string
  severity: "OK" | "WARN" | "ERROR" | string
  message: string
  fieldRef: string | null
  delta: Record<string, unknown> | null
}

export type WorkdayDetailDto = {
  id: string
  date: string
  status: "DRAFT" | "READY" | "RELEASED" | string
  employee: WorkdayEmployeeDto
  tb: TbDto | null
  rs: RsDto | null
  streetwatch: StreetwatchDto | null
  attachments: AttachmentDto[]
  validationIssues: ValidationIssueDto[]
}

export type LayoutFieldConfig = {
  key: string
  label: string
  editorType?: string
  order?: number
  width?: number
}

export type WorkdayLayoutConfig = {
  tbFields: LayoutFieldConfig[]
  rsFields: LayoutFieldConfig[]
  streetwatchColumns: LayoutFieldConfig[]
}

export type WorkdayLayoutResponse = {
  name: string
  documentTypeTb: string
  documentTypeRs: string
  config: WorkdayLayoutConfig
}
