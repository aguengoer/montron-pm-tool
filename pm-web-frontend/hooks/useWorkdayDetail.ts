import { useQuery } from "@tanstack/react-query";

import { pmApiFetch } from "@/lib/apiClient";
import type { WorkdayDetailDto } from "@/lib/workdayTypes";

export function useWorkdayDetail(workdayId: string | undefined) {
  return useQuery({
    queryKey: ["workdayDetail", workdayId],
    enabled: Boolean(workdayId),
    queryFn: async () => {
      if (!workdayId) {
        throw new Error("workdayId is required");
      }
      return await pmApiFetch<WorkdayDetailDto>(`/api/workdays/${workdayId}`);
    },
  });
}
