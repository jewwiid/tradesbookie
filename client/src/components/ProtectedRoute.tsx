import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  redirectPath = "/" 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/admin-login";
      }, 1000);
      return;
    }

    if (!isLoading && isAuthenticated && requireAdmin) {
      // For admin access, we'll use a simple check - this can be enhanced later with proper roles
      // For now, restrict to authenticated users only (can be refined based on actual user structure)
      const userEmail = (user as any)?.email || '';
      const isAdmin = userEmail.includes('admin') || userEmail.includes('support');
      
      if (!isAdmin) {
        toast({
          title: "Unauthorized Access",
          description: "Admin privileges required to access this page.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, redirectPath, toast]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Additional admin check
  if (requireAdmin) {
    const userEmail = (user as any)?.email || '';
    const isAdmin = userEmail.includes('admin') || userEmail.includes('support');
    
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600">This page is restricted to administrators only.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}