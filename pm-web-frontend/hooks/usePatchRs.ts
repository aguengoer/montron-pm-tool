"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { pmApiFetch } from "@/lib/apiClient"
import type { RsPatchRequest } from "@/lib/rsPatchTypes"

export function usePatchRs(workdayId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: RsPatchRequest) => {
      if (!workdayId) {
        throw new Error("workdayId is required for RS patch")
      }

      return await pmApiFetch(`/api/workdays/${workdayId}/rs`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      })
    },
    onSuccess: () => {
      if (workdayId) {
        queryClient.invalidateQueries({ queryKey: ["workdayDetail", workdayId] })
      }
    },
  })
}
