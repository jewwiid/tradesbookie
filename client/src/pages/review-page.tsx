import { useParams } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ReviewPage() {
  const { qrCode } = useParams();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ['/api/track', qrCode],
    enabled: !!qrCode
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      if (!response.ok) throw new Error('Failed to submit review');
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback. It helps us improve our service.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitReview = () => {
    if (!rating || !reviewTitle || !reviewText || !reviewerName) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a rating.",
        variant: "destructive",
      });
      return;
    }

    submitReview.mutate({
      bookingId: booking?.id,
      installerId: booking?.installerId,
      userId: booking?.userId,
      rating,
      title: reviewTitle,
      comment: reviewText,
      reviewerName,
      qrCode
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Booking Not Found</CardTitle>
            <CardDescription>
              We couldn't find a booking with this reference code.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/'} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">Review Submitted!</CardTitle>
            <CardDescription>
              Thank you for taking the time to review your installation experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your feedback helps us maintain high service standards and helps other customers make informed decisions.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Return to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/refer'}
                className="w-full"
              >
                Refer Friends & Earn €25
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Rate Your Experience</CardTitle>
            <CardDescription>
              Help others by sharing your experience with tradesbook.ie
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Installation Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Service:</strong> {booking.tvSize}" TV Installation</p>
                <p><strong>Address:</strong> {booking.address}</p>
                <p><strong>Date:</strong> {new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </span>
                </p>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Overall Rating</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {rating === 0 && "Select a rating"}
                {rating === 1 && "Poor - Needs significant improvement"}
                {rating === 2 && "Fair - Below expectations"}
                {rating === 3 && "Good - Met expectations"}
                {rating === 4 && "Very Good - Exceeded expectations"}
                {rating === 5 && "Excellent - Outstanding service"}
              </p>
            </div>

            {/* Review Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewerName">Your Name</Label>
                <Input
                  id="reviewerName"
                  placeholder="Enter your name (will be displayed publicly)"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewTitle">Review Title</Label>
                <Input
                  id="reviewTitle"
                  placeholder="Summarize your experience"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewText">Your Review</Label>
                <Textarea
                  id="reviewText"
                  placeholder="Tell us about your experience... Was the installer professional? How was the quality of work? Would you recommend us to others?"
                  className="min-h-[120px]"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                onClick={handleSubmitReview}
                disabled={submitReview.isPending}
                className="w-full"
                size="lg"
              >
                {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>

            {/* Quick Questions Reminder */}
            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-blue-900 mb-2">Consider these questions in your review:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Was the installer professional and on time?</li>
                <li>• Are you satisfied with the installation quality?</li>
                <li>• Would you recommend tradesbook.ie to others?</li>
                <li>• Any suggestions for improvement?</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}