import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Phone, Mail, MapPin, Award, Clock, CheckCircle, MessageSquare, Wrench, Shield } from "lucide-react";

interface InstallerProfileProps {
  installer: {
    id: number;
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    address?: string | null;
    serviceArea?: string;
    expertise?: any;
    bio?: string | null;
    yearsExperience?: number | null;
    profileImageUrl?: string | null;
  };
  showContactActions?: boolean;
}

interface Review {
  id: number;
  userId: string;
  installerId: number;
  bookingId: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface Rating {
  averageRating: number;
  totalReviews: number;
}

export default function InstallerProfile({ installer, showContactActions = true }: InstallerProfileProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch installer reviews
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/api/installers/${installer.id}/reviews`],
  });

  // Fetch installer rating
  const { data: rating } = useQuery<Rating>({
    queryKey: [`/api/installers/${installer.id}/rating`],
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await apiRequest("POST", "/api/reviews", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setShowReviewDialog(false);
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/installers/${installer.id}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installers/${installer.id}/rating`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) {
      toast({
        title: "Error",
        description: "Please write a comment for your review",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      installerId: installer.id,
      bookingId: 1, // In a real app, this would be from a completed booking
      rating: reviewRating,
      title: reviewTitle.trim() || null,
      comment: reviewComment.trim(),
    });
  };

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const expertise = installer.expertise ? 
    (Array.isArray(installer.expertise) ? installer.expertise : []) : [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-24 w-24 mx-auto sm:mx-0">
            <AvatarImage src={installer.profileImageUrl || undefined} />
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getInitials(installer.contactName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {installer.businessName}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
              {installer.contactName}
            </CardDescription>
            
            {rating && rating.totalReviews > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <div className="flex items-center gap-1">
                  {renderStars(rating.averageRating)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {rating.averageRating.toFixed(1)} ({rating.totalReviews} reviews)
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              {installer.yearsExperience && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {installer.yearsExperience} years experience
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Verified
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" />
                Insured
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {installer.bio && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              About
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {installer.bio}
            </p>
          </div>
        )}

        {expertise.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {expertise.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span>{installer.serviceArea || installer.address || "Ireland"}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Award className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span>Professional TV Installer</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div className="flex items-center gap-2">
              {installer.insurance ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                    ✓ Insured
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{installer.insurance}</span>
                </div>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs">
                  ⚠ Uninsured
                </Badge>
              )}
            </div>
          </div>
        </div>

        {showContactActions && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              className="flex-1 flex items-center gap-2" 
              onClick={() => window.open(`tel:${installer.phone}`, '_self')}
            >
              <Phone className="h-4 w-4" />
              Call {installer.phone}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 flex items-center gap-2"
              onClick={() => window.open(`mailto:${installer.email}`, '_self')}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" aria-describedby="review-dialog-description">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                  <DialogDescription id="review-dialog-description">
                    Share your experience with {installer.businessName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 cursor-pointer transition-colors ${
                            i < reviewRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-400"
                          }`}
                          onClick={() => setReviewRating(i + 1)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Great service!"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell others about your experience..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={createReviewMutation.isPending}
                  >
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {reviews.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Customer Reviews ({reviews.length})
              </h3>
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <Card key={review.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating, "h-4 w-4")}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                      {review.isVerified && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {reviews.length > 3 && (
                  <Button variant="outline" className="w-full">
                    View All {reviews.length} Reviews
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}