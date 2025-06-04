import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Home, MapPin, Star, Euro, Calendar } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { useLocation } from "wouter";

export default function InstallerDashboard() {
  const [, setLocation] = useLocation();
  const [jobFilter, setJobFilter] = useState('all');

  // Mock installer data for demo purposes
  const installerStats = {
    monthlyJobs: 18,
    earnings: "2,850",
    rating: "4.9"
  };

  // Mock jobs data
  const jobs = [
    {
      id: 1,
      customer: "Emma Wilson",
      service: "Gold Mount - 65\" TV",
      address: "123 Oak Street, Dublin 4",
      earning: "220.15",
      date: "Dec 16, 2:00 PM",
      status: "new",
      originalImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      aiPreview: "https://images.unsplash.com/photo-1567016432779-094069958ea5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: 2,
      customer: "Mike Johnson",
      service: "Bronze Mount - 43\" TV",
      address: "456 Pine Road, Dublin 2",
      earning: "92.65",
      date: "Tomorrow, 10:00 AM",
      status: "accepted",
      notes: "Please ring the doorbell twice. TV is already unboxed in the living room.",
      originalImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      aiPreview: "https://images.unsplash.com/photo-1567016432779-094069958ea5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    },
    {
      id: 3,
      customer: "Sarah Davis",
      service: "Silver Mount - 55\" TV + Cable Concealment",
      address: "789 Elm Avenue, Dublin 8",
      earning: "177.35",
      date: "Dec 13, Completed",
      status: "completed",
      originalImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      completedImage: "https://images.unsplash.com/photo-1567016432779-094069958ea5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleAcceptJob = (jobId: number) => {
    console.log(`Accepting job ${jobId}`);
    // In a real app, this would make an API call
  };

  const handleCompleteJob = (jobId: number) => {
    console.log(`Completing job ${jobId}`);
    // In a real app, this would make an API call
  };

  const handleViewRoute = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const filteredJobs = jobFilter === 'all' ? jobs : jobs.filter(job => job.status === jobFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">Installer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <Home className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">T</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Tom Mitchell</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jobs This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{installerStats.monthlyJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">€{installerStats.earnings}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{installerStats.rating}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assigned Jobs</CardTitle>
              <div className="flex space-x-2">
                {['all', 'new', 'accepted', 'completed'].map((filter) => (
                  <Button
                    key={filter}
                    variant={jobFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setJobFilter(filter)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className={`${
                  job.status === 'accepted' ? 'border-green-200 bg-green-50' : 
                  job.status === 'completed' ? 'opacity-75' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.customer}</h3>
                          <Badge className={getStatusBadge(job.status)}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{job.service}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">€{job.earning}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {job.date}
                        </p>
                      </div>
                    </div>

                    {job.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Customer Notes</p>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                          {job.notes}
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          {job.status === 'completed' ? 'Before' : 'Customer Photo'}
                        </p>
                        <img 
                          src={job.originalImage} 
                          alt="Customer room photo"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          {job.status === 'completed' ? 'After (Your Work)' : 'AI Preview'}
                        </p>
                        <img 
                          src={job.status === 'completed' ? job.completedImage : job.aiPreview} 
                          alt={job.status === 'completed' ? 'Completed installation' : 'AI preview'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewRoute(job.address)}
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        View Route
                      </Button>
                      
                      <div className="space-x-2">
                        {job.status === 'new' && (
                          <Button 
                            onClick={() => handleAcceptJob(job.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept Job
                          </Button>
                        )}
                        {job.status === 'accepted' && (
                          <Button 
                            onClick={() => handleCompleteJob(job.id)}
                            className="bg-primary hover:bg-blue-600"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
