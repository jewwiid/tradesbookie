import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, TrendingUp, Calendar, Monitor, CheckCircle, Clock, AlertCircle } from "lucide-react";

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

// Irish counties with approximate coordinates for visualization
const IRELAND_LOCATIONS: Record<string, { lat: number; lng: number; county: string }> = {
  'Dublin': { lat: 53.3498, lng: -6.2603, county: 'Dublin' },
  'Cork': { lat: 51.8985, lng: -8.4756, county: 'Cork' },
  'Galway': { lat: 53.2707, lng: -9.0568, county: 'Galway' },
  'Limerick': { lat: 52.6638, lng: -8.6267, county: 'Limerick' },
  'Waterford': { lat: 52.2593, lng: -7.1101, county: 'Waterford' },
  'Kilkenny': { lat: 52.6541, lng: -7.2448, county: 'Kilkenny' },
  'Wexford': { lat: 52.3369, lng: -6.4633, county: 'Wexford' },
  'Carlow': { lat: 52.8408, lng: -6.9269, county: 'Carlow' },
  'Kildare': { lat: 53.1581, lng: -6.9115, county: 'Kildare' },
  'Laois': { lat: 53.0344, lng: -7.2992, county: 'Laois' },
  'Meath': { lat: 53.6055, lng: -6.6578, county: 'Meath' },
  'Wicklow': { lat: 52.9808, lng: -6.0426, county: 'Wicklow' },
  'Offaly': { lat: 53.2736, lng: -7.7906, county: 'Offaly' },
  'Westmeath': { lat: 53.5428, lng: -7.3411, county: 'Westmeath' },
  'Longford': { lat: 53.7289, lng: -7.7956, county: 'Longford' },
  'Louth': { lat: 53.8578, lng: -6.3481, county: 'Louth' },
  'Cavan': { lat: 53.9901, lng: -7.3609, county: 'Cavan' },
  'Monaghan': { lat: 54.2489, lng: -6.9688, county: 'Monaghan' },
  'Donegal': { lat: 54.6566, lng: -8.1105, county: 'Donegal' },
  'Sligo': { lat: 54.2697, lng: -8.4694, county: 'Sligo' },
  'Leitrim': { lat: 54.0199, lng: -8.0739, county: 'Leitrim' },
  'Roscommon': { lat: 53.6279, lng: -8.1951, county: 'Roscommon' },
  'Mayo': { lat: 53.8544, lng: -9.2965, county: 'Mayo' },
  'Clare': { lat: 52.8454, lng: -8.9811, county: 'Clare' },
  'Kerry': { lat: 52.1665, lng: -9.7047, county: 'Kerry' },
  'Tipperary': { lat: 52.4731, lng: -8.1600, county: 'Tipperary' },
};

export default function InstallationMapTracker() {
  const [selectedLocation, setSelectedLocation] = useState<InstallationLocation | null>(null);

  const { data: locations = [], isLoading } = useQuery<InstallationLocation[]>({
    queryKey: ["/api/installations/locations"],
  });

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

  const totalInstallations = locations.reduce((sum, loc) => sum + loc.count, 0);
  const topLocation = locations[0];

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
        {/* Interactive Ireland Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Installation Coverage Map
            </CardTitle>
            <CardDescription>
              Privacy-protected view showing city and county data only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-b from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg p-4 h-96 overflow-hidden">
              {/* SVG Map of Ireland */}
              <svg viewBox="0 0 400 500" className="w-full h-full">
                {/* Simplified Ireland outline */}
                <path
                  d="M100 50 Q150 30 200 50 Q250 40 300 60 Q320 80 330 120 Q340 160 320 200 Q310 240 290 280 Q270 320 250 360 Q230 400 200 420 Q170 440 140 430 Q110 420 90 380 Q70 340 80 300 Q85 260 90 220 Q95 180 90 140 Q85 100 100 50Z"
                  fill="rgba(34, 197, 94, 0.1)"
                  stroke="rgba(34, 197, 94, 0.3)"
                  strokeWidth="2"
                />
                
                {/* Location markers */}
                {locations.map((location, index) => {
                  const coords = IRELAND_LOCATIONS[location.location];
                  if (!coords) return null;
                  
                  // Convert lat/lng to SVG coordinates (simplified)
                  const x = ((coords.lng + 10.5) / 4.5) * 400;
                  const y = ((55.5 - coords.lat) / 5) * 500;
                  const size = Math.min(Math.max(location.count * 2, 8), 20);
                  
                  return (
                    <g key={location.location}>
                      <circle
                        cx={x}
                        cy={y}
                        r={size}
                        fill={selectedLocation?.location === location.location ? "#ef4444" : "#3b82f6"}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200 hover:fill-red-500"
                        onClick={() => setSelectedLocation(location)}
                      />
                      <text
                        x={x}
                        y={y + size + 15}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                      >
                        {location.location}
                      </text>
                      <text
                        x={x}
                        y={y + size + 25}
                        textAnchor="middle"
                        className="text-xs fill-gray-500"
                      >
                        {location.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
                <h4 className="text-sm font-semibold mb-2">Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Installation locations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Selected location</span>
                  </div>
                  <p className="text-gray-500 mt-1">Marker size = installation count</p>
                </div>
              </div>
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