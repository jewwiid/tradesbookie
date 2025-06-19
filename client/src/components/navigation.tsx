import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tv, Menu, Home, Calendar, Settings, User, Shield, MapPin } from 'lucide-react';

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const isHome = location === '/';
  
  // Check if user is admin
  const isAdmin = user?.email === 'admin@tradesbook.ie' || 
                  user?.email === 'jude.okun@gmail.com' || 
                  user?.id === 'admin' || 
                  user?.id === '42442296';

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Tv className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">tradesbook.ie</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {!isAdmin && (
                <>
                  <Link href="/how-it-works" className="text-gray-700 hover:text-primary transition-colors">
                    How it Works
                  </Link>
                  <Link href="/pricing" className="text-gray-700 hover:text-primary transition-colors">
                    Pricing
                  </Link>
                  <Link href="/our-installers" className="text-gray-700 hover:text-primary transition-colors">
                    Our Installers
                  </Link>
                  <Link href="/installation-tracker" className="text-gray-700 hover:text-primary transition-colors">
                    Installation Map
                  </Link>
                </>
              )}
              {isAuthenticated && isAdmin && (
                <Link href="/admin-dashboard" className="text-gray-700 hover:text-primary transition-colors flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
              {!isAdmin && (
                <Link href="/booking">
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Book Installation
                  </Button>
                </Link>
              )}
              {isAuthenticated ? (
                <Link href="/api/logout">
                  <Button variant="outline">
                    Logout
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/api/login">
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                  <Link href="/api/login">
                    <Button variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
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
                  {!isAdmin && (
                    <>
                      <Link 
                        href="/how-it-works" 
                        className="flex items-center py-2 text-gray-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="h-5 w-5 mr-3" />
                        How it Works
                      </Link>
                      <Link 
                        href="/pricing" 
                        className="flex items-center py-2 text-gray-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-5 w-5 mr-3" />
                        Pricing
                      </Link>
                      <Link 
                        href="/our-installers" 
                        className="flex items-center py-2 text-gray-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5 mr-3" />
                        Our Installers
                      </Link>
                      <Link 
                        href="/installation-tracker" 
                        className="flex items-center py-2 text-gray-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MapPin className="h-5 w-5 mr-3" />
                        Installation Map
                      </Link>
                    </>
                  )}
                  {isAuthenticated && isAdmin && (
                    <Link 
                      href="/admin-dashboard" 
                      className="flex items-center py-2 text-gray-700 hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5 mr-3" />
                      Admin Dashboard
                    </Link>
                  )}
                  {!isAdmin && (
                    <>
                      <Link 
                        href="/installer-registration" 
                        className="flex items-center py-2 text-gray-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        Join as Installer
                      </Link>
                      <Link 
                        href="/booking" 
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button className="w-full justify-start bg-primary hover:bg-primary/90">
                          <Calendar className="h-5 w-5 mr-3" />
                          Book Installation
                        </Button>
                      </Link>
                    </>
                  )}
                  {isAuthenticated ? (
                    <Link 
                      href="/api/logout" 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full justify-start">
                        <User className="h-5 w-5 mr-3" />
                        Logout
                      </Button>
                    </Link>
                  ) : (
                    <Link 
                      href="/api/login" 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full justify-start">
                        <User className="h-5 w-5 mr-3" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
