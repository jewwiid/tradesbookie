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
  Play, 
  Eye,
  EyeOff,
  Clock,
  Users
} from "lucide-react";

interface VideoTutorial {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  thumbnailUrl?: string;
  difficulty: string;
  category: string;
  viewCount: number;
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

const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

export default function VideoTutorialsManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<VideoTutorial | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    thumbnailUrl: "",
    difficulty: "beginner",
    category: "general",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch video tutorials from both sources
  const { data: tutorialsData = [], isLoading } = useQuery({
    queryKey: ["/api/admin/video-tutorials"]
  });

  // Type the query responses
  const tutorials = tutorialsData as VideoTutorial[];

  // Fetch tutorials from general resources
  const { data: resourceTutorialsData = [] } = useQuery({
    queryKey: ["/api/admin/resources"],
    select: (data: any[]) => data.filter((resource: any) => 
      resource.type === 'tutorial' || resource.type === 'video'
    ),
  });

  const resourceTutorials = resourceTutorialsData as any[];

  // Create tutorial mutation
  const createTutorialMutation = useMutation({
    mutationFn: async (tutorialData: any) => {
      await apiRequest("POST", "/api/admin/video-tutorials", tutorialData);
    },
    onSuccess: () => {
      toast({
        title: "Tutorial Created",
        description: "Video tutorial has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/video-tutorials"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Tutorial",
        description: error.message || "Failed to create tutorial",
        variant: "destructive"
      });
    }
  });

  // Update tutorial mutation
  const updateTutorialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/admin/video-tutorials/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Tutorial Updated",
        description: "Video tutorial has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/video-tutorials"] });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Tutorial",
        description: error.message || "Failed to update tutorial",
        variant: "destructive"
      });
    }
  });

  // Delete tutorial mutation
  const deleteTutorialMutation = useMutation({
    mutationFn: async (tutorialId: number) => {
      await apiRequest("DELETE", `/api/admin/video-tutorials/${tutorialId}`);
    },
    onSuccess: () => {
      toast({
        title: "Tutorial Deleted",
        description: "Video tutorial has been removed successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/video-tutorials"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Tutorial",
        description: error.message || "Failed to delete tutorial",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      duration: "",
      thumbnailUrl: "",
      difficulty: "beginner",
      category: "general",
      isActive: true
    });
    setSelectedTutorial(null);
  };

  const handleCreateTutorial = (e: React.FormEvent) => {
    e.preventDefault();
    createTutorialMutation.mutate(formData);
  };

  const handleUpdateTutorial = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTutorial) {
      updateTutorialMutation.mutate({ id: selectedTutorial.id, data: formData });
    }
  };

  const handleEditTutorial = (tutorial: VideoTutorial) => {
    setSelectedTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description,
      videoUrl: tutorial.videoUrl,
      duration: tutorial.duration,
      thumbnailUrl: tutorial.thumbnailUrl || "",
      difficulty: tutorial.difficulty,
      category: tutorial.category,
      isActive: tutorial.isActive
    });
    setShowEditDialog(true);
  };

  const handleDeleteTutorial = (tutorialId: number) => {
    if (confirm("Are you sure you want to delete this tutorial?")) {
      deleteTutorialMutation.mutate(tutorialId);
    }
  };

  // Combine both tutorial sources
  const allTutorials = [
    ...tutorials,
    ...resourceTutorials.map((resource: any) => ({
      id: `resource-${resource.id}`,
      title: resource.title,
      description: resource.description,
      duration: '',
      videoUrl: resource.externalUrl,
      thumbnailUrl: '',
      thumbnailEmoji: '📺',
      level: 'beginner',
      category: resource.category,
      viewCount: resource.views || 0,
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

  const TutorialForm = ({ onSubmit, isUpdate = false }: { onSubmit: (e: React.FormEvent) => void; isUpdate?: boolean }) => (
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
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="e.g., 5:30"
          />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL *</Label>
        <Input
          id="videoUrl"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
        <Input
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
          placeholder="https://..."
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
          disabled={createTutorialMutation.isPending || updateTutorialMutation.isPending}
        >
          {(createTutorialMutation.isPending || updateTutorialMutation.isPending) ? "Saving..." : (isUpdate ? "Update Tutorial" : "Create Tutorial")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Video Tutorials</h3>
          <p className="text-sm text-gray-600">
            Manage video tutorials for customers
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Video Tutorial</DialogTitle>
            </DialogHeader>
            <TutorialForm onSubmit={handleCreateTutorial} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {allTutorials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No video tutorials available.</p>
              <p className="text-sm text-gray-500 mt-2">Create a tutorial or add resources from Customer Resources Management.</p>
            </CardContent>
          </Card>
        ) : (
          allTutorials.map((tutorial: any) => (
            <Card key={tutorial.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {categoryOptions.find(cat => cat.value === tutorial.category)?.label || tutorial.category}
                    </Badge>
                    <Badge variant="outline">
                      {difficultyOptions.find(diff => diff.value === tutorial.difficulty)?.label || tutorial.difficulty}
                    </Badge>
                    {tutorial.duration && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {tutorial.duration}
                      </Badge>
                    )}
                    <Badge variant={tutorial.isActive ? "default" : "secondary"}>
                      {tutorial.isActive ? (
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
                    onClick={() => handleEditTutorial(tutorial)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTutorial(tutorial.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">{tutorial.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {tutorial.viewCount} views
                  </span>
                  <span>Created {new Date(tutorial.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {tutorial.thumbnailUrl && (
                    <img
                      src={tutorial.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-16 h-12 object-cover rounded"
                    />
                  )}
                  <a
                    href={tutorial.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Play className="h-4 w-4" />
                    Watch Video
                  </a>
                </div>
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
            <DialogTitle>Edit Video Tutorial</DialogTitle>
          </DialogHeader>
          <TutorialForm onSubmit={handleUpdateTutorial} isUpdate />
        </DialogContent>
      </Dialog>
    </div>
  );
}