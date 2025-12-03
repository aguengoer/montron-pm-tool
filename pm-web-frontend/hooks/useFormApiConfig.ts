import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { pmApiFetch } from "@/lib/apiClient"

export type FormApiConfigResponse = {
  baseUrl: string | null
  serviceToken: string | null // Always null in response for security
  serviceTokenConfigured: boolean
}

export type UpdateFormApiConfigRequest = {
  baseUrl: string | null
  serviceToken: string
}

export function useFormApiConfig() {
  return useQuery({
    queryKey: ["formApiConfig"],
    queryFn: async () => {
      return await pmApiFetch<FormApiConfigResponse>("/api/config/form-api")
    },
  })
}

export function useUpdateFormApiConfig() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (request: UpdateFormApiConfigRequest) => {
      await pmApiFetch("/api/config/form-api", {
        method: "PUT",
        body: JSON.stringify(request),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formApiConfig"] })
      toast({
        title: "Konfiguration gespeichert",
        description: "Die Form API-Konfiguration wurde erfolgreich gespeichert.",
      })
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Speichern",
        description:
          (error as any)?.message || "Die Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    },
  })
}

