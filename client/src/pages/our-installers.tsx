import React, { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import InstallerProfile from "@/components/installer-profile";
import InstallerLocationMap from "@/components/InstallerLocationMap";
import { Star, MapPin, CheckCircle, Award, Users, ArrowRight, Shield, Clock, Eye, UserCheck, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PlatformStats {
  totalInstallers: number;
  countiesCovered: number;
  averageRating: number;
  completedInstallations: number;
}

interface Installer {
  id: number;
  businessName?: string;
  contactName?: string;
  serviceArea?: string;
  profileImageUrl?: string;
  isVip?: boolean;
  isAvailable?: boolean;
  insurance?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface Review {
  id: number;
  installerId: number;
  rating: number;
  comment?: string;
}

export default function OurInstallers() {
  // Fetch installers from the database
  const { data: installers, isLoading: installersLoading } = useQuery({
    queryKey: ["/api/installers"],
    retry: false,
  });

  // Fetch reviews for all installers
  const { data: allReviews = [] } = useQuery({
    queryKey: ["/api/reviews"],
    retry: false,
  });

  // Fetch real platform statistics
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/platform/stats"],
    retry: false,
  });

  // Type the query responses
  const typedInstallers = installers as Installer[] | undefined;
  const typedAllReviews = allReviews as Review[];
  const typedPlatformStats = platformStats as PlatformStats | undefined;

  // Function to get review stats for an installer
  const getInstallerReviewStats = (installerId: number) => {
    if (!typedAllReviews || !Array.isArray(typedAllReviews)) {
      return { averageRating: 0, totalReviews: 0 };
    }
    const installerReviews = typedAllReviews.filter((review: Review) => review.installerId === installerId);
    
    if (installerReviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalRating = installerReviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
    const averageRating = (totalRating / installerReviews.length).toFixed(1);
    
    return { 
      averageRating: parseFloat(averageRating), 
      totalReviews: installerReviews.length 
    };
  };

  const qualifications = [
    "Admin-reviewed and approved profiles",
    "Business registration and contact verification", 
    "Direct customer payment (cash, card, transfer)",
    "Public liability insurance (optional)",
    "Real-time availability status tracking",
    "Customer review and rating system",
    "Lead generation marketplace access",
    "Professional profile with work samples"
  ];

  // Generate service areas from actual installer registrations
  const serviceAreas = React.useMemo(() => {
    if (!typedInstallers || !Array.isArray(typedInstallers) || typedInstallers.length === 0) return [];
    
    // Extract unique service areas from approved installers
    const areas = typedInstallers
      .filter((installer: Installer) => installer.serviceArea) // Only installers with service areas
      .map((installer: Installer) => installer.serviceArea)
      .filter((area: string | undefined, index: number, self: (string | undefined)[]) => 
        area && self.indexOf(area) === index // Remove duplicates and empty values
      )
      .sort(); // Sort alphabetically
    
    return areas as string[];
  }, [typedInstallers]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Professional Installers
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Meet the certified professionals who bring your TV installation vision to life
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span>Admin approved</span>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-green-600 mr-2" />
              <span>Customer reviewed</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <span>Direct payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installer Network Stats */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  typedPlatformStats?.totalInstallers || 0
                )}
              </div>
              <div className="text-gray-600">Professional Installers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  typedPlatformStats?.countiesCovered || 0
                )}
              </div>
              <div className="text-gray-600">Counties Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  typedPlatformStats?.averageRating && typedPlatformStats.averageRating > 0 ? typedPlatformStats.averageRating : "N/A"
                )}
              </div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  typedPlatformStats?.completedInstallations || 0
                )}
              </div>
              <div className="text-gray-600">Installations Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Installers */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Installers
            </h2>
            <p className="text-lg text-gray-600">
              Experienced professionals ready to serve your area
            </p>
          </div>

          {installersLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {typedInstallers?.map((installer: Installer) => (
                <Card key={installer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Profile Photo */}
                    <div className="flex justify-center mb-4 relative">
                      {installer.profileImageUrl ? (
                        <img
                          src={installer.profileImageUrl}
                          alt={`${installer.businessName} profile`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {installer.contactName?.split(' ').map((n: string) => n[0]).join('') || 'TV'}
                          </span>
                        </div>
                      )}
                      
                      {/* VIP Badge - Takes priority */}
                      {installer.isVip && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-md">
                            <Crown className="w-3 h-3 mr-1" />
                            VIP
                          </div>
                        </div>
                      )}
                      
                      {/* Availability Badge - Only show if not VIP (to avoid overlap) */}
                      {!installer.isVip && installer.isAvailable && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                            Available
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Business Name */}
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                      {installer.businessName}
                    </h3>

                    {/* Service Area */}
                    <div className="flex items-center justify-center mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-600 text-sm">{installer.serviceArea}</span>
                    </div>

                    {/* Rating and Verification */}
                    <div className="flex items-center justify-center mb-6">
                      {(() => {
                        const reviewStats = getInstallerReviewStats(installer.id);
                        return (
                          <>
                            {reviewStats.totalReviews > 0 && (
                              <>
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                <span className="text-gray-700 font-medium">
                                  {reviewStats.averageRating}/5
                                </span>
                                <span className="text-gray-500 text-sm ml-1">
                                  ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''})
                                </span>
                              </>
                            )}
                            {installer.insurance && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {installer.isVip ? (
                        <>
                          <Button 
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold" 
                            onClick={() => window.location.href = `/booking?installer=${installer.id}&direct=true`}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Book VIP Installer Directly
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full text-xs border-yellow-200 hover:bg-yellow-50" 
                            onClick={() => window.location.href = `/installer/${installer.id}/public-profile`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View VIP Profile
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline"
                          className="w-full" 
                          onClick={() => window.location.href = '/booking'}
                        >
                          Book via Marketplace
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Installer Locations Across Ireland
            </h2>
            <p className="text-lg text-gray-600">
              Interactive map showing our professional installers nationwide
            </p>
          </div>

          {installersLoading ? (
            <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-500">Loading map...</div>
            </div>
          ) : typedInstallers && typedInstallers.length > 0 ? (
            <InstallerLocationMap
              installers={typedInstallers as any[]}
              height="500px"
              className="mb-8"
            />
          ) : (
            <div className="w-full h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No installers to display</p>
                <p className="text-sm">Check back soon as we build our network</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Installer Qualifications */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Our Platform Works
            </h2>
            <p className="text-lg text-gray-600">
              Connecting customers with verified installers through our lead generation marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {qualifications.map((qualification, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-700">{qualification}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Coverage */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Service Coverage Areas
            </h2>
            <p className="text-lg text-gray-600">
              Professional TV installation across Ireland
            </p>
          </div>

          {serviceAreas.length > 0 ? (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                {serviceAreas.map((area, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-900">{area}</span>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-600 mb-4">Don't see your area? We're expanding coverage regularly.</p>
                <Link href="/installer-service-selection">
                  <Button variant="outline">
                    Join Our Network
                    <Users className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Building Our Network</h3>
                <p className="text-gray-600 mb-6">
                  We're actively recruiting qualified installers across Ireland. 
                  Be among the first to join our platform.
                </p>
                <Link href="/installer-service-selection">
                  <Button>
                    Become an Installer
                    <Users className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How We Match You */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How We Match You with the Right Installer
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location-Based Matching</h3>
              <p className="text-gray-600">We connect you with certified installers in your specific area for faster service.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill-Based Selection</h3>
              <p className="text-gray-600">Installers are matched based on their expertise with your specific TV type and installation needs.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Availability Matching</h3>
              <p className="text-gray-600">We ensure your chosen installer is available for your preferred installation date and time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Work with Our Professionals?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your installation and get matched with a certified installer in your area
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Book Installation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/installer-service-selection">
              <Button size="lg" variant="outline" className="border-white text-[#2563eb] hover:bg-white hover:text-[#2563eb]">
                Become an Installer
                <Users className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}