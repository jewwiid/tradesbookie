import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, ChevronLeft, ChevronRight, Heart, Lock, Eye, Filter, Tv, Zap, Wrench, User, Award, TrendingUp, Clock, Crown } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/navigation';
import Footer from '@/components/Footer';

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

interface InstallerProfile {
  id: number;
  businessName: string;
  contactName: string;
  profileImage?: string;
  averageRating: number;
  totalReviews: number;
  yearsExperience: number;
  expertise: string[];
  serviceArea: string;
  isVip?: boolean;
}

interface InstallationShowcase {
  id: number;
  installer: InstallerProfile;
  beforeAfterPhotos: BeforeAfterPhoto[];
  review: CustomerReview;
  serviceType: string;
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
  const [selectedReviewIndex, setSelectedReviewIndex] = useState<{ [key: number]: number }>({});
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const { user, isAuthenticated } = useAuth();

  // Reset page when filter changes
  const handleServiceFilterChange = (value: string) => {
    setSelectedServiceFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  // Fetch showcase data
  const { data: showcaseData, isLoading, error } = useQuery<ShowcaseResponse>({
    queryKey: ['/api/installation-showcase', page, selectedServiceFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (selectedServiceFilter !== 'all') {
        params.append('serviceType', selectedServiceFilter);
      }
      return fetch(`/api/installation-showcase?${params}`)
        .then(res => res.json());
    }
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

  const handleReviewNavigation = (installationId: number, direction: 'prev' | 'next', maxReviews: number) => {
    setSelectedReviewIndex(prev => {
      const current = prev[installationId] || 0;
      let newIndex;
      
      if (direction === 'next') {
        newIndex = (current + 1) % maxReviews;
      } else {
        newIndex = current === 0 ? maxReviews - 1 : current - 1;
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
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Installer Showcase
            </h1>
            <p className="text-gray-600">
              Discover our professional installers and their completed work with real customer reviews
            </p>
            {!isAuthenticated && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign in to view detailed installation photos and customer reviews</span>
                </div>
              </div>
            )}
            
            {/* Service Filter */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by service:</span>
              </div>
              <Select value={selectedServiceFilter} onValueChange={handleServiceFilterChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="tv-installation">
                    <div className="flex items-center space-x-2">
                      <Tv className="w-4 h-4" />
                      <span>TV Installation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="smart-home" disabled>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Smart Home (Coming Soon)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="general-install" disabled>
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4" />
                      <span>General Install (Coming Soon)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No showcases yet</h3>
              <p className="text-gray-600 mb-4">
                Be among the first to experience our professional installation services!
              </p>
              <Button onClick={() => setLocation('/booking')} className="bg-blue-600 hover:bg-blue-700">
                Book Installation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {installations.map((installation) => {
              const currentPhotoIndex = selectedPhotoIndex[installation.id] || 0;
              const currentPhoto = installation.beforeAfterPhotos?.[currentPhotoIndex];
              const hasMultiplePhotos = (installation.beforeAfterPhotos?.length || 0) > 1;

              const currentReviewIndex = selectedReviewIndex[installation.id] || 0;
              const currentReview = installation.reviews?.[currentReviewIndex];
              const hasMultipleReviews = (installation.reviews?.length || 0) > 1;

              // Skip installations with missing data
              if (!installation.installer || !installation.beforeAfterPhotos?.length) {
                return null;
              }

              return (
                <Card key={installation.id} className="overflow-hidden shadow-lg border-0 bg-white">
                  <CardContent className="p-0">
                    {/* Installer Profile Banner */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-center space-x-4">
                        {/* Profile Image with VIP Badge */}
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {installation.installer?.profileImage ? (
                            <img 
                              src={installation.installer.profileImage} 
                              alt={installation.installer?.businessName || 'Installer'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            installation.installer?.businessName?.charAt(0) || 'I'
                          )}
                          {installation.installer?.isVip && (
                            <div className="absolute -top-1 -right-1">
                              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                                <Crown className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Installer Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {installation.installer?.businessName || 'Unknown Installer'}
                            </h3>
                            {installation.installer?.isVip && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1">
                                <Crown className="w-3 h-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {installation.installer?.contactName || 'Unknown'} • {installation.installer?.serviceArea || 'Unknown Area'}
                          </p>
                          {/* Only show rating if there are actual reviews */}
                          {installation.installer?.totalReviews > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {(installation.installer?.averageRating || 0).toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">({installation.installer?.totalReviews || 0} reviews)</span>
                            </div>
                          )}
                        </div>
                        

                      </div>
                    </div>

                    {/* Before/After Photos */}
                    {currentPhoto && (
                      <div className="relative">
                        {isAuthenticated ? (
                          <div className="grid grid-cols-2 gap-1">
                            {/* Before Photo */}
                            <div className="relative">
                              <img 
                                src={currentPhoto.beforePhoto.startsWith('data:') ? currentPhoto.beforePhoto : `data:image/jpeg;base64,${currentPhoto.beforePhoto}`}
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
                                src={currentPhoto.afterPhoto.startsWith('data:') ? currentPhoto.afterPhoto : `data:image/jpeg;base64,${currentPhoto.afterPhoto}`}
                                alt="After installation"
                                className="w-full h-64 sm:h-80 object-cover"
                              />
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-green-500 hover:bg-green-600">After</Badge>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1">
                            {/* Blurred Preview for Non-authenticated Users */}
                            <div className="relative">
                              <img 
                                src={currentPhoto.beforePhoto.startsWith('data:') ? currentPhoto.beforePhoto : `data:image/jpeg;base64,${currentPhoto.beforePhoto}`}
                                alt="Before installation preview"
                                className="w-full h-64 sm:h-80 object-cover blur-lg"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
                                  <Lock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-gray-800">Sign in to view</p>
                                </div>
                              </div>
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-red-500 hover:bg-red-600">Before</Badge>
                              </div>
                            </div>

                            <div className="relative">
                              <img 
                                src={currentPhoto.afterPhoto.startsWith('data:') ? currentPhoto.afterPhoto : `data:image/jpeg;base64,${currentPhoto.afterPhoto}`}
                                alt="After installation preview"
                                className="w-full h-64 sm:h-80 object-cover blur-lg"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
                                  <Lock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-gray-800">Sign in to view</p>
                                </div>
                              </div>
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-green-500 hover:bg-green-600">After</Badge>
                              </div>
                            </div>
                          </div>
                        )}

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

                    {/* Customer Review Carousel */}
                    <div className="p-6">
                      {isAuthenticated ? (
                        <div className="space-y-4">
                          {/* Review Navigation Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${
                                      i < (currentReview?.rating || 0)
                                        ? 'text-yellow-400 fill-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="font-semibold text-gray-900">{currentReview?.rating || 0}/5</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {hasMultipleReviews && (
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReviewNavigation(installation.id, 'prev', installation.reviews.length)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </Button>
                                  <span className="text-xs text-gray-500 px-2">
                                    {currentReviewIndex + 1} / {installation.reviews.length}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReviewNavigation(installation.id, 'next', installation.reviews.length)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Recently completed</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Review Content */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{currentReview?.title || 'Installation Review'}</h4>
                              <span className="text-sm text-gray-500">
                                by {currentReview?.customerName || 'Verified Customer'}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {currentReview?.comment || 'No review comment available.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                            <div className="text-center">
                              <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                              <p className="text-sm font-medium text-gray-700 mb-3">Sign in to read customer reviews</p>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setLocation('/api/login')}
                              >
                                Sign In
                              </Button>
                            </div>
                          </div>
                          
                          <div className="blur-sm pointer-events-none space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
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
                                <span className="font-semibold text-gray-900">{installation.review.rating}/5</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Recently completed</span>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">{installation.review.title}</h4>
                              <p className="text-gray-700 leading-relaxed">
                                {installation.review.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Join Our Professional Network
                </h3>
                <p className="text-blue-700 mb-4">
                  Experience quality installation services from our verified professional installers.
                </p>
                <Button 
                  onClick={() => setLocation('/booking')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Book Installation Service
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}