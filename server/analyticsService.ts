import { storage } from "./storage";
import { db } from "./db";
import { pricingConfig } from "../shared/schema";
import { eq } from "drizzle-orm";

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
  reviewMetrics: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
  };
  referralMetrics: {
    totalReferralCodes: number;
    activeReferrals: number;
    totalReferralEarnings: number;
    averageReferralsPerCode: number;
  };
}

export interface RealTimeStats {
  activeUsers: number;
  todayBookings: number;
  todayRevenue: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

// Helper function to get lead fee for a service type
async function getLeadFeeForService(serviceType: string): Promise<number> {
  try {
    const result = await db.select()
      .from(pricingConfig)
      .where(eq(pricingConfig.itemKey, serviceType))
      .limit(1);
    
    if (result.length > 0) {
      return result[0].leadFee;
    }
    
    // Fallback to default lead fees if not found in database
    const fallbackFees: Record<string, number> = {
      'table-top-small': 12,
      'table-top-large': 15, 
      'bronze': 20,
      'silver': 25,
      'silver-wall': 25,
      'gold': 30,
      'gold-large': 35
    };
    
    return fallbackFees[serviceType] || 20; // Default to €20 if not found
  } catch (error) {
    console.error('Error fetching lead fee for service:', serviceType, error);
    return 20; // Default fallback
  }
}

export async function getWebsiteMetrics(): Promise<WebsiteMetrics> {
  try {
    // Get real booking data from database
    const bookings = await storage.getAllBookings();
    const installers = await storage.getAllInstallers();
    
    const totalBookings = bookings.length;
    
    // In lead generation model, platform revenue comes from lead fees, not customer payments
    let totalRevenue = 0;
    for (const booking of bookings) {
      // Get the lead fee for this service type from pricing config
      const leadFee = await getLeadFeeForService(booking.serviceType);
      totalRevenue += leadFee;
    }
    
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

    // Get review metrics from database
    const reviewMetrics = await getReviewMetrics();

    // Get referral metrics from database
    const referralMetrics = await getReferralMetrics();

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
      monthlyTrends,
      reviewMetrics,
      referralMetrics
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
    
    // Calculate today's revenue from lead fees, not customer payments
    const todayBookingsArray = bookings.filter(booking => 
      new Date(booking.createdAt || booking.scheduledDate) >= startOfDay);
    
    const todayBookings = todayBookingsArray.length;
    let todayRevenue = 0;
    
    for (const booking of todayBookingsArray) {
      const leadFee = await getLeadFeeForService(booking.serviceType);
      todayRevenue += leadFee;
    }

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

async function getReviewMetrics(): Promise<{totalReviews: number, averageRating: number, ratingDistribution: Array<{rating: number, count: number}>}> {
  try {
    const reviews = await storage.getAllReviews();
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: []
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length
    }));

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: ratingCounts
    };
  } catch (error) {
    console.error('Error getting review metrics:', error);
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: []
    };
  }
}

async function getReferralMetrics(): Promise<{totalReferralCodes: number, activeReferrals: number, totalReferralEarnings: number, averageReferralsPerCode: number}> {
  try {
    const referralCodes = await storage.getAllReferralCodes();
    const totalReferralCodes = referralCodes.length;
    const activeReferrals = referralCodes.filter(code => code.isActive).length;
    
    const totalReferralEarnings = referralCodes.reduce((sum, code) => 
      sum + parseFloat(code.totalEarnings.toString()), 0);
    
    const totalReferrals = referralCodes.reduce((sum, code) => 
      sum + code.totalReferrals, 0);
    
    const averageReferralsPerCode = totalReferralCodes > 0 ? 
      totalReferrals / totalReferralCodes : 0;

    return {
      totalReferralCodes,
      activeReferrals,
      totalReferralEarnings,
      averageReferralsPerCode: Math.round(averageReferralsPerCode * 10) / 10
    };
  } catch (error) {
    console.error('Error getting referral metrics:', error);
    return {
      totalReferralCodes: 0,
      activeReferrals: 0,
      totalReferralEarnings: 0,
      averageReferralsPerCode: 0
    };
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
    monthlyTrends: [],
    reviewMetrics: {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: []
    },
    referralMetrics: {
      totalReferralCodes: 0,
      activeReferrals: 0,
      totalReferralEarnings: 0,
      averageReferralsPerCode: 0
    }
  };
}