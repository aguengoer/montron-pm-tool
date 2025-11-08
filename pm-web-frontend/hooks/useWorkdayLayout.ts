import { useQuery } from "@tanstack/react-query";

import { pmApiFetch } from "@/lib/apiClient";
import type { WorkdayLayoutResponse } from "@/lib/workdayTypes";

export function useWorkdayLayout() {
  return useQuery({
    queryKey: ["workdayLayout"],
    queryFn: async () => {
      const response = await pmApiFetch<WorkdayLayoutResponse>("/api/workday-layout");
      return {
        ...response,
        config: {
          tbFields: response.config?.tbFields ?? [],
          rsFields: response.config?.rsFields ?? [],
          streetwatchColumns: response.config?.streetwatchColumns ?? [],
        },
      } satisfies WorkdayLayoutResponse;
    },
  });
}
