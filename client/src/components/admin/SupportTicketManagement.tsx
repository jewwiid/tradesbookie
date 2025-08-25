import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar,
  Filter,
  Search,
  Reply,
  Eye,
  Loader2,
  Trash2
} from "lucide-react";

interface SupportTicket {
  id: number;
  userId: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  assignedTo?: string;
  userEmail?: string;
  userName?: string;
}

interface TicketMessage {
  id: number;
  ticketId: number;
  userId: string;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

const statusOptions = [
  { value: "open", label: "Open", color: "bg-red-100 text-red-800" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "closed", label: "Closed", color: "bg-green-100 text-green-800" }
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
];

const categoryOptions = [
  { value: "general", label: "General Inquiry" },
  { value: "technical", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "booking", label: "Booking Issues" },
  { value: "installer", label: "Installer Support" },
  { value: "complaint", label: "Complaint" },
  { value: "feature", label: "Feature Request" }
];

export default function SupportTicketManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all support tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support/tickets"],
  });

  // Fetch ticket messages when a ticket is selected
  const { data: messages = [], isLoading: messagesLoading } = useQuery<TicketMessage[]>({
    queryKey: [`/api/admin/support/tickets/${selectedTicket?.id}/messages`],
    enabled: !!selectedTicket?.id,
  });

  // Reply to ticket mutation
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, message, status }: { ticketId: number; message: string; status?: string }) => {
      const response = await apiRequest('POST', `/api/admin/support/tickets/${ticketId}/reply`, {
        message,
        status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/support/tickets/${selectedTicket?.id}/messages`] });
      setReplyMessage("");
      setNewStatus("");
      setShowTicketDialog(false);
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to the customer and they'll receive an email notification.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    }
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, assignedTo }: { ticketId: number; status: string; assignedTo?: string }) => {
      const response = await apiRequest('PUT', `/api/admin/support/tickets/${ticketId}/status`, {
        status,
        assignedTo
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      toast({
        title: "Status Updated",
        description: "Ticket status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/support/tickets/${ticketId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      setShowTicketDialog(false);
      toast({
        title: "Ticket Deleted",
        description: "Support ticket has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket",
        variant: "destructive",
      });
    }
  });

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesSearch = searchTerm === "" || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setShowTicketDialog(true);
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage,
      status: newStatus !== selectedTicket.status ? newStatus : undefined
    });
  };

  const handleStatusChange = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  const handleDeleteTicket = (ticketId: number) => {
    deleteTicketMutation.mutate(ticketId);
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return (
      <Badge className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return (
      <Badge variant="outline" className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || priority}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading support tickets...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <CardTitle>Support Ticket Management</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{filteredTickets.length} tickets</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No support tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.userName || "Unknown"}</div>
                          <div className="text-sm text-gray-500">{ticket.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{ticket.subject}</div>
                          <div className="text-sm text-gray-500 truncate">{ticket.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryOptions.find(cat => cat.value === ticket.category)?.label || ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{formatDateTime(ticket.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Support Ticket</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this support ticket? This action cannot be undone and will permanently remove the ticket and all its messages.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTicket(ticket.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deleteTicketMutation.isPending}
                                >
                                  {deleteTicketMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete Ticket"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Support Ticket #{selectedTicket?.id}</span>
            </DialogTitle>
            <DialogDescription>
              Manage and respond to customer support requests
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex flex-col h-full min-h-0 gap-4">
              {/* Ticket Header */}
              <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Customer</Label>
                    <div className="mt-1">
                      <div className="font-medium">{selectedTicket.userName || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{selectedTicket.userEmail}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Created</Label>
                    <div className="mt-1 text-sm">{formatDateTime(selectedTicket.createdAt)}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">Category</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {categoryOptions.find(cat => cat.value === selectedTicket.category)?.label || selectedTicket.category}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="flex-shrink-0">
                <Label className="font-semibold">Subject</Label>
                <div className="mt-1 font-medium">{selectedTicket.subject}</div>
              </div>

              <Separator className="flex-shrink-0" />

              {/* Full Conversation */}
              <div className="flex-1 min-h-0 flex flex-col">
                <Label className="font-semibold mb-3 flex-shrink-0">Conversation ({messages.length} messages)</Label>
                <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-gray-50 rounded-lg border">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg max-w-[80%] border ${
                          message.isAdminReply 
                            ? 'bg-blue-100 border-blue-200 ml-auto text-right' 
                            : 'bg-white border-gray-200 mr-auto'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.isAdminReply ? (
                            <>
                              <span className="text-sm font-medium text-blue-700">Support Team</span>
                              <span className="text-xs text-blue-600">
                                {formatDateTime(message.createdAt)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-gray-700">Customer</span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(message.createdAt)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{message.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator className="flex-shrink-0" />

              {/* Reply Section */}
              <div className="space-y-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Reply to Customer</Label>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Update Status:</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  placeholder="Type your reply to the customer..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                />

                <div className="text-sm text-gray-500">
                  The customer will receive an email notification with your reply.
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                  >
                    {replyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}