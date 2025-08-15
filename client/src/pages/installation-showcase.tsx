import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useLocation } from 'wouter';

interface BeforeAfterPhoto {
  tvIndex: number;
  beforePhoto: string;
  afterPhoto: string;
  timestamp?: string;
}

interface CustomerReview {
  rating: number;
  title: string;
  comment: string;
  date: string;
}

interface InstallationShowcase {
  id: number;
  location: string;
  tvCount: number;
  services: string;
  primaryService: string;
  qualityStars: number;
  photoStars: number;
  reviewStars: number;
  beforeAfterPhotos: BeforeAfterPhoto[];
  review: CustomerReview;
  completedAt: string;
}

interface ShowcaseResponse {
  installations: InstallationShowcase[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

export default function InstallationShowcase() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<{ [key: number]: number }>({});

  // Fetch showcase data
  const { data: showcaseData, isLoading, error } = useQuery<ShowcaseResponse>({
    queryKey: ['/api/installation-showcase', page],
    queryFn: () => 
      fetch(`/api/installation-showcase?page=${page}&limit=10`)
        .then(res => res.json())
  });

  const handlePhotoNavigation = (installationId: number, direction: 'prev' | 'next', maxPhotos: number) => {
    setSelectedPhotoIndex(prev => {
      const current = prev[installationId] || 0;
      let newIndex;
      
      if (direction === 'next') {
        newIndex = (current + 1) % maxPhotos;
      } else {
        newIndex = current === 0 ? maxPhotos - 1 : current - 1;
      }
      
      return { ...prev, [installationId]: newIndex };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const installations = showcaseData?.installations || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Installation Gallery
            </h1>
            <p className="text-gray-600">
              Discover our completed TV installations with real customer reviews and before/after photos
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Failed to load installation gallery. Please try again later.</p>
            </CardContent>
          </Card>
        ) : installations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No installations yet</h3>
              <p className="text-gray-600 mb-4">
                Be among the first to showcase your TV installation experience!
              </p>
              <Button onClick={() => setLocation('/booking')} className="bg-blue-600 hover:bg-blue-700">
                Book Installation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {installations.map((installation) => {
              const currentPhotoIndex = selectedPhotoIndex[installation.id] || 0;
              const currentPhoto = installation.beforeAfterPhotos[currentPhotoIndex];
              const hasMultiplePhotos = installation.beforeAfterPhotos.length > 1;

              return (
                <Card key={installation.id} className="overflow-hidden shadow-lg">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{installation.location}</span>
                          <span>•</span>
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(installation.completedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            {installation.primaryService}
                          </Badge>
                          {installation.tvCount > 1 && (
                            <Badge variant="secondary">
                              {installation.tvCount} TVs
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quality Stars */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < installation.qualityStars 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="text-sm font-medium ml-1">
                            {installation.qualityStars}/5 Quality Score
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {installation.photoStars}/3 Photo • {installation.reviewStars}/2 Review
                        </div>
                      </div>

                      <p className="text-gray-700">{installation.services}</p>
                    </div>

                    {/* Before/After Photos */}
                    {currentPhoto && (
                      <div className="relative">
                        <div className="grid grid-cols-2 gap-1">
                          {/* Before Photo */}
                          <div className="relative">
                            <img 
                              src={`data:image/jpeg;base64,${currentPhoto.beforePhoto}`}
                              alt="Before installation"
                              className="w-full h-64 sm:h-80 object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-red-500 hover:bg-red-600">Before</Badge>
                            </div>
                          </div>

                          {/* After Photo */}
                          <div className="relative">
                            <img 
                              src={`data:image/jpeg;base64,${currentPhoto.afterPhoto}`}
                              alt="After installation"
                              className="w-full h-64 sm:h-80 object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-green-500 hover:bg-green-600">After</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Photo Navigation */}
                        {hasMultiplePhotos && (
                          <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePhotoNavigation(installation.id, 'prev', installation.beforeAfterPhotos.length)}
                              className="pointer-events-auto bg-white/80 hover:bg-white"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePhotoNavigation(installation.id, 'next', installation.beforeAfterPhotos.length)}
                              className="pointer-events-auto bg-white/80 hover:bg-white"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {/* Photo Counter */}
                        {hasMultiplePhotos && (
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="secondary" className="bg-black/50 text-white">
                              {currentPhotoIndex + 1} / {installation.beforeAfterPhotos.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer Review */}
                    <div className="p-6 pt-4">
                      <div className="border-l-4 border-l-blue-500 pl-4 bg-gray-50 p-4 rounded-r-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < installation.review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="font-medium text-sm">{installation.review.rating}/5</span>
                          <span className="text-gray-500 text-sm">• Customer Review</span>
                        </div>
                        
                        <h4 className="font-semibold mb-2">{installation.review.title}</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {installation.review.comment}
                        </p>
                        
                        <p className="text-xs text-gray-500 mt-3">
                          Reviewed on {formatDate(installation.review.date)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Load More / Pagination */}
            {showcaseData?.hasMore && (
              <div className="text-center py-8">
                <Button 
                  onClick={() => setPage(prev => prev + 1)}
                  variant="outline"
                  className="px-8"
                >
                  Load More Installations
                </Button>
              </div>
            )}

            {/* CTA for booking */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Ready for Your TV Installation?
                </h3>
                <p className="text-blue-700 mb-4">
                  Join our satisfied customers and get professional TV installation with quality guarantee.
                </p>
                <Button 
                  onClick={() => setLocation('/booking')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Book Your Installation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}