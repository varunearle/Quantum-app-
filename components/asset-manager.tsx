"use client"

import { useState } from "react"
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
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import type { Asset } from "@/lib/quantum-optimizer"

interface AssetManagerProps {
  assets: Asset[]
  onAssetsChange: (assets: Asset[]) => void
}

const assetCategories = [
  "Technology",
  "Healthcare",
  "Financial",
  "Consumer",
  "Energy",
  "Real Estate",
  "Utilities",
  "Materials",
  "ETF",
  "Bond",
]

export default function AssetManager({ assets, onAssetsChange }: AssetManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    symbol: "",
    name: "",
    expectedReturn: 0.1,
    volatility: 0.2,
    price: 100,
  })

  const handleAddAsset = () => {
    if (newAsset.symbol && newAsset.name) {
      const asset: Asset = {
        symbol: newAsset.symbol.toUpperCase(),
        name: newAsset.name,
        expectedReturn: newAsset.expectedReturn || 0.1,
        volatility: newAsset.volatility || 0.2,
        price: newAsset.price || 100,
      }
      onAssetsChange([...assets, asset])
      setNewAsset({ symbol: "", name: "", expectedReturn: 0.1, volatility: 0.2, price: 100 })
      setIsAddDialogOpen(false)
    }
  }

  const handleUpdateAsset = (index: number, field: keyof Asset, value: string | number) => {
    const updatedAssets = [...assets]
    updatedAssets[index] = { ...updatedAssets[index], [field]: value }
    onAssetsChange(updatedAssets)
  }

  const handleRemoveAsset = (index: number) => {
    const updatedAssets = assets.filter((_, i) => i !== index)
    onAssetsChange(updatedAssets)
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Portfolio Assets
              <Badge variant="secondary">{assets.length} assets</Badge>
            </CardTitle>
            <CardDescription>Manage your portfolio assets with expected returns and risk metrics</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>Enter the details for the new asset to add to your portfolio</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="AAPL"
                      value={newAsset.symbol}
                      onChange={(e) => setNewAsset((prev) => ({ ...prev, symbol: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newAsset.price}
                      onChange={(e) => setNewAsset((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    placeholder="Apple Inc."
                    value={newAsset.name}
                    onChange={(e) => setNewAsset((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Return</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={newAsset.expectedReturn}
                      onChange={(e) =>
                        setNewAsset((prev) => ({ ...prev, expectedReturn: Number.parseFloat(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Volatility</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={newAsset.volatility}
                      onChange={(e) =>
                        setNewAsset((prev) => ({ ...prev, volatility: Number.parseFloat(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleAddAsset} className="w-full">
                  Add Asset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No assets in portfolio</p>
              <p className="text-sm">Add assets to start optimizing your portfolio</p>
            </div>
          ) : (
            assets.map((asset, index) => (
              <div key={`${asset.symbol}-${index}`} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-sm">
                      {asset.symbol}
                    </Badge>
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">${asset.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAsset(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Expected Return</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={asset.expectedReturn}
                        onChange={(e) => handleUpdateAsset(index, "expectedReturn", Number.parseFloat(e.target.value))}
                        className="text-sm"
                      />
                      <div className="flex items-center gap-1 text-sm">
                        {asset.expectedReturn > 0.1 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-muted-foreground">{formatPercentage(asset.expectedReturn)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Volatility</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={asset.volatility}
                        onChange={(e) => handleUpdateAsset(index, "volatility", Number.parseFloat(e.target.value))}
                        className="text-sm"
                      />
                      <span className="text-sm text-muted-foreground">{formatPercentage(asset.volatility)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
