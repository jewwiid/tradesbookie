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
  Hammer
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
  const [newStatus, setNewStatus] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch past leads
  const { data: pastLeads = [], isLoading } = useQuery<PastLead[]>({
    queryKey: [`/api/installer/${installerId}/past-leads`],
    refetchInterval: 30000, // Refresh every 30 seconds
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
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/past-leads`] });
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
                <Card key={lead.id} className="border hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.customerName}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {lead.address}
                        </p>
                      </div>
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {statusLabels[lead.status as keyof typeof statusLabels]}
                      </Badge>
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
                    
                    <div className="pt-2 border-t">
                      <Button
                        onClick={() => openUpdateDialog(lead)}
                        className="w-full"
                        size="sm"
                      >
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
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
    </div>
  );
}