import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Store, MapPin, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Retailer {
  code: string;
  name: string;
  fullName: string;
  color: string;
  storeLocations: Record<string, string>;
}

interface StoreEditForm {
  retailerCode: string;
  storeCode: string;
  storeName: string;
  isNew: boolean;
}

export default function StoreManagement() {
  const [editingStore, setEditingStore] = useState<StoreEditForm | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all retailers
  const { data: retailers, isLoading } = useQuery<Retailer[]>({
    queryKey: ['/api/retail-partner/retailers'],
  });

  // Update store locations mutation
  const updateStoresMutation = useMutation({
    mutationFn: async ({ retailerCode, storeLocations }: { retailerCode: string; storeLocations: Record<string, string> }) => {
      return apiRequest(`/api/retail-partner/retailers/${retailerCode}/stores`, {
        method: 'PUT',
        body: { storeLocations }
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Store locations updated for ${variables.retailerCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/retail-partner/retailers'] });
      setIsDialogOpen(false);
      setEditingStore(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update store locations",
        variant: "destructive",
      });
    }
  });

  const handleAddStore = (retailerCode: string) => {
    setEditingStore({
      retailerCode,
      storeCode: '',
      storeName: '',
      isNew: true
    });
    setIsDialogOpen(true);
  };

  const handleEditStore = (retailerCode: string, storeCode: string, storeName: string) => {
    setEditingStore({
      retailerCode,
      storeCode,
      storeName,
      isNew: false
    });
    setIsDialogOpen(true);
  };

  const handleSaveStore = () => {
    if (!editingStore || !editingStore.storeCode || !editingStore.storeName) {
      toast({
        title: "Validation Error",
        description: "Store code and name are required",
        variant: "destructive",
      });
      return;
    }

    const retailer = retailers?.find(r => r.code === editingStore.retailerCode);
    if (!retailer) return;

    const updatedStoreLocations = {
      ...retailer.storeLocations,
      [editingStore.storeCode]: editingStore.storeName
    };

    updateStoresMutation.mutate({
      retailerCode: editingStore.retailerCode,
      storeLocations: updatedStoreLocations
    });
  };

  const handleDeleteStore = (retailerCode: string, storeCode: string) => {
    const retailer = retailers?.find(r => r.code === retailerCode);
    if (!retailer) return;

    const updatedStoreLocations = { ...retailer.storeLocations };
    delete updatedStoreLocations[storeCode];

    updateStoresMutation.mutate({
      retailerCode,
      storeLocations: updatedStoreLocations
    });
  };

  const getRetailerStats = (retailer: Retailer) => {
    const storeCount = Object.keys(retailer.storeLocations).length;
    return { storeCount };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading retailers...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Store Management
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage store locations and codes for all supported retailers
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="manage">Manage Stores</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {retailers?.map((retailer) => {
                const stats = getRetailerStats(retailer);
                return (
                  <Card key={retailer.code} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: retailer.color }}
                          />
                          <CardTitle className="text-lg">{retailer.name}</CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {retailer.code}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{retailer.fullName}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Store Locations</span>
                          <Badge variant="outline">{stats.storeCount}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Object.entries(retailer.storeLocations).slice(0, 3).map(([code, name]) => (
                            <div key={code} className="flex justify-between">
                              <span>{code}</span>
                              <span>{name}</span>
                            </div>
                          ))}
                          {stats.storeCount > 3 && (
                            <div className="text-center text-gray-400 mt-1">
                              +{stats.storeCount - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Manage Stores Tab */}
          <TabsContent value="manage" className="space-y-4">
            {retailers?.map((retailer) => (
              <Card key={retailer.code}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: retailer.color }}
                      />
                      <CardTitle className="text-lg">{retailer.fullName}</CardTitle>
                      <Badge>{retailer.code}</Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddStore(retailer.code)}
                      disabled={updateStoresMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Store
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(retailer.storeLocations).map(([code, name]) => (
                      <div key={code} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{code}</div>
                            <div className="text-xs text-gray-600">{name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStore(retailer.code, code, name)}
                            disabled={updateStoresMutation.isPending}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteStore(retailer.code, code)}
                            disabled={updateStoresMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(retailer.storeLocations).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No store locations configured
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Store Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStore?.isNew ? 'Add Store Location' : 'Edit Store Location'}
              </DialogTitle>
            </DialogHeader>
            
            {editingStore && (
              <div className="space-y-4">
                <div>
                  <Label>Retailer</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 border rounded">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: retailers?.find(r => r.code === editingStore.retailerCode)?.color }}
                    />
                    <span>{retailers?.find(r => r.code === editingStore.retailerCode)?.fullName}</span>
                    <Badge>{editingStore.retailerCode}</Badge>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="storeCode">Store Code *</Label>
                  <Input
                    id="storeCode"
                    value={editingStore.storeCode}
                    onChange={(e) => setEditingStore({
                      ...editingStore,
                      storeCode: e.target.value.toUpperCase()
                    })}
                    placeholder="e.g. DUB, CRK, GAL"
                    disabled={!editingStore.isNew}
                  />
                </div>
                
                <div>
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input
                    id="storeName"
                    value={editingStore.storeName}
                    onChange={(e) => setEditingStore({
                      ...editingStore,
                      storeName: e.target.value
                    })}
                    placeholder="e.g. Dublin, Cork, Galway"
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-4">
                  <Button
                    onClick={handleSaveStore}
                    disabled={updateStoresMutation.isPending || !editingStore.storeCode || !editingStore.storeName}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {updateStoresMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingStore(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}