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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Wrench
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tool)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tool.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </Card>
  );
}