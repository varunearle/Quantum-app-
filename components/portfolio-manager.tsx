"use client"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Save, FolderOpen, Trash2, Calendar, Tag } from "lucide-react"
import { PortfolioStorage, type SavedPortfolio } from "@/lib/portfolio-storage"
import type { Asset } from "@/lib/quantum-optimizer"

interface PortfolioManagerProps {
  currentAssets: Asset[]
  currentWeights?: number[]
  onLoadPortfolio: (assets: Asset[], weights?: number[]) => void
}

export default function PortfolioManager({ currentAssets, currentWeights, onLoadPortfolio }: PortfolioManagerProps) {
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [saveForm, setSaveForm] = useState({
    name: "",
    description: "",
    tags: "",
  })

  useEffect(() => {
    loadSavedPortfolios()
  }, [])

  const loadSavedPortfolios = () => {
    const portfolios = PortfolioStorage.getAllPortfolios()
    setSavedPortfolios(portfolios)
  }

  const handleSavePortfolio = () => {
    if (!saveForm.name.trim()) return

    const portfolio: SavedPortfolio = {
      id: PortfolioStorage.generateId(),
      name: saveForm.name.trim(),
      description: saveForm.description.trim() || undefined,
      assets: currentAssets,
      weights: currentWeights,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: saveForm.tags
        ? saveForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    }

    PortfolioStorage.savePortfolio(portfolio)
    loadSavedPortfolios()
    setSaveForm({ name: "", description: "", tags: "" })
    setIsSaveDialogOpen(false)
  }

  const handleLoadPortfolio = (portfolio: SavedPortfolio) => {
    onLoadPortfolio(portfolio.assets, portfolio.weights)
    setIsLoadDialogOpen(false)
  }

  const handleDeletePortfolio = (id: string) => {
    PortfolioStorage.deletePortfolio(id)
    loadSavedPortfolios()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Portfolio Management
          <Badge variant="secondary">{savedPortfolios.length} saved</Badge>
        </CardTitle>
        <CardDescription>Save, load, and manage your portfolio configurations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={currentAssets.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Save Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Portfolio</DialogTitle>
                <DialogDescription>Save your current portfolio configuration for future use</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Portfolio Name</Label>
                  <Input
                    placeholder="My Quantum Portfolio"
                    value={saveForm.name}
                    onChange={(e) => setSaveForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="High-growth tech portfolio optimized for maximum Sharpe ratio..."
                    value={saveForm.description}
                    onChange={(e) => setSaveForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <Input
                    placeholder="tech, growth, high-risk"
                    value={saveForm.tags}
                    onChange={(e) => setSaveForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Current Portfolio:</p>
                  <p className="text-xs text-muted-foreground">
                    {currentAssets.length} assets: {currentAssets.map((a) => a.symbol).join(", ")}
                  </p>
                </div>
                <Button onClick={handleSavePortfolio} className="w-full" disabled={!saveForm.name.trim()}>
                  Save Portfolio
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Load Portfolio</DialogTitle>
                <DialogDescription>Select a saved portfolio to load into the optimizer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedPortfolios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No saved portfolios</p>
                    <p className="text-sm">Save your first portfolio to see it here</p>
                  </div>
                ) : (
                  savedPortfolios.map((portfolio) => (
                    <div key={portfolio.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{portfolio.name}</h4>
                          {portfolio.description && (
                            <p className="text-sm text-muted-foreground">{portfolio.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatDate(portfolio.createdAt)}</span>
                            <span>•</span>
                            <span>{portfolio.assets.length} assets</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleLoadPortfolio(portfolio)}>
                            Load
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{portfolio.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePortfolio(portfolio.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {portfolio.assets.slice(0, 5).map((asset) => (
                          <Badge key={asset.symbol} variant="outline" className="text-xs">
                            {asset.symbol}
                          </Badge>
                        ))}
                        {portfolio.assets.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{portfolio.assets.length - 5} more
                          </Badge>
                        )}
                      </div>

                      {portfolio.tags && portfolio.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {portfolio.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
