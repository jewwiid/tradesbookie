import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, QrCode, Download, BarChart3, Eye } from 'lucide-react';

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconEmoji: string;
  backgroundColor: string;
  textColor: string;
  qrCodeId: string;
  qrCodeUrl: string;
  displayOrder: number;
  isActive: boolean;
  totalScans: number;
  totalRecommendations: number;
  totalConversions: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  iconEmoji: string;
  backgroundColor: string;
  textColor: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminProductCategories() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    iconEmoji: '📺',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    displayOrder: 0,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<ProductCategory[]>({
    queryKey: ['/api/admin/product-categories']
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => apiRequest('/api/admin/product-categories', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/product-categories'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Category created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create category', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => 
      apiRequest(`/api/admin/product-categories/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/product-categories'] });
      setEditingCategory(null);
      resetForm();
      toast({ title: 'Category updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update category', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/product-categories/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/product-categories'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete category', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      iconEmoji: '📺',
      backgroundColor: '#3B82F6',
      textColor: '#FFFFFF',
      displayOrder: 0,
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconEmoji: category.iconEmoji,
      backgroundColor: category.backgroundColor,
      textColor: category.textColor,
      displayOrder: category.displayOrder,
      isActive: category.isActive
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const downloadFlyer = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/admin/product-categories/${categoryId}/flyer`);
      const svgText = await response.text();
      
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `category-${categoryId}-flyer.svg`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Failed to download flyer', variant: 'destructive' });
    }
  };

  const downloadBulkFlyer = async () => {
    try {
      const response = await fetch('/api/admin/product-categories/bulk-flyer');
      const svgText = await response.text();
      
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all-categories-flyer.svg';
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Failed to download bulk flyer', variant: 'destructive' });
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && (!editingCategory || editingCategory.name !== formData.name)) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, editingCategory]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Category QR Codes</h1>
          <p className="text-muted-foreground mt-2">
            Manage product categories and generate QR code flyers for in-store marketing
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadBulkFlyer} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download All Flyers
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <CategoryDialog
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
              title="Create Product Category"
            />
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.iconEmoji}</span>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>/{category.slug}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  {category.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {category.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold">{category.totalScans}</div>
                  <div className="text-xs text-muted-foreground">Scans</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{category.totalRecommendations}</div>
                  <div className="text-xs text-muted-foreground">Recs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{category.totalConversions}</div>
                  <div className="text-xs text-muted-foreground">Bookings</div>
                </div>
              </div>

              <div 
                className="w-full h-20 rounded-md flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: category.backgroundColor, color: category.textColor }}
              >
                QR Code Preview
              </div>

              <div className="flex flex-wrap gap-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadFlyer(category.id)}
                >
                  <QrCode className="h-3 w-3 mr-1" />
                  Flyer
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <CategoryDialog
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmit}
                    isLoading={updateMutation.isPending}
                    title="Edit Product Category"
                  />
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{category.name}"? This will also remove all associated QR scan data and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(category.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories?.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first product category to get started with QR code flyers
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Category
          </Button>
        </div>
      )}
    </div>
  );
}

function CategoryDialog({ 
  formData, 
  setFormData, 
  onSubmit, 
  isLoading, 
  title 
}: {
  formData: CategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  title: string;
}) {
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="col-span-3"
            placeholder="e.g., Smart TVs"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            className="col-span-3"
            placeholder="smart-tvs"
            required
          />
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="col-span-3"
            placeholder="Find the perfect smart TV for your home..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="emoji">Icon</Label>
          <Input
            id="emoji"
            value={formData.iconEmoji}
            onChange={(e) => setFormData(prev => ({ ...prev, iconEmoji: e.target.value }))}
            className="col-span-3"
            placeholder="📺"
            maxLength={10}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bg-color">Background Color</Label>
            <Input
              id="bg-color"
              type="color"
              value={formData.backgroundColor}
              onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="w-full h-10"
            />
          </div>
          <div>
            <Label htmlFor="text-color">Text Color</Label>
            <Input
              id="text-color"
              type="color"
              value={formData.textColor}
              onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
              className="w-full h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            className="col-span-3"
            min="0"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <DialogTrigger asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogTrigger>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Category'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}