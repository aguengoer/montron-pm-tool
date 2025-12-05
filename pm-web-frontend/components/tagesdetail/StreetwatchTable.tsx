"use client"

import { StreetwatchData } from "@/types/tagesdetail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface StreetwatchTableProps {
  data: StreetwatchData
}

export function StreetwatchTable({ data }: StreetwatchTableProps) {
  return (
    <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-montron-text dark:text-white">
          🚗 Streetwatch
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.entries.length === 0 ? (
          <p className="text-sm text-montron-contrast dark:text-montron-extra">
            Keine Streetwatch-Daten verfügbar
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-montron-contrast/20">
                  <TableHead className="text-montron-text dark:text-white">Zeit</TableHead>
                  <TableHead className="text-montron-text dark:text-white">Ereignis</TableHead>
                  <TableHead className="text-montron-text dark:text-white">Ort</TableHead>
                  <TableHead className="text-montron-text dark:text-white text-right">
                    KM-Stand
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry, idx) => (
                  <TableRow
                    key={idx}
                    className="border-montron-contrast/20 hover:bg-montron-extra/50 dark:hover:bg-montron-contrast/10"
                  >
                    <TableCell className="text-montron-text dark:text-white font-medium">
                      {entry.zeit}
                    </TableCell>
                    <TableCell className="text-montron-text dark:text-white">
                      {entry.ereignis}
                    </TableCell>
                    <TableCell className="text-montron-text dark:text-white">
                      {entry.ort}
                    </TableCell>
                    <TableCell className="text-montron-text dark:text-white text-right">
                      {entry.kilometerstand ? entry.kilometerstand.toLocaleString("de-DE") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

