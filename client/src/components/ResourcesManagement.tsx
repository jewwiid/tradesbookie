import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, ExternalLink, Star, Shield, Gift, Info, FileText, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Resource {
  id: number;
  title: string;
  description: string;
  content: string;
  type: string;
  category: string;
  brand?: string;
  companyName?: string;
  externalUrl?: string;
  linkText: string;
  imageUrl?: string;
  iconType: string;
  featured: boolean;
  priority: number;
  tags: string[];
  isActive: boolean;
  publishedAt: string;
  expiryDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const iconTypeOptions = [
  { value: "link", label: "Link", icon: ExternalLink },
  { value: "warranty", label: "Warranty", icon: Shield },
  { value: "cashback", label: "Cashback", icon: Gift },
  { value: "info", label: "Information", icon: Info },
  { value: "tutorial", label: "Tutorial", icon: FileText },
  { value: "guide", label: "Guide", icon: BookOpen },
];

// Resource format/structure
const typeOptions = [
  { value: "guide", label: "Step-by-Step Guide" },
  { value: "faq", label: "FAQ" },
  { value: "video", label: "Video Tutorial" },
  { value: "checklist", label: "Checklist" },
  { value: "manual", label: "Manual/Documentation" },
  { value: "promotion", label: "Promotional Content" },
];

// Subject matter/topic area
const categoryOptions = [
  { value: "setup-installation", label: "Setup & Installation" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "warranty-support", label: "Warranty & Support" },
  { value: "maintenance", label: "Maintenance & Care" },
  { value: "promotions-offers", label: "Promotions & Offers" },
  { value: "product-info", label: "Product Information" },
];

// Manufacturer/retailer identification
const brandOptions = [
  { value: "", label: "Generic/No Brand" },
  { value: "Sony", label: "Sony" },
  { value: "Samsung", label: "Samsung" },
  { value: "LG", label: "LG" },
  { value: "Philips", label: "Philips" },
  { value: "TCL", label: "TCL" },
  { value: "Hisense", label: "Hisense" },
  { value: "Harvey Norman", label: "Harvey Norman" },
  { value: "Currys", label: "Currys" },
  { value: "DID Electrical", label: "DID Electrical" },
];

export default function ResourcesManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteResourceId, setDeleteResourceId] = useState<number | null>(null);
  const [aiUrl, setAiUrl] = useState("");
  const [aiMarkdown, setAiMarkdown] = useState("");
  const [aiInputMethod, setAiInputMethod] = useState<'url' | 'markdown'>('url');
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    type: "guide",
    category: "setup-installation",
    brand: "",
    companyName: "",
    externalUrl: "",
    linkText: "Learn More",
    imageUrl: "",
    iconType: "link",
    featured: false,
    priority: 0,
    tags: [] as string[],
    isActive: true,
    expiryDate: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all resources
  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/admin/resources"],
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/resources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({ title: "Resource created successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating resource", 
        description: error.message || "Failed to create resource",
        variant: "destructive" 
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/admin/resources/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({ title: "Resource updated successfully" });
      setDialogOpen(false);
      setEditingResource(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating resource", 
        description: error.message || "Failed to update resource",
        variant: "destructive" 
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({ title: "Resource deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting resource", 
        description: error.message || "Failed to delete resource",
        variant: "destructive" 
      });
    },
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) => 
      apiRequest("PATCH", `/api/admin/resources/${id}/featured`, { featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({ title: "Featured status updated" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating featured status", 
        description: error.message || "Failed to update featured status",
        variant: "destructive" 
      });
    },
  });

  // AI Content Generation mutation
  const generateAIContentMutation = useMutation({
    mutationFn: async (input: string) => {
      const response = await apiRequest("POST", "/api/admin/resources/generate-content", 
        aiInputMethod === 'url' ? { url: input } : { markdown: input }
      );
      return await response.json();
    },
    onSuccess: (data: any) => {
      
      // Check if the response has the expected structure
      if (!data) {
        toast({ 
          title: "Error processing response", 
          description: "No response from AI service",
          variant: "destructive" 
        });
        return;
      }

      // Handle different response formats - the API might return data directly or wrapped
      let generatedContent = data.data || data;
      
      // Validate that the generated content has the required fields
      if (!generatedContent || typeof generatedContent !== 'object') {
        console.error("Invalid content format:", generatedContent);
        toast({ 
          title: "Error processing content", 
          description: "AI service returned invalid content format",
          variant: "destructive" 
        });
        return;
      }

      // Check if we have at least a title to proceed
      if (!generatedContent.title && !generatedContent.description && !generatedContent.content) {
        console.error("Missing essential content fields:", generatedContent);
        toast({ 
          title: "Incomplete content", 
          description: "AI service didn't generate sufficient content",
          variant: "destructive" 
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: generatedContent.title || prev.title,
        description: generatedContent.description || prev.description,
        content: generatedContent.content || prev.content,
        category: generatedContent.category || prev.category,
        type: generatedContent.type || prev.type,
        externalUrl: aiInputMethod === 'url' ? aiUrl : '', // Set the URL only if using URL method
      }));
      
      // Clear the appropriate input
      if (aiInputMethod === 'url') {
        setAiUrl("");
      } else {
        setAiMarkdown("");
      }
      
      toast({ 
        title: "Content generated successfully", 
        description: "AI has filled in the title, description, and content fields"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error generating content", 
        description: error.message || "Failed to generate content from URL",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      type: "guide",
      category: "setup-installation",
      brand: "",
      companyName: "",
      externalUrl: "",
      linkText: "Learn More",
      imageUrl: "",
      iconType: "link",
      featured: false,
      priority: 0,
      tags: [],
      isActive: true,
      expiryDate: "",
    });
    setAiUrl("");
    setAiMarkdown("");
    setAiInputMethod('url');
  };

  const handleGenerateAIContent = () => {
    if (aiInputMethod === 'url') {
      if (!aiUrl.trim()) {
        toast({ 
          title: "URL required", 
          description: "Please enter a URL to generate content from",
          variant: "destructive" 
        });
        return;
      }

      // Basic URL validation
      try {
        new URL(aiUrl);
      } catch {
        toast({ 
          title: "Invalid URL", 
          description: "Please enter a valid URL (e.g., https://example.com)",
          variant: "destructive" 
        });
        return;
      }

      generateAIContentMutation.mutate(aiUrl);
    } else {
      if (!aiMarkdown.trim()) {
        toast({ 
          title: "Markdown content required", 
          description: "Please paste markdown content to generate from",
          variant: "destructive" 
        });
        return;
      }

      if (aiMarkdown.trim().length < 50) {
        toast({ 
          title: "More content needed", 
          description: "Please provide more detailed markdown content for better results",
          variant: "destructive" 
        });
        return;
      }

      // For markdown, we'll send a special request to the backend
      generateAIContentMutation.mutate(aiMarkdown);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      content: resource.content,
      type: resource.type,
      category: resource.category,
      brand: resource.brand || "",
      companyName: resource.companyName || "",
      externalUrl: resource.externalUrl || "",
      linkText: resource.linkText,
      imageUrl: resource.imageUrl || "",
      iconType: resource.iconType,
      featured: resource.featured,
      priority: resource.priority,
      tags: resource.tags || [],
      isActive: resource.isActive,
      expiryDate: resource.expiryDate ? new Date(resource.expiryDate).toISOString().split('T')[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data - backend now handles date conversion properly
    const submissionData = {
      ...formData,
      // Ensure empty strings are converted to null for optional fields
      brand: formData.brand || null,
      companyName: formData.companyName || null,
      externalUrl: formData.externalUrl || null,
      imageUrl: formData.imageUrl || null
      // expiryDate is sent as-is (string), backend will convert to Date or null
    };
    
    if (editingResource) {
      updateResourceMutation.mutate({ id: editingResource.id, data: submissionData });
    } else {
      createResourceMutation.mutate(submissionData);
    }
  };

  const getIconForType = (iconType: string) => {
    const iconOption = iconTypeOptions.find(option => option.value === iconType);
    const IconComponent = iconOption?.icon || ExternalLink;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold">Customer Resources</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage helpful resources for customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingResource(null); resetForm(); }} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Resource</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? "Edit Resource" : "Create New Resource"}
              </DialogTitle>
              <DialogDescription>
                {editingResource ? "Update the resource information" : "Add a new helpful resource for customers"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Content Generation Section */}
              {!editingResource && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">AI Content Generation</h4>
                    </div>
                    {/* Method Toggle */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${aiInputMethod === 'url' ? 'text-blue-900 font-medium' : 'text-blue-600'}`}>URL</span>
                      <Switch
                        checked={aiInputMethod === 'markdown'}
                        onCheckedChange={(checked) => setAiInputMethod(checked ? 'markdown' : 'url')}
                      />
                      <span className={`text-xs ${aiInputMethod === 'markdown' ? 'text-blue-900 font-medium' : 'text-blue-600'}`}>Markdown</span>
                    </div>
                  </div>
                  
                  {aiInputMethod === 'url' ? (
                    <>
                      <p className="text-sm text-blue-700 mb-3">
                        Paste a URL below and let AI automatically fill in the title, description, and content fields.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/article-or-guide"
                          value={aiUrl}
                          onChange={(e) => setAiUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleGenerateAIContent}
                          disabled={generateAIContentMutation.isPending}
                          className="shrink-0"
                        >
                          {generateAIContentMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-blue-700 mb-3">
                        Paste markdown content below and let AI transform it into structured resource fields.
                      </p>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Paste your markdown content here...&#10;&#10;Example:&#10;# TV Wall Mounting Guide&#10;&#10;## What You'll Need&#10;- Wall mount bracket&#10;- Stud finder&#10;- Level&#10;&#10;## Steps&#10;1. Find the wall studs..."
                          value={aiMarkdown}
                          onChange={(e) => setAiMarkdown(e.target.value)}
                          className="min-h-[120px] text-sm"
                        />
                        <Button
                          type="button"
                          onClick={handleGenerateAIContent}
                          disabled={generateAIContentMutation.isPending}
                          className="w-full"
                        >
                          {generateAIContentMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating from Markdown...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate from Markdown
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {generateAIContentMutation.isPending && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {aiInputMethod === 'url' ? 'Analyzing webpage and generating fields...' : 'Processing markdown and generating fields...'}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Resource Format</Label>
                  <p className="text-xs text-gray-500">What kind of content format is this?</p>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Topic Area</Label>
                  <p className="text-xs text-gray-500">What subject or area does this cover?</p>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Related Brand/Retailer</Label>
                  <p className="text-xs text-gray-500">Which manufacturer or retailer does this relate to? (Optional)</p>
                  <Select value={formData.brand} onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="externalUrl">External URL</Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    value={formData.externalUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkText">Link Text</Label>
                  <Input
                    id="linkText"
                    value={formData.linkText}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iconType">Icon Type</Label>
                  <Select value={formData.iconType} onValueChange={(value) => setFormData(prev => ({ ...prev, iconType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Set an expiry date for promotional content to be automatically removed when it expires.
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                >
                  {editingResource ? "Update" : "Create"} Resource
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {(resources || []).map((resource: Resource) => (
          <Card key={resource.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="mt-1 shrink-0">
                    {getIconForType(resource.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <CardTitle className="text-base sm:text-lg truncate">{resource.title}</CardTitle>
                      <div className="flex items-center gap-1 flex-wrap">
                        {resource.featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {!resource.isActive && (
                          <Badge variant="outline" className="text-gray-500 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                      <Badge variant="outline" className="text-xs">{resource.category}</Badge>
                      {resource.brand && (
                        <Badge variant="outline" className="text-xs">{resource.brand}</Badge>
                      )}
                      <span className="text-xs text-gray-500 whitespace-nowrap">Priority: {resource.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeaturedMutation.mutate({ 
                      id: resource.id, 
                      featured: !resource.featured 
                    })}
                  >
                    <Star className={`h-4 w-4 ${resource.featured ? 'text-yellow-500 fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteResourceMutation.mutate(resource.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {resource.imageUrl && (
                <div className="mb-3">
                  <img 
                    src={resource.imageUrl} 
                    alt={resource.title}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <p className="text-sm text-gray-700 mb-3">{resource.content}</p>
              {resource.externalUrl && (
                <div className="flex items-center justify-between">
                  <a
                    href={resource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {resource.linkText}
                  </a>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(resource.createdAt).toLocaleDateString()}
                    {resource.lastModifiedBy && (
                      <span className="ml-2">by {resource.lastModifiedBy}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!resources || (resources as Resource[]).length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first customer resource.</p>
            <Button onClick={() => { setEditingResource(null); resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Resource
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}