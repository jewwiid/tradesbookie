import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, Phone, Mail, Calendar, Award, Wrench, CheckCircle, Eye, ArrowLeft, ExternalLink } from 'lucide-react';
import Navigation from '@/components/navigation';
import Footer from '@/components/Footer';

interface BeforeAfterPhoto {
  tvIndex: number;
  beforePhoto: string;
  afterPhoto: string;
  timestamp?: string;
}

interface CompletedWork {
  id: number;
  location: string;
  serviceType: string;
  completedAt: string;
  qualityStars: number;
  beforeAfterPhotos: BeforeAfterPhoto[];
  customerRating?: number;
  customerReview?: string;
}

interface InstallerProfile {
  id: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceArea: string;
  address: string;
  yearsExperience: number;
  averageRating: number;
  totalReviews: number;
  expertise: string[];
  bio: string;
  profileImageUrl?: string;
  isActive: boolean;
  completedJobs: number;
  completedWork: CompletedWork[];
}

export default function InstallerProfile() {
  const [, setLocation] = useLocation();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<{ [key: number]: number }>({});
  
  // Get installer ID from URL
  const urlParts = window.location.pathname.split('/');
  const installerId = urlParts[2]; // /installer/:id

  // Fetch installer profile data
  const { data: installer, isLoading, error } = useQuery<InstallerProfile>({
    queryKey: [`/api/installer/${installerId}/public-profile`],
    enabled: !!installerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !installer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-2">Installer Not Found</h2>
              <p className="text-gray-600 mb-4">
                The installer profile you're looking for doesn't exist or is not publicly available.
              </p>
              <Button onClick={() => setLocation('/our-installers')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Installers
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePhotoNavigation = (installationId: number, direction: 'next' | 'prev') => {
    const installation = installer.completedWork.find(w => w.id === installationId);
    if (!installation) return;
    
    const currentIndex = selectedPhotoIndex[installationId] || 0;
    const maxIndex = installation.beforeAfterPhotos.length - 1;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    }
    
    setSelectedPhotoIndex(prev => ({
      ...prev,
      [installationId]: newIndex
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {installer.profileImageUrl ? (
                      <img 
                        src={installer.profileImageUrl}
                        alt={installer.businessName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Wrench className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{installer.businessName}</h1>
                    <p className="text-lg text-gray-600 mb-3">{installer.contactName}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${
                              i < Math.round(installer.averageRating) 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="text-lg font-semibold ml-2">
                          {installer.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-600">
                          ({installer.totalReviews} review{installer.totalReviews !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>

                    {/* Key Stats */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{installer.yearsExperience} years experience</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{installer.completedJobs} jobs completed</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{installer.serviceArea}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {installer.bio && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-gray-700 leading-relaxed">{installer.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services & Expertise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Services & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {installer.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Work Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Recent Work ({installer.completedWork.length})
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/installation-showcase" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Gallery
                    </a>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {installer.completedWork.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No completed work photos available yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {installer.completedWork.slice(0, 6).map((work) => {
                      const currentPhoto = work.beforeAfterPhotos[selectedPhotoIndex[work.id] || 0];
                      
                      return (
                        <div key={work.id} className="border rounded-lg overflow-hidden">
                          {/* Work Header */}
                          <div className="p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{work.serviceType}</h4>
                              <div className="flex items-center space-x-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${
                                      i < work.qualityStars 
                                        ? 'text-yellow-400 fill-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>Dublin Area</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(work.completedAt)}</span>
                              </div>
                            </div>
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
                                    className="w-full h-24 object-cover"
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
                                    className="w-full h-24 object-cover"
                                  />
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-green-500 hover:bg-green-600">After</Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Photo Navigation */}
                              {work.beforeAfterPhotos.length > 1 && (
                                <div className="absolute bottom-2 right-2 flex space-x-2">
                                  <button
                                    onClick={() => handlePhotoNavigation(work.id, 'prev')}
                                    className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75"
                                  >
                                    ←
                                  </button>
                                  <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                    {(selectedPhotoIndex[work.id] || 0) + 1} / {work.beforeAfterPhotos.length}
                                  </span>
                                  <button
                                    onClick={() => handlePhotoNavigation(work.id, 'next')}
                                    className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75"
                                  >
                                    →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {installer.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{installer.phone}</p>
                    </div>
                  </div>
                )}
                
                {installer.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{installer.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Service Area</p>
                    <p className="font-medium">{installer.serviceArea}</p>
                  </div>
                </div>

                {(installer.phone || installer.email) && (
                  <>
                    <Separator />
                    
                    {installer.phone && (
                      <Button className="w-full" asChild>
                        <a href={`tel:${installer.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call Now
                        </a>
                      </Button>
                    )}
                    
                    {installer.email && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={`mailto:${installer.email}`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </a>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Professional Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Professional Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    {installer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="font-medium">{installer.yearsExperience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Jobs Completed</span>
                  <span className="font-medium">{installer.completedJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{installer.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}