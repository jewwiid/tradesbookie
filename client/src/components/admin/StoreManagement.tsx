import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Store, MapPin, Save, X, Building2, ShoppingBag, UserCog, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Retailer {
  code: string;
  name: string;
  fullName: string;
  color: string;
  storeLocations: Record<string, string>;
}

interface NewRetailerForm {
  code: string;
  name: string;
  fullName: string;
  color: string;
}

interface StoreLocationForm {
  retailerCode: string;
  storeCode: string;
  storeName: string;
  isNew: boolean;
}

interface StoreUser {
  id: number;
  email: string;
  retailerCode: string;
  storeCode?: string;
  storeName: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface StoreCredentialForm {
  email: string;
  password: string;
  retailerCode: string;
  storeCode?: string;
  isNew: boolean;
}

export default function StoreManagement() {
  const [editingRetailer, setEditingRetailer] = useState<NewRetailerForm | null>(null);
  const [editingStore, setEditingStore] = useState<StoreLocationForm | null>(null);
  const [editingCredential, setEditingCredential] = useState<StoreCredentialForm | null>(null);
  const [isRetailerDialogOpen, setIsRetailerDialogOpen] = useState(false);
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all retailers
  const { data: retailers, isLoading } = useQuery<Retailer[]>({
    queryKey: ['/api/retail-partner/retailers'],
  });

  // Fetch store users (credentials)
  const { data: storeUsers, isLoading: storeUsersLoading } = useQuery<StoreUser[]>({
    queryKey: ['/api/admin/store-users'],
  });

  // Create new retailer mutation
  const createRetailerMutation = useMutation({
    mutationFn: async (retailerData: NewRetailerForm) => {
      return apiRequest('POST', '/api/retail-partner/retailers', {
        ...retailerData,
        storeLocations: {} // Initialize with empty store locations
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New retailer/franchise created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/retail-partner/retailers'] });
      setIsRetailerDialogOpen(false);
      setEditingRetailer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create retailer",
        variant: "destructive",
      });
    }
  });

  // Update retailer mutation
  const updateRetailerMutation = useMutation({
    mutationFn: async ({ code, updates }: { code: string; updates: Partial<NewRetailerForm> }) => {
      return apiRequest(`/api/retail-partner/retailers/${code}`, {
        method: 'PATCH',
        body: updates
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Retailer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/retail-partner/retailers'] });
      setIsRetailerDialogOpen(false);
      setEditingRetailer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update retailer",
        variant: "destructive",
      });
    }
  });

  // Delete retailer mutation
  const deleteRetailerMutation = useMutation({
    mutationFn: async (retailerCode: string) => {
      return apiRequest(`/api/retail-partner/retailers/${retailerCode}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Retailer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/retail-partner/retailers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete retailer",
        variant: "destructive",
      });
    }
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
        description: `Store locations updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/retail-partner/retailers'] });
      setIsStoreDialogOpen(false);
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

  // Store credential management mutations
  const createStoreUserMutation = useMutation({
    mutationFn: async (credentialData: Omit<StoreCredentialForm, 'isNew'>) => {
      return apiRequest('POST', '/api/admin/store-users', credentialData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store login credentials created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/store-users'] });
      setIsCredentialDialogOpen(false);
      setEditingCredential(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create store credentials",
        variant: "destructive",
      });
    }
  });

  const updateStoreUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<StoreCredentialForm> }) => {
      return apiRequest('PATCH', `/api/admin/store-users/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store credentials updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/store-users'] });
      setIsCredentialDialogOpen(false);
      setEditingCredential(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update store credentials",
        variant: "destructive",
      });
    }
  });

  const deleteStoreUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/store-users/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store credentials deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/store-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete store credentials",
        variant: "destructive",
      });
    }
  });

  // Retailer management handlers
  const handleAddRetailer = () => {
    setEditingRetailer({
      code: '',
      name: '',
      fullName: '',
      color: '#3B82F6'
    });
    setIsRetailerDialogOpen(true);
  };

  const handleEditRetailer = (retailer: Retailer) => {
    setEditingRetailer({
      code: retailer.code,
      name: retailer.name,
      fullName: retailer.fullName,
      color: retailer.color
    });
    setIsRetailerDialogOpen(true);
  };

  const handleSaveRetailer = () => {
    if (!editingRetailer || !editingRetailer.code || !editingRetailer.name || !editingRetailer.fullName) {
      toast({
        title: "Validation Error",
        description: "All retailer fields are required",
        variant: "destructive",
      });
      return;
    }

    // Check if this is editing an existing retailer
    const existingRetailer = retailers?.find(r => r.code === editingRetailer.code);
    
    if (existingRetailer) {
      // Update existing retailer
      updateRetailerMutation.mutate({
        code: editingRetailer.code,
        updates: {
          name: editingRetailer.name,
          fullName: editingRetailer.fullName,
          color: editingRetailer.color
        }
      });
    } else {
      // Create new retailer
      createRetailerMutation.mutate(editingRetailer);
    }
  };

  const handleDeleteRetailer = (retailerCode: string) => {
    if (window.confirm('Are you sure you want to delete this retailer and all its store locations?')) {
      deleteRetailerMutation.mutate(retailerCode);
    }
  };

  // Store location management handlers
  const handleAddStore = (retailerCode: string) => {
    setEditingStore({
      retailerCode,
      storeCode: '',
      storeName: '',
      isNew: true
    });
    setIsStoreDialogOpen(true);
  };

  const handleEditStore = (retailerCode: string, storeCode: string, storeName: string) => {
    setEditingStore({
      retailerCode,
      storeCode,
      storeName,
      isNew: false
    });
    setIsStoreDialogOpen(true);
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
    if (!window.confirm('Are you sure you want to delete this store location?')) return;
    
    const retailer = retailers?.find(r => r.code === retailerCode);
    if (!retailer) return;

    const updatedStoreLocations = { ...retailer.storeLocations };
    delete updatedStoreLocations[storeCode];

    updateStoresMutation.mutate({
      retailerCode,
      storeLocations: updatedStoreLocations
    });
  };

  // Store credential management handlers
  const handleAddCredential = () => {
    setEditingCredential({
      email: '',
      password: '',
      retailerCode: 'HN', // Default to Harvey Norman
      storeCode: '',
      isNew: true
    });
    setIsCredentialDialogOpen(true);
  };

  const handleEditCredential = (storeUser: StoreUser) => {
    setEditingCredential({
      email: storeUser.email,
      password: '', // Don't pre-fill password for security
      retailerCode: storeUser.retailerCode,
      storeCode: storeUser.storeCode || '',
      isNew: false
    });
    setIsCredentialDialogOpen(true);
  };

  const handleSaveCredential = () => {
    if (!editingCredential || !editingCredential.email || !editingCredential.retailerCode) {
      toast({
        title: "Validation Error",
        description: "Email and retailer are required",
        variant: "destructive",
      });
      return;
    }

    if (editingCredential.isNew) {
      if (!editingCredential.password) {
        toast({
          title: "Validation Error",
          description: "Password is required for new credentials",
          variant: "destructive",
        });
        return;
      }
      createStoreUserMutation.mutate({
        email: editingCredential.email,
        password: editingCredential.password,
        retailerCode: editingCredential.retailerCode,
        storeCode: editingCredential.storeCode || undefined
      });
    } else {
      // Find existing store user to update
      const existingUser = storeUsers?.find(u => 
        u.email === editingCredential.email && 
        u.retailerCode === editingCredential.retailerCode
      );
      if (existingUser) {
        const updates: any = {
          email: editingCredential.email,
          retailerCode: editingCredential.retailerCode,
          storeCode: editingCredential.storeCode || undefined
        };
        if (editingCredential.password) {
          updates.password = editingCredential.password;
        }
        updateStoreUserMutation.mutate({
          id: existingUser.id,
          updates
        });
      }
    }
  };

  const handleDeleteCredential = (storeUser: StoreUser) => {
    if (window.confirm(`Are you sure you want to delete store credentials for ${storeUser.email}?`)) {
      deleteStoreUserMutation.mutate(storeUser.id);
    }
  };

  const getRetailerStats = (retailer: Retailer) => {
    const storeCount = Object.keys(retailer.storeLocations).length;
    return { storeCount };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store & Retailer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading retailers and stores...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Store & Retailer Management
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage retail partners/franchises and their individual store locations
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="retailers">Manage Retailers/Franchises</TabsTrigger>
            <TabsTrigger value="locations">Manage Store Locations</TabsTrigger>
            <TabsTrigger value="credentials">Store Login Credentials</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {retailers?.map((retailer) => {
                const stats = getRetailerStats(retailer);
                return (
                  <Card key={retailer.code} className="border-l-4" style={{ borderLeftColor: retailer.color }}>
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
                              <span className="font-mono">{code}</span>
                              <span className="truncate ml-2">{name}</span>
                            </div>
                          ))}
                          {stats.storeCount > 3 && (
                            <div className="text-center text-gray-400 mt-1">
                              +{stats.storeCount - 3} more locations
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

          {/* Retailers Management Tab */}
          <TabsContent value="retailers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Retail Partners & Franchises</h3>
              <Button onClick={handleAddRetailer}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Retailer/Franchise
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {retailers?.map((retailer) => (
                <Card key={retailer.code}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: retailer.color }}
                        />
                        <div>
                          <CardTitle className="text-lg">{retailer.fullName}</CardTitle>
                          <p className="text-sm text-gray-600">
                            Code: <span className="font-mono">{retailer.code}</span> | 
                            Short Name: {retailer.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {Object.keys(retailer.storeLocations).length} locations
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRetailer(retailer)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRetailer(retailer.code)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Store Locations Management Tab */}
          <TabsContent value="locations" className="space-y-4">
            <h3 className="text-lg font-semibold">Store Locations by Retailer</h3>
            
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
                      <MapPin className="w-4 h-4 mr-1" />
                      Add Store Location
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(retailer.storeLocations).map(([code, name]) => (
                      <div key={code} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm font-mono">{code}</div>
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
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {Object.keys(retailer.storeLocations).length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No store locations added yet. Click "Add Store Location" to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Store Credentials Management Tab */}
          <TabsContent value="credentials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Store Login Credentials</h3>
              <Button onClick={handleAddCredential}>
                <Plus className="w-4 h-4 mr-2" />
                Add Store Credentials
              </Button>
            </div>

            {storeUsersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading store credentials...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {storeUsers?.map((storeUser) => {
                  const retailer = retailers?.find(r => r.code === storeUser.retailerCode);
                  const storeName = storeUser.storeCode && retailer?.storeLocations?.[storeUser.storeCode] 
                    ? `${retailer.fullName} ${retailer.storeLocations[storeUser.storeCode]}`
                    : retailer?.fullName || storeUser.retailerCode;

                  return (
                    <Card key={storeUser.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <UserCog className="w-5 h-5 text-blue-600" />
                              <div>
                                <CardTitle className="text-lg">{storeUser.email}</CardTitle>
                                <p className="text-sm text-gray-600">
                                  {storeName}
                                  {storeUser.storeCode && (
                                    <Badge variant="outline" className="ml-2">
                                      {storeUser.storeCode}
                                    </Badge>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={storeUser.isActive ? "default" : "secondary"}
                              className={storeUser.isActive ? "bg-green-600" : ""}
                            >
                              {storeUser.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCredential(storeUser)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCredential(storeUser)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Retailer Code:</span>
                            <span className="ml-2 font-mono">{storeUser.retailerCode}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Store Code:</span>
                            <span className="ml-2 font-mono">{storeUser.storeCode || 'All stores'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Created:</span>
                            <span className="ml-2">{new Date(storeUser.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Last Login:</span>
                            <span className="ml-2">{storeUser.lastLoginAt ? new Date(storeUser.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {storeUsers?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No store credentials configured yet. Click "Add Store Credentials" to get started.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Retailer Add/Edit Dialog */}
        <Dialog open={isRetailerDialogOpen} onOpenChange={setIsRetailerDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRetailer && retailers?.find(r => r.code === editingRetailer.code) 
                  ? 'Edit Retailer/Franchise' 
                  : 'Add New Retailer/Franchise'
                }
              </DialogTitle>
            </DialogHeader>
            {editingRetailer && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="retailer-code">Retailer Code*</Label>
                  <Input
                    id="retailer-code"
                    value={editingRetailer.code}
                    onChange={(e) => setEditingRetailer({...editingRetailer, code: e.target.value.toUpperCase()})}
                    placeholder="e.g., HN, CRY, BBY"
                    disabled={!!retailers?.find(r => r.code === editingRetailer.code)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="retailer-name">Short Name*</Label>
                  <Input
                    id="retailer-name"
                    value={editingRetailer.name}
                    onChange={(e) => setEditingRetailer({...editingRetailer, name: e.target.value})}
                    placeholder="e.g., Harvey Norman, Currys"
                  />
                </div>
                
                <div>
                  <Label htmlFor="retailer-fullname">Full Name*</Label>
                  <Input
                    id="retailer-fullname"
                    value={editingRetailer.fullName}
                    onChange={(e) => setEditingRetailer({...editingRetailer, fullName: e.target.value})}
                    placeholder="e.g., Harvey Norman Ireland, Currys PC World"
                  />
                </div>
                
                <div>
                  <Label htmlFor="retailer-color">Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="retailer-color"
                      type="color"
                      value={editingRetailer.color}
                      onChange={(e) => setEditingRetailer({...editingRetailer, color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editingRetailer.color}
                      onChange={(e) => setEditingRetailer({...editingRetailer, color: e.target.value})}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-4">
                  <Button
                    onClick={handleSaveRetailer}
                    disabled={createRetailerMutation.isPending || updateRetailerMutation.isPending || !editingRetailer.code || !editingRetailer.name || !editingRetailer.fullName}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {createRetailerMutation.isPending || updateRetailerMutation.isPending ? 'Saving...' : 'Save Retailer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRetailerDialogOpen(false);
                      setEditingRetailer(null);
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

        {/* Store Location Add/Edit Dialog */}
        <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStore?.isNew ? 'Add Store Location' : 'Edit Store Location'}
              </DialogTitle>
            </DialogHeader>
            {editingStore && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="store-retailer">Retailer</Label>
                  <Select value={editingStore.retailerCode} onValueChange={(value) => 
                    setEditingStore({...editingStore, retailerCode: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {retailers?.map(retailer => (
                        <SelectItem key={retailer.code} value={retailer.code}>
                          {retailer.fullName} ({retailer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="store-code">Store Code*</Label>
                  <Input
                    id="store-code"
                    value={editingStore.storeCode}
                    onChange={(e) => setEditingStore({...editingStore, storeCode: e.target.value.toUpperCase()})}
                    placeholder="e.g., DUB01, COR02"
                  />
                </div>
                
                <div>
                  <Label htmlFor="store-name">Store Name*</Label>
                  <Input
                    id="store-name"
                    value={editingStore.storeName}
                    onChange={(e) => setEditingStore({...editingStore, storeName: e.target.value})}
                    placeholder="e.g., Dublin Tallaght, Cork City Centre"
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-4">
                  <Button
                    onClick={handleSaveStore}
                    disabled={updateStoresMutation.isPending || !editingStore.storeCode || !editingStore.storeName}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {updateStoresMutation.isPending ? 'Saving...' : 'Save Location'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStoreDialogOpen(false);
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

        {/* Store Credentials Add/Edit Dialog */}
        <Dialog open={isCredentialDialogOpen} onOpenChange={setIsCredentialDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCredential?.isNew ? 'Add Store Credentials' : 'Edit Store Credentials'}
              </DialogTitle>
            </DialogHeader>
            {editingCredential && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="credential-email">Store Email*</Label>
                  <Input
                    id="credential-email"
                    type="email"
                    value={editingCredential.email}
                    onChange={(e) => setEditingCredential({...editingCredential, email: e.target.value})}
                    placeholder="e.g., carrickmines@HarveyNorman.com"
                  />
                </div>

                <div>
                  <Label htmlFor="credential-password">
                    Password{editingCredential.isNew ? '*' : ' (leave blank to keep current)'}
                  </Label>
                  <Input
                    id="credential-password"
                    type="password"
                    value={editingCredential.password}
                    onChange={(e) => setEditingCredential({...editingCredential, password: e.target.value})}
                    placeholder="Store code or custom password"
                  />
                </div>

                <div>
                  <Label htmlFor="credential-retailer">Retailer*</Label>
                  <Select 
                    value={editingCredential.retailerCode} 
                    onValueChange={(value) => setEditingCredential({...editingCredential, retailerCode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {retailers?.map(retailer => (
                        <SelectItem key={retailer.code} value={retailer.code}>
                          {retailer.fullName} ({retailer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="credential-store">Store Location (Optional)</Label>
                  <Select 
                    value={editingCredential.storeCode || ''} 
                    onValueChange={(value) => setEditingCredential({...editingCredential, storeCode: value || undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All stores (leave blank for all)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All stores</SelectItem>
                      {editingCredential.retailerCode && 
                        retailers?.find(r => r.code === editingCredential.retailerCode)?.storeLocations &&
                        Object.entries(retailers.find(r => r.code === editingCredential.retailerCode)!.storeLocations).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name} ({code})
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    onClick={handleSaveCredential}
                    disabled={createStoreUserMutation.isPending || updateStoreUserMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {createStoreUserMutation.isPending || updateStoreUserMutation.isPending ? 'Saving...' : 'Save Credentials'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCredentialDialogOpen(false);
                      setEditingCredential(null);
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