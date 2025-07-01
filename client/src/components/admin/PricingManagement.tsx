import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Euro, Plus, Edit, Trash2, Settings, Save, X } from "lucide-react";

interface PricingItem {
  id: number;
  category: string;
  itemKey: string;
  name: string;
  description?: string;
  customerPrice: number;
  leadFee: number;
  minTvSize?: number;
  maxTvSize?: number;
  isActive: boolean;
}

interface PricingFormData {
  category: 'service' | 'addon' | 'bracket';
  itemKey: string;
  name: string;
  description: string;
  customerPrice: number;
  leadFee: number;
  minTvSize?: number;
  maxTvSize?: number;
}

const PricingForm = ({ 
  pricing, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  pricing?: PricingItem; 
  onSubmit: (data: PricingFormData) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<PricingFormData>({
    category: pricing?.category as 'service' | 'addon' | 'bracket' || 'service',
    itemKey: pricing?.itemKey || '',
    name: pricing?.name || '',
    description: pricing?.description || '',
    customerPrice: pricing?.customerPrice || 0,
    leadFee: pricing?.leadFee || 0,
    minTvSize: pricing?.minTvSize,
    maxTvSize: pricing?.maxTvSize,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value: 'service' | 'addon' | 'bracket') => 
            setFormData(prev => ({ ...prev, category: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="addon">Add-on</SelectItem>
              <SelectItem value="bracket">Bracket</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Choose the type: Service (main installation tiers), Add-on (optional extras), or Bracket (wall mount types)
          </p>
        </div>
        <div>
          <Label htmlFor="itemKey">Item Key</Label>
          <Input
            id="itemKey"
            value={formData.itemKey}
            onChange={(e) => setFormData(prev => ({ ...prev, itemKey: e.target.value }))}
            placeholder="e.g., bronze, soundbar-mounting"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Unique identifier used in code. Use lowercase with hyphens (e.g., "gold-premium", "cable-hiding")
          </p>
        </div>
      </div>
      
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Bronze Wall Mount"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Display name shown to customers (e.g., "Bronze Wall Mount", "Soundbar Installation", "Premium Fixed Bracket")
        </p>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the service/addon/bracket"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Short description explaining what this item includes. Shown to customers during booking.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerPrice">Customer Price (€)</Label>
          <Input
            id="customerPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.customerPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPrice: parseFloat(e.target.value) || 0 }))}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Estimated price shown to customers. They pay installers directly (cash/card/transfer).
          </p>
        </div>
        <div>
          <Label htmlFor="leadFee">Lead Fee (€)</Label>
          <Input
            id="leadFee"
            type="number"
            step="0.01"
            min="0"
            value={formData.leadFee}
            onChange={(e) => setFormData(prev => ({ ...prev, leadFee: parseFloat(e.target.value) || 0 }))}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Fixed fee installers pay to access this lead. Platform revenue source (€12-€35 typically).
          </p>
        </div>
      </div>
      
      {formData.category === 'service' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minTvSize">Min TV Size (inches)</Label>
            <Input
              id="minTvSize"
              type="number"
              min="0"
              value={formData.minTvSize || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                minTvSize: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="e.g., 32"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum TV size for this service tier. Helps filter appropriate options for customers.
            </p>
          </div>
          <div>
            <Label htmlFor="maxTvSize">Max TV Size (inches)</Label>
            <Input
              id="maxTvSize"
              type="number"
              min="0"
              value={formData.maxTvSize || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxTvSize: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="e.g., 65 (leave empty for unlimited)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum TV size for this tier. Leave empty for no upper limit (e.g., premium services).
            </p>
          </div>
        </div>
      )}
      
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {pricing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default function PricingManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'service' | 'addon' | 'bracket'>('all');
  const [editingPricing, setEditingPricing] = useState<PricingItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch all pricing configurations
  const { data: allPricing = [], isLoading } = useQuery<PricingItem[]>({
    queryKey: ["/api/admin/pricing"],
  });

  // Filter pricing by category
  const filteredPricing = selectedCategory === 'all' 
    ? allPricing 
    : allPricing.filter((item: PricingItem) => item.category === selectedCategory);

  // Create pricing mutation
  const createPricingMutation = useMutation({
    mutationFn: async (data: PricingFormData) => {
      const response = await apiRequest('POST', '/api/admin/pricing', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Pricing Created",
        description: "Pricing configuration created successfully",
      });
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pricing configuration",
        variant: "destructive",
      });
    }
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PricingFormData }) => {
      const response = await apiRequest('PUT', `/api/admin/pricing/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Pricing Updated",
        description: "Pricing configuration updated successfully",
      });
      setEditingPricing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing configuration",
        variant: "destructive",
      });
    }
  });

  // Delete pricing mutation
  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/pricing/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Pricing Deleted",
        description: "Pricing configuration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pricing configuration",
        variant: "destructive",
      });
    }
  });

  // Initialize default pricing mutation
  const initializePricingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/pricing/initialize');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing"] });
      toast({
        title: "Pricing Initialized",
        description: "Default pricing configurations created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize pricing configurations",
        variant: "destructive",
      });
    }
  });

  const handleCreatePricing = (data: PricingFormData) => {
    createPricingMutation.mutate(data);
  };

  const handleUpdatePricing = (data: PricingFormData) => {
    if (editingPricing) {
      updatePricingMutation.mutate({ id: editingPricing.id, data });
    }
  };

  const handleDeletePricing = (id: number) => {
    if (confirm('Are you sure you want to delete this pricing configuration?')) {
      deletePricingMutation.mutate(id);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'addon': return 'bg-green-100 text-green-800';
      case 'bracket': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading pricing configurations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <CardTitle>Pricing Management</CardTitle>
            </div>
            <div className="flex space-x-2">
              {allPricing.length === 0 && (
                <Button 
                  onClick={() => initializePricingMutation.mutate()}
                  disabled={initializePricingMutation.isPending}
                  variant="outline"
                >
                  Initialize Default Pricing
                </Button>
              )}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pricing
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Pricing Configuration</DialogTitle>
                    <DialogDescription>
                      Configure pricing for our lead generation marketplace. Customer Price is shown as an estimate - customers pay installers directly. Lead Fee is what installers pay us to access leads.
                    </DialogDescription>
                  </DialogHeader>
                  <PricingForm
                    onSubmit={handleCreatePricing}
                    onCancel={() => setShowCreateDialog(false)}
                    isLoading={createPricingMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-6">
            <Label>Filter by Category</Label>
            <Select value={selectedCategory} onValueChange={(value: 'all' | 'service' | 'addon' | 'bracket') => 
              setSelectedCategory(value)
            }>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="service">Services</SelectItem>
                <SelectItem value="addon">Add-ons</SelectItem>
                <SelectItem value="bracket">Brackets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Customer Price</TableHead>
                <TableHead>Lead Fee</TableHead>
                <TableHead>TV Size Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPricing.map((item: PricingItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge className={getCategoryBadgeColor(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{item.itemKey}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-1 text-green-600" />
                      {formatPrice(item.customerPrice)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-1 text-blue-600" />
                      {formatPrice(item.leadFee)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.minTvSize || item.maxTvSize ? (
                      <span className="text-sm">
                        {item.minTvSize || 0}" - {item.maxTvSize || '∞'}"
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPricing(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePricing(item.id)}
                        disabled={deletePricingMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPricing.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No pricing configurations found for the selected category.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editingPricing !== null} onOpenChange={() => setEditingPricing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pricing Configuration</DialogTitle>
            <DialogDescription>
              Update pricing for our lead generation marketplace. Customer Price is shown as an estimate - customers pay installers directly. Lead Fee is what installers pay us to access leads.
            </DialogDescription>
          </DialogHeader>
          {editingPricing && (
            <PricingForm
              pricing={editingPricing}
              onSubmit={handleUpdatePricing}
              onCancel={() => setEditingPricing(null)}
              isLoading={updatePricingMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}