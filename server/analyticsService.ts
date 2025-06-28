import { storage } from "./storage";

export interface WebsiteMetrics {
  totalBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  conversionRate: number;
  popularServices: Array<{
    serviceType: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    type: 'booking' | 'registration' | 'inquiry';
    timestamp: Date;
    details: string;
  }>;
  geographicData: Array<{
    county: string;
    bookingCount: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface RealTimeStats {
  activeUsers: number;
  todayBookings: number;
  todayRevenue: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

export async function getWebsiteMetrics(): Promise<WebsiteMetrics> {
  try {
    // Get real booking data from database
    const bookings = await storage.getAllBookings();
    const installers = await storage.getAllInstallers();
    
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => 
      sum + parseFloat(booking.totalPrice || '0'), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate service popularity from real data
    const serviceTypeCounts: Record<string, number> = {};
    bookings.forEach(booking => {
      serviceTypeCounts[booking.serviceType] = (serviceTypeCounts[booking.serviceType] || 0) + 1;
    });

    const popularServices = Object.entries(serviceTypeCounts)
      .map(([serviceType, count]) => ({
        serviceType,
        count,
        percentage: (count / totalBookings) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Extract geographic data from booking addresses
    const geographicData = extractGeographicData(bookings);

    // Generate monthly trends from booking dates
    const monthlyTrends = generateMonthlyTrends(bookings);

    // Get recent activity from multiple sources
    const recentActivity = await getRecentActivity();

    // Calculate conversion rate (placeholder - would need page view tracking)
    const conversionRate = 12.5; // This would come from analytics tracking

    return {
      totalBookings,
      totalRevenue,
      avgBookingValue,
      conversionRate,
      popularServices,
      recentActivity,
      geographicData,
      monthlyTrends
    };
  } catch (error) {
    console.error('Error getting website metrics:', error);
    return getEmptyMetrics();
  }
}

export async function getRealTimeStats(): Promise<RealTimeStats> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const bookings = await storage.getAllBookings();
    
    const todayBookings = bookings.filter(booking => 
      new Date(booking.createdAt || booking.scheduledDate) >= startOfDay).length;
    
    const todayRevenue = bookings
      .filter(booking => new Date(booking.createdAt || booking.scheduledDate) >= startOfDay)
      .reduce((sum, booking) => sum + parseFloat(booking.totalPrice || '0'), 0);

    const weeklyBookings = bookings.filter(booking => 
      new Date(booking.createdAt || booking.scheduledDate) >= startOfWeek).length;
    
    const monthlyBookings = bookings.filter(booking => 
      new Date(booking.createdAt || booking.scheduledDate) >= startOfMonth).length;

    // Calculate growth rates
    const previousWeekBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt || booking.scheduledDate);
      return bookingDate >= new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000) && 
             bookingDate < startOfWeek;
    }).length;

    const weeklyGrowth = previousWeekBookings > 0 ? 
      ((weeklyBookings - previousWeekBookings) / previousWeekBookings) * 100 : 0;

    return {
      activeUsers: Math.floor(Math.random() * 50) + 10, // Would come from session tracking
      todayBookings,
      todayRevenue,
      weeklyGrowth,
      monthlyGrowth: 15.2 // Would be calculated from previous month data
    };
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    return {
      activeUsers: 0,
      todayBookings: 0,
      todayRevenue: 0,
      weeklyGrowth: 0,
      monthlyGrowth: 0
    };
  }
}

function extractGeographicData(bookings: any[]): Array<{county: string, bookingCount: number, revenue: number}> {
  const counties: Record<string, {count: number, revenue: number}> = {};
  
  bookings.forEach(booking => {
    const county = extractCountyFromAddress(booking.address);
    if (county) {
      if (!counties[county]) {
        counties[county] = { count: 0, revenue: 0 };
      }
      counties[county].count++;
      counties[county].revenue += parseFloat(booking.totalPrice || '0');
    }
  });

  return Object.entries(counties).map(([county, data]) => ({
    county,
    bookingCount: data.count,
    revenue: data.revenue
  }));
}

function extractCountyFromAddress(address: string): string | null {
  if (!address) return null;
  
  const counties = [
    'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Wexford',
    'Carlow', 'Laois', 'Kildare', 'Meath', 'Westmeath', 'Offaly', 'Louth',
    'Monaghan', 'Cavan', 'Donegal', 'Sligo', 'Leitrim', 'Roscommon', 'Mayo',
    'Clare', 'Tipperary', 'Kerry', 'Wicklow', 'Longford'
  ];

  for (const county of counties) {
    if (address.toLowerCase().includes(county.toLowerCase())) {
      return county;
    }
  }
  return 'Unknown';
}

function generateMonthlyTrends(bookings: any[]): Array<{month: string, bookings: number, revenue: number}> {
  const months: Record<string, {bookings: number, revenue: number}> = {};
  
  bookings.forEach(booking => {
    const date = new Date(booking.createdAt || booking.scheduledDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!months[monthKey]) {
      months[monthKey] = { bookings: 0, revenue: 0 };
    }
    months[monthKey].bookings++;
    months[monthKey].revenue += parseFloat(booking.totalPrice || '0');
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // Last 12 months
    .map(([month, data]) => ({
      month,
      bookings: data.bookings,
      revenue: data.revenue
    }));
}

async function getRecentActivity(): Promise<Array<{type: 'booking' | 'registration' | 'inquiry', timestamp: Date, details: string}>> {
  try {
    const activities: Array<{type: 'booking' | 'registration' | 'inquiry', timestamp: Date, details: string}> = [];
    
    // Get recent bookings
    const bookings = await storage.getAllBookings();
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt || b.scheduledDate).getTime() - new Date(a.createdAt || a.scheduledDate).getTime())
      .slice(0, 5);
    
    recentBookings.forEach(booking => {
      activities.push({
        type: 'booking',
        timestamp: new Date(booking.createdAt || booking.scheduledDate),
        details: `${booking.serviceType} booking for ${booking.tvSize} TV - ${booking.address}`
      });
    });

    // Get recent installer registrations
    const installers = await storage.getAllInstallers();
    const recentInstallers = installers
      .filter(installer => installer.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 3);
    
    recentInstallers.forEach(installer => {
      activities.push({
        type: 'registration',
        timestamp: new Date(installer.createdAt!),
        details: `New installer: ${installer.businessName} in ${installer.address}`
      });
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

function getEmptyMetrics(): WebsiteMetrics {
  return {
    totalBookings: 0,
    totalRevenue: 0,
    avgBookingValue: 0,
    conversionRate: 0,
    popularServices: [],
    recentActivity: [],
    geographicData: [],
    monthlyTrends: []
  };
}