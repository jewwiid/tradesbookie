import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WandSparkles, CheckCircle, Camera, CalendarDays, Wrench, Tv, Medal, Award, Crown } from 'lucide-react';
import { formatPrice, SERVICE_TIERS } from '@/lib/constants';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative typeform-gradient-bg py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-fade-in">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                See Your TV on the Wall{' '}
                <span className="gradient-text">Before You Book</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Upload a photo of your room and our AI will show you exactly how your new TV will look mounted on your wall. Professional installation guaranteed.
              </p>
              <Link href="/booking">
                <Button size="lg" className="btn-primary">
                  <WandSparkles className="h-5 w-5 mr-3" />
                  Start AI Preview
                </Button>
              </Link>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AI Room Preview
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Professional Install
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Instant Booking
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Modern living room with mounted TV"
                className="rounded-3xl shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              <Card className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-800">AI Preview Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Choose Your Installation Service</h2>
            <p className="text-xl text-gray-600">Professional TV mounting and installation services with transparent pricing</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Table Top Installation */}
            <Card className="service-card table-top hover:shadow-lg transition-all duration-300">
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tv className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Table Top Setup</h3>
                <p className="text-gray-600 mb-4">Perfect for smaller TVs and simple setups</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span>Up to 43"</span>
                    <span className="font-semibold">{formatPrice(8900)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>43" and above</span>
                    <span className="font-semibold">{formatPrice(10900)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bronze Mounting */}
            <Card className="service-card bronze hover:shadow-lg transition-all duration-300">
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Medal className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bronze Mount</h3>
                <p className="text-gray-600 mb-4">Fixed wall mounting for medium TVs</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span>Up to 42"</span>
                    <span className="font-semibold">{formatPrice(10900)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Silver Mounting */}
            <Card className="service-card silver hover:shadow-lg transition-all duration-300 relative">
              <div className="absolute top-4 right-4 bg-primary text-white text-xs px-2 py-1 rounded-full">Popular</div>
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Silver Mount</h3>
                <p className="text-gray-600 mb-4">Tilting mount with cable management</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span>43"-85"</span>
                    <span className="font-semibold">{formatPrice(15900)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>85"+ Large</span>
                    <span className="font-semibold">{formatPrice(25900)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gold Mounting */}
            <Card className="service-card gold hover:shadow-lg transition-all duration-300 md:col-span-2 lg:col-span-1">
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gold Mount</h3>
                <p className="text-gray-600 mb-4">Full motion mount with premium features</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span>Standard Size</span>
                    <span className="font-semibold">{formatPrice(25900)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>85"+ Premium</span>
                    <span className="font-semibold">{formatPrice(35900)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 typeform-gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple 3-step process to get your TV professionally mounted</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Upload & Preview</h3>
              <p className="text-gray-600">Take a photo of your room and let our AI show you how your TV will look mounted on the wall</p>
            </div>
            
            <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-gradient-to-r from-secondary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Book & Schedule</h3>
              <p className="text-gray-600">Choose your service tier, select your preferred date and time, and complete your booking</p>
            </div>
            
            <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Professional Install</h3>
              <p className="text-gray-600">Our certified installer arrives on time and mounts your TV exactly as previewed</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
