"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  multiFactor, 
  TotpMultiFactorGenerator,
  getAuth,
  User,
  MultiFactorUser
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface MfaStatus {
  isEnabled: boolean;
  enrolledFactors: Array<{
    uid: string;
    displayName?: string;
    factorId: string;
  }>;
}

/**
 * Hook to check MFA status for current user
 */
export function useMfaStatus() {
  return useQuery<MfaStatus>({
    queryKey: ["mfa-status"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        const multiFactorUser = multiFactor(user);
        const enrolledFactors = multiFactorUser.enrolledFactors || [];

        return {
          isEnabled: enrolledFactors.length > 0,
          enrolledFactors: enrolledFactors.map((factor) => ({
            uid: factor.uid,
            displayName: factor.displayName,
            factorId: factor.factorId,
          })),
        };
      } catch (error) {
        console.error("Error checking MFA status:", error);
        return {
          isEnabled: false,
          enrolledFactors: [],
        };
      }
    },
    enabled: !!auth.currentUser,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to unenroll MFA
 */
export function useUnenrollMfa() {
  const queryClient = useQueryClient();

  return useCallback(async (factorUid: string) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    const multiFactorUser = multiFactor(user);
    const factor = multiFactorUser.enrolledFactors.find((f) => f.uid === factorUid);

    if (!factor) {
      throw new Error("Factor not found");
    }

    await multiFactorUser.unenroll(factor);

    // Invalidate MFA status query
    queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
  }, [queryClient]);
}
