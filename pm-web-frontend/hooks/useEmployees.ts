import { useQuery } from "@tanstack/react-query";

import { pmApiFetch } from "@/lib/apiClient";

export type EmployeeDto = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  department: string | null;
  status: "ACTIVE" | "INACTIVE" | string;
};

export type EmployeePageResponse = {
  content: EmployeeDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type UseEmployeesParams = {
  page?: number;
  size?: number;
  q?: string;
  department?: string | null;
  status?: string | null;
};

export function useEmployees(params: UseEmployeesParams) {
  const { page = 0, size = 50, q, department, status } = params;

  return useQuery({
    queryKey: ["employees", { page, size, q, department, status }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", page.toString());
      searchParams.set("size", size.toString());
      if (q) searchParams.set("q", q);
      if (department) searchParams.set("department", department);
      if (status) searchParams.set("status", status);

      const queryString = searchParams.toString();
      const path = `/api/employees${queryString ? `?${queryString}` : ""}`;

      return await pmApiFetch<EmployeePageResponse>(path);
    },
    keepPreviousData: true,
  });
}
