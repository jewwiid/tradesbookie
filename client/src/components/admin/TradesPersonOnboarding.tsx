import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  UserPlus, 
  Mail, 
  Users, 
  Wrench, 
  Send, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Bot,
  Sparkles,
  FileText,
  Loader2
} from "lucide-react";

// Trade skills with their TV installation relevance
const TRADE_SKILLS = [
  { value: "carpenter", label: "Carpenter", relevance: "Wall mounting, custom installations, furniture assembly" },
  { value: "electrician", label: "Electrician", relevance: "Cable management, power outlets, smart TV wiring" },
  { value: "plumber", label: "Plumber", relevance: "Wall mounting (drilling skills), basic installations" },
  { value: "joiner", label: "Joiner", relevance: "Custom mounting solutions, built-in installations" },
  { value: "painter", label: "Painter/Decorator", relevance: "Wall assessment, finishing work around mounts" },
  { value: "general_handyman", label: "General Handyman", relevance: "All-round installation and maintenance skills" },
  { value: "tv_specialist", label: "TV Installation Specialist", relevance: "Professional TV installation expertise" }
];

const IRISH_COUNTIES = [
  "Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny", "Wexford",
  "Kildare", "Meath", "Wicklow", "Carlow", "Laois", "Offaly", "Tipperary",
  "Clare", "Kerry", "Mayo", "Donegal", "Sligo", "Leitrim", "Roscommon",
  "Longford", "Westmeath", "Cavan", "Monaghan", "Louth"
];

interface OnboardingFormData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  county: string;
  tradeSkill: string;
  adminNotes: string;
}

interface EmailTemplateFormData {
  templateName: string;
  tradeSkill: string;
  subject: string;
  content: string;
}

interface TradesPersonInvitation {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  county: string;
  tradeSkill: string;
  status: string;
  emailSent: boolean;
  invitationToken: string;
  invitationUrl: string;
  createdBy: string;
  createdAt: string;
}

interface TradesPersonEmailTemplate {
  id: number;
  templateName: string;
  tradeSkill: string;
  subject: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export default function TradesPersonOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    county: "",
    tradeSkill: "",
    adminNotes: ""
  });

  const [emailTemplateData, setEmailTemplateData] = useState<EmailTemplateFormData>({
    templateName: "",
    tradeSkill: "",
    subject: "",
    content: ""
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiOptions, setAiOptions] = useState({
    tone: 'professional' as 'professional' | 'friendly' | 'persuasive',
    focus: 'opportunity' as 'earnings' | 'flexibility' | 'skills' | 'opportunity'
  });

  const [bulkInviteData, setBulkInviteData] = useState({
    tradeSkill: "",
    emailTemplate: "",
    csvData: ""
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/admin/onboarding/invitations"],
  });

  // Fetch email templates
  const { data: emailTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/admin/onboarding/email-templates"],
  });

  // Create individual invitation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      return await apiRequest("/api/admin/onboarding/create-invitation", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onboarding/invitations"] });
      setFormData({
        name: "", email: "", phone: "", businessName: "", county: "", tradeSkill: "", adminNotes: ""
      });
      toast({
        title: "Invitation Created",
        description: "Tradesperson invitation has been created and sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create email template
  const createTemplateMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      return await apiRequest("/api/admin/onboarding/create-email-template", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onboarding/email-templates"] });
      setEmailTemplateData({ templateName: "", tradeSkill: "", subject: "", content: "" });
      toast({
        title: "Template Created",
        description: "Email template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create email template. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Register installer on behalf
  const registerInstallerMutation = useMutation({
    mutationFn: async (data: OnboardingFormData & { password: string }) => {
      return await apiRequest("/api/admin/onboarding/register-installer", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      toast({
        title: "Installer Registered",
        description: "Installer has been registered successfully. Confirmation email sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register installer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resend invitation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest(`/api/admin/onboarding/resend-invitation/${invitationId}`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/onboarding/invitations"] });
      toast({
        title: "Invitation Resent",
        description: "Invitation email has been resent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend invitation.",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvitation = () => {
    if (!formData.name || !formData.email || !formData.tradeSkill) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, email, and trade skill.",
        variant: "destructive",
      });
      return;
    }
    createInvitationMutation.mutate(formData);
  };

  const handleRegisterInstaller = () => {
    if (!formData.name || !formData.email || !formData.tradeSkill) {
      toast({
        title: "Missing Information", 
        description: "Please fill in required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const password = Math.random().toString(36).slice(-8);
    registerInstallerMutation.mutate({ ...formData, password });
  };

  const handleCreateTemplate = () => {
    if (!emailTemplateData.templateName || !emailTemplateData.tradeSkill || !emailTemplateData.subject || !emailTemplateData.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all template fields.",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate(emailTemplateData);
  };

  const handleGenerateAITemplate = async () => {
    if (!emailTemplateData.tradeSkill) {
      toast({
        title: "Trade Skill Required",
        description: "Please select a trade skill before generating AI content.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await apiRequest("POST", "/api/admin/onboarding/generate-ai-template", {
        tradeSkill: emailTemplateData.tradeSkill,
        templateName: emailTemplateData.templateName,
        tone: aiOptions.tone,
        focus: aiOptions.focus
      });
      
      const responseData = await response.json();

      setEmailTemplateData(prev => ({
        ...prev,
        subject: responseData.subject,
        content: responseData.content,
        templateName: prev.templateName || responseData.templateName
      }));

      toast({
        title: "AI Template Generated",
        description: "Your personalized email template has been created successfully.",
      });
    } catch (error) {
      console.error('Error generating AI template:', error);
      
      // Get detailed error message
      let errorMessage = "Failed to generate AI template. Please try again.";
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as any).message;
        } else if ('error' in error) {
          errorMessage = (error as any).error;
        }
      }
      
      toast({
        title: "Generation Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleLoadPresetTemplate = async (tradeSkill: string) => {
    try {
      const response = await apiRequest("GET", `/api/admin/onboarding/preset-template/${tradeSkill}`);
      const responseData = await response.json();
      
      setEmailTemplateData(prev => ({
        ...prev,
        subject: responseData.subject,
        content: responseData.content,
        templateName: responseData.templateName
      }));

      toast({
        title: "Preset Template Loaded",
        description: `${tradeSkill} template has been loaded successfully.`,
      });
    } catch (error) {
      console.error('Error loading preset template:', error);
      
      // Get detailed error message
      let errorMessage = "Failed to load preset template. Please try again.";
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as any).message;
        } else if ('error' in error) {
          errorMessage = (error as any).error;
        }
      }
      
      toast({
        title: "Load Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'bg-blue-100 text-blue-800',
      opened: 'bg-yellow-100 text-yellow-800',
      profile_started: 'bg-orange-100 text-orange-800',
      profile_completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Invitation URL has been copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tradesperson Onboarding</h2>
          <p className="text-gray-600">Invite and onboard skilled tradespeople to expand your installer network</p>
        </div>
      </div>

      <Tabs defaultValue="invite" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invite">Send Invitations</TabsTrigger>
          <TabsTrigger value="register">Direct Registration</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="manage">Manage Invitations</TabsTrigger>
        </TabsList>

        {/* Send Individual Invitations */}
        <TabsContent value="invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Tradesperson
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+353 1 234 5678"
                  />
                </div>

                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Smith Carpentry Ltd"
                  />
                </div>

                <div>
                  <Label htmlFor="county">County</Label>
                  <Select 
                    value={formData.county} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {IRISH_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tradeSkill">Trade Skill *</Label>
                  <Select 
                    value={formData.tradeSkill} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tradeSkill: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_SKILLS.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value}>
                          <div>
                            <div className="font-medium">{skill.label}</div>
                            <div className="text-sm text-gray-500">{skill.relevance}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={formData.adminNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Internal notes about this invitation..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateInvitation}
                  disabled={createInvitationMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {createInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Direct Registration */}
        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Register Installer Directly
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Direct Registration</h4>
                <p className="text-blue-800 text-sm">
                  Register a tradesperson directly on their behalf. They will receive an email with login credentials 
                  and a link to complete their profile.
                </p>
              </div>

              {/* Reuse the same form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg-name">Full Name *</Label>
                  <Input
                    id="reg-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reg-email">Email Address *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-phone">Phone Number</Label>
                  <Input
                    id="reg-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+353 1 234 5678"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-business">Business Name</Label>
                  <Input
                    id="reg-business"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Smith Carpentry Ltd"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-county">County</Label>
                  <Select 
                    value={formData.county} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {IRISH_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reg-trade">Trade Skill *</Label>
                  <Select 
                    value={formData.tradeSkill} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tradeSkill: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_SKILLS.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleRegisterInstaller}
                disabled={registerInstallerMutation.isPending}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {registerInstallerMutation.isPending ? "Registering..." : "Register & Send Login Details"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Create Email Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={emailTemplateData.templateName}
                    onChange={(e) => setEmailTemplateData(prev => ({ ...prev, templateName: e.target.value }))}
                    placeholder="Carpenter Invitation Template"
                  />
                </div>

                <div>
                  <Label htmlFor="templateSkill">Target Trade Skill</Label>
                  <Select 
                    value={emailTemplateData.tradeSkill} 
                    onValueChange={(value) => setEmailTemplateData(prev => ({ ...prev, tradeSkill: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_SKILLS.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={emailTemplateData.subject}
                  onChange={(e) => setEmailTemplateData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Expand Your Business with TV Installation Services"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">Email Content</Label>
                  <div className="flex gap-2">
                    {/* AI Options Panel */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          AI Options
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            AI Generation Options
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Email Tone</Label>
                            <Select 
                              value={aiOptions.tone} 
                              onValueChange={(value) => setAiOptions(prev => ({ ...prev, tone: value as any }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="persuasive">Persuasive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Primary Focus</Label>
                            <Select 
                              value={aiOptions.focus} 
                              onValueChange={(value) => setAiOptions(prev => ({ ...prev, focus: value as any }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="opportunity">Business Opportunity</SelectItem>
                                <SelectItem value="earnings">Income Potential</SelectItem>
                                <SelectItem value="flexibility">Work Flexibility</SelectItem>
                                <SelectItem value="skills">Skill Utilization</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Use AI Button */}
                    <Button 
                      onClick={handleGenerateAITemplate}
                      disabled={isGeneratingAI || !emailTemplateData.tradeSkill}
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {isGeneratingAI ? "Generating..." : "Use AI"}
                    </Button>

                    {/* Preset Templates Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Presets
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Preset Email Templates
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {TRADE_SKILLS.map((skill) => (
                            <div key={skill.value} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                 onClick={() => handleLoadPresetTemplate(skill.value)}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{skill.label}</h4>
                                <Badge variant="outline">Preset</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{skill.relevance}</p>
                              <Button size="sm" className="w-full">
                                Load {skill.label} Template
                              </Button>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <Textarea
                  id="content"
                  value={emailTemplateData.content}
                  onChange={(e) => setEmailTemplateData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Hi {{name}}, As a skilled {{tradeSkill}}, you have the perfect foundation to earn additional income through TV installation services..."
                  rows={12}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Available variables: {"{"}{"name"}, {"{"}{"tradeSkill"}, {"{"}{"invitationUrl"}, {"{"}{"platformBenefits"}, {"{"}{"estimatedEarnings"}
                </div>
              </div>

              <Button 
                onClick={handleCreateTemplate}
                disabled={createTemplateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-4">Loading templates...</div>
              ) : (emailTemplates as TradesPersonEmailTemplate[]).length === 0 ? (
                <div className="text-center py-4 text-gray-500">No email templates created yet</div>
              ) : (
                <div className="space-y-4">
                  {(emailTemplates as TradesPersonEmailTemplate[]).map((template: TradesPersonEmailTemplate) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.templateName}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {TRADE_SKILLS.find(s => s.value === template.tradeSkill)?.label || template.tradeSkill}
                          </Badge>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Invitations */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Invitation Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="text-center py-4">Loading invitations...</div>
              ) : (invitations as TradesPersonInvitation[]).length === 0 ? (
                <div className="text-center py-4 text-gray-500">No invitations sent yet</div>
              ) : (
                <div className="space-y-4">
                  {(invitations as TradesPersonInvitation[]).map((invitation: TradesPersonInvitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{invitation.name}</h4>
                            <Badge className={getStatusBadge(invitation.status)}>
                              {invitation.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Email:</span> {invitation.email}
                            </div>
                            <div>
                              <span className="font-medium">Trade:</span> {
                                TRADE_SKILLS.find(s => s.value === invitation.tradeSkill)?.label || 
                                invitation.tradeSkill
                              }
                            </div>
                            <div>
                              <span className="font-medium">County:</span> {invitation.county || 'Not specified'}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {
                                new Date(invitation.createdAt).toLocaleDateString()
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(invitation.invitationUrl)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy URL
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitationMutation.mutate(invitation.id)}
                            disabled={resendInvitationMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Resend
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}