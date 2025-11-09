"use client"

import { useMutation } from "@tanstack/react-query"

import { pmApiFetch } from "@/lib/apiClient"

export type PresignAttachmentResponse = {
  urls: Record<string, string>
}

type PresignRequest = {
  attachmentIds?: string[]
}

export function usePresignAttachments(workdayId: string | undefined) {
  return useMutation({
    mutationFn: async (payload?: PresignRequest) => {
      if (!workdayId) {
        throw new Error("workdayId is required for presign-download")
      }

      const body = payload && payload.attachmentIds && payload.attachmentIds.length > 0 ? payload : undefined

      return await pmApiFetch<PresignAttachmentResponse>(
        `/api/workdays/${workdayId}/attachments/presign-download`,
        {
          method: "POST",
          body: body ? JSON.stringify(body) : undefined,
        },
      )
    },
  })
}
