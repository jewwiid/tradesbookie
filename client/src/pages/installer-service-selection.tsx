import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Tv, 
  Wrench, 
  Home, 
  Car, 
  Lightbulb, 
  Wind,
  Shield,
  Plus,
  Clock,
  CheckCircle2
} from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  active: boolean;
  avgEarnings: string;
  demandLevel: 'high' | 'medium' | 'low';
  jobsAvailable: number;
  setupTime: string;
}

const defaultServices: ServiceType[] = [
  {
    id: 'tv-installation',
    name: 'TV Installation',
    description: 'Mount TVs, setup sound systems, and install streaming devices',
    icon: Tv,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    active: true,
    avgEarnings: '€120-200',
    demandLevel: 'high',
    jobsAvailable: 45,
    setupTime: '5 min'
  },
  {
    id: 'home-security',
    name: 'Home Security Systems',
    description: 'Install CCTV, alarms, smart locks, and security equipment',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    active: false,
    avgEarnings: '€150-300',
    demandLevel: 'high',
    jobsAvailable: 0,
    setupTime: 'Coming soon'
  },
  {
    id: 'smart-home',
    name: 'Smart Home Setup',
    description: 'Install smart thermostats, lighting, and home automation',
    icon: Home,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    active: false,
    avgEarnings: '€100-250',
    demandLevel: 'medium',
    jobsAvailable: 0,
    setupTime: 'Coming soon'
  },
  {
    id: 'electrical',
    name: 'Electrical Services',
    description: 'Install outlets, switches, ceiling fans, and lighting fixtures',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    active: false,
    avgEarnings: '€80-180',
    demandLevel: 'high',
    jobsAvailable: 0,
    setupTime: 'Coming soon'
  },
  {
    id: 'hvac',
    name: 'HVAC Installation',
    description: 'Install air conditioning units, heating systems, and ventilation',
    icon: Wind,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    active: false,
    avgEarnings: '€200-400',
    demandLevel: 'medium',
    jobsAvailable: 0,
    setupTime: 'Coming soon'
  },
  {
    id: 'automotive',
    name: 'Automotive Electronics',
    description: 'Install car audio, dashcams, GPS systems, and accessories',
    icon: Car,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    active: false,
    avgEarnings: '€60-150',
    demandLevel: 'low',
    jobsAvailable: 0,
    setupTime: 'Coming soon'
  }
];

export default function InstallerServiceSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Real-time service metrics tracking (preserved for future analytics dashboard)
  // Currently tracking but not displaying avgEarnings and jobsAvailable per user request
  const { data: serviceMetrics } = useQuery({
    queryKey: ['/api/service-metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch active service types from database
  const { data: activeServiceTypes } = useQuery({
    queryKey: ['/api/service-types/active'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Convert metrics to lookup map for easy access
  const metricsMap = serviceMetrics?.reduce((acc: any, metric: any) => {
    acc[metric.serviceType.key] = metric;
    return acc;
  }, {}) || {};

  // Merge default services with real-time data
  // Note: Real-time avgEarnings and jobsAvailable data is still being tracked
  // but hidden from UI per user request. This data can be used for admin analytics.
  const services = defaultServices.map(service => {
    const metrics = metricsMap[service.id];
    const isActiveInDb = activeServiceTypes?.some((st: any) => st.key === service.id && st.isActive);
    
    return {
      ...service,
      active: isActiveInDb || service.id === 'tv-installation', // Keep TV installation always active
      // Real-time data still available for backend analytics:
      // avgEarnings: metrics ? `€${metrics.avgEarningsLow}-${metrics.avgEarningsHigh}` : service.avgEarnings,
      // jobsAvailable: metrics ? metrics.totalJobsAvailable : service.jobsAvailable,
      setupTime: service.active || isActiveInDb ? service.setupTime : 'Coming soon'
    };
  });

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service?.active) {
      toast({
        title: "Service Coming Soon",
        description: "This service type will be available in the future. TV Installation is currently available.",
        variant: "default"
      });
      return;
    }
    
    setSelectedService(serviceId);
    
    // Auto-scroll to the selected card for better UX
    setTimeout(() => {
      const selectedCard = document.querySelector(`[data-service-id="${serviceId}"]`);
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleContinue = () => {
    if (!selectedService) {
      toast({
        title: "Select a Service",
        description: "Please select a service type to continue with registration.",
        variant: "destructive"
      });
      return;
    }

    // Redirect to registration with selected service
    setLocation(`/installer-registration?service=${selectedService}`);
  };

  const getDemandBadge = (demandLevel: 'high' | 'medium' | 'low') => {
    switch (demandLevel) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800 border-green-300">High Demand</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium Demand</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Growing</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/installer-login" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Installer Login
          </Link>
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Service Type
          </h1>
          <p className="text-xl text-gray-600 mb-2 max-w-3xl mx-auto">
            Select the type of installation service you want to offer. You can expand to other services later.
          </p>
          <p className="text-sm text-gray-500">
            Each service type has different requirements, earning potential, and setup processes
          </p>
        </div>

        {/* Service Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {services.map((service) => {
            const IconComponent = service.icon;
            const isSelected = selectedService === service.id;
            const isDisabled = !service.active;
            
            return (
              <Card 
                key={service.id}
                data-service-id={service.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2 transform scale-105 shadow-xl' : ''
                } ${
                  isDisabled ? 'opacity-60' : 'hover:scale-105'
                } ${service.borderColor}`}
                onClick={() => handleServiceSelect(service.id)}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {!service.active && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  </div>
                )}
                
                <CardContent className={`p-6 ${service.bgColor}`}>
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 ${service.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 border ${service.borderColor}`}>
                      <IconComponent className={`w-8 h-8 ${service.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {service.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Setup Time
                      </span>
                      <span className="font-semibold text-gray-900">
                        {service.setupTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Market Demand</span>
                      {getDemandBadge(service.demandLevel)}
                    </div>
                    
                    {service.active && isSelected && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Button 
                          onClick={handleContinue}
                          className="w-full bg-primary hover:bg-primary/90 text-sm font-semibold"
                          size="sm"
                        >
                          Continue with {service.name}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Admin Add Service Card (placeholder) */}
          <Card className="cursor-not-allowed opacity-50 border-dashed border-2">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">
                More Services Coming
              </h3>
              <p className="text-gray-400 text-sm">
                Additional service types will be added by our admin team based on market demand
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="text-center max-w-md mx-auto">
          <Button 
            onClick={handleContinue}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold mb-4"
            disabled={!selectedService}
          >
            {selectedService ? 'Continue with Registration' : 'Select a Service Type'}
          </Button>
          
          {selectedService && (
            <p className="text-sm text-gray-600">
              You selected: <strong>{services.find(s => s.id === selectedService)?.name}</strong>
              <br />
              Next: Complete your installer profile and wait for approval
            </p>
          )}
        </div>

        {/* Help Text */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h4 className="font-semibold text-blue-900 mb-3">How it works:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <p><strong>Choose Service</strong><br/>Select your area of expertise</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-blue-600">2</span>
                  </div>
                  <p><strong>Register & Setup</strong><br/>Complete your profile and verification</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-blue-600">3</span>
                  </div>
                  <p><strong>Start Earning</strong><br/>Get approved and start accepting jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}