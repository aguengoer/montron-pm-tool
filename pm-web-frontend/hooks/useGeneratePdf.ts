"use client"

import { useMutation } from "@tanstack/react-query"

import { pmApiFetch } from "@/lib/apiClient"

export type PdfKind = "tb" | "rs"

type PdfResponse = {
  url: string
}

type GeneratePdfPayload = {
  kind: PdfKind
}

export function useGeneratePdf(workdayId: string | undefined) {
  return useMutation({
    mutationFn: async ({ kind }: GeneratePdfPayload) => {
      if (!workdayId) {
        throw new Error("workdayId is required for PDF generation")
      }

      return await pmApiFetch<PdfResponse>(
        `/api/workdays/${workdayId}/pdf/${kind}`,
        { method: "POST" },
      )
    },
  })
}
