"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { pmApiFetch } from "@/lib/apiClient"

type RequestPinResponse = {
  sent: boolean
}

type ConfirmReleaseRequest = {
  pin: string
}

export function useRequestReleasePin(workdayId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!workdayId) {
        throw new Error("workdayId is required for release PIN request")
      }

      return await pmApiFetch<RequestPinResponse>(
        `/api/workdays/${workdayId}/release/request-pin`,
        { method: "POST" },
      )
    },
  })
}

export function useConfirmRelease(workdayId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: ConfirmReleaseRequest) => {
      if (!workdayId) {
        throw new Error("workdayId is required for release confirm")
      }

      return await pmApiFetch(
        `/api/workdays/${workdayId}/release/confirm`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      )
    },
    onSuccess: () => {
      if (workdayId) {
        queryClient.invalidateQueries({ queryKey: ["workdayDetail", workdayId] })
      }
    },
  })
}
