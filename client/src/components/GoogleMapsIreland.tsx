import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Tv } from 'lucide-react';

interface Installation {
  id: number;
  address: string;
  county: string;
  lat: number;
  lng: number;
  serviceType: string;
  totalPrice: string;
  status: string;
  createdAt: string;
  tvSize: string;
}

interface GoogleMapsIrelandProps {
  installations: Installation[];
  isLoading?: boolean;
  showLegend?: boolean;
  height?: string;
}

export default function GoogleMapsIreland({ 
  installations, 
  isLoading = false, 
  showLegend = true,
  height = "500px"
}: GoogleMapsIrelandProps) {
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Installation Map...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
            style={{ height }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Ireland Installation Coverage
          <Badge variant="secondary">{installations.length} active installations</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-4" style={{ minHeight: height }}>
          {/* Installation List */}
          <div className="lg:col-span-2 space-y-3 max-h-96 overflow-y-auto">
            {installations.length > 0 ? (
              installations.map((installation, index) => (
                <div 
                  key={installation.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedInstallation?.id === installation.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedInstallation(installation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {installation.county}
                        </span>
                        <Badge variant={
                          installation.status === 'completed' ? 'default' : 
                          installation.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {installation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {installation.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Tv className="h-3 w-3" />
                          {installation.tvSize}" {installation.serviceType}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(installation.createdAt).toLocaleDateString('en-IE')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No installation data available</p>
              </div>
            )}
          </div>

          {/* Installation Details */}
          <div className="lg:col-span-1">
            {selectedInstallation ? (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Installation Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedInstallation.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Service</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedInstallation.tvSize}" {selectedInstallation.serviceType} Installation
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                    <Badge variant={
                      selectedInstallation.status === 'completed' ? 'default' : 
                      selectedInstallation.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {selectedInstallation.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Date</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedInstallation.createdAt).toLocaleDateString('en-IE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-center">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Select an installation to view details</p>
              </div>
            )}
          </div>
        </div>

        {showLegend && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Installation Status Legend</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="default">Completed</Badge>
                <span className="text-gray-600">Installation finished</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">In Progress</Badge>
                <span className="text-gray-600">Currently being installed</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Pending</Badge>
                <span className="text-gray-600">Awaiting installation</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}