import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import InstallationMapTracker from "@/components/installation-map-tracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, BarChart3 } from "lucide-react";

export default function InstallationTracker() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Installation Tracker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Interactive map showing TV installation locations across Ireland. 
            Privacy-protected view displaying only city and county data.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <CardTitle>Interactive Map</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Click on location markers to explore installation details and recent activity across Ireland
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>Real-Time Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Live installation statistics showing completion rates and trending locations
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <CardTitle>Privacy Protected</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Only city and county data shown to protect customer privacy while showing coverage
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Main Tracker Component */}
        <InstallationMapTracker />

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">About Installation Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This tracker shows aggregate installation data across Ireland to help customers 
                understand our service coverage and installer network strength.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Privacy First</h4>
                  <p className="text-gray-500">
                    We only display city and county information to protect customer privacy 
                    while demonstrating our nationwide coverage.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Live Updates</h4>
                  <p className="text-gray-500">
                    Installation data is updated in real-time as our certified installers 
                    complete jobs across the country.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}