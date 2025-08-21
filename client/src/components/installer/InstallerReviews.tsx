import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, MessageSquare, User, Calendar, CheckCircle2, Award, Mail, MapPin } from "lucide-react";

interface Review {
  id: number;
  userId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  serviceType: string;
  tvSize: string;
  completedDate: string;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  recentReviews: Review[];
}

interface InstallerReviewsProps {
  installerId: number;
}

export default function InstallerReviews({ installerId }: InstallerReviewsProps) {
  // Fetch reviews and stats
  const { data: reviewStats, isLoading } = useQuery<ReviewStats>({
    queryKey: [`/api/installer/${installerId}/reviews`],
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'Date not available';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!reviewStats || reviewStats.totalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendingReviews installerId={installerId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{reviewStats.totalReviews}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">{reviewStats.averageRating.toFixed(1)}</p>
                  {renderStars(Math.round(reviewStats.averageRating), 'md')}
                </div>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Verified Reviews</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reviewStats.recentReviews.filter(r => r.isVerified).length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reviewStats.ratingDistribution.map((dist) => (
              <div key={dist.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{dist.rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">{dist.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Recent Reviews ({reviewStats.recentReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {reviewStats.recentReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{review.customerName}</h4>
                        {review.isVerified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {review.serviceType}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{review.tvSize}</p>
                  </div>
                </div>

                {review.title && (
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                )}

                {review.comment && (
                  <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Installation completed {formatDate(review.completedDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Show pending reviews if we have existing reviews but more jobs without reviews */}
      <PendingReviews installerId={installerId} />
    </div>
  );
}

// Component to show completed jobs without reviews and request review functionality
function PendingReviews({ installerId }: { installerId: number }) {
  const { data: completedJobs, isLoading } = useQuery<any[]>({
    queryKey: [`/api/installer/${installerId}/completed-jobs`],
  });

  const { toast } = useToast();
  const [sendingReviews, setSendingReviews] = useState<number[]>([]);

  const jobsWithoutReviews = completedJobs?.filter(job => 
    job.booking && !job.booking.hasCustomerReview
  ) || [];

  const requestReview = async (jobId: number, customerEmail: string, customerName: string) => {
    setSendingReviews(prev => [...prev, jobId]);
    
    try {
      const response = await apiRequest('POST', '/api/installer/request-review', {
        bookingId: jobId, 
        installerId,
        customerEmail,
        customerName
      });

      if (response.success) {
        toast({
          title: "Review Request Sent",
          description: `Review request sent to ${customerName}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send review request",
        variant: "destructive",
      });
    } finally {
      setSendingReviews(prev => prev.filter(id => id !== jobId));
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading completed jobs...</p>
      </div>
    );
  }

  if (jobsWithoutReviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Complete your first installation to start receiving customer reviews.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Request Customer Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Request Reviews for Recent Installations ({jobsWithoutReviews.length})
          </h4>
          <p className="text-sm text-gray-500">
            Send personalized review requests to customers who haven't left feedback yet.
          </p>
        </div>

        <div className="space-y-4">
          {jobsWithoutReviews.slice(0, 5).map((job) => (
            <div key={job.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-medium text-gray-900 truncate">{job.booking?.customerName}</h5>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(job.booking?.completedDate || job.completedDate)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{job.booking?.address}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {job.booking?.serviceType || 'Installation'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sendingReviews.includes(job.bookingId)}
                  onClick={() => requestReview(
                    job.bookingId,
                    job.booking?.customerEmail,
                    job.booking?.customerName
                  )}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 whitespace-nowrap"
                >
                  {sendingReviews.includes(job.bookingId) ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                      <span className="hidden sm:inline">Sending...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Request Review</span>
                      <span className="sm:hidden">Request</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
          
          {jobsWithoutReviews.length > 5 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                And {jobsWithoutReviews.length - 5} more completed installations
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}