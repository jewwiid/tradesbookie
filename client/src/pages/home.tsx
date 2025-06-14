import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Tv, Camera, Calendar, Bolt, Star, CheckCircle, Users, Settings } from "lucide-react";

export default function Home() {
  const serviceTiers = [
    {
      id: "table-top",
      title: "Table Top Setup",
      description: "Perfect for smaller TVs and simple setups",
      icon: <Tv className="w-8 h-8" />,
      color: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      prices: [
        { size: "Up to 43\"", price: "€89" },
        { size: "43\" and above", price: "€109" }
      ]
    },
    {
      id: "bronze",
      title: "Bronze Mount",
      description: "Fixed wall mounting for medium TVs",
      icon: <Star className="w-8 h-8" />,
      color: "from-amber-50 to-orange-50",
      borderColor: "border-amber-100",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      prices: [
        { size: "Up to 42\"", price: "€109" }
      ]
    },
    {
      id: "silver",
      title: "Silver Mount",
      description: "Tilting mount with cable management",
      icon: <Bolt className="w-8 h-8" />,
      color: "from-gray-50 to-slate-50",
      borderColor: "border-gray-200",
      iconBg: "bg-gray-200",
      iconColor: "text-gray-600",
      popular: true,
      prices: [
        { size: "43\"-85\"", price: "€159" },
        { size: "85\"+ Large", price: "€259" }
      ]
    },
    {
      id: "gold",
      title: "Gold Mount",
      description: "Full motion mount with premium features",
      icon: <Star className="w-8 h-8" />,
      color: "from-yellow-50 to-amber-50",
      borderColor: "border-yellow-200",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      prices: [
        { size: "Standard Size", price: "€259" },
        { size: "85\"+ Premium", price: "€359" }
      ]
    }
  ];

  const howItWorksSteps = [
    {
      icon: <Camera className="w-8 h-8 text-white" />,
      title: "Upload & Preview",
      description: "Take a photo of your room and let our AI show you how your TV will look mounted on the wall",
      gradient: "from-primary to-blue-600"
    },
    {
      icon: <Calendar className="w-8 h-8 text-white" />,
      title: "Book & Schedule",
      description: "Choose your service tier, select your preferred date and time, and complete your booking",
      gradient: "from-secondary to-purple-600"
    },
    {
      icon: <Bolt className="w-8 h-8 text-white" />,
      title: "Professional Install",
      description: "Our certified installer arrives on time and mounts your TV exactly as previewed",
      gradient: "from-success to-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Tv className="w-8 h-8 text-primary mr-3" />
              <span className="text-xl font-bold text-foreground">SmartTVMount</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How it Works</a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
              <Link href="/installer/1" className="text-muted-foreground hover:text-primary transition-colors">Installers</Link>
              <Link href="/customer">
                <Button variant="outline" size="sm">Customer Login</Button>
              </Link>
              <Link href="/admin">
                <Button size="sm">Admin</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative hero-gradient py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left slide-up">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
                See Your TV on the Wall{" "}
                <span className="gradient-bg bg-clip-text text-transparent">Before You Book</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Upload a photo of your room and our AI will show you exactly how your new TV will look mounted on your wall. Professional installation guaranteed.
              </p>
              <Link href="/booking">
                <Button size="lg" className="gradient-bg text-lg px-8 py-4 h-auto rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                  <Camera className="w-5 h-5 mr-3" />
                  Start AI Preview
                </Button>
              </Link>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  AI Room Preview
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Professional Install
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Instant Booking
                </div>
              </div>
            </div>
            <div className="relative scale-in">
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern living room with mounted TV" 
                className="rounded-3xl shadow-2xl w-full object-cover h-96"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full pulse-primary"></div>
                  <span className="text-sm font-medium text-foreground">AI Preview Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers Section */}
      <section id="pricing" className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Choose Your Installation Service</h2>
            <p className="text-xl text-muted-foreground">Professional TV mounting and installation services with transparent pricing</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceTiers.map((tier, index) => (
              <Card key={tier.id} className={`pricing-card ${tier.popular ? 'popular' : ''} fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">Popular</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className={`w-16 h-16 ${tier.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <div className={tier.iconColor}>{tier.icon}</div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{tier.title}</h3>
                    <p className="text-muted-foreground mb-4 text-sm">{tier.description}</p>
                    <div className="space-y-2">
                      {tier.prices.map((price, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{price.size}</span>
                          <span className="font-semibold text-foreground">{price.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple 3-step process to get your TV professionally mounted</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{index + 1}. {step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-card">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">See how your TV will look before booking your professional installation</p>
            <Link href="/booking">
              <Button size="lg" className="gradient-bg text-lg px-8 py-4 h-auto rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                Start Your Booking Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">
            <div className="flex items-center justify-center mb-4">
              <Tv className="w-6 h-6 text-primary mr-2" />
              <span className="font-semibold">SmartTVMount</span>
            </div>
            <p>&copy; 2024 SmartTVMount. Professional TV installation services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
