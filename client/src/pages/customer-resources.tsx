import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Video,
  Clock,
  Eye
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import AIHelpWidget from "@/components/AIHelpWidget";

interface Guide {
  id: number;
  title: string;
  description: string;
  fileType?: string;
  fileSize?: string;
  downloadCount?: number;
  fileUrl?: string;
}

interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration?: string;
  category?: string;
  videoUrl?: string;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  category?: string;
  brand?: string;
  externalUrl?: string;
  linkText?: string;
}

export default function CustomerResources() {
  // Fetch downloadable guides
  const { data: guides = [] } = useQuery<Guide[]>({
    queryKey: ["/api/downloadable-guides"]
  });

  // Fetch video tutorials  
  const { data: tutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ["/api/video-tutorials"]
  });

  // Fetch TV setup specific resources only
  const { data: allResources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"]
  });

  // Filter resources to only show TV setup related content
  const tvSetupResources = allResources.filter(resource => 
    resource.category === 'tv-setup' || 
    resource.category === 'streaming' || 
    resource.category === 'installation' ||
    resource.type === 'tv-guide' ||
    resource.title.toLowerCase().includes('tv') ||
    resource.title.toLowerCase().includes('streaming') ||
    resource.title.toLowerCase().includes('setup')
  );

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



  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TV Setup & Streaming Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guides and resources specifically for TV installation, smart TV setup, and streaming app configuration.
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
                    Book TV Setup Service
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{guide.title}</span>
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {guide.fileType}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guide.fileSize && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="h-4 w-4 mr-1" />
                        Size: {guide.fileSize}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Download className="h-4 w-4 mr-1" />
                      {guide.downloadCount} downloads
                    </div>
                    {guide.fileUrl && (
                      <Button 
                        asChild
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <a href={guide.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download Guide
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {guides.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No downloadable guides available at the moment.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* TV Setup Resources */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Tv className="w-7 h-7 mr-3 text-orange-600" />
            TV Setup Resources
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tvSetupResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{resource.title}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {resource.type}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resource.category && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Badge variant="secondary" className="text-xs">
                          {resource.category}
                        </Badge>
                      </div>
                    )}
                    {resource.brand && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Tv className="h-4 w-4 mr-1" />
                        {resource.brand}
                      </div>
                    )}
                    {resource.externalUrl && (
                      <Button 
                        asChild
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {resource.linkText || "Learn More"}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {tvSetupResources.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Tv className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No TV setup resources available at the moment.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Video Tutorials */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Video className="w-7 h-7 mr-3 text-purple-600" />
            Video Tutorials
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg p-8 mb-4 relative">
                      <Video className="w-12 h-12 mx-auto text-purple-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white bg-black bg-opacity-50 rounded-full p-2" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{tutorial.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{tutorial.description}</p>
                    <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-4">
                      {tutorial.duration && <span>{tutorial.duration}</span>}
                      <Badge variant="outline" className="text-xs">
                        {tutorial.category || 'Tutorial'}
                      </Badge>
                    </div>
                    {tutorial.videoUrl && (
                      <Button 
                        asChild
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                      >
                        <a href={tutorial.videoUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="w-4 h-4 mr-2" />
                          Watch Tutorial
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {tutorials.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No video tutorials available at the moment.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* AI Help Assistant */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <HelpCircle className="w-7 h-7 mr-3 text-blue-600" />
            Ask Our AI Assistant
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <p className="text-gray-700 mb-6 text-center max-w-2xl mx-auto">
              Get instant answers to your questions about TV installation, electronics, and streaming services. 
              Our AI assistant is trained on the latest technical information to help you quickly.
            </p>
            <AIHelpWidget />
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