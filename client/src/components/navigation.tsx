import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, Menu, Home, Settings, Wrench, LogIn } from "lucide-react";

export function Navigation() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customerLoginOpen, setCustomerLoginOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  const navItems = [
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Installers", href: "/installer" },
  ];

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle customer login logic
    setCustomerLoginOpen(false);
    navigate("/customer");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle admin login logic
    setAdminLoginOpen(false);
    navigate("/admin");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Tv className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">SmartTVMount</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
            
            <Dialog open={customerLoginOpen} onOpenChange={setCustomerLoginOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">Customer Login</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold">Customer Access</DialogTitle>
                  <p className="text-center text-gray-600">
                    Enter your booking details or scan your QR code
                  </p>
                </DialogHeader>
                <form onSubmit={handleCustomerLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="bookingId">Booking ID</Label>
                    <Input
                      id="bookingId"
                      placeholder="BK-2024-001"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="input-field"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCustomerLoginOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 btn-primary">
                      Access Dashboard
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={adminLoginOpen} onOpenChange={setAdminLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold">Admin Login</DialogTitle>
                  <p className="text-center text-gray-600">
                    Access the admin dashboard
                  </p>
                </DialogHeader>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="admin"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setAdminLoginOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 btn-primary">
                      Login
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Button
                  className="btn-primary justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCustomerLoginOpen(true);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Customer Login
                </Button>
                <Button
                  variant="outline"
                  className="justify-start border-primary text-primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAdminLoginOpen(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
