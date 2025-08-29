import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Tv, User } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns";

interface ScheduledInstallation {
  id: number;
  bookingId: number;
  customerName: string;
  address: string;
  scheduledDate: string;
  scheduledTime?: string;
  tvSize: string;
  serviceType: string;
  status: string;
  estimatedTotal: string;
  eventType?: string;
  isProposed?: boolean;
  isConfirmed?: boolean;
}

interface InstallerScheduleCalendarProps {
  installerId?: number;
}

const InstallerScheduleCalendar = ({ installerId }: InstallerScheduleCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch scheduled installations for calendar
  const { data: scheduledInstallsData = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/installer/${installerId}/schedule-calendar`],
    enabled: !!installerId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Type the query response
  const scheduledInstalls = scheduledInstallsData as ScheduledInstallation[];

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group installations by date (including both confirmed and proposed)
  const installationsByDate = scheduledInstalls.reduce((acc: Record<string, ScheduledInstallation[]>, install: ScheduledInstallation) => {
    // Handle both string dates and date objects
    const installDate = typeof install.scheduledDate === 'string' 
      ? install.scheduledDate.split(' ')[0]  // Extract just the date part from "2025-08-23 00:00:00"
      : format(new Date(install.scheduledDate), 'yyyy-MM-dd');
    
    if (!acc[installDate]) {
      acc[installDate] = [];
    }
    acc[installDate].push(install);
    return acc;
  }, {});

  // Get installations for selected date
  const selectedDateInstalls = selectedDate 
    ? installationsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const getStatusColor = (install: ScheduledInstallation) => {
    if (install.isProposed) {
      return 'bg-amber-100 text-amber-800 border-amber-300'; // Proposed dates
    }
    switch (install.status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const hasInstallations = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return installationsByDate[dateKey]?.length > 0;
  };

  if (!installerId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Please complete your profile setup to view your schedule.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Installation Schedule</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                ←
              </Button>
              <span className="text-lg font-medium min-w-[140px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                →
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(date => {
                  const dateInstalls = installationsByDate[format(date, 'yyyy-MM-dd')] || [];
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);
                  
                  return (
                    <button
                      key={date.toString()}
                      onClick={() => setSelectedDate(isSelected ? null : date)}
                      className={`
                        relative h-16 p-2 rounded border text-left transition-all hover:bg-gray-50
                        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                        ${isTodayDate ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}
                        ${!isSameMonth(date, currentDate) ? 'opacity-30' : ''}
                      `}
                    >
                      <div className={`text-sm font-medium ${
                        isTodayDate ? 'text-blue-700' : 
                        !isSameMonth(date, currentDate) ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </div>
                      
                      {dateInstalls.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          {(() => {
                            const confirmedJobs = dateInstalls.filter((job: ScheduledInstallation) => job.isConfirmed || job.eventType === 'confirmed');
                            const proposedJobs = dateInstalls.filter((job: ScheduledInstallation) => job.isProposed || job.eventType === 'proposed');
                            
                            return (
                              <div className="space-y-1">
                                {confirmedJobs.length > 0 && (() => {
                                  const completedJobs = confirmedJobs.filter((job: ScheduledInstallation) => job.status === 'completed');
                                  const activeJobs = confirmedJobs.filter((job: ScheduledInstallation) => job.status !== 'completed');
                                  
                                  return (
                                    <>
                                      <div className={`w-full h-1 rounded-full ${
                                        completedJobs.length > 0 && activeJobs.length === 0 ? 'bg-green-500' : 
                                        completedJobs.length > 0 && activeJobs.length > 0 ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                                        'bg-blue-500'
                                      }`}></div>
                                      <div className={`text-xs font-medium ${
                                        completedJobs.length > 0 && activeJobs.length === 0 ? 'text-green-600' : 
                                        'text-blue-600'
                                      }`}>
                                        {completedJobs.length > 0 && activeJobs.length === 0 
                                          ? `${completedJobs.length} completed`
                                          : completedJobs.length > 0 && activeJobs.length > 0
                                          ? `${activeJobs.length} scheduled, ${completedJobs.length} completed`
                                          : `${confirmedJobs.length} scheduled`
                                        }
                                      </div>
                                    </>
                                  );
                                })()}
                                {proposedJobs.length > 0 && (
                                  <>
                                    <div className="w-full h-1 bg-amber-400 rounded-full"></div>
                                    <div className="text-xs text-amber-600 font-medium">
                                      {proposedJobs.length} proposed
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>
              {selectedDate 
                ? format(selectedDate, 'MMM dd, yyyy')
                : 'Select a Date'
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateInstalls.length > 0 ? (
              <div className="space-y-4">
                {selectedDateInstalls.map((install: ScheduledInstallation) => (
                  <div key={install.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{install.customerName}</span>
                      </div>
                      <Badge className={getStatusColor(install)}>
                        {install.isProposed ? '⏰ Proposed' :
                         install.status === 'scheduled' ? '✅ Scheduled' : 
                         install.status === 'in_progress' ? 'In Progress' : 
                         install.status === 'completed' ? 'Completed' : 
                         install.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {install.scheduledTime && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{install.scheduledTime}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{install.address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Tv className="w-4 h-4" />
                          <span>{install.tvSize}" {install.serviceType}</span>
                        </div>
                        <span className="font-medium">€{install.estimatedTotal}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No installations scheduled for this date</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Click on a calendar date to view scheduled installations</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Summary Stats */}
      <Card className="lg:col-span-3">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{scheduledInstalls.length}</div>
              <div className="text-sm text-gray-600">Total Scheduled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {scheduledInstalls.filter((i: ScheduledInstallation) => i.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {scheduledInstalls.filter((i: ScheduledInstallation) => i.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallerScheduleCalendar;