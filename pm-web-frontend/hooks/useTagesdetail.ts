import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { pmApiFetch } from "@/lib/apiClient"
import { TagesdetailData } from "@/types/tagesdetail"

export function useTagesdetail(employeeId: string, date: string) {
  return useQuery({
    queryKey: ["tagesdetail", employeeId, date],
    queryFn: async () => {
      if (!employeeId || !date) {
        throw new Error("employeeId and date are required")
      }
      return await pmApiFetch<TagesdetailData>(`/api/employees/${employeeId}/tagesdetail/${date}`)
    },
    enabled: !!employeeId && !!date,
  })
}

// For future editing functionality
interface UpdateSubmissionParams {
  submissionId: string
  fieldId: string
  value: any
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ submissionId, fieldId, value }: UpdateSubmissionParams) => {
      const response = await pmApiFetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          [fieldId]: value,
        }),
      })

      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate tagesdetail queries to refetch
      queryClient.invalidateQueries({ queryKey: ["tagesdetail"] })
    },
  })
}
