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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Save, X, Monitor } from "lucide-react";

interface WallMountPricing {
  id: number;
  key: string;
  name: string;
  description: string;
  mountType: string;
  price: string;
  maxTvSize: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface WallMountPricingFormData {
  key: string;
  name: string;
  description: string;
  mountType: string;
  price: number;
  maxTvSize?: number;
  isActive: boolean;
  displayOrder: number;
}

const WallMountPricingForm = ({ 
  pricing, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  pricing?: WallMountPricing; 
  onSubmit: (data: WallMountPricingFormData) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<WallMountPricingFormData>({
    key: pricing?.key || '',
    name: pricing?.name || '',
    description: pricing?.description || '',
    mountType: pricing?.mountType || 'Fixed',
    price: pricing ? parseFloat(pricing.price) : 0,
    maxTvSize: pricing?.maxTvSize || undefined,
    isActive: pricing?.isActive ?? true,
    displayOrder: pricing?.displayOrder || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="e.g., premium-tilting"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Premium Tilting Mount"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the wall mount option..."
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="mountType">Mount Type</Label>
          <Select 
            value={formData.mountType} 
            onValueChange={(value) => setFormData({ ...formData, mountType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fixed">Fixed</SelectItem>
              <SelectItem value="Tilting">Tilting</SelectItem>
              <SelectItem value="Full Motion">Full Motion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Price (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxTvSize">Max TV Size (inches)</Label>
          <Input
            id="maxTvSize"
            type="number"
            min="1"
            value={formData.maxTvSize || ''}
            onChange={(e) => setFormData({ ...formData, maxTvSize: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Leave empty for no limit"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            min="0"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Wall Mount Option"}
        </Button>
      </div>
    </form>
  );
};

export default function WallMountPricingManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPricing, setEditingPricing] = useState<WallMountPricing | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch wall mount pricing
  const { data: wallMountPricing = [], isLoading } = useQuery<WallMountPricing[]>({
    queryKey: ["/api/wall-mount-pricing"],
  });

  // Create wall mount pricing mutation
  const createPricingMutation = useMutation({
    mutationFn: async (data: WallMountPricingFormData) => {
      const response = await apiRequest('POST', '/api/admin/wall-mount-pricing', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both wall mount and service tier queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/wall-mount-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-tiers"] });
      toast({
        title: "Wall Mount Option Created",
        description: "New wall mount pricing option created successfully. Booking flow updated in real-time.",
      });
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create wall mount option",
        variant: "destructive",
      });
    }
  });

  // Update wall mount pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: WallMountPricingFormData }) => {
      const response = await apiRequest('PUT', `/api/admin/wall-mount-pricing/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both wall mount and service tier queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/wall-mount-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-tiers"] });
      toast({
        title: "Wall Mount Option Updated",
        description: "Wall mount pricing updated successfully. Booking flow updated in real-time.",
      });
      setEditingPricing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update wall mount option",
        variant: "destructive",
      });
    }
  });

  // Delete wall mount pricing mutation
  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/wall-mount-pricing/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both wall mount and service tier queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/wall-mount-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-tiers"] });
      toast({
        title: "Wall Mount Option Deleted",
        description: "Wall mount pricing deleted successfully. Booking flow updated in real-time.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete wall mount option",
        variant: "destructive",
      });
    }
  });

  const handleCreatePricing = (data: WallMountPricingFormData) => {
    createPricingMutation.mutate(data);
  };

  const handleUpdatePricing = (data: WallMountPricingFormData) => {
    if (editingPricing) {
      updatePricingMutation.mutate({ id: editingPricing.id, data });
    }
  };

  const handleDeletePricing = (id: number) => {
    if (confirm('Are you sure you want to delete this wall mount option?')) {
      deletePricingMutation.mutate(id);
    }
  };

  const getMountTypeBadgeColor = (mountType: string) => {
    switch (mountType) {
      case 'Fixed': return 'bg-blue-100 text-blue-800';
      case 'Tilting': return 'bg-green-100 text-green-800';
      case 'Full Motion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: string) => `€${parseFloat(price).toFixed(2)}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">Loading wall mount pricing...</div>
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
              <Monitor className="w-6 h-6 text-blue-600" />
              <CardTitle>Wall Mount Pricing Management</CardTitle>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Wall Mount Option
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="create-wall-mount-description">
                <DialogHeader>
                  <DialogTitle>Create New Wall Mount Option</DialogTitle>
                  <DialogDescription id="create-wall-mount-description">
                    Add a new wall mount pricing option that customers can select during booking.
                  </DialogDescription>
                </DialogHeader>
                <WallMountPricingForm
                  onSubmit={handleCreatePricing}
                  onCancel={() => setShowCreateDialog(false)}
                  isLoading={createPricingMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mount Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Max TV Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallMountPricing.map((pricing) => (
                  <TableRow key={pricing.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pricing.name}</div>
                        <div className="text-sm text-gray-500">{pricing.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMountTypeBadgeColor(pricing.mountType)}>
                        {pricing.mountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(pricing.price)}
                    </TableCell>
                    <TableCell>
                      {pricing.maxTvSize ? `${pricing.maxTvSize}"` : 'No limit'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pricing.isActive ? "default" : "secondary"}>
                        {pricing.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{pricing.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPricing(pricing)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePricing(pricing.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {wallMountPricing.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No wall mount pricing options found. Add some options to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editingPricing !== null} onOpenChange={() => setEditingPricing(null)}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-wall-mount-description">
          <DialogHeader>
            <DialogTitle>Edit Wall Mount Option</DialogTitle>
            <DialogDescription id="edit-wall-mount-description">
              Update the wall mount pricing option details.
            </DialogDescription>
          </DialogHeader>
          {editingPricing && (
            <WallMountPricingForm
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