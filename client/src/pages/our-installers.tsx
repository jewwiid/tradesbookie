import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import InstallerProfile from "@/components/installer-profile";
import { Star, MapPin, CheckCircle, Award, Users, ArrowRight, Shield, Clock, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function OurInstallers() {
  // Fetch installers from the database
  const { data: installers, isLoading: installersLoading } = useQuery({
    queryKey: ["/api/installers"],
    retry: false,
  });

  const qualifications = [
    "5+ years TV installation experience",
    "Certified electrical work authorization",
    "Comprehensive background checks",
    "Insurance and bonding coverage",
    "Customer service training",
    "Safety protocol certification",
    "Harvey Norman partnership trained",
    "Real-time GPS tracking"
  ];

  const serviceAreas = [
    "Dublin City Centre", "South Dublin", "North Dublin", "West Dublin",
    "Cork City", "Galway", "Limerick", "Waterford",
    "Kilkenny", "Wexford", "Kildare", "Meath",
    "Wicklow", "Carlow", "Laois", "Offaly"
  ];

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
              <span>Background checked</span>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-green-600 mr-2" />
              <span>Certified professionals</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <span>Real-time tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installer Network Stats */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Professional Installers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">16</div>
              <div className="text-gray-600">Counties Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">2,500+</div>
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
              {installers?.slice(0, 6).map((installer: any) => (
                <Card key={installer.id} className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {installer.businessName || installer.contactName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {installer.serviceAreas?.[0] || installer.address || "Dublin"}
                        </div>
                      </div>
                      <div className="flex items-center bg-green-50 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {installer.rating || "4.9"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        {installer.experience || "5+ years experience"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        {installer.specialties?.[0] || "Wall mounting specialist"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        {installer.availability || "Same-day available"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {installer.deviceTypes?.slice(0, 3).map((type: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      )) || (
                        <>
                          <Badge variant="secondary" className="text-xs">TV Mounting</Badge>
                          <Badge variant="secondary" className="text-xs">Cable Management</Badge>
                          <Badge variant="secondary" className="text-xs">Setup</Badge>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Installer Qualifications */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Installers?
            </h2>
            <p className="text-lg text-gray-600">
              Every installer meets our strict qualification standards
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
            <Link href="/installer-registration">
              <Button variant="outline">
                Join Our Network
                <Users className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
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
            <Link href="/installer-registration">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
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