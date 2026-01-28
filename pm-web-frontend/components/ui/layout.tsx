"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Users, FileOutput, Building, Settings, LogOut, User } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, logout } = useAuth()
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)

  const isLoginRoute = pathname === "/login"
  const isSetupRoute = pathname?.startsWith("/setup")

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (loading) return
    // Skip auth checks for setup routes - handled by SetupGuard
    if (isSetupRoute) return
    if (!isLoginRoute && !isAuthenticated) {
      router.replace("/login")
    } else if (isLoginRoute && isAuthenticated) {
      router.replace("/mitarbeiter")
    }
  }, [loading, isAuthenticated, isLoginRoute, isSetupRoute, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (isLoginRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        {children}
      </div>
    )
  }

  // Setup routes don't require authentication - handled by SetupGuard
  if (isSetupRoute) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-montron-text">
      <header className="border-b border-montron-contrast/20 dark:border-montron-contrast/40 py-2 px-4">
        <div className="container mx-auto flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:bg-montron-extra dark:hover:bg-montron-contrast/20"
              >
                <User className="h-4 w-4 mr-2" />
                {currentUser?.email || "Benutzer"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentUser?.email || "Nicht angemeldet"}</p>
                  {currentUser?.emailVerified && (
                    <p className="text-xs text-muted-foreground">E-Mail verifiziert</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-16 border-r border-montron-contrast/20 dark:border-montron-contrast/40 bg-white dark:bg-montron-text flex flex-col items-center py-6">
          <div className="mb-6">
            <Link href="/">
              <svg id="Ebene_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55.76 60.92" className="w-10 h-10">
                <defs>
                  <style>{`.cls-1{fill:#E9573A;}`}</style>
                </defs>
                <polygon
                  className="cls-1"
                  points="52.23 13.24 26.89 .26 26.72 .03 26.6 .12 26.37 0 26.5 .18 2.72 16.39 35.28 12.58 45.46 26.96 52.23 13.24"
                />
                <polygon
                  className="cls-1"
                  points="28.13 60.92 7.95 34.96 15.26 18.72 0 19.84 1.69 48.84 2.35 47.39 1.7 48.85 28.13 60.92"
                />
                <polygon
                  className="cls-1"
                  points="55.51 45.82 55.76 45.67 55.51 45.69 54.35 16.82 40.36 46.42 22.77 47.28 30.7 60.36 55.48 45.84 55.51 45.84 55.51 45.82"
                />
              </svg>
            </Link>
          </div>
          <TooltipProvider>
            <div className="flex flex-col gap-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/mitarbeiter">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:bg-montron-extra dark:hover:bg-montron-contrast/20"
                    >
                      <Users className="h-5 w-5" />
                      <span className="sr-only">Mitarbeiter</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Mitarbeiterübersicht</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/export">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:bg-montron-extra dark:hover:bg-montron-contrast/20"
                    >
                      <FileOutput className="h-5 w-5" />
                      <span className="sr-only">Export</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Export & PDF-Übersicht</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/kunden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:bg-montron-extra dark:hover:bg-montron-contrast/20"
                    >
                      <Building className="h-5 w-5" />
                      <span className="sr-only">Kunden</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Kundenverwaltung</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/einstellungen">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:bg-montron-extra dark:hover:bg-montron-contrast/20"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Einstellungen</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Einstellungen</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </aside>

        <main className="flex-1 bg-white dark:bg-montron-text">{children}</main>
      </div>
    </div>
  )
}

