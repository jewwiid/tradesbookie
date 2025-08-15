import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, User, MapPin, Award, Calendar, ChevronRight, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface InstallerMiniProfileProps {
  installer: {
    id: number;
    businessName: string;
    contactName?: string;
    phone?: string;
    serviceArea: string;
    yearsExperience: number;
    profileImageUrl?: string;
    averageRating: number;
    totalReviews: number;
    isVip?: boolean;
  };
  showDetailedReviews?: boolean;
  className?: string;
}

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  userId: string;
  reviewerName?: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  recentReviews: Review[];
}

export default function InstallerMiniProfile({ 
  installer, 
  showDetailedReviews = false, 
  className = '' 
}: InstallerMiniProfileProps) {
  const [showReviewsDialog, setShowReviewsDialog] = useState(false);

  // Fetch detailed review stats when dialog opens
  const { data: reviewStats, isLoading: reviewsLoading } = useQuery<ReviewStats>({
    queryKey: ['/api/installer', installer.id, 'reviews'],
    enabled: showReviewsDialog,
  });

  const handleViewAllReviews = () => {
    setShowReviewsDialog(true);
  };

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Profile Image */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {installer.profileImageUrl ? (
                <img 
                  src={installer.profileImageUrl} 
                  alt={installer.businessName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
            </div>

            {/* Installer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-lg truncate">{installer.businessName}</h4>
                {installer.isVip && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Shield className="w-3 h-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              
              {installer.contactName && (
                <p className="text-sm text-gray-600 mb-2">{installer.contactName}</p>
              )}

              {/* Star Rating */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(installer.averageRating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="font-medium">{installer.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-600">
                  ({installer.totalReviews} review{installer.totalReviews !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Service Area & Experience */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{installer.serviceArea}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{installer.yearsExperience} years exp.</span>
                </div>
              </div>

              {/* View Reviews Button */}
              {showDetailedReviews && installer.totalReviews > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewAllReviews}
                  className="w-full"
                >
                  View All Reviews
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reviews Dialog */}
      <Dialog open={showReviewsDialog} onOpenChange={setShowReviewsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-6 h-6" />
              <span>{installer.businessName} - Customer Reviews</span>
            </DialogTitle>
          </DialogHeader>

          {reviewsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviewStats ? (
            <div className="space-y-6">
              {/* Review Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Overall Rating */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {reviewStats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < Math.floor(reviewStats.averageRating) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">
                      Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const distribution = reviewStats.ratingDistribution.find(r => r.rating === rating);
                      const percentage = distribution?.percentage || 0;
                      const count = distribution?.count || 0;
                      
                      return (
                        <div key={rating} className="flex items-center space-x-2">
                          <span className="text-sm w-8">{rating}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Reviews */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {reviewStats.recentReviews.length > 0 ? (
                    reviewStats.recentReviews.map((review) => (
                      <Card key={review.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${
                                      i < review.rating 
                                        ? 'text-yellow-400 fill-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="font-medium">{review.rating}/5</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <h4 className="font-medium mb-2">{review.title}</h4>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          
                          {review.reviewerName && (
                            <p className="text-sm text-gray-500">
                              - {review.reviewerName}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No reviews available yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load review data.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}