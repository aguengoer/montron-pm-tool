import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pmApiFetch } from "@/lib/apiClient";
import type { TbPatchRequest } from "@/lib/tbPatchTypes";

export function usePatchTb(workdayId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: TbPatchRequest) => {
      if (!workdayId) {
        throw new Error("workdayId is required for TB patch");
      }

      return await pmApiFetch(`/api/workdays/${workdayId}/tb`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    onSuccess: () => {
      if (workdayId) {
        queryClient.invalidateQueries({ queryKey: ["workdayDetail", workdayId] });
      }
    },
  });
}
