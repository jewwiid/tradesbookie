import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Gift, Users, Euro, CheckCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReferralPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  const generateReferralLink = () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to generate a referral link.",
        variant: "destructive",
      });
      return;
    }

    // Generate unique referral code based on email
    const referralCode = btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const link = `https://tradesbook.ie/?ref=${referralCode}`;
    setReferralLink(link);
    setIsGenerated(true);
    
    toast({
      title: "Referral link generated!",
      description: "Share this link to earn €25 for each successful booking.",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  const shareViaEmail = () => {
    const subject = "Get Professional TV Installation - €25 Off Your First Booking!";
    const body = `Hi there!\n\nI recently used tradesbook.ie for my TV installation and had an amazing experience. They're offering €25 off your first booking when you use my referral link:\n\n${referralLink}\n\ntradesbook.ie connects you with certified TV installers who provide:\n• Professional wall mounting\n• Cable management\n• Same-day service available\n• 12-month warranty\n• Competitive pricing\n\nI highly recommend their service!\n\nBest regards`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaWhatsApp = () => {
    const message = `🔧 Professional TV Installation with €25 OFF!\n\nI used tradesbook.ie for my TV installation - fantastic service! Get €25 off your first booking: ${referralLink}\n\n✅ Certified installers\n✅ Same-day service\n✅ 12-month warranty\n✅ Professional results\n\nHighly recommend! 👍`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Refer & Earn €25
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share tradesbook.ie with friends and family. Earn €25 credit for each successful booking!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Gift className="w-6 h-6 mr-2" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Generate Your Link</h3>
                  <p className="text-gray-600 text-sm">Create your unique referral link below</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Share With Friends</h3>
                  <p className="text-gray-600 text-sm">Send via email, WhatsApp, or social media</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Earn Rewards</h3>
                  <p className="text-gray-600 text-sm">Get €25 credit when they complete a booking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Euro className="w-6 h-6 mr-2" />
                Referral Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-800">You Earn</span>
                  <span className="text-2xl font-bold text-green-600">€25</span>
                </div>
                <p className="text-green-700 text-sm">Credit for each successful referral</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-800">Friend Gets</span>
                  <span className="text-2xl font-bold text-blue-600">€25 OFF</span>
                </div>
                <p className="text-blue-700 text-sm">Discount on their first booking</p>
              </div>
              
              <div className="text-center pt-2">
                <p className="text-gray-600 text-sm">
                  <strong>No limits!</strong> Refer as many friends as you want
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Referral Link */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Share2 className="w-6 h-6 mr-2" />
              Generate Your Referral Link
            </CardTitle>
            <CardDescription>
              Enter your email to create a unique referral link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isGenerated ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button onClick={generateReferralLink} className="w-full">
                  Generate My Referral Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Your referral link is ready!</span>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Referral Link</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyToClipboard} variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={shareViaEmail} variant="outline" className="w-full">
                    Share via Email
                  </Button>
                  <Button onClick={shareViaWhatsApp} variant="outline" className="w-full">
                    Share via WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• €25 credit is awarded after the referred customer completes their first booking</li>
              <li>• Credits can be used towards future tradesbook.ie services</li>
              <li>• Referred customers must be first-time users of tradesbook.ie</li>
              <li>• Credits expire 12 months from the date earned</li>
              <li>• tradesbook.ie reserves the right to modify or terminate this program at any time</li>
              <li>• Self-referrals are not permitted</li>
            </ul>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Euro className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">€12,500</div>
              <div className="text-gray-600">Earned by Referrers</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">4.9/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}