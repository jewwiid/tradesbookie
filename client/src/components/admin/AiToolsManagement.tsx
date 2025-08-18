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
  Archive,
  BarChart4,
  TrendingUp,
  Users,
  Clock,
  Target,
  FileDown,
  Smartphone,
  Monitor,
  Tablet
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

interface AnalyticsSummary {
  totalInteractions: number;
  uniqueSessions: number;
  storeLocations: number;
  creditUsageRate: number;
  avgProcessingTime: number;
  topPerformingTool: string;
  lastInteraction: string;
}

interface InteractionAnalytics {
  id: number;
  sessionId: string;
  aiTool: string;
  interactionType: string;
  userPrompt: string;
  storeLocation?: string;
  processingTimeMs: number;
  creditUsed: boolean;
  deviceType: string;
  productQuery?: string;
  category?: string;
  createdAt: string;
}

interface StoreAnalytics {
  storeLocation: string;
  totalInteractions: number;
  uniqueSessions: number;
  avgProcessingTime: number;
  topAiTool: string;
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

// QRCodeList component for displaying existing QR codes
const QRCodeList = ({ toolId }: { toolId: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: qrCodes = [], isLoading } = useQuery({
    queryKey: ['/api/admin/ai-tools', toolId, 'qr-codes'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/ai-tools/${toolId}/qr-codes`);
      if (!response.ok) throw new Error('Failed to fetch QR codes');
      return response.json();
    },
  });

  const deleteQrMutation = useMutation({
    mutationFn: async (qrCodeId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/ai-tools/qr-codes/${qrCodeId}`);
      if (!response.ok) throw new Error('Failed to delete QR code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools', toolId, 'qr-codes'] });
      toast({ title: "Success", description: "QR code deleted successfully" });
    }
  });

  const toggleQrStatusMutation = useMutation({
    mutationFn: async ({ qrCodeId, isActive }: { qrCodeId: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/ai-tools/qr-codes/${qrCodeId}`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to toggle QR code status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-tools', toolId, 'qr-codes'] });
      toast({ title: "Success", description: "QR code status updated" });
    }
  });

  const handleDownloadQRCode = (qrCodeUrl: string, storeLocation?: string) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    const filename = storeLocation 
      ? `qr-${storeLocation.replace(/\s+/g, '-').toLowerCase()}.png`
      : `qr-code.png`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "QR code downloaded successfully"
    });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading QR codes...</div>;
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <QrCode className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No QR codes generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {qrCodes.map((qr: any) => (
        <div key={qr.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <img 
              src={qr.qrCodeUrl} 
              alt="QR Code" 
              className="w-12 h-12 border rounded"
            />
            <div>
              <p className="font-medium">{qr.storeLocation || 'General'}</p>
              <p className="text-sm text-muted-foreground">
                Scans: {qr.scanCount} | Created: {format(new Date(qr.createdAt), 'MMM dd')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={qr.isActive}
              onCheckedChange={(isActive) =>
                toggleQrStatusMutation.mutate({ qrCodeId: qr.id, isActive })
              }
              disabled={toggleQrStatusMutation.isPending}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadQRCode(qr.qrCodeUrl, qr.storeLocation)}
              title="Download QR Code"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteQrMutation.mutate(qr.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete QR Code"
              disabled={deleteQrMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

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
  const [analyticsTabActive, setAnalyticsTabActive] = useState("overview");

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

  // Fetch analytics summary
  const { data: analyticsSummary, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/ai-analytics/summary'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ai-analytics/summary');
      if (!response.ok) throw new Error('Failed to fetch analytics summary');
      return response.json();
    }
  });

  // Fetch detailed interactions
  const { data: interactions = [], isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/admin/ai-analytics/interactions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ai-analytics/interactions');
      if (!response.ok) throw new Error('Failed to fetch interactions');
      return response.json();
    }
  });

  // Fetch store analytics
  const { data: storeAnalytics = [], isLoading: storeAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/ai-analytics/stores'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ai-analytics/stores');
      if (!response.ok) throw new Error('Failed to fetch store analytics');
      return response.json();
    }
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

  // CSV Export functionality
  const handleExportCSV = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/ai-analytics/export');
      if (!response.ok) throw new Error('Failed to export data');
      
      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics data exported successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive"
      });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

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
    setQrCodeData(null); // Clear any cached QR data
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
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">Manage Tools</TabsTrigger>
            <TabsTrigger value="qr-management">QR Code Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="qr-management" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage QR codes for all AI tools
                </p>
              </div>

              {tools.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No AI Tools Available</h3>
                  <p className="text-muted-foreground">
                    Create AI tools first to generate QR codes for them.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tools.map((tool: AiTool) => {
                    const IconComponent = getIcon(tool.iconName);
                    return (
                      <Card key={tool.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{tool.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{tool.key}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateQr(tool)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Generate QR
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageQrCodes(tool)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Manage QR Codes
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <QRCodeList toolId={tool.id} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Analytics Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart4 className="h-5 w-5" />
                      AI Tools Analytics & Reports
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Track AI tool usage, store performance, and customer interactions
                    </p>
                  </div>
                  <Button onClick={handleExportCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Summary Cards */}
                {analyticsSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Interactions</p>
                            <p className="text-2xl font-bold">{analyticsSummary.totalInteractions}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Store Coverage</p>
                            <p className="text-2xl font-bold">{analyticsSummary.storeLocations}</p>
                          </div>
                          <MapPin className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Credit Usage</p>
                            <p className="text-2xl font-bold">{analyticsSummary.creditUsageRate}%</p>
                          </div>
                          <Target className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                            <p className="text-2xl font-bold">{analyticsSummary.avgProcessingTime}ms</p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Analytics Tabs */}
                <Tabs value={analyticsTabActive} onValueChange={setAnalyticsTabActive} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="interactions">Recent Interactions</TabsTrigger>
                    <TabsTrigger value="stores">Store Performance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Performing AI Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {interactions.length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(
                              interactions.reduce((acc: any, interaction: InteractionAnalytics) => {
                                acc[interaction.aiTool] = (acc[interaction.aiTool] || 0) + 1;
                                return acc;
                              }, {})
                            )
                              .sort(([,a], [,b]) => (b as number) - (a as number))
                              .slice(0, 5)
                              .map(([tool, count]) => (
                                <div key={tool} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <span className="font-medium capitalize">{tool.replace('-', ' ')}</span>
                                  <Badge variant="outline">{count} interactions</Badge>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">No interaction data available</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="interactions" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recent AI Interactions</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Latest customer interactions with AI tools across all store locations
                        </p>
                      </CardHeader>
                      <CardContent>
                        {interactionsLoading ? (
                          <div className="text-center py-4">Loading interactions...</div>
                        ) : interactions.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {interactions.slice(0, 20).map((interaction: InteractionAnalytics) => (
                              <div key={interaction.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">
                                      {interaction.aiTool.replace('-', ' ')}
                                    </Badge>
                                    {interaction.storeLocation && (
                                      <Badge variant="secondary" className="text-xs">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {interaction.storeLocation}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {getDeviceIcon(interaction.deviceType)}
                                    <span>{format(new Date(interaction.createdAt), 'MMM dd, HH:mm')}</span>
                                  </div>
                                </div>
                                <p className="text-sm">{interaction.userPrompt}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Processing: {interaction.processingTimeMs}ms</span>
                                  <span className={interaction.creditUsed ? 'text-orange-600' : 'text-green-600'}>
                                    {interaction.creditUsed ? 'Credit Used' : 'Free Usage'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">No recent interactions</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="stores" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Store Performance Analytics</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          AI tool usage and conversion rates by store location
                        </p>
                      </CardHeader>
                      <CardContent>
                        {storeAnalyticsLoading ? (
                          <div className="text-center py-4">Loading store analytics...</div>
                        ) : storeAnalytics.length > 0 ? (
                          <div className="space-y-3">
                            {storeAnalytics.map((store: StoreAnalytics) => (
                              <div key={store.storeLocation} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">{store.storeLocation}</h4>
                                  <Badge className={(store.avgProcessingTime || 0) < 2000 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                    {Math.round(store.avgProcessingTime || 0)}ms avg
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Interactions</p>
                                    <p className="font-medium">{store.totalInteractions}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Unique Users</p>
                                    <p className="font-medium">{store.uniqueSessions}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Avg Response</p>
                                    <p className="font-medium">{Math.round(store.avgProcessingTime || 0)}ms</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Top Tool</p>
                                    <p className="font-medium capitalize">{store.topAiTool?.replace('-', ' ') || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">No store analytics available</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* QR Code Generation Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-lg">
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
                    <p className="text-xs text-muted-foreground break-all">
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
                  <QRCodeList toolId={selectedToolForManagement.id} />
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