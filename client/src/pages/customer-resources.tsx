import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Download, 
  ExternalLink, 
  HelpCircle, 
  Monitor, 
  Play, 
  Settings, 
  Smartphone, 
  Tv, 
  Wifi, 
  CheckCircle,
  AlertCircle,
  FileText,
  Video
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

export default function CustomerResources() {
  const commonIssues = [
    {
      issue: "Can't find streaming apps on my TV",
      solution: "Check if your TV supports the app store. For older TVs, you may need an external device like Chromecast or Apple TV.",
      difficulty: "Easy"
    },
    {
      issue: "Apps keep buffering or freezing",
      solution: "Check your internet speed (minimum 25 Mbps for 4K). Restart your router and TV. Clear app cache if possible.",
      difficulty: "Easy"
    },
    {
      issue: "Can't sign in to streaming apps",
      solution: "Ensure you're using the correct email/password. Some apps require activation codes from their website.",
      difficulty: "Moderate"
    },
    {
      issue: "Poor picture quality on streaming",
      solution: "Check HDMI cables, TV picture settings, and internet speed. Ensure you're selecting HD/4K quality in app settings.",
      difficulty: "Moderate"
    }
  ];

  const setupGuides = [
    {
      title: "Setting up RTÉ Player",
      description: "Complete guide to install and configure RTÉ Player on your smart TV",
      steps: ["Download RTÉ Player from your TV's app store", "Create or sign in to your RTÉ account", "Verify your TV license details", "Start watching Irish content"],
      compatibleTvs: ["Samsung Smart TV", "LG webOS", "Android TV", "Apple TV"]
    },
    {
      title: "TG4 Player Setup",
      description: "How to access TG4's Irish language programming on your TV",
      steps: ["Install TG4 Player app", "No registration required", "Browse Irish language content", "Enable subtitles if needed"],
      compatibleTvs: ["Most Smart TVs", "Streaming devices"]
    },
    {
      title: "Virgin Media Player",
      description: "Access Virgin Media content on compatible devices",
      steps: ["Download Virgin Media Player", "Log in with your Virgin account", "Link your TV package", "Enjoy on-demand content"],
      compatibleTvs: ["Samsung", "LG", "Android TV", "iOS/Android apps"]
    },
    {
      title: "SaorView Connect",
      description: "Set up free Irish digital TV channels",
      steps: ["Ensure SaorView Connect compatibility", "Connect to internet", "Run channel scan", "Access additional Irish channels"],
      compatibleTvs: ["SaorView Connect compatible TVs"]
    }
  ];

  const downloadableGuides = [
    {
      title: "TV Compatibility Checker",
      description: "PDF guide to check if your TV supports Irish streaming apps",
      fileType: "PDF",
      size: "2.1 MB"
    },
    {
      title: "Internet Speed Requirements",
      description: "Minimum speeds needed for different streaming qualities",
      fileType: "PDF", 
      size: "1.8 MB"
    },
    {
      title: "Remote Control Setup Guide",
      description: "How to navigate streaming apps with your TV remote",
      fileType: "PDF",
      size: "3.2 MB"
    }
  ];

  const videoTutorials = [
    {
      title: "Setting up Netflix on Smart TV",
      duration: "4:32",
      thumbnail: "🎬",
      level: "Beginner"
    },
    {
      title: "Troubleshooting App Crashes",
      duration: "6:15",
      thumbnail: "🔧",
      level: "Intermediate"
    },
    {
      title: "Optimizing Picture Quality",
      duration: "8:20",
      thumbnail: "📺",
      level: "Advanced"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Customer Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Self-help guides, tutorials, and troubleshooting resources for setting up Irish streaming apps on your smart TV.
          </p>
        </div>

        {/* Quick Help Section */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <HelpCircle className="w-6 h-6" />
              <span>Need Immediate Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-blue-800 mb-4">
                  If you need personalized assistance setting up your streaming apps, our professional TV setup service is here to help.
                </p>
                <Link href="/tv-setup-assist">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Tv className="w-4 h-4 mr-2" />
                    Book TV Setup Service - €100
                  </Button>
                </Link>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What's Included:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Smart TV compatibility check</li>
                  <li>• Irish streaming app setup</li>
                  <li>• Account configuration</li>
                  <li>• Remote or in-person assistance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Guides */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <BookOpen className="w-7 h-7 mr-3 text-blue-600" />
            App Setup Guides
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {setupGuides.map((guide, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Setup Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        {guide.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Compatible TVs:</h4>
                      <div className="flex flex-wrap gap-2">
                        {guide.compatibleTvs.map((tv, tvIndex) => (
                          <Badge key={tvIndex} variant="outline" className="text-xs">
                            {tv}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Issues */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="w-7 h-7 mr-3 text-orange-600" />
            Common Issues & Solutions
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {commonIssues.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{item.issue}</h4>
                      <p className="text-gray-600 text-sm mb-3">{item.solution}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.difficulty === 'Easy' 
                            ? 'border-green-300 text-green-700' 
                            : 'border-yellow-300 text-yellow-700'
                        }`}
                      >
                        {item.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Downloadable Resources */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Download className="w-7 h-7 mr-3 text-green-600" />
            Downloadable Guides
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {downloadableGuides.map((guide, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">{guide.title}</h4>
                    <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                    <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-4">
                      <span>{guide.fileType}</span>
                      <span>{guide.size}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Video Tutorials */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Video className="w-7 h-7 mr-3 text-purple-600" />
            Video Tutorials
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg p-8 mb-4 relative">
                      <span className="text-4xl">{video.thumbnail}</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white bg-black bg-opacity-50 rounded-full p-2" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
                    <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-4">
                      <span>{video.duration}</span>
                      <Badge variant="outline" className="text-xs">
                        {video.level}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  If these resources don't solve your issue, our professional TV setup service provides personalized assistance 
                  to get your streaming apps working perfectly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/tv-setup-assist">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Tv className="w-5 h-5 mr-2" />
                      Book Professional Setup - €100
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      
      <Footer />
    </div>
  );
}