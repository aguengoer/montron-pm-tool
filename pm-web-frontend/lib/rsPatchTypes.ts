export type RsPositionPatchDto = {
  code?: string | null
  description?: string | null
  hours?: number | null
  quantity?: number | null
  unit?: string | null
  pricePerUnit?: number | null
}

export type RsPatchRequest = {
  startTime?: string | null
  endTime?: string | null
  breakMinutes?: number | null
  customerId?: string | null
  customerName?: string | null
  positions?: RsPositionPatchDto[]
}
