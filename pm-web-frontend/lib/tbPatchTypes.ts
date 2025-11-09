export type TbPatchRequest = {
  startTime?: string | null
  endTime?: string | null
  breakMinutes?: number | null
  travelMinutes?: number | null
  licensePlate?: string | null
  department?: string | null
  overnight?: boolean | null
  kmStart?: number | null
  kmEnd?: number | null
  comment?: string | null
  extra?: Record<string, unknown> | null
}
