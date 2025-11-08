import { useQuery } from "@tanstack/react-query";

import { pmApiFetch } from "@/lib/apiClient";
import type { EmployeeDto } from "@/hooks/useEmployees";

export function useEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["employee", employeeId],
    enabled: Boolean(employeeId),
    queryFn: async () => {
      if (!employeeId) {
        throw new Error("employeeId is required");
      }
      return await pmApiFetch<EmployeeDto>(`/api/employees/${employeeId}`);
    },
  });
}
