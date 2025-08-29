import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Star, Shield, Gift, Info, FileText, BookOpen, Search, Filter, Eye, Calendar, Clock } from "lucide-react";

interface Resource {
  id: number;
  title: string;
  description: string;
  content: string;
  type: string;
  category: string;
  brand?: string | null;
  companyName?: string | null;
  externalUrl?: string | null;
  linkText?: string | null;
  imageUrl?: string | null;
  iconType?: string | null;
  featured?: boolean | null;
  priority?: number | null;
  tags?: any;
  isActive?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  expiryDate?: string | null;
}

const iconTypeMap = {
  link: ExternalLink,
  warranty: Shield,
  cashback: Gift,
  info: Info,
  tutorial: FileText,
  guide: BookOpen,
};

const categoryColors = {
  warranty: "bg-blue-100 text-blue-800",
  promotions: "bg-green-100 text-green-800",
  tutorials: "bg-purple-100 text-purple-800",
  guides: "bg-orange-100 text-orange-800",
  general: "bg-gray-100 text-gray-800",
};

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  // Type the resources data
  const typedResources = resources as Resource[] | undefined;

  // Filter resources based on search and filters
  const filteredResources = typedResources?.filter((resource: Resource) => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || resource.brand === selectedBrand;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Get unique categories and brands from resources
  const categories = [...new Set(typedResources?.map((r: Resource) => r.category) || [])];
  const brands = [...new Set(typedResources?.map((r: Resource) => r.brand).filter((brand): brand is string => Boolean(brand)) || [])];

  // Separate featured and regular resources
  const featuredResources = filteredResources?.filter((r: Resource) => r.featured) || [];
  const regularResources = filteredResources?.filter((r: Resource) => !r.featured) || [];

  const getIcon = (iconType: string | null | undefined) => {
    const IconComponent = iconTypeMap[(iconType || 'link') as keyof typeof iconTypeMap] || ExternalLink;
    return <IconComponent className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || categoryColors.general;
  };

  const openDetailModal = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {/* Resource Image */}
      {resource.imageUrl && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img 
            src={resource.imageUrl} 
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          {resource.featured && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1 text-blue-600">
              {getIcon(resource.iconType)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                {resource.featured && !resource.imageUrl && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryColor(resource.category)}>
                  {resource.category}
                </Badge>
                <Badge variant="outline">{resource.type}</Badge>
                {resource.brand && (
                  <Badge variant="outline" className="font-medium">
                    {resource.brand}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{resource.content}</p>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => openDetailModal(resource)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
          
          {resource.externalUrl && (
            <Button asChild className="w-full">
              <a
                href={resource.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center"
              >
                {getIcon(resource.iconType)}
                <span className="ml-2">{resource.linkText}</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ResourceDetailModal = () => (
    <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        {selectedResource && (
          <div>
            <DialogHeader>
              <div className="flex items-start space-x-3 mb-4">
                <div className="text-blue-600">
                  {getIcon(selectedResource.iconType)}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    {selectedResource.title}
                    {selectedResource.featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="h-4 w-4 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </DialogTitle>
                  <p className="text-gray-600 mt-2">{selectedResource.description}</p>
                </div>
              </div>
            </DialogHeader>
            
            {/* Resource Image in Modal */}
            {selectedResource.imageUrl && (
              <div className="mb-6">
                <img 
                  src={selectedResource.imageUrl} 
                  alt={selectedResource.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(selectedResource.category)}>
                    {selectedResource.category}
                  </Badge>
                  <Badge variant="outline">{selectedResource.type}</Badge>
                  {selectedResource.brand && (
                    <Badge variant="outline" className="font-medium">
                      {selectedResource.brand}
                    </Badge>
                  )}
                </div>
                {selectedResource.companyName && (
                  <p className="text-sm text-gray-600">
                    <strong>Company:</strong> {selectedResource.companyName}
                  </p>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                {selectedResource.publishedAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Published: {new Date(selectedResource.publishedAt).toLocaleDateString()}
                  </div>
                )}
                {selectedResource.expiryDate && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Expires: {new Date(selectedResource.expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Full Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Details</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedResource.content}
                </p>
              </div>
            </div>
            
            {/* Tags */}
            {selectedResource.tags && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedResource.tags) ? selectedResource.tags : []).map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* External Link */}
            {selectedResource.externalUrl && (
              <div className="flex justify-center">
                <Button asChild className="w-full max-w-md">
                  <a
                    href={selectedResource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center"
                  >
                    {getIcon(selectedResource.iconType)}
                    <span className="ml-2">{selectedResource.linkText || 'Open Resource'}</span>
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Customer Resources
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Everything you need to get the most from your TV purchase
          </p>
          <p className="text-lg text-blue-200 max-w-3xl mx-auto">
            Find warranty registration links, cashback promotions, installation guides, and more helpful resources from leading TV brands and retailers.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand: string) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Resources</h2>
              <p className="text-lg text-gray-600">Most popular and important resources for our customers</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map((resource: Resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Resources */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {featuredResources.length > 0 ? "All Resources" : "Customer Resources"}
            </h2>
            <p className="text-lg text-gray-600">
              {filteredResources?.length || 0} resources found
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regularResources.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularResources.map((resource: Resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory !== "all" || selectedBrand !== "all"
                  ? "Try adjusting your search criteria"
                  : "Resources will appear here as they are added"
                }
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
      
      {/* Detail Modal */}
      <ResourceDetailModal />
    </div>
  );
}