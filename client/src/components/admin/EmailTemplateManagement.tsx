import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Mail, Edit, Trash2, Plus, Eye, Code, Send, Loader2 } from "lucide-react";

interface EmailTemplate {
  id: number;
  templateKey: string;
  templateName: string;
  fromEmail: string;
  replyToEmail: string | null;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  shortcodes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_SHORTCODES = [
  { code: "{{customerName}}", description: "Customer's full name" },
  { code: "{{customerEmail}}", description: "Customer's email address" },
  { code: "{{bookingId}}", description: "Booking reference number" },
  { code: "{{qrCode}}", description: "QR code for tracking" },
  { code: "{{serviceType}}", description: "Type of service booked" },
  { code: "{{tvSize}}", description: "TV size in inches" },
  { code: "{{address}}", description: "Installation address" },
  { code: "{{totalPrice}}", description: "Total booking price" },
  { code: "{{installerName}}", description: "Installer's name" },
  { code: "{{installerEarnings}}", description: "Installer's earnings" },
  { code: "{{scheduledDate}}", description: "Scheduled installation date" },
  { code: "{{trackingUrl}}", description: "Booking tracking URL" },
  { code: "{{currentDate}}", description: "Current date" },
  { code: "{{platformName}}", description: "Platform name (tradesbook.ie)" },
  { code: "{{supportEmail}}", description: "Support email address" }
];

const DEFAULT_EMAIL_TEMPLATES = [
  {
    templateKey: "booking_confirmation",
    templateName: "Booking Confirmation",
    description: "Sent to customers when they complete a booking"
  },
  {
    templateKey: "installer_notification",
    templateName: "Installer Job Notification",
    description: "Sent to installers when new jobs are available"
  },
  {
    templateKey: "installer_welcome",
    templateName: "Installer Welcome Email",
    description: "Sent to new installers upon registration"
  },
  {
    templateKey: "installer_approval",
    templateName: "Installer Approval Email",
    description: "Sent when installer applications are approved"
  },
  {
    templateKey: "installer_rejection",
    templateName: "Installer Rejection Email",
    description: "Sent when installer applications are rejected"
  },
  {
    templateKey: "payment_confirmation",
    templateName: "Payment Confirmation",
    description: "Sent when payments are successfully processed"
  }
];

export default function EmailTemplateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewData, setPreviewData] = useState<string>("");
  const [testingTemplate, setTestingTemplate] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    templateKey: "",
    templateName: "",
    fromEmail: "noreply@tradesbook.ie",
    replyToEmail: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    shortcodes: [] as string[],
    isActive: true
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/admin/email-templates"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/email-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setShowCreateDialog(false);
      resetForm();
      toast({ title: "Email template created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating template",
        description: error.message || "Failed to create email template",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/admin/email-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
      toast({ title: "Email template updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating template",
        description: error.message || "Failed to update email template",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Email template deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.message || "Failed to delete email template",
        variant: "destructive"
      });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: (templateId: number) => apiRequest("POST", `/api/admin/email-templates/${templateId}/test`),
    onSuccess: () => {
      toast({ 
        title: "Test email sent successfully",
        description: "Check your email inbox for the test message"
      });
      setTestingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error sending test email",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
      setTestingTemplate(null);
    }
  });

  const resetForm = () => {
    setFormData({
      templateKey: "",
      templateName: "",
      fromEmail: "noreply@tradesbook.ie",
      replyToEmail: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      shortcodes: [],
      isActive: true
    });
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      templateKey: template.templateKey,
      templateName: template.templateName,
      fromEmail: template.fromEmail,
      replyToEmail: template.replyToEmail || "",
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      shortcodes: template.shortcodes || [],
      isActive: template.isActive
    });
    setShowEditDialog(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    // Replace shortcodes with sample data for preview
    let previewHtml = template.htmlContent;
    const sampleData = {
      "{{customerName}}": "John Doe",
      "{{customerEmail}}": "john.doe@example.com",
      "{{bookingId}}": "QR-BOOK-12345",
      "{{qrCode}}": "QR-BOOK-12345",
      "{{serviceType}}": "Premium Wall Mount",
      "{{tvSize}}": "65",
      "{{address}}": "123 Main Street, Dublin, Ireland",
      "{{totalPrice}}": "€249",
      "{{installerName}}": "Mike Johnson",
      "{{installerEarnings}}": "€179",
      "{{scheduledDate}}": "March 15, 2025",
      "{{trackingUrl}}": "https://tradesbook.ie/track/QR-BOOK-12345",
      "{{currentDate}}": new Date().toLocaleDateString(),
      "{{platformName}}": "tradesbook.ie",
      "{{supportEmail}}": "support@tradesbook.ie"
    };

    Object.entries(sampleData).forEach(([shortcode, value]) => {
      previewHtml = previewHtml.replace(new RegExp(shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    setPreviewData(previewHtml);
    setShowPreviewDialog(true);
  };

  const handleTestEmail = (template: EmailTemplate) => {
    setTestingTemplate(template.id);
    testEmailMutation.mutate(template.id);
  };

  const handleSubmit = () => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const insertShortcode = (shortcode: string) => {
    const textarea = document.querySelector('textarea[name="htmlContent"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = formData.htmlContent.substring(0, start) + shortcode + formData.htmlContent.substring(end);
      setFormData({ ...formData, htmlContent: newValue });
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + shortcode.length, start + shortcode.length);
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading email templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Template Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customize email templates with shortcodes and manage sender settings
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No email templates found</p>
                <p className="text-sm text-muted-foreground">Create your first email template to get started</p>
              </div>
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template: EmailTemplate) => (
                <Card key={template.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{template.templateName}</h3>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Key:</strong> {template.templateKey}</p>
                          <p><strong>From:</strong> {template.fromEmail}</p>
                          <p><strong>Subject:</strong> {template.subject}</p>
                          {template.replyToEmail && (
                            <p><strong>Reply-To:</strong> {template.replyToEmail}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(template)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestEmail(template)}
                          disabled={testingTemplate === template.id}
                          className="flex items-center gap-1"
                        >
                          {testingTemplate === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {testingTemplate === template.id ? 'Sending...' : 'Test'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(template.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Template Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Suggestions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Common email templates you might want to create
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {DEFAULT_EMAIL_TEMPLATES.map((suggestion) => (
              <div key={suggestion.templateKey} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{suggestion.templateName}</h4>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      templateKey: suggestion.templateKey,
                      templateName: suggestion.templateName
                    });
                    setShowCreateDialog(true);
                  }}
                >
                  Create
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              Configure your email template with shortcodes for dynamic content
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateKey">Template Key</Label>
                  <Input
                    id="templateKey"
                    value={formData.templateKey}
                    onChange={(e) => setFormData({...formData, templateKey: e.target.value})}
                    placeholder="e.g., booking_confirmation"
                    disabled={!!selectedTemplate}
                  />
                </div>
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={formData.templateName}
                    onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                    placeholder="e.g., Booking Confirmation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({...formData, fromEmail: e.target.value})}
                    placeholder="noreply@tradesbook.ie"
                  />
                </div>
                <div>
                  <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
                  <Input
                    id="replyToEmail"
                    value={formData.replyToEmail}
                    onChange={(e) => setFormData({...formData, replyToEmail: e.target.value})}
                    placeholder="support@tradesbook.ie"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g., Booking Confirmation - {{bookingId}}"
                />
              </div>

              <div>
                <Label htmlFor="htmlContent">HTML Content</Label>
                <Textarea
                  id="htmlContent"
                  name="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({...formData, htmlContent: e.target.value})}
                  placeholder="Enter your HTML email template..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="textContent">Text Content (Optional)</Label>
                <Textarea
                  id="textContent"
                  value={formData.textContent}
                  onChange={(e) => setFormData({...formData, textContent: e.target.value})}
                  placeholder="Plain text version of your email..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Template is active</Label>
              </div>
            </div>

            {/* Shortcodes Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Available Shortcodes
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {AVAILABLE_SHORTCODES.map((shortcode) => (
                    <div key={shortcode.code} className="p-2 border rounded cursor-pointer hover:bg-muted"
                         onClick={() => insertShortcode(shortcode.code)}>
                      <code className="text-sm font-mono text-primary">{shortcode.code}</code>
                      <p className="text-xs text-muted-foreground mt-1">{shortcode.description}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click any shortcode to insert it at your cursor position
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              setSelectedTemplate(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Email Preview
            </DialogTitle>
            <DialogDescription>
              Preview how the email will look with sample data
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="p-4 min-h-[400px] max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewData }}
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowPreviewDialog(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}