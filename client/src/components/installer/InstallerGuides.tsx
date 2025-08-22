import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ExternalLink, BookOpen, FileText, Play, Clock, Eye } from "lucide-react";

interface InstallerGuidesProps {
  installerId?: number;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  content?: string;
  type: string;
  category: string;
  brand?: string;
  companyName?: string;
  externalUrl?: string;
  linkText?: string;
  serviceTypeId?: number;
  createdAt: string;
}

interface DownloadableGuide {
  id: number;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  category: string;
  serviceTypeId?: number;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

interface VideoTutorial {
  id: number;
  title: string;
  description?: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
  thumbnailEmoji: string;
  level: string;
  category: string;
  serviceTypeId?: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function InstallerGuides({ installerId }: InstallerGuidesProps) {
  const [activeTab, setActiveTab] = useState("guides");

  // Fetch installer's service assignments to filter resources
  const { data: serviceAssignments } = useQuery({
    queryKey: ['/api/installer-service-assignments', installerId],
    queryFn: async () => {
      const response = await fetch('/api/installer-service-assignments');
      if (!response.ok) throw new Error('Failed to fetch service assignments');
      return response.json();
    },
    enabled: !!installerId,
  });

  // Get service type IDs for this installer
  const installerServiceTypes = serviceAssignments
    ?.filter((assignment: any) => assignment.installerId === installerId)
    ?.map((assignment: any) => assignment.serviceTypeId) || [];

  // Fetch resources filtered by installer's services
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/installer/resources', installerServiceTypes],
    queryFn: async () => {
      const params = new URLSearchParams();
      installerServiceTypes.forEach((typeId: number) => params.append('serviceTypeIds', typeId.toString()));
      
      const response = await fetch(`/api/installer/resources?${params}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    },
    enabled: installerServiceTypes.length > 0,
  });

  // Fetch downloadable guides filtered by installer's services
  const { data: guides, isLoading: guidesLoading } = useQuery({
    queryKey: ['/api/installer/downloadable-guides', installerServiceTypes],
    queryFn: async () => {
      const params = new URLSearchParams();
      installerServiceTypes.forEach((typeId: number) => params.append('serviceTypeIds', typeId.toString()));
      
      const response = await fetch(`/api/installer/downloadable-guides?${params}`);
      if (!response.ok) throw new Error('Failed to fetch downloadable guides');
      return response.json();
    },
    enabled: installerServiceTypes.length > 0,
  });

  // Fetch video tutorials filtered by installer's services
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['/api/installer/video-tutorials', installerServiceTypes],
    queryFn: async () => {
      const params = new URLSearchParams();
      installerServiceTypes.forEach((typeId: number) => params.append('serviceTypeIds', typeId.toString()));
      
      const response = await fetch(`/api/installer/video-tutorials?${params}`);
      if (!response.ok) throw new Error('Failed to fetch video tutorials');
      return response.json();
    },
    enabled: installerServiceTypes.length > 0,
  });

  const handleDownload = async (guideId: number, fileUrl?: string) => {
    if (!fileUrl) return;
    
    // Track download
    try {
      await fetch(`/api/installer/downloadable-guides/${guideId}/download`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }
    
    // Open download
    window.open(fileUrl, '_blank');
  };

  const handleVideoView = async (videoId: number, videoUrl: string) => {
    // Track view
    try {
      await fetch(`/api/installer/video-tutorials/${videoId}/view`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track video view:', error);
    }
    
    // Open video
    window.open(videoUrl, '_blank');
  };

  if (!installerId) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Installer information not available</p>
      </div>
    );
  }

  if (installerServiceTypes.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No service assignments found</p>
        <p className="text-sm text-gray-400 mt-2">Contact support to set up your services</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Articles & Guides</span>
            <span className="sm:hidden">Articles</span>
          </TabsTrigger>
          <TabsTrigger value="downloads" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Downloadable Guides</span>
            <span className="sm:hidden">Downloads</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Video Tutorials</span>
            <span className="sm:hidden">Videos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="mt-6">
          {resourcesLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : resources?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No guides available for your services</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resources?.map((resource: Resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription className="mt-2">{resource.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">{resource.type}</Badge>
                          <Badge variant="outline">{resource.category}</Badge>
                          {resource.brand && (
                            <Badge variant="outline">{resource.brand}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {resource.externalUrl ? (
                      <Button
                        onClick={() => window.open(resource.externalUrl, '_blank')}
                        className="w-full"
                        variant="default"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {resource.linkText || 'Read More'}
                      </Button>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <p>{resource.content?.substring(0, 200)}...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="downloads" className="mt-6">
          {guidesLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : guides?.length === 0 ? (
            <div className="text-center py-8">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No downloadable guides available for your services</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {guides?.map((guide: DownloadableGuide) => (
                <Card key={guide.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription className="mt-2">{guide.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">{guide.fileType}</Badge>
                          <Badge variant="outline">{guide.fileSize}</Badge>
                          <Badge variant="outline">{guide.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Downloaded {guide.downloadCount} times
                      </p>
                      <Button
                        onClick={() => handleDownload(guide.id, guide.fileUrl)}
                        disabled={!guide.fileUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {videosLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : videos?.length === 0 ? (
            <div className="text-center py-8">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No video tutorials available for your services</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {videos?.map((video: VideoTutorial) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleVideoView(video.id, video.videoUrl)}>
                  <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="text-4xl">{video.thumbnailEmoji}</div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-t-lg">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <CardDescription>{video.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary">{video.level}</Badge>
                      <Badge variant="outline">{video.category}</Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.viewCount} views
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}