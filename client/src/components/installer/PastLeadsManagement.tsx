import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ScheduleNegotiation } from "./ScheduleNegotiation";
import { 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  Calendar,
  DollarSign,
  AlertCircle,
  Hammer,
  Eye,
  Tv,
  Image,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Archive
} from "lucide-react";

interface PastLead {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  addons: string[];
  estimatedPrice: string;
  leadFee: string;
  status: string;
  scheduledDate?: Date;
  completedDate?: Date;
  customerNotes?: string;
  createdAt: string;
  declinedAt?: string; // Added for passed leads tracking
  // Additional fields for complete booking details
  needsWallMount?: boolean;
  difficulty?: string;
  preferredDate?: string;
  preferredTime?: string;
  roomPhotoUrl?: string;
  aiPreviewUrl?: string;
  // Multi-TV support
  tvInstallations?: any[];
  tvQuantity?: number;
  estimatedTotal?: string;
  referralCode?: string;
  referralDiscount?: string;
}

interface PurchasedLeadsManagementProps {
  installerId: number;
}

const statusColors = {
  'purchased': 'bg-blue-100 text-blue-800',
  'confirmed': 'bg-yellow-100 text-yellow-800',
  'scheduled': 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-orange-100 text-orange-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
};

const statusLabels = {
  'purchased': 'Lead Purchased',
  'confirmed': 'Customer Confirmed',
  'scheduled': 'Installation Scheduled',
  'in-progress': 'Work in Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

export default function PastLeadsManagement({ installerId }: PurchasedLeadsManagementProps) {
  const [selectedLead, setSelectedLead] = useState<PastLead | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [recentlyUpdatedLeads, setRecentlyUpdatedLeads] = useState<Set<number>>(new Set());
  const [showPassedLeads, setShowPassedLeads] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to check if a lead was recently updated
  const isRecentlyUpdated = (leadId: number) => {
    return recentlyUpdatedLeads.has(leadId);
  };

  // Function to mark a lead as recently updated
  const markAsRecentlyUpdated = (leadId: number) => {
    setRecentlyUpdatedLeads(prev => new Set(prev).add(leadId));
    // Remove the indicator after 30 seconds
    setTimeout(() => {
      setRecentlyUpdatedLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }, 30000);
  };

  // Fetch past leads
  const { data: pastLeads = [], isLoading } = useQuery<PastLead[]>({
    queryKey: [`/api/installer/${installerId}/past-leads`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch passed (declined) leads
  const { data: passedLeads = [], isLoading: passedLeadsLoading } = useQuery<PastLead[]>({
    queryKey: [`/api/installer/${installerId}/passed-leads`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Retrieve passed lead mutation
  const retrievePassedLeadMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest('POST', `/api/installer/${installerId}/retrieve-passed-lead/${requestId}`);
    },
    onSuccess: (data) => {
      toast({
        title: "Lead Retrieved",
        description: "The passed lead has been successfully retrieved and is now available in your active leads.",
      });
      // Refresh both passed leads and available leads
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/passed-leads`] });
      queryClient.invalidateQueries({ queryKey: ['/api/installer', installerId, 'available-leads'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to retrieve passed lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status, message }: { leadId: number; status: string; message?: string }) => {
      return apiRequest('POST', `/api/installer/${installerId}/update-lead-status`, { 
        leadId, 
        status,
        message 
      });
    },
    onSuccess: (data: any) => {
      // Mark the lead as recently updated for visual feedback
      if (selectedLead) {
        markAsRecentlyUpdated(selectedLead.id);
      }
      
      // Invalidate both past leads and available leads queries
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/past-leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/available-leads`] });
      
      // Force refetch immediately
      queryClient.refetchQueries({ queryKey: [`/api/installer/${installerId}/past-leads`] });
      
      toast({
        title: "Status Updated",
        description: `Lead status updated successfully. Customer has been notified.`,
      });
      setShowUpdateDialog(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = () => {
    if (selectedLead && newStatus) {
      updateStatusMutation.mutate({
        leadId: selectedLead.id,
        status: newStatus,
        message: updateMessage.trim() || undefined
      });
    }
  };

  const openUpdateDialog = (lead: PastLead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setUpdateMessage('');
    setShowUpdateDialog(true);
  };

  const openScheduleDialog = (lead: PastLead) => {
    setSelectedLead(lead);
    setShowScheduleDialog(true);
  };

  const openDetailsDialog = (lead: PastLead) => {
    setSelectedLead(lead);
    setShowDetailsDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Purchased Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Manage your purchased leads and update their status to keep customers informed
          </p>
          
          {pastLeads.length === 0 ? (
            <div className="text-center py-12">
              <Hammer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Past Leads</h3>
              <p className="text-gray-500">
                Your purchased leads will appear here once you start accepting requests
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pastLeads.map((lead) => (
                <Card key={lead.id} className={`border hover:shadow-lg transition-all duration-300 ${
                  isRecentlyUpdated(lead.id) 
                    ? 'border-green-300 bg-green-50/30 shadow-md ring-1 ring-green-200' 
                    : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.customerName}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {lead.address}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                          {statusLabels[lead.status as keyof typeof statusLabels]}
                        </Badge>
                        {isRecentlyUpdated(lead.id) && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Recently Updated
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">TV Size:</span>
                        <p className="font-medium">{lead.tvSize}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Service:</span>
                        <p className="font-medium">{lead.serviceType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <p className="font-medium">€{lead.estimatedPrice}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Lead Fee:</span>
                        <p className="font-medium text-green-600">€{lead.leadFee}</p>
                      </div>
                    </div>
                    
                    {/* Customer Contact Details - Available after purchase */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Customer Contact Details
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-green-700">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${lead.customerEmail}`} className="hover:underline">
                            {lead.customerEmail}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-green-700">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${lead.customerPhone}`} className="hover:underline">
                            {lead.customerPhone}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Purchased {new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {lead.customerNotes && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <span className="font-medium text-gray-700">Customer Notes:</span>
                        <p className="text-gray-600 mt-1">{lead.customerNotes}</p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t space-y-2">
                      <Button
                        onClick={() => openDetailsDialog(lead)}
                        variant="default"
                        size="sm"
                        className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 mb-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Complete Details
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => openUpdateDialog(lead)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Hammer className="w-3 h-3" />
                          Update
                        </Button>
                        <Button
                          onClick={() => openScheduleDialog(lead)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          Schedule
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

      {/* Passed Leads Section */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowPassedLeads(!showPassedLeads)}
            className="w-full flex items-center justify-between text-left"
          >
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-orange-600" />
              Passed Leads ({passedLeads.length})
            </CardTitle>
            {showPassedLeads ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </CardHeader>
        
        {showPassedLeads && (
          <CardContent>
            <p className="text-gray-600 mb-4">
              Leads you previously passed on. You can retrieve them back to your active leads list.
            </p>
            
            {passedLeadsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : passedLeads.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Passed Leads</h3>
                <p className="text-gray-500 text-sm">
                  Leads you pass on will appear here, allowing you to retrieve them later if needed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {passedLeads.map((lead) => (
                  <Card key={lead.id} className="border-orange-200 bg-orange-50/30">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{lead.address}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Tv className="w-3 h-3" />
                            {lead.tvSize}" • {lead.serviceType}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-orange-300 text-orange-800">
                          Passed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                          <p><strong>Price:</strong> €{lead.estimatedPrice}</p>
                          <p><strong>Passed on:</strong> {lead.declinedAt ? new Date(lead.declinedAt).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Customer details:</strong> {lead.customerName}
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Retrieve this lead to see full contact information
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => retrievePassedLeadMutation.mutate(lead.id)}
                          disabled={retrievePassedLeadMutation.isPending}
                          className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {retrievePassedLeadMutation.isPending ? 'Retrieving...' : 'Retrieve Lead'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent aria-describedby="status-update-description">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription id="status-update-description">
              Update the status of this lead to keep the customer informed of progress
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium">{selectedLead.customerName}</h3>
                <p className="text-sm text-gray-600">{selectedLead.address}</p>
                <p className="text-sm text-gray-600">{selectedLead.tvSize} • {selectedLead.serviceType}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Customer Confirmed</SelectItem>
                    <SelectItem value="scheduled">Installation Scheduled</SelectItem>
                    <SelectItem value="in-progress">Work in Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Customer (Optional)
                </label>
                <Textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Add a personal message about this status update (e.g., estimated completion time, next steps, etc.)"
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be included in the email notification to the customer
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Customer Notification</p>
                    <p>The customer will receive an email update about this status change</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending || newStatus === selectedLead.status}
                  className="flex-1"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Negotiation Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="schedule-dialog-description">
          <DialogHeader>
            <DialogTitle>Schedule Installation</DialogTitle>
            <DialogDescription id="schedule-dialog-description">
              Coordinate installation timing with {selectedLead?.customerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <ScheduleNegotiation
              bookingId={selectedLead.id}
              installerId={installerId}
              customerName={selectedLead.customerName}
              isInstaller={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" aria-describedby="complete-booking-details">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Complete Booking Details</DialogTitle>
            <DialogDescription id="complete-booking-details" className="text-sm sm:text-base">
              Comprehensive information about this purchased installation
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && selectedLead.customerName && selectedLead.address ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Customer Name</label>
                    <p className="text-sm sm:text-base break-words font-medium">{selectedLead.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Contact Phone</label>
                    <p className="text-sm sm:text-base break-words">
                      <a href={`tel:${selectedLead.customerPhone}`} className="text-blue-600 hover:underline">
                        {selectedLead.customerPhone}
                      </a>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Email Address</label>
                    <p className="text-sm sm:text-base break-words">
                      <a href={`mailto:${selectedLead.customerEmail}`} className="text-blue-600 hover:underline">
                        {selectedLead.customerEmail}
                      </a>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Installation Address</label>
                    <p className="text-sm sm:text-base break-words">{selectedLead.address}</p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                  <Tv className="w-5 h-5 text-blue-600" />
                  Service Specifications
                </h3>
                
                {selectedLead.tvQuantity && selectedLead.tvQuantity > 1 && selectedLead.tvInstallations && Array.isArray(selectedLead.tvInstallations) ? (
                  /* Multi-TV Installation Details */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Tv className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-base">Multiple TV Installation ({selectedLead.tvQuantity} TVs)</span>
                    </div>
                    
                    {(selectedLead.tvInstallations || []).map((tv: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
                        <h4 className="font-medium text-sm mb-2">TV {index + 1} ({tv?.location || `TV ${index + 1}`})</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-600">Size:</span> {tv?.tvSize || 'Not specified'}"
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Service:</span> {tv?.serviceType || 'Standard'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Wall:</span> {tv?.wallType || 'Not specified'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Mount:</span> {tv?.mountType || 'Not specified'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Wall Mount:</span> {tv?.needsWallMount ? 'Required' : 'Not needed'}
                          </div>
                          {tv?.basePrice && (
                            <div>
                              <span className="font-medium text-gray-600">Price:</span> €{tv.basePrice}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs sm:text-sm font-medium text-gray-600">Installation Difficulty</label>
                          <p className="text-sm sm:text-base capitalize">{selectedLead.difficulty || 'Standard'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single TV Installation Details */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">TV Size</label>
                      <p className="text-sm sm:text-base font-bold">{selectedLead.tvSize || 'Not specified'}" Television</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Service Type</label>
                      <p className="text-sm sm:text-base capitalize break-words">{selectedLead.serviceType?.replace('-', ' ') || 'Standard Installation'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Wall Type</label>
                      <p className="text-sm sm:text-base capitalize">{selectedLead.wallType || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Mount Type</label>
                      <p className="text-sm sm:text-base capitalize">{selectedLead.mountType || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Wall Mount Required</label>
                      <p className="text-sm sm:text-base">{selectedLead.needsWallMount ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Installation Difficulty</label>
                      <p className="text-sm sm:text-base capitalize">{selectedLead.difficulty || 'Standard'}</p>
                    </div>
                  </div>
                )}

                {/* Addons */}
                {selectedLead.addons && Array.isArray(selectedLead.addons) && selectedLead.addons.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Add-on Services</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedLead.addons.map((addon: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {typeof addon === 'string' ? addon : (addon?.name || 'Unknown addon')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduling Information */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Scheduling Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Preferred Date</label>
                    <p className="text-sm sm:text-base">
                      {selectedLead.preferredDate 
                        ? (() => {
                            try {
                              return new Date(selectedLead.preferredDate).toLocaleDateString();
                            } catch {
                              return 'Invalid date';
                            }
                          })()
                        : 'No preference specified'
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Preferred Time</label>
                    <p className="text-sm sm:text-base">{selectedLead.preferredTime || 'Any time'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Current Status</label>
                    <Badge className={statusColors[selectedLead.status as keyof typeof statusColors]}>
                      {statusLabels[selectedLead.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Lead Purchased</label>
                    <p className="text-sm sm:text-base">
                      {(() => {
                        try {
                          return selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'Unknown date';
                        } catch {
                          return 'Invalid date';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              {(selectedLead.roomPhotoUrl || selectedLead.aiPreviewUrl) && (
                <div className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                    <Image className="w-5 h-5 text-indigo-600" />
                    Room Photos & Preview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedLead.roomPhotoUrl && (
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">Customer's Room Photo</label>
                        <img 
                          src={selectedLead.roomPhotoUrl} 
                          alt="Customer's room photo" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {selectedLead.aiPreviewUrl && (
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-600">AI Installation Preview</label>
                        <img 
                          src={selectedLead.aiPreviewUrl} 
                          alt="AI installation preview" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Information */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Pricing Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Estimated Price</label>
                    <p className="text-sm sm:text-base font-semibold text-green-600">€{selectedLead.estimatedPrice || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Lead Fee (Your Cost)</label>
                    <p className="text-sm sm:text-base font-medium text-blue-600">€{selectedLead.leadFee || '0'}</p>
                  </div>
                  {selectedLead.estimatedTotal && (
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Total Project Value</label>
                      <p className="text-sm sm:text-base font-semibold">€{selectedLead.estimatedTotal}</p>
                    </div>
                  )}
                  {selectedLead.referralCode && (
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Referral Code</label>
                      <p className="text-sm sm:text-base">{selectedLead.referralCode}</p>
                    </div>
                  )}
                  {selectedLead.referralDiscount && (
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Customer Discount</label>
                      <p className="text-sm sm:text-base text-green-600">-€{selectedLead.referralDiscount}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Notes */}
              {selectedLead.customerNotes && (
                <div className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Customer Notes
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm sm:text-base text-gray-700">{selectedLead.customerNotes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : selectedLead ? (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Incomplete Lead Data</h3>
              <p className="text-gray-600 mb-4">
                This lead appears to have incomplete information. Please try refreshing the page or contact support if the issue persists.
              </p>
              <Button onClick={() => setShowDetailsDialog(false)} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lead Selected</h3>
              <p className="text-gray-600">Unable to display lead details.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}