import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginModalsProps {
  showCustomerLogin: boolean;
  setShowCustomerLogin: (show: boolean) => void;
  showAdminLogin: boolean;
  setShowAdminLogin: (show: boolean) => void;
}

export default function LoginModals({
  showCustomerLogin,
  setShowCustomerLogin,
  showAdminLogin,
  setShowAdminLogin
}: LoginModalsProps) {
  const handleCustomerLogin = () => {
    setShowCustomerLogin(false);
    window.location.href = "/customer/demo-token";
  };

  const handleAdminLogin = () => {
    setShowAdminLogin(false);
    window.location.href = "/api/login";
  };

  return (
    <>
      {/* Customer Login Modal */}
      <Dialog open={showCustomerLogin} onOpenChange={setShowCustomerLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Customer Access</DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              Enter your booking details or scan your QR code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input id="bookingId" placeholder="BK-2024-001" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCustomerLogin(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCustomerLogin}>
                Access Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Login Modal */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Admin Login</DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              Access the admin dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="admin" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdminLogin(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdminLogin}>
                Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}