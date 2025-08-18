import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Tv,
  Shield,
  HelpCircle,
  Search,
  Mail,
  BarChart3,
  Settings,
  Bot,
  Brain,
  Wrench,
  QrCode,
  Download,
  MapPin,
  Eye,
  MoreHorizontal,
  Calendar,
  Activity,
  Archive
} from "lucide-react";

interface AiTool {
  id: number;
  key: string;
  name: string;
  description: string;
  creditCost: number;
  isActive: boolean;
  iconName: string;
  category: string;
  endpoint?: string;
  createdAt: string;
  updatedAt: string;
}

interface AiToolQrCode {
  id: number;
  toolId: number;
  qrCodeId: string;
  qrCodeUrl: string;
  targetUrl: string;
  storeLocation?: string;
  scanCount: number;
  lastScannedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form schema for creating/updating AI tools
const aiToolSchema = z.object({
  key: z.string().min(1, "Key is required").regex(/^[a-z-]+$/, "Key must contain only lowercase letters and hyphens"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  creditCost: z.number().min(1, "Credit cost must be at least 1"),
  category: z.string().min(1, "Category is required"),
  iconName: z.string().min(1, "Icon name is required"),
  endpoint: z.string().optional(),
  isActive: z.boolean().default(true)
});

type AiToolFormData = z.infer<typeof aiToolSchema>;

const iconOptions = [
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Tv", label: "TV", icon: Tv },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "HelpCircle", label: "Help Circle", icon: HelpCircle },
  { value: "Search", label: "Search", icon: Search },
  { value: "Mail", label: "Mail", icon: Mail },
  { value: "BarChart3", label: "Bar Chart", icon: BarChart3 },
  { value: "Settings", label: "Settings", icon: Settings },
  { value: "Bot", label: "Bot", icon: Bot },
  { value: "Brain", label: "Brain", icon: Brain },
  { value: "Wrench", label: "Wrench", icon: Wrench }
];

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "tv", label: "TV & Installation" },
  { value: "product", label: "Product Analysis" },
  { value: "communication", label: "Communication" },
  { value: "analytics", label: "Analytics" },
  { value: "support", label: "Support" }
];

