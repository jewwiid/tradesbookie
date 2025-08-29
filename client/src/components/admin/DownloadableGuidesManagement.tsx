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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FileText,
  Eye,
  EyeOff
} from "lucide-react";

interface DownloadableGuide {
  id: number;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  category: string;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "compatibility", label: "Compatibility" },
  { value: "speed", label: "Speed" },
  { value: "remote-control", label: "Remote Control" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "setup", label: "Setup" }
];

const fileTypeOptions = [
  { value: "PDF", label: "PDF" },
  { value: "DOC", label: "DOC" },
  { value: "DOCX", label: "DOCX" },
  { value: "TXT", label: "TXT" }
];

export default function DownloadableGuidesManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<DownloadableGuide | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileType: "PDF",
    fileSize: "",
    fileUrl: "",
    category: "general",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch downloadable guides from both sources
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["/api/admin/downloadable-guides"]
  });

  // Fetch guides from general resources
  const { data: resourceGuides = [] } = useQuery({
    queryKey: ["/api/admin/resources"],
    select: (data: any[]) => data.filter((resource: any) => resource.type === 'guide'),
  });

  // Type the query responses
  const typedGuides = guides as DownloadableGuide[];
  const typedResourceGuides = resourceGuides as any[];

  // Create guide mutation
  const createGuideMutation = useMutation({
    mutationFn: async (guideData: any) => {
      await apiRequest("POST", "/api/admin/downloadable-guides", guideData);
    },
    onSuccess: () => {
      toast({
        title: "Guide Created",
        description: "Downloadable guide has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/downloadable-guides"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Guide",
        description: error.message || "Failed to create guide",
        variant: "destructive"
      });
    }
  });

  // Update guide mutation
  const updateGuideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/admin/downloadable-guides/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Guide Updated",
        description: "Downloadable guide has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/downloadable-guides"] });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Guide",
        description: error.message || "Failed to update guide",
        variant: "destructive"
      });
    }
  });

  // Delete guide mutation
  const deleteGuideMutation = useMutation({
    mutationFn: async (guideId: number) => {
      await apiRequest("DELETE", `/api/admin/downloadable-guides/${guideId}`);
    },
    onSuccess: () => {
      toast({
        title: "Guide Deleted",
        description: "Downloadable guide has been removed successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/downloadable-guides"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Guide",
        description: error.message || "Failed to delete guide",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      fileType: "PDF",
      fileSize: "",
      fileUrl: "",
      category: "general",
      isActive: true
    });
    setSelectedGuide(null);
  };

  const handleCreateGuide = (e: React.FormEvent) => {
    e.preventDefault();
    createGuideMutation.mutate(formData);
  };

  const handleUpdateGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuide) {
      updateGuideMutation.mutate({ id: selectedGuide.id, data: formData });
    }
  };

  const handleEditGuide = (guide: DownloadableGuide) => {
    setSelectedGuide(guide);
    setFormData({
      title: guide.title,
      description: guide.description,
      fileType: guide.fileType,
      fileSize: guide.fileSize,
      fileUrl: guide.fileUrl || "",
      category: guide.category,
      isActive: guide.isActive
    });
    setShowEditDialog(true);
  };

  const handleDeleteGuide = (guideId: number) => {
    if (confirm("Are you sure you want to delete this guide?")) {
      deleteGuideMutation.mutate(guideId);
    }
  };

  // Combine both guide sources
  const allGuides = [
    ...typedGuides,
    ...typedResourceGuides.map((resource: any) => ({
      id: `resource-${resource.id}`,
      title: resource.title,
      description: resource.description,
      fileType: 'Resource',
      fileSize: '',
      fileUrl: resource.externalUrl,
      category: resource.category,
      downloadCount: resource.views || 0,
      isActive: resource.isActive,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      isFromResource: true
    }))
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const GuideForm = ({ onSubmit, isUpdate = false }: { onSubmit: (e: React.FormEvent) => void; isUpdate?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
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
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fileType">File Type</Label>
          <Select value={formData.fileType} onValueChange={(value) => setFormData({ ...formData, fileType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              {fileTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fileSize">File Size</Label>
          <Input
            id="fileSize"
            value={formData.fileSize}
            onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
            placeholder="e.g., 2.1 MB"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fileUrl">File URL</Label>
          <Input
            id="fileUrl"
            value={formData.fileUrl}
            onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createGuideMutation.isPending || updateGuideMutation.isPending}
        >
          {(createGuideMutation.isPending || updateGuideMutation.isPending) ? "Saving..." : (isUpdate ? "Update Guide" : "Create Guide")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Downloadable Guides</h3>
          <p className="text-sm text-gray-600">
            Manage downloadable guides for customers
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Downloadable Guide</DialogTitle>
            </DialogHeader>
            <GuideForm onSubmit={handleCreateGuide} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {allGuides.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No downloadable guides available.</p>
              <p className="text-sm text-gray-500 mt-2">Create a guide or add resources from Customer Resources Management.</p>
            </CardContent>
          </Card>
        ) : (
          allGuides.map((guide: any) => (
            <Card key={guide.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {categoryOptions.find(cat => cat.value === guide.category)?.label || guide.category}
                    </Badge>
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {guide.fileType}
                    </Badge>
                    {guide.fileSize && (
                      <Badge variant="outline">{guide.fileSize}</Badge>
                    )}
                    <Badge variant={guide.isActive ? "default" : "secondary"}>
                      {guide.isActive ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGuide(guide)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGuide(guide.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">{guide.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {guide.downloadCount} downloads
                  </span>
                  <span>Created {new Date(guide.createdAt).toLocaleDateString()}</span>
                </div>
                {guide.fileUrl && (
                  <a
                    href={guide.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View File
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Downloadable Guide</DialogTitle>
          </DialogHeader>
          <GuideForm onSubmit={handleUpdateGuide} isUpdate />
        </DialogContent>
      </Dialog>
    </div>
  );
}