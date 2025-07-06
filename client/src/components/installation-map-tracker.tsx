import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, TrendingUp, Calendar, Monitor, CheckCircle, Clock, AlertCircle } from "lucide-react";
import GoogleMapsIreland from "./GoogleMapsIreland";

interface InstallationLocation {
  location: string;
  count: number;
  recentInstallations: Array<{
    id: number;
    serviceType: string;
    tvSize: string;
    date: string;
    status: string;
  }>;
}

export default function InstallationMapTracker() {
  const [selectedLocation, setSelectedLocation] = useState<InstallationLocation | null>(null);

  // Fetch geocoded installation data for Google Maps
  const { data: geocodedInstallations, isLoading } = useQuery({
    queryKey: ['/api/installations/geocoded'],
    retry: false,
  });

  // Extract installation data by location from real data
  const installationsByLocation: Record<string, InstallationLocation> = {};
  
  if (geocodedInstallations) {
    geocodedInstallations.forEach((installation: any) => {
      const locationKey = installation.county;
      if (!installationsByLocation[locationKey]) {
        installationsByLocation[locationKey] = {
          location: locationKey,
          count: 0,
          recentInstallations: []
        };
      }
      installationsByLocation[locationKey].count += 1;
      installationsByLocation[locationKey].recentInstallations.push({
        id: installation.id,
        serviceType: installation.serviceType,
        tvSize: installation.tvSize,
        date: new Date(installation.createdAt).toISOString().split('T')[0],
        status: installation.status
      });
    });
  }

  // Sort recent installations by date (most recent first)
  Object.values(installationsByLocation).forEach(location => {
    location.recentInstallations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // Keep only the 5 most recent
    location.recentInstallations = location.recentInstallations.slice(0, 5);
  });

  const locations = Object.values(installationsByLocation);
  const totalInstallations = geocodedInstallations?.length || 0;
  const topLocation = locations.sort((a, b) => b.count - a.count)[0];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'scheduled': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'scheduled': return Calendar;
      default: return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Installations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInstallations}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Locations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{locations.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top Location</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {topLocation?.location || 'N/A'}
                </p>
                {topLocation && (
                  <p className="text-sm text-gray-500">{topLocation.count} installations</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Google Maps Ireland */}
        <div className="lg:col-span-2">
          <GoogleMapsIreland 
            installations={geocodedInstallations || []} 
            isLoading={isLoading}
            showLegend={true}
            height="600px"
          />
        </div>
      </div>

      {/* Location Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Installation Locations</CardTitle>
            <CardDescription>
              Click on a location to view recent installations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Location List */}
              {locations.map((location, index) => (
                <div
                  key={location.location}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedLocation?.location === location.location
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {location.location}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {location.count} {location.count === 1 ? 'installation' : 'installations'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocation(location);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              
              {locations.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No installation locations found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedLocation ? `${selectedLocation.location} Details` : 'Select a Location'}
            </CardTitle>
            <CardDescription>
              {selectedLocation 
                ? `${selectedLocation.count} installations completed`
                : 'Click on a location marker to view details'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLocation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedLocation.count}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Installations</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedLocation.recentInstallations.filter(i => i.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recent Installations
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedLocation.recentInstallations.map((installation, index) => {
                      const StatusIcon = getStatusIcon(installation.status);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(installation.status)}`} />
                            <div>
                              <p className="text-sm font-medium">{installation.tvSize}" {installation.serviceType}</p>
                              <p className="text-xs text-gray-500">{formatDate(installation.date)}</p>
                            </div>
                          </div>
                          <Badge variant={installation.status === 'completed' ? 'default' : 'secondary'}>
                            {installation.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Click on any location marker on the map to view installation details and recent activity.</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {locations.slice(0, 6).map((location, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLocation(location)}
                      className="justify-start"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {location.location} ({location.count})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Statistics by Location</CardTitle>
          <CardDescription>
            Comprehensive breakdown of installations across Ireland
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Location</th>
                  <th className="text-center p-2">Total Installations</th>
                  <th className="text-center p-2">Completed</th>
                  <th className="text-center p-2">Recent Activity</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location, index) => {
                  const completed = location.recentInstallations.filter(i => i.status === 'completed').length;
                  const recentActivity = location.recentInstallations[0];
                  
                  return (
                    <tr 
                      key={index} 
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedLocation(location)}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{location.location}</span>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="secondary">{location.count}</Badge>
                      </td>
                      <td className="text-center p-2">
                        <span className="text-green-600 font-medium">{completed}</span>
                      </td>
                      <td className="text-center p-2 text-sm text-gray-500">
                        {recentActivity ? formatDate(recentActivity.date) : 'No recent activity'}
                      </td>
                      <td className="text-center p-2">
                        <Badge variant={location.count > 5 ? 'default' : 'outline'}>
                          {location.count > 5 ? 'Active' : 'Growing'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}