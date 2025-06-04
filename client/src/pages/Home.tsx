import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import ServiceTierCard from "@/components/ServiceTierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, Camera, Calendar, Bolt, CheckCircle, Star, Medal, Award, Crown } from "lucide-react";

export default function Home() {
  const [customerLoginOpen, setCustomerLoginOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  const serviceTiers = [
    {
      key: "table-top",
      name: "Table Top Setup",
      description: "Perfect for smaller TVs and simple setups",
      icon: <Tv className="text-2xl text-blue-600" />,
      gradient: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      pricing: [
        { label: "Up to 43\"", price: 89 },
        { label: "43\" and above", price: 109 }
      ]
    },
    {
      key: "bronze",
      name: "Bronze Mount",
      description: "Fixed wall mounting for medium TVs",
      icon: <Medal className="text-2xl text-amber-600" />,
      gradient: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      pricing: [
        { label: "Up to 42\"", price: 109 }
      ]
    },
    {
      key: "silver",
      name: "Silver Mount",
      description: "Tilting mount with cable management",
      icon: <Award className="text-2xl text-gray-600" />,
      gradient: "from-gray-50 to-slate-50",
      border: "border-gray-200",
      popular: true,
      pricing: [
        { label: "43\"-85\"", price: 159 },
        { label: "85\"+ Large", price: 259 }
      ]
    },
    {
      key: "gold",
      name: "Gold Mount",
      description: "Full motion mount with premium features",
      icon: <Crown className="text-2xl text-yellow-600" />,
      gradient: "from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      pricing: [
        { label: "Standard Size", price: 259 },
        { label: "85\"+ Premium", price: 359 }
      ]
    }
  ];

  const handleCustomerLogin = () => {
    setCustomerLoginOpen(false);
    // In a real app, this would validate credentials and redirect
    window.location.href = "/customer/demo-token";
  };

  const handleAdminLogin = () => {
    setAdminLoginOpen(false);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        onCustomerLogin={() => setCustomerLoginOpen(true)}
        onAdminLogin={() => setAdminLoginOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                See Your TV on the Wall{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Before You Book
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Upload a photo of your room and our AI will show you exactly how your new TV will look mounted on your wall. Professional installation guaranteed.
              </p>
              <Link href="/booking">
                <Button className="inline-flex items-center bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                  <Camera className="mr-3 h-5 w-5" />
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
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Modern living room with mounted TV" 
                className="rounded-3xl shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-800">AI Preview Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Installation Service
            </h2>
            <p className="text-xl text-gray-600">
              Professional TV mounting and installation services with transparent pricing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceTiers.map((tier) => (
              <ServiceTierCard key={tier.key} {...tier} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple 3-step process to get your TV professionally mounted
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Upload & Preview</h3>
              <p className="text-gray-600">
                Take a photo of your room and let our AI show you how your TV will look mounted on the wall
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Book & Schedule</h3>
              <p className="text-gray-600">
                Choose your service tier, select your preferred date and time, and complete your booking
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bolt className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Professional Install</h3>
              <p className="text-gray-600">
                Our certified installer arrives on time and mounts your TV exactly as previewed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Login Modal */}
      <Dialog open={customerLoginOpen} onOpenChange={setCustomerLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Customer Access</DialogTitle>
            <p className="text-gray-600 text-center">Enter your booking details or scan your QR code</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input id="bookingId" placeholder="BK-2024-001" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setCustomerLoginOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCustomerLogin}>
                Access Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Login Modal */}
      <Dialog open={adminLoginOpen} onOpenChange={setAdminLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Admin Login</DialogTitle>
            <p className="text-gray-600 text-center">Access the admin dashboard</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="admin" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setAdminLoginOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdminLogin}>
                Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
