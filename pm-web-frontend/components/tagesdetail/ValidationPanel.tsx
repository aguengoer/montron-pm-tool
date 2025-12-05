"use client"

import { ValidationIssue } from "@/types/tagesdetail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationPanelProps {
  issues: ValidationIssue[]
  onIssueClick?: (issue: ValidationIssue) => void
}

export function ValidationPanel({ issues, onIssueClick }: ValidationPanelProps) {
  if (issues.length === 0) {
    return (
      <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-montron-text dark:text-white">
            ⚠️ Prüfhinweise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-montron-contrast dark:text-montron-extra">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Keine Probleme gefunden</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-montron-text dark:text-white">
          ⚠️ Prüfhinweise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-md text-sm cursor-pointer transition-colors",
                "hover:opacity-80",
                issue.type === "success" && "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
                issue.type === "warning" && "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
                issue.type === "error" && "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
              )}
              onClick={() => onIssueClick?.(issue)}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg mt-[-2px]">{issue.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{issue.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    Feld: {issue.fieldId} ({issue.formType})
                  </p>
                </div>
                {getIssueIcon(issue.type)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getIssueIcon(type: ValidationIssue["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 flex-shrink-0" />
    case "warning":
      return <AlertCircle className="h-5 w-5 flex-shrink-0" />
    case "error":
      return <XCircle className="h-5 w-5 flex-shrink-0" />
  }
}

