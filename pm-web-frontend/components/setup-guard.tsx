"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSetupState } from "@/hooks/useSetupState"
import { Spinner } from "@/components/ui/spinner"

/**
 * Guard component that redirects to /setup if installation is UNCONFIGURED.
 * Should be used at the root level to protect all routes except /setup.
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: setupState, isLoading } = useSetupState()

  const isSetupRoute = pathname?.startsWith("/setup") || pathname === "/setup"

  useEffect(() => {
    if (isLoading) return

    // If UNCONFIGURED, redirect all routes to /setup (except /setup itself)
    if (setupState?.state === "UNCONFIGURED" && !isSetupRoute) {
      router.replace("/setup")
      return
    }

    // If CONFIGURED, block /setup route
    if (setupState?.state === "CONFIGURED" && isSetupRoute) {
      router.replace("/mitarbeiter")
      return
    }
  }, [setupState, isLoading, isSetupRoute, router, pathname])

  // Show loading state while checking setup status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        <div className="text-center">
          <Spinner className="h-10 w-10 mx-auto mb-4" />
          <p className="text-montron-contrast dark:text-montron-extra">Lade Setup-Status...</p>
        </div>
      </div>
    )
  }

  // If UNCONFIGURED and not on setup route, don't render children (will redirect)
  if (setupState?.state === "UNCONFIGURED" && !isSetupRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  // If CONFIGURED and on setup route, don't render children (will redirect)
  if (setupState?.state === "CONFIGURED" && isSetupRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  return <>{children}</>
}