export default function AiToolsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AiTool | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedToolForQr, setSelectedToolForQr] = useState<AiTool | null>(null);
  const [storeLocation, setStoreLocation] = useState("");
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [qrManagementDialogOpen, setQrManagementDialogOpen] = useState(false);
  const [selectedToolForManagement, setSelectedToolForManagement] = useState<AiTool | null>(null);

  const form = useForm<AiToolFormData>({
    resolver: zodResolver(aiToolSchema),
    defaultValues: {
      key: "",
      name: "",
      description: "",
      creditCost: 1,
      category: "general",
      iconName: "Zap",
      endpoint: "",
      isActive: true
    }
  });

  // Fetch AI tools
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['/api/admin/ai-tools'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ai-tools');
      if (!response.ok) throw new Error('Failed to fetch AI tools');
      return response.json();
    }
  });

  // Fetch QR codes for a specific tool
  const { data: qrCodes = [], isLoading: qrCodesLoading } = useQuery({
    queryKey: ['/api/admin/ai-tools', selectedToolForManagement?.id, 'qr-codes'],
    queryFn: async () => {
      if (!selectedToolForManagement) return [];
      const response = await apiRequest('GET', `/api/admin/ai-tools/${selectedToolForManagement.id}/qr-codes`);
      if (!response.ok) throw new Error('Failed to fetch QR codes');
      return response.json();
    },
    enabled: !!selectedToolForManagement
  });

  // Create AI tool mutation
  const createToolMutation = useMutation({
    mutationFn: async (data: AiToolFormData) => {
      const response = await apiRequest('POST', '/api/admin/ai-tools', data);
      if (!response.ok) throw new Error('Failed to create AI tool');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "AI tool created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create AI tool",
        variant: "destructive"
      });
    }
  });

  // Update AI tool mutation
  const updateToolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AiToolFormData> }) => {
      const response = await apiRequest('PUT', `/api/admin/ai-tools/${id}`, data);
      if (!response.ok) throw new Error('Failed to update AI tool');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools'] });
      setEditingTool(null);
      form.reset();
      toast({
        title: "Success",
        description: "AI tool updated successfully"
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/ai-tools/${id}/status`, { isActive });
      if (!response.ok) throw new Error('Failed to update AI tool status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools'] });
      toast({
        title: "Success",
        description: "AI tool status updated"
      });
    }
  });

  // Delete AI tool mutation
  const deleteToolMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/ai-tools/${id}`);
      if (!response.ok) throw new Error('Failed to delete AI tool');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools'] });
      toast({
        title: "Success",
        description: "AI tool deleted successfully"
      });
    }
  });

  // Generate QR code mutation
  const generateQrMutation = useMutation({
    mutationFn: async ({ id, storeLocation }: { id: number; storeLocation?: string }) => {
      const response = await apiRequest('POST', `/api/admin/ai-tools/${id}/qr-code`, { storeLocation });
      if (!response.ok) throw new Error('Failed to generate QR code');
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeData(data);
      // Invalidate QR codes list if we're managing QR codes
      if (selectedToolForManagement) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools', selectedToolForManagement.id, 'qr-codes'] });
      }
      toast({
        title: "Success",
        description: "QR code generated and saved successfully"
      });
    }
  });

  // Delete QR code mutation
  const deleteQrMutation = useMutation({
    mutationFn: async (qrCodeId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/ai-tools/qr-codes/${qrCodeId}`);
      if (!response.ok) throw new Error('Failed to delete QR code');
      return response.json();
    },
    onSuccess: () => {
      if (selectedToolForManagement) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools', selectedToolForManagement.id, 'qr-codes'] });
      }
      toast({
        title: "Success",
        description: "QR code deleted successfully"
      });
    }
  });

  // Toggle QR code active status mutation
  const toggleQrStatusMutation = useMutation({
    mutationFn: async ({ qrCodeId, isActive }: { qrCodeId: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/ai-tools/qr-codes/${qrCodeId}`, { isActive });
      if (!response.ok) throw new Error('Failed to update QR code status');
      return response.json();
    },
    onSuccess: () => {
      if (selectedToolForManagement) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools', selectedToolForManagement.id, 'qr-codes'] });
      }
      toast({
        title: "Success",
        description: "QR code status updated"
      });
    }
  });

  const handleSubmit = (data: AiToolFormData) => {
    if (editingTool) {
      updateToolMutation.mutate({ id: editingTool.id, data });
    } else {
      createToolMutation.mutate(data);
    }
  };

  const handleEdit = (tool: AiTool) => {
    setEditingTool(tool);
    form.reset({
      key: tool.key,
      name: tool.name,
      description: tool.description,
      creditCost: tool.creditCost,
      category: tool.category,
      iconName: tool.iconName,
      endpoint: tool.endpoint || "",
      isActive: tool.isActive
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this AI tool?')) {
      deleteToolMutation.mutate(id);
    }
  };

  const handleGenerateQr = (tool: AiTool) => {
    setSelectedToolForQr(tool);
    setStoreLocation("");
    setQrCodeData(null);
    setQrDialogOpen(true);
  };

  const handleQrGenerate = () => {
    if (selectedToolForQr) {
      generateQrMutation.mutate({ 
        id: selectedToolForQr.id, 
        storeLocation: storeLocation || undefined 
      });
    }
  };

  const handleDownloadFlyer = async () => {
    if (selectedToolForQr) {
      try {
        const params = new URLSearchParams();
        if (storeLocation) params.set('storeLocation', storeLocation);
        
        const response = await apiRequest('GET', `/api/admin/ai-tools/${selectedToolForQr.id}/flyer?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to download flyer');
        
        const svgContent = await response.text();
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedToolForQr.key}-flyer.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Flyer downloaded successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download flyer",
          variant: "destructive"
        });
      }
    }
  };

  const handleManageQrCodes = (tool: AiTool) => {
    setSelectedToolForManagement(tool);
    setQrManagementDialogOpen(true);
  };

  const handleDeleteQrCode = (qrCodeId: number) => {
    if (confirm('Are you sure you want to delete this QR code?')) {
      deleteQrMutation.mutate(qrCodeId);
    }
  };

  const handleToggleQrStatus = (qrCodeId: number, isActive: boolean) => {
    toggleQrStatusMutation.mutate({ qrCodeId, isActive });
  };

  const handleDownloadQRCode = (qrCodeUrl: string, toolKey: string, storeLocation?: string) => {
    // Create a link to download the QR code as PNG
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    const filename = storeLocation 
      ? `${toolKey}-qr-${storeLocation.replace(/\s+/g, '-').toLowerCase()}.png`
      : `${toolKey}-qr.png`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "QR code downloaded successfully"
    });
  };

  const getIcon = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Zap;
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-100 text-gray-800",
      tv: "bg-blue-100 text-blue-800",
      product: "bg-green-100 text-green-800",
      communication: "bg-purple-100 text-purple-800",
      analytics: "bg-orange-100 text-orange-800",
      support: "bg-red-100 text-red-800"
    };
    return colors[category] || colors.general;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Tools Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">Loading AI tools...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Tools Management
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Manage AI-powered features and their pricing. Each tool consumes credits when used by customers.
          </p>
        </div>
        <Dialog 
          open={isCreateDialogOpen || !!editingTool} 
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingTool(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add AI Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTool ? 'Edit AI Tool' : 'Create New AI Tool'}
              </DialogTitle>
              <DialogDescription>
                {editingTool 
                  ? 'Update the AI tool configuration and pricing.'
                  : 'Add a new AI-powered feature to the platform.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Key</FormLabel>
                        <FormControl>
                          <Input placeholder="tv-preview" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="TV Preview Generator" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Generate AI-powered TV installation preview images" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="creditCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Cost</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iconName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iconOptions.map(icon => {
                              const IconComponent = icon.icon;
                              return (
                                <SelectItem key={icon.value} value={icon.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    {icon.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="/api/tv-preview" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this AI tool for customers to use
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTool(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createToolMutation.isPending || updateToolMutation.isPending}
                  >
                    {editingTool ? 'Update Tool' : 'Create Tool'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool: AiTool) => {
                const IconComponent = getIcon(tool.iconName);
                return (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-sm text-muted-foreground">{tool.key}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadgeColor(tool.category)}>
                        {tool.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={tool.description}>
                        {tool.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tool.creditCost} credit{tool.creditCost !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tool.isActive}
                          onCheckedChange={(isActive) =>
                            toggleStatusMutation.mutate({ id: tool.id, isActive })
                          }
                          disabled={toggleStatusMutation.isPending}
                        />
                        {tool.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateQr(tool)}
                          title="Generate QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageQrCodes(tool)}
                          title="Manage QR Codes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tool)}
                          title="Edit Tool"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tool.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Tool"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No AI tools configured yet. Create your first AI tool to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {tools.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Total AI tools: {tools.length} | 
            Active: {tools.filter((t: AiTool) => t.isActive).length} | 
            Disabled: {tools.filter((t: AiTool) => !t.isActive).length}
          </div>
        )}
      </CardContent>

      {/* QR Code Generation Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
            <DialogDescription>
              Generate a QR code for customers to scan and access the AI tool in-store.
            </DialogDescription>
          </DialogHeader>
          {selectedToolForQr && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                  {React.createElement(getIcon(selectedToolForQr.iconName), { className: "h-4 w-4" })}
                </div>
                <div>
                  <div className="font-medium">{selectedToolForQr.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedToolForQr.description}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="storeLocation" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Store Location (Optional)
                </Label>
                <Input
                  id="storeLocation"
                  placeholder="e.g., Harvey Norman Carrickmines"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  className="mt-1"
                />
              </div>

              {!qrCodeData ? (
                <Button 
                  onClick={handleQrGenerate}
                  disabled={generateQrMutation.isPending}
                  className="w-full"
                >
                  {generateQrMutation.isPending ? "Generating..." : "Generate QR Code"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <img 
                      src={qrCodeData.qrCodeUrl} 
                      alt="QR Code" 
                      className="mx-auto border rounded-lg p-2 bg-white"
                      style={{ width: '200px', height: '200px' }}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Scan to access: {qrCodeData.tool.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      URL: {qrCodeData.targetUrl}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => selectedToolForQr && handleDownloadQRCode(qrCodeData.qrCodeUrl, selectedToolForQr.key, storeLocation || undefined)}
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Download QR
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadFlyer}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Flyer
                    </Button>
                    <Button 
                      onClick={handleQrGenerate}
                      variant="outline"
                      className="flex-1"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Management Dialog */}
      <Dialog open={qrManagementDialogOpen} onOpenChange={setQrManagementDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage QR Codes</DialogTitle>
            <DialogDescription>
              View and manage all saved QR codes for this AI tool.
            </DialogDescription>
          </DialogHeader>
          
          {selectedToolForManagement && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                  {React.createElement(getIcon(selectedToolForManagement.iconName), { className: "h-4 w-4" })}
                </div>
                <div>
                  <div className="font-medium">{selectedToolForManagement.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedToolForManagement.description}</div>
                </div>
              </div>

              <Tabs defaultValue="saved-qr-codes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="saved-qr-codes">Saved QR Codes</TabsTrigger>
                  <TabsTrigger value="generate-new">Generate New</TabsTrigger>
                </TabsList>
                
                <TabsContent value="saved-qr-codes" className="space-y-4">
                  {qrCodesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading QR codes...</div>
                    </div>
                  ) : qrCodes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No saved QR codes yet.</p>
                      <p className="text-sm">Use the "Generate New" tab to create your first QR code.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {qrCodes.map((qrCode: AiToolQrCode) => (
                          <Card key={qrCode.id} className={`relative ${!qrCode.isActive ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant={qrCode.isActive ? "default" : "secondary"}>
                                    {qrCode.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  {qrCode.scanCount > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <Activity className="h-3 w-3 mr-1" />
                                      {qrCode.scanCount} scans
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteQrCode(qrCode.id)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="text-center mb-3">
                                <img 
                                  src={qrCode.qrCodeUrl} 
                                  alt="QR Code" 
                                  className="mx-auto border rounded p-1 bg-white"
                                  style={{ width: '120px', height: '120px' }}
                                />
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                {qrCode.storeLocation && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">{qrCode.storeLocation}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Created {format(new Date(qrCode.createdAt), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                
                                {qrCode.lastScannedAt && (
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Last scan {format(new Date(qrCode.lastScannedAt), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={qrCode.isActive}
                                    onCheckedChange={(isActive) => handleToggleQrStatus(qrCode.id, isActive)}
                                    disabled={toggleQrStatusMutation.isPending}
                                  />
                                  <span className="text-sm text-muted-foreground">Active</span>
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadQRCode(qrCode.qrCodeUrl, selectedToolForManagement.key, qrCode.storeLocation || undefined)}
                                    title="Download QR Code PNG"
                                  >
                                    <QrCode className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const params = new URLSearchParams();
                                        if (qrCode.storeLocation) params.set('storeLocation', qrCode.storeLocation);
                                        
                                        const response = await apiRequest('GET', `/api/admin/ai-tools/${selectedToolForManagement.id}/flyer?${params.toString()}`);
                                        if (!response.ok) throw new Error('Failed to download flyer');
                                        
                                        const svgContent = await response.text();
                                        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                                        const url = URL.createObjectURL(blob);
                                        
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${selectedToolForManagement.key}-flyer.svg`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);

                                        toast({
                                          title: "Success",
                                          description: "Flyer downloaded successfully"
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to download flyer",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    title="Download Printable Flyer SVG"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="generate-new" className="space-y-4">
                  <div>
                    <Label htmlFor="newStoreLocation" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Store Location (Optional)
                    </Label>
                    <Input
                      id="newStoreLocation"
                      placeholder="e.g., Harvey Norman Carrickmines"
                      value={storeLocation}
                      onChange={(e) => setStoreLocation(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (selectedToolForManagement) {
                        generateQrMutation.mutate({ 
                          id: selectedToolForManagement.id, 
                          storeLocation: storeLocation || undefined 
                        });
                      }
                    }}
                    disabled={generateQrMutation.isPending}
                    className="w-full"
                  >
                    {generateQrMutation.isPending ? "Generating..." : "Generate & Save New QR Code"}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}