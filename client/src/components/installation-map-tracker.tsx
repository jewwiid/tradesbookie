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

// Irish counties with SVG coordinates for accurate map positioning
const IRELAND_LOCATIONS: Record<string, { x: number; y: number; county: string }> = {
  'Dublin': { x: 190, y: 180, county: 'Dublin' },
  'Cork': { x: 90, y: 320, county: 'Cork' },
  'Galway': { x: 50, y: 200, county: 'Galway' },
  'Limerick': { x: 80, y: 260, county: 'Limerick' },
  'Waterford': { x: 140, y: 280, county: 'Waterford' },
  'Kilkenny': { x: 160, y: 260, county: 'Kilkenny' },
  'Wexford': { x: 180, y: 300, county: 'Wexford' },
  'Carlow': { x: 170, y: 240, county: 'Carlow' },
  'Kildare': { x: 170, y: 200, county: 'Kildare' },
  'Laois': { x: 150, y: 220, county: 'Laois' },
  'Meath': { x: 180, y: 160, county: 'Meath' },
  'Wicklow': { x: 200, y: 220, county: 'Wicklow' },
  'Offaly': { x: 140, y: 200, county: 'Offaly' },
  'Westmeath': { x: 160, y: 180, county: 'Westmeath' },
  'Longford': { x: 140, y: 160, county: 'Longford' },
  'Louth': { x: 200, y: 140, county: 'Louth' },
  'Cavan': { x: 160, y: 140, county: 'Cavan' },
  'Monaghan': { x: 180, y: 120, county: 'Monaghan' },
  'Donegal': { x: 120, y: 80, county: 'Donegal' },
  'Sligo': { x: 100, y: 120, county: 'Sligo' },
  'Leitrim': { x: 120, y: 140, county: 'Leitrim' },
  'Roscommon': { x: 110, y: 180, county: 'Roscommon' },
  'Mayo': { x: 80, y: 140, county: 'Mayo' },
  'Clare': { x: 70, y: 240, county: 'Clare' },
  'Kerry': { x: 50, y: 300, county: 'Kerry' },
  'Tipperary': { x: 120, y: 240, county: 'Tipperary' },
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
              <svg viewBox="0 0 300 400" className="w-full h-full">
                {/* Accurate Ireland outline */}
                <path
                  d="M150 20 L160 25 L170 30 L180 35 L190 45 L200 55 L210 65 L220 75 L225 85 L230 95 L235 105 L240 115 L245 125 L250 135 L252 145 L254 155 L255 165 L256 175 L255 185 L254 195 L252 205 L250 215 L248 225 L245 235 L242 245 L238 255 L234 265 L230 275 L225 285 L220 295 L214 305 L208 315 L200 325 L192 335 L184 345 L175 355 L165 365 L155 370 L145 375 L135 378 L125 380 L115 378 L105 375 L95 370 L85 365 L75 355 L65 345 L57 335 L50 325 L44 315 L40 305 L37 295 L35 285 L34 275 L33 265 L32 255 L31 245 L30 235 L29 225 L28 215 L27 205 L26 195 L25 185 L24 175 L23 165 L22 155 L21 145 L20 135 L19 125 L18 115 L17 105 L16 95 L15 85 L14 75 L13 65 L12 55 L11 45 L10 35 L15 30 L25 25 L35 22 L45 20 L55 19 L65 18 L75 17 L85 16 L95 15 L105 14 L115 13 L125 12 L135 11 L145 15 Z"
                  fill="rgba(34, 197, 94, 0.1)"
                  stroke="rgba(34, 197, 94, 0.3)"
                  strokeWidth="2"
                />
                
                {/* Northern Ireland outline */}
                <path
                  d="M180 70 L190 65 L200 62 L210 60 L220 58 L230 56 L240 55 L250 54 L260 53 L270 52 L275 58 L280 65 L285 72 L290 80 L292 88 L294 96 L295 104 L296 112 L295 120 L294 128 L292 136 L290 144 L285 152 L280 159 L275 165 L270 170 L260 174 L250 177 L240 179 L230 180 L220 181 L210 182 L200 183 L190 184 L185 178 L182 170 L180 162 L179 154 L178 146 L177 138 L176 130 L175 122 L174 114 L173 106 L172 98 L171 90 L170 82 L175 75 Z"
                  fill="rgba(156, 163, 175, 0.2)"
                  stroke="rgba(156, 163, 175, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                
                {/* Location markers */}
                {locations.map((location, index) => {
                  const coords = IRELAND_LOCATIONS[location.location];
                  if (!coords) return null;
                  
                  const size = Math.min(Math.max(location.count * 2, 8), 20);
                  
                  return (
                    <g key={location.location}>
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={size}
                        fill={selectedLocation?.location === location.location ? "#ef4444" : "#3b82f6"}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200 hover:fill-red-500"
                        onClick={() => setSelectedLocation(location)}
                      />
                      <text
                        x={coords.x}
                        y={coords.y + size + 15}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                      >
                        {location.location}
                      </text>
                      <text
                        x={coords.x}
                        y={coords.y + size + 25}
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