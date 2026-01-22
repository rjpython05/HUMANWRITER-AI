"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, FileText, Check } from "lucide-react"
import { useState } from "react"

interface GenerationResultProps {
  result: {
    id: string
    humanizedText: string
    rawText: string
    discipline: string
    modelUsed: string
    duration: number
    tokensGenerated?: number
    createdAt: Date
    status: string
  }
  onExport?: (format: "pdf" | "docx" | "txt") => void
}

export function GenerationResult({ result, onExport }: GenerationResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.humanizedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Text</CardTitle>
              <CardDescription>
                Generated with {result.modelUsed} in {(result.duration / 1000).toFixed(2)}s
              </CardDescription>
            </div>
            <Badge variant={result.status === "COMPLETED" ? "default" : "secondary"}>
              {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
              {result.humanizedText}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Text
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport?.("pdf")}>
              <Download className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport?.("docx")}>
              <FileText className="mr-2 h-4 w-4" />
              Export as DOCX
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Discipline</p>
              <p className="font-medium">{result.discipline}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{result.modelUsed}</p>
            </div>
            {result.tokensGenerated && (
              <div>
                <p className="text-muted-foreground">Tokens Generated</p>
                <p className="font-medium">{result.tokensGenerated.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Word Count</p>
              <p className="font-medium">{result.humanizedText.split(/\s+/).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
