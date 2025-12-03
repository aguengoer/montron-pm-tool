import { useQuery } from "@tanstack/react-query"
import { PM_API_BASE_URL } from "@/lib/config"

export type SetupState = "UNCONFIGURED" | "CONFIGURED"

export type SetupStateResponse = {
  state: SetupState
}

export function useSetupState() {
  return useQuery({
    queryKey: ["setupState"],
    queryFn: async () => {
      const response = await fetch(`${PM_API_BASE_URL}/setup/state`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch setup state: ${response.status}`)
      }

      return (await response.json()) as SetupStateResponse
    },
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

