import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import GoogleMap from '@/components/GoogleMap';
import StaticMapImage, { useStaticMapUrl, useBookingMapUrl } from '@/components/StaticMapImage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Image as ImageIcon, Users } from 'lucide-react';

interface LocationCoordinates {
  lat: number;
  lng: number;
}

// Demo page to showcase Google Maps integration
export default function MapsDemo() {
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const [demoAddress] = useState("1 Grafton Street, Dublin 2, Ireland");
  
  // Sample installer locations around Dublin
  const sampleInstallers = [
    {
      id: 1,
      name: "Dublin TV Services",
      location: { lat: 53.3441, lng: -6.2675 },
      distance: 2.3
    },
    {
      id: 2,
      name: "Professional Mounting Co.",
      location: { lat: 53.3606, lng: -6.2584 },
      distance: 1.8
    },
    {
      id: 3,
      name: "Elite Installation Ltd",
      location: { lat: 53.3331, lng: -6.2489 },
      distance: 3.1
    }
  ];

  // Sample booking markers
  const bookingMarkers = [
    {
      location: { lat: 53.3498, lng: -6.2603 },
      color: '#3B82F6',
      label: 'C',
      title: 'Customer Location',
      info: '<div><strong>Customer:</strong> John Doe<br><strong>Service:</strong> 65" TV Wall Mount<br><strong>Status:</strong> Pending</div>'
    },
    {
      location: { lat: 53.3441, lng: -6.2675 },
      color: '#10B981',
      label: 'I',
      title: 'Installer Location',
      info: '<div><strong>Installer:</strong> Dublin TV Services<br><strong>Distance:</strong> 2.3km<br><strong>Status:</strong> Available</div>'
    }
  ];

  // Demo static map for email template
  const { data: staticMapUrl } = useStaticMapUrl({
    center: { lat: 53.3498, lng: -6.2603 },
    zoom: 12,
    size: { width: 600, height: 300 },
    markers: bookingMarkers,
    mapType: 'roadmap'
  });

  // Demo booking map
  const { data: bookingMapUrl } = useBookingMapUrl(
    demoAddress,
    { lat: 53.3441, lng: -6.2675 }
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Google Maps Integration Demo</h1>
        <p className="text-gray-600">
          Comprehensive demonstration of Google Maps functionality for tradesbook.ie
        </p>
      </div>

      <Tabs defaultValue="interactive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interactive" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Interactive Map</span>
          </TabsTrigger>
          <TabsTrigger value="static" className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Static Maps</span>
          </TabsTrigger>
          <TabsTrigger value="booking" className="flex items-center space-x-2">
            <Navigation className="h-4 w-4" />
            <span>Booking Maps</span>
          </TabsTrigger>
          <TabsTrigger value="installer" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Installer Matching</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Google Map</CardTitle>
              <p className="text-sm text-gray-600">
                Click on the map to select a location. Search for addresses and find nearby installers.
              </p>
            </CardHeader>
            <CardContent>
              <GoogleMap
                center={{ lat: 53.3498, lng: -6.2603 }}
                zoom={12}
                markers={bookingMarkers}
                onLocationSelect={setSelectedLocation}
                height="500px"
                enableAddressSearch={true}
                installerLocations={sampleInstallers}
              />
              
              {selectedLocation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Selected Location:</h4>
                  <p className="text-blue-700">
                    Latitude: {selectedLocation.lat.toFixed(6)}, 
                    Longitude: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="static" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Static Map Image</CardTitle>
                <p className="text-sm text-gray-600">
                  Generated for emails and reports
                </p>
              </CardHeader>
              <CardContent>
                <StaticMapImage
                  center={{ lat: 53.3498, lng: -6.2603 }}
                  zoom={13}
                  size={{ width: 400, height: 300 }}
                  markers={[
                    {
                      location: { lat: 53.3498, lng: -6.2603 },
                      color: 'red',
                      label: '1'
                    }
                  ]}
                  alt="Dublin city center location"
                />
                
                {staticMapUrl && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 break-all">
                      Generated URL: {staticMapUrl}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satellite View</CardTitle>
                <p className="text-sm text-gray-600">
                  Alternative map type for detailed views
                </p>
              </CardHeader>
              <CardContent>
                <StaticMapImage
                  center={{ lat: 53.3498, lng: -6.2603 }}
                  zoom={15}
                  size={{ width: 400, height: 300 }}
                  mapType="satellite"
                  markers={[
                    {
                      location: { lat: 53.3498, lng: -6.2603 },
                      color: 'yellow',
                      label: 'TV'
                    }
                  ]}
                  alt="Satellite view of installation location"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="booking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Location Map</CardTitle>
              <p className="text-sm text-gray-600">
                Shows customer location with nearby installer for booking confirmation emails
              </p>
            </CardHeader>
            <CardContent>
              <StaticMapImage
                customerAddress={demoAddress}
                installerLocation={{ lat: 53.3441, lng: -6.2675 }}
                alt="Booking location with installer"
              />
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Customer: {demoAddress}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Installer: Dublin TV Services (2.3km away)
                  </Badge>
                </div>
              </div>

              {bookingMapUrl && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 break-all">
                    Booking Map URL: {bookingMapUrl}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installer Matching System</CardTitle>
              <p className="text-sm text-gray-600">
                Real-time map showing available installers and customer requests
              </p>
            </CardHeader>
            <CardContent>
              <GoogleMap
                center={{ lat: 53.3498, lng: -6.2603 }}
                zoom={11}
                markers={[
                  // Customer requests
                  {
                    location: { lat: 53.3498, lng: -6.2603 },
                    color: '#DC2626',
                    label: '1',
                    title: 'TV Installation Request',
                    info: '<div><strong>65" TV Wall Mount</strong><br>€180 service<br>Customer rating: 4.8/5<br><em>Click to accept</em></div>'
                  },
                  {
                    location: { lat: 53.3712, lng: -6.2591 },
                    color: '#DC2626',
                    label: '2',
                    title: 'Emergency TV Installation',
                    info: '<div><strong>55" TV Wall Mount</strong><br>€220 service<br>Emergency call<br><em>Click to accept</em></div>'
                  },
                  // Available installers
                  {
                    location: { lat: 53.3441, lng: -6.2675 },
                    color: '#059669',
                    label: 'A',
                    title: 'Dublin TV Services',
                    info: '<div><strong>Available</strong><br>Rating: 4.9/5<br>15 jobs completed<br><em>Online now</em></div>'
                  },
                  {
                    location: { lat: 53.3606, lng: -6.2584 },
                    color: '#059669',
                    label: 'B',
                    title: 'Professional Mounting Co.',
                    info: '<div><strong>Available</strong><br>Rating: 4.7/5<br>23 jobs completed<br><em>Online now</em></div>'
                  }
                ]}
                height="500px"
                installerLocations={sampleInstallers}
              />
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="font-semibold text-red-900">Customer Requests</span>
                  </div>
                  <p className="text-sm text-red-700">
                    2 active installation requests in your area
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="font-semibold text-green-900">Available Installers</span>
                  </div>
                  <p className="text-sm text-green-700">
                    3 installers online and ready to accept jobs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Google Maps API Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Address Geocoding</h4>
              <p className="text-sm text-gray-600">
                Convert addresses to coordinates for precise location mapping
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Static Map Generation</h4>
              <p className="text-sm text-gray-600">
                Create map images for emails, reports, and mobile-friendly displays
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Distance Calculation</h4>
              <p className="text-sm text-gray-600">
                Calculate distances between customers and installers for optimal matching
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Interactive Maps</h4>
              <p className="text-sm text-gray-600">
                Full-featured maps with markers, info windows, and user interactions
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Irish Address Validation</h4>
              <p className="text-sm text-gray-600">
                Verify addresses are within Ireland for service area validation
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Batch Processing</h4>
              <p className="text-sm text-gray-600">
                Process multiple addresses efficiently for installer coverage analysis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}