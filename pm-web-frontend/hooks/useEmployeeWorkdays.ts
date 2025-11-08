import { useQuery } from "@tanstack/react-query";

import { pmApiFetch } from "@/lib/apiClient";

export type WorkdaySummaryDto = {
  id: string;
  date: string;
  status: "DRAFT" | "READY" | "RELEASED" | string;
  hasTb: boolean;
  hasRs: boolean;
  hasStreetwatch: boolean;
};

export type UseEmployeeWorkdaysParams = {
  employeeId: string;
  from: string;
  to: string;
};

export function useEmployeeWorkdays(params: UseEmployeeWorkdaysParams) {
  const { employeeId, from, to } = params;

  return useQuery({
    queryKey: ["employeeWorkdays", { employeeId, from, to }],
    enabled: Boolean(employeeId && from && to),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("from", from);
      searchParams.set("to", to);
      const path = `/api/employees/${employeeId}/workdays?${searchParams.toString()}`;
      return await pmApiFetch<WorkdaySummaryDto[]>(path);
    },
  });
}
