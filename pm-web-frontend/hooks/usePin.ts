import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getPinStatus, setPin as apiSetPin, verifyPin as apiVerifyPin } from "@/lib/api/pin"

/**
 * Hook to fetch PIN status for current user
 */
export function usePinStatus() {
  return useQuery({
    queryKey: ["pin", "status"],
    queryFn: getPinStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to set/update PIN
 */
export function useSetPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiSetPin,
    onSuccess: () => {
      // Invalidate PIN status query to refetch
      queryClient.invalidateQueries({ queryKey: ["pin", "status"] })
    },
  })
}

/**
 * Hook to verify PIN
 */
export function useVerifyPin() {
  return useMutation({
    mutationFn: apiVerifyPin,
  })
}

