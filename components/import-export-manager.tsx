"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Download, Upload, FileJson, FileSpreadsheet, CheckCircle, AlertCircle, BarChart3 } from "lucide-react"
import { ImportExportManager } from "@/lib/import-export"
import type { Asset, OptimizationResult } from "@/lib/quantum-optimizer"

interface ImportExportManagerProps {
  assets: Asset[]
  optimizationResult?: OptimizationResult | null
  onImportAssets: (assets: Asset[]) => void
  onImportComplete?: (data: {
    assets: Asset[]
    weights?: number[]
    optimizationResult?: OptimizationResult
    metadata?: any
  }) => void
}

export default function ImportExportManagerComponent({
  assets,
  optimizationResult,
  onImportAssets,
  onImportComplete,
}: ImportExportManagerProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [exportForm, setExportForm] = useState({
    name: "My Portfolio",
    description: "",
    format: "json" as "json" | "csv",
    includeResults: true,
  })
  const [importStatus, setImportStatus] = useState<{
    loading: boolean
    success: boolean
    error: string | null
    preview?: { assets: Asset[]; metadata?: any }
  }>({
    loading: false,
    success: false,
    error: null,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = () => {
    const content = ImportExportManager.exportToJSON(
      exportForm.name,
      assets,
      optimizationResult?.optimalWeights,
      exportForm.includeResults ? optimizationResult || undefined : undefined,
      exportForm.description || undefined,
    )

    const filename = ImportExportManager.generateFilename(exportForm.name.replace(/[^a-zA-Z0-9]/g, "_"), "json")

    ImportExportManager.downloadFile(content, filename, "application/json")
    setIsExportDialogOpen(false)
  }

  const handleExportCSV = () => {
    const content = ImportExportManager.exportToCSV(
      assets,
      optimizationResult?.optimalWeights,
      exportForm.includeResults ? optimizationResult || undefined : undefined,
    )

    const filename = ImportExportManager.generateFilename(exportForm.name.replace(/[^a-zA-Z0-9]/g, "_"), "csv")

    ImportExportManager.downloadFile(content, filename, "text/csv")
    setIsExportDialogOpen(false)
  }

  const handleExportOptimizationResults = () => {
    if (!optimizationResult) return

    const content = ImportExportManager.exportOptimizationResultsToCSV(optimizationResult)
    const filename = ImportExportManager.generateFilename("optimization_results", "csv")

    ImportExportManager.downloadFile(content, filename, "text/csv")
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportStatus({ loading: true, success: false, error: null })

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      if (fileExtension === "json") {
        const result = await ImportExportManager.importFromJSON(file)
        setImportStatus({
          loading: false,
          success: true,
          error: null,
          preview: { assets: result.assets, metadata: result.metadata },
        })

        if (onImportComplete) {
          onImportComplete(result)
        } else {
          onImportAssets(result.assets)
        }
      } else if (fileExtension === "csv") {
        const result = await ImportExportManager.importFromCSV(file)
        setImportStatus({
          loading: false,
          success: true,
          error: null,
          preview: { assets: result.assets },
        })
        onImportAssets(result.assets)
      } else {
        throw new Error("Unsupported file format. Please use JSON or CSV files.")
      }
    } catch (error) {
      setImportStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetImportStatus = () => {
    setImportStatus({ loading: false, success: false, error: null })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Import/Export Portfolio Data
          <Badge variant="secondary">JSON & CSV</Badge>
        </CardTitle>
        <CardDescription>
          Import portfolio data from files or export your current portfolio configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Portfolio
            </h4>

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={assets.length === 0} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Portfolio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Portfolio Data</DialogTitle>
                  <DialogDescription>Configure export settings and download your portfolio data</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Portfolio Name</Label>
                    <Input
                      value={exportForm.name}
                      onChange={(e) => setExportForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="My Portfolio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={exportForm.description}
                      onChange={(e) => setExportForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Portfolio description..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Include Optimization Results</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeResults"
                        checked={exportForm.includeResults}
                        onChange={(e) => setExportForm((prev) => ({ ...prev, includeResults: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="includeResults" className="text-sm">
                        Include weights and optimization results
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleExportJSON} className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Export JSON
                    </Button>
                    <Button
                      onClick={handleExportCSV}
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {optimizationResult && (
              <Button onClick={handleExportOptimizationResults} variant="outline" className="w-full bg-transparent">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Portfolio
            </h4>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Portfolio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Portfolio Data</DialogTitle>
                  <DialogDescription>Upload a JSON or CSV file to import portfolio data</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select File</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileSelect}
                      disabled={importStatus.loading}
                    />
                    <p className="text-xs text-muted-foreground">Supported formats: JSON, CSV</p>
                  </div>

                  {importStatus.loading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Processing file...</span>
                      </div>
                      <Progress value={50} className="w-full" />
                    </div>
                  )}

                  {importStatus.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{importStatus.error}</AlertDescription>
                    </Alert>
                  )}

                  {importStatus.success && importStatus.preview && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Successfully imported {importStatus.preview.assets.length} assets
                        {importStatus.preview.metadata && ` from "${importStatus.preview.metadata.name}"`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {importStatus.preview && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <h5 className="font-medium text-sm">Preview:</h5>
                      <div className="space-y-1">
                        {importStatus.preview.assets.slice(0, 3).map((asset) => (
                          <div key={asset.symbol} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {asset.symbol}
                            </Badge>
                            <span className="text-muted-foreground">{asset.name}</span>
                          </div>
                        ))}
                        {importStatus.preview.assets.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{importStatus.preview.assets.length - 3} more assets
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => setIsImportDialogOpen(false)} variant="outline" className="flex-1">
                      Close
                    </Button>
                    {(importStatus.error || importStatus.success) && (
                      <Button onClick={resetImportStatus} variant="outline">
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* File Format Information */}
        <div className="border-t pt-4">
          <h5 className="font-medium text-sm mb-2">Supported Formats:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <FileJson className="h-4 w-4 text-chart-1 mt-0.5" />
              <div>
                <p className="font-medium">JSON Format</p>
                <p className="text-muted-foreground">Complete portfolio data with optimization results</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="h-4 w-4 text-chart-2 mt-0.5" />
              <div>
                <p className="font-medium">CSV Format</p>
                <p className="text-muted-foreground">Asset data with Symbol, Name, Return, Volatility, Price</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
