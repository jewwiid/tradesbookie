import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Star, Shield, Gift, Info, FileText, BookOpen, Search, Filter } from "lucide-react";

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

  // Fetch resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  // Filter resources based on search and filters
  const filteredResources = resources?.filter((resource: Resource) => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || resource.brand === selectedBrand;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Get unique categories and brands from resources
  const categories = [...new Set(resources?.map((r: Resource) => r.category) || [])];
  const brands = [...new Set(resources?.map((r: Resource) => r.brand).filter(Boolean) || [])];

  // Separate featured and regular resources
  const featuredResources = filteredResources?.filter((r: Resource) => r.featured) || [];
  const regularResources = filteredResources?.filter((r: Resource) => !r.featured) || [];

  const getIcon = (iconType: string) => {
    const IconComponent = iconTypeMap[iconType as keyof typeof iconTypeMap] || ExternalLink;
    return <IconComponent className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || categoryColors.general;
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1 text-blue-600">
              {getIcon(resource.iconType)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                {resource.featured && (
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
      </CardContent>
    </Card>
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
                  {categories.map(category => (
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
                  {brands.map(brand => (
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
    </div>
  );
}