import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tv, Menu, Home, Calendar, Settings, User } from 'lucide-react';
import LoginModals from '@/components/login-modals';

interface NavigationProps {
  onCustomerLogin?: () => void;
  onAdminLogin?: () => void;
}

export default function Navigation({ onCustomerLogin, onAdminLogin }: NavigationProps) {
  const [location] = useLocation();
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location === '/';

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Tv className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">SmartTVMount</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-primary transition-colors">
                How it Works
              </Link>
              <span className="text-gray-700 hover:text-primary transition-colors cursor-pointer">
                Pricing
              </span>
              <Link href="/installer" className="text-gray-700 hover:text-primary transition-colors">
                Installers
              </Link>
              <Button
                onClick={() => setShowCustomerLogin(true)}
                variant="default"
                className="bg-primary hover:bg-primary/90"
              >
                Customer Login
              </Button>
              <Button
                onClick={() => setShowAdminLogin(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                Admin
              </Button>
            </div>

            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col space-y-4 pt-6">
                  <Link 
                    href="/" 
                    className="flex items-center py-2 text-gray-700 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5 mr-3" />
                    How it Works
                  </Link>
                  <span className="flex items-center py-2 text-gray-700 hover:text-primary cursor-pointer">
                    <Calendar className="h-5 w-5 mr-3" />
                    Pricing
                  </span>
                  <Link 
                    href="/installer" 
                    className="flex items-center py-2 text-gray-700 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Installers
                  </Link>
                  <Button
                    onClick={() => {
                      setShowCustomerLogin(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start bg-primary hover:bg-primary/90"
                  >
                    <User className="h-5 w-5 mr-3" />
                    Customer Login
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAdminLogin(true);
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Admin
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <LoginModals
        showCustomerLogin={showCustomerLogin}
        showAdminLogin={showAdminLogin}
        onCloseCustomerLogin={() => setShowCustomerLogin(false)}
        onCloseAdminLogin={() => setShowAdminLogin(false)}
      />
    </>
  );
}
