import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle, User, Calendar, MapPin } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ReviewInterfaceProps {
  booking: {
    id: number;
    qrCode: string;
    address: string;
    status: string;
    contactName: string;
    installerId?: number;
    createdAt?: string;
    installer?: {
      id: number;
      businessName: string;
      contactName: string;
      profileImageUrl?: string;
      averageRating: number;
      totalReviews: number;
    };
    qualityStars?: number;
    photoStars?: number;
    reviewStars?: number;
  };
  onReviewSubmitted?: () => void;
}

interface ExistingReview {
  id: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export default function ReviewInterface({ booking, onReviewSubmitted }: ReviewInterfaceProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  
  const { toast } = useToast();

  // Check for existing review
  const { data: existingReviewData, isLoading: reviewLoading, error: reviewError } = useQuery({
    queryKey: ['/api/bookings', booking.id, 'review'],
    queryFn: async () => {
      return await apiRequest('GET', `/api/bookings/${booking.id}/review`);
    },
    enabled: booking.status === 'completed' && !!booking.installerId,
    retry: (failureCount, error) => {
      // Don't retry on 404 - it just means no review exists
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('404')) {
          return false;
        }
      }
      return failureCount < 3;
    }
  });

  // Update state when existing review data is loaded
  useEffect(() => {
    if (existingReviewData && !reviewError) {
      setExistingReview(existingReviewData);
      setHasSubmittedReview(true);
      // Populate form with existing review data
      setRating(existingReviewData.rating || 5);
      setTitle(existingReviewData.title || '');
      setComment(existingReviewData.comment || '');
    } else if (reviewError) {
      // If there's a 404 error, that means no review exists - reset states
      const errorMessage = reviewError?.message || '';
      if (errorMessage.includes('404')) {
        setExistingReview(null);
        setHasSubmittedReview(false);
      }
    }
  }, [existingReviewData, reviewError]);

  // Check if booking can be reviewed
  const canReview = booking.status === 'completed' && booking.installerId && !hasSubmittedReview && !existingReview;
  const showReviewForm = canReview || existingReview;
  
  // Show loading state while checking for existing reviews
  if (reviewLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Checking review status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return apiRequest('POST', '/api/reviews', reviewData);
    },
    onSuccess: (response) => {
      toast({
        title: "Review submitted successfully!",
        description: "Thank you for your feedback. Your installer will receive 2 additional quality stars.",
      });
      
      setHasSubmittedReview(true);
      setExistingReview({
        id: response.id,
        rating,
        title,
        comment,
        createdAt: new Date().toISOString()
      });
      
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      
      // Refresh booking data to show updated stars
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user/bookings'] });
      
      onReviewSubmitted?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitReview = async () => {
    if (!rating || !title.trim() || !comment.trim()) {
      toast({
        title: "Please complete all fields",
        description: "Rating, title, and comment are required.",
        variant: "destructive"
      });
      return;
    }

    if (title.length < 5) {
      toast({
        title: "Title too short",
        description: "Please provide a title with at least 5 characters.",
        variant: "destructive"
      });
      return;
    }

    if (comment.length < 20) {
      toast({
        title: "Comment too short", 
        description: "Please provide a comment with at least 20 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    const reviewData = {
      bookingId: booking.id,
      installerId: booking.installerId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      qrCode: booking.qrCode
    };

    submitReviewMutation.mutate(reviewData);
    setIsSubmitting(false);
  };

  if (!showReviewForm || !booking.installer) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>
            {existingReview ? 'Your Review' : 'Rate Your Installation Experience'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Installer Info */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            {booking.installer.profileImageUrl ? (
              <img 
                src={booking.installer.profileImageUrl} 
                alt={booking.installer.businessName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{booking.installer.businessName}</h4>
            <p className="text-sm text-gray-600">{booking.installer.contactName}</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(booking.installer.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {booking.installer.averageRating.toFixed(1)} ({booking.installer.totalReviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>{booking.address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Completed: {new Date(booking.createdAt || '').toLocaleDateString()}</span>
          </div>
        </div>

        {/* Quality Stars Display */}
        {booking.qualityStars !== undefined && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Installation Quality Rating</h5>
                <p className="text-sm text-gray-600">
                  {booking.photoStars || 0}/3 Photo Stars + {booking.reviewStars || 0}/2 Review Stars
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < (booking.qualityStars || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="ml-2 font-semibold">{booking.qualityStars || 0}/5</span>
              </div>
            </div>
          </div>
        )}

        {existingReview ? (
          /* Show Existing Review */
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Review Submitted</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < existingReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="font-medium">{existingReview.rating}/5 stars</span>
              </div>
              
              <div>
                <h6 className="font-medium">{existingReview.title}</h6>
                <p className="text-gray-700 mt-1">{existingReview.comment}</p>
              </div>
              
              <p className="text-sm text-gray-500">
                Submitted on {new Date(existingReview.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          /* Review Submission Form */
          <div className="space-y-4">
            {/* Star Rating */}
            <div>
              <Label className="text-base font-medium">How would you rate your installation experience?</Label>
              <div className="flex items-center space-x-1 mt-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHoveredStar(i + 1)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        i < (hoveredStar || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
                <span className="ml-3 font-medium">
                  {rating}/5 {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <Label htmlFor="review-title">Review Title</Label>
              <Input
                id="review-title"
                placeholder="e.g., Professional service and great installation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Review Comment */}
            <div>
              <Label htmlFor="review-comment">Tell us about your experience</Label>
              <Textarea
                id="review-comment"
                placeholder="Describe the quality of work, professionalism, timeliness, and overall satisfaction..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">{comment.length}/500 characters</p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting || !rating || !title.trim() || !comment.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting Review...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Submit Review (+2 Quality Stars)
                </>
              )}
            </Button>
            
            <p className="text-sm text-gray-600 text-center">
              Your honest feedback helps improve service quality and rewards excellent installers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}