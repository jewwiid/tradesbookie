import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useInstallerAuth } from '@/hooks/useInstallerAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tv, Menu, Home, Calendar, Settings, User, Shield, MapPin, LogIn, UserPlus, X, Wrench, FileText, MessageCircle } from 'lucide-react';
import SimplifiedAuthDialog from './SimplifiedAuthDialog';

interface NavigationProps {
  isInstallerContext?: boolean;
  installerProfile?: any;
}

export default function Navigation({ isInstallerContext = false, installerProfile: propInstallerProfile }: NavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { installerProfile: globalInstallerProfile, isInstallerAuthenticated } = useInstallerAuth();

  const isHome = location === '/';
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
                  user?.email === 'admin@tradesbook.ie' || 
                  user?.email === 'jude.okun@gmail.com' || 
                  user?.id === '42442296';

  // Use either the prop installer profile or the global one
  const currentInstallerProfile = propInstallerProfile || globalInstallerProfile;
  const currentlyInstallerAuthenticated = !!propInstallerProfile || isInstallerAuthenticated;

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        {/* First Row - Brand */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center flex-col py-4">
              <Link href="/" className="flex flex-col items-center">
                <span className="font-gooddog text-gray-900 text-[40px]">tradesbook.ie</span>
                <span className="font-gooddog text-[15px] mt-[-7px] mb-[-7px] text-center text-[#453b3b]">...where trades get booked!</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Second Row - Navigation */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center justify-start flex-1">
                {!isAdmin && !isInstallerContext && (
                  <div className="flex items-center space-x-6">
                    <Link 
                      href="/how-it-works" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      How it Works
                    </Link>
                    <Link 
                      href="/resources" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      Resources
                    </Link>
                    <Link 
                      href="/ai-help" 
                      className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      AI Help
                    </Link>
                    <Link 
                      href="/booking-tracker" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      Track Booking
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Side - CTA and Auth */}
              <div className="hidden md:flex items-center space-x-3">
                {!isAdmin && !currentlyInstallerAuthenticated && !isAuthenticated && (
                  <>
                    <Link href="/installer-login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:text-primary font-medium"
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        Installer
                      </Button>
                    </Link>
                    <Link href="/booking">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 font-medium"
                      >
                        <Tv className="w-4 h-4 mr-1" />
                        Book Installation
                      </Button>
                    </Link>
                  </>
                )}
                {currentlyInstallerAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      <Wrench className="w-3 h-3 inline mr-1" />
                      {currentInstallerProfile?.contactName || currentInstallerProfile?.email?.split('@')[0]}
                    </div>
                    <Link href="/installer-dashboard">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="font-medium"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/installers/logout', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          });
                          if (response.ok) {
                            // Clear localStorage and redirect
                            localStorage.removeItem('installer');
                            localStorage.removeItem('installerId');
                            window.location.href = '/installer-login';
                          }
                        } catch (error) {
                          console.error('Logout error:', error);
                          // Fallback: still clear localStorage and redirect
                          localStorage.removeItem('installer');
                          localStorage.removeItem('installerId');
                          window.location.href = '/installer-login';
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                      Welcome, {user?.firstName || user?.email?.split('@')[0]}
                    </div>
                    {isAdmin && (
                      <Link href="/admin-dashboard">
                        <Button variant="outline" size="sm" className="font-medium">
                          <Shield className="w-4 h-4 mr-1" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link href="/customer-dashboard">
                        <Button variant="outline" size="sm" className="font-medium">
                          <User className="w-4 h-4 mr-1" />
                          My Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium"
                      onClick={() => {
                        window.location.href = '/api/logout';
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : !isInstallerContext ? (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium"
                      onClick={() => setAuthDialogOpen(true)}
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Sign In
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Mobile menu trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[400px] min-w-[280px] p-0" aria-describedby="mobile-menu-description">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription id="mobile-menu-description" className="sr-only">
                    Main navigation menu for mobile devices
                  </SheetDescription>
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center p-6 border-b">
                      <h2 className="text-lg font-semibold">Menu</h2>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 py-4 overflow-y-auto">
                      {!isAdmin && !currentlyInstallerAuthenticated && (
                        <div className="space-y-2 px-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Navigation
                          </div>
                          <Link 
                            href="/how-it-works" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Home className="h-5 w-5 mr-4 flex-shrink-0" />
                            How it Works
                          </Link>
                          <Link 
                            href="/resources" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-5 w-5 mr-4 flex-shrink-0" />
                            Resources
                          </Link>
                          <Link 
                            href="/booking-tracker" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Calendar className="h-5 w-5 mr-4 flex-shrink-0" />
                            Track Booking
                          </Link>
                          <Link 
                            href="/ai-help" 
                            className="flex items-center py-4 px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-base min-h-[48px] font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <MessageCircle className="h-5 w-5 mr-4 flex-shrink-0" />
                            AI Help Assistant
                          </Link>
                        </div>
                      )}

                      {/* Admin Section */}
                      {isAuthenticated && isAdmin && (
                        <div className="space-y-2 px-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Admin
                          </div>
                          <Link 
                            href="/admin-dashboard" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="h-5 w-5 mr-4 flex-shrink-0" />
                            Admin Dashboard
                          </Link>
                        </div>
                      )}

                      {/* Customer Dashboard Section */}
                      {isAuthenticated && !isAdmin && !currentlyInstallerAuthenticated && (
                        <div className="space-y-2 px-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Customer Dashboard
                          </div>
                          <Link 
                            href="/customer-dashboard" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5 mr-4 flex-shrink-0" />
                            My Dashboard
                          </Link>
                        </div>
                      )}

                      {/* Installer Dashboard Section */}
                      {currentlyInstallerAuthenticated && (
                        <div className="space-y-2 px-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Installer Dashboard
                          </div>
                          <Link 
                            href="/installer-dashboard" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Settings className="h-5 w-5 mr-4 flex-shrink-0" />
                            Dashboard
                          </Link>
                          <Link 
                            href="/" 
                            className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Home className="h-5 w-5 mr-4 flex-shrink-0" />
                            Home
                          </Link>
                        </div>
                      )}

                      {/* Installer Section for non-authenticated */}
                      {!isAdmin && !currentlyInstallerAuthenticated && !isAuthenticated && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-2 px-4">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                              For Installers
                            </div>
                            <Link 
                              href="/installer-login" 
                              className="flex items-center py-4 px-4 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors text-base min-h-[48px]"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Wrench className="h-5 w-5 mr-4 flex-shrink-0" />
                              Installer
                            </Link>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t p-4 space-y-3">
                      {!isAdmin && !currentlyInstallerAuthenticated && !isAuthenticated && (
                        <Link 
                          href="/booking" 
                          className="w-full block"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button className="w-full justify-center bg-primary hover:bg-primary/90">
                            <Tv className="h-5 w-5 mr-2" />
                            Book Installation
                          </Button>
                        </Link>
                      )}
                      
                      {currentlyInstallerAuthenticated ? (
                        <div className="space-y-3">
                          <div className="text-center text-sm text-gray-600 bg-blue-50 p-2 rounded-md border border-blue-200">
                            <Wrench className="w-4 h-4 inline mr-1" />
                            {currentInstallerProfile?.contactName || currentInstallerProfile?.email?.split('@')[0]}
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full justify-center"
                            onClick={async () => {
                              setMobileMenuOpen(false);
                              try {
                                const response = await fetch('/api/installers/logout', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                });
                                if (response.ok) {
                                  // Clear localStorage and redirect
                                  localStorage.removeItem('installer');
                                  localStorage.removeItem('installerId');
                                  window.location.href = '/installer-login';
                                }
                              } catch (error) {
                                console.error('Logout error:', error);
                                // Fallback: still clear localStorage and redirect
                                localStorage.removeItem('installer');
                                localStorage.removeItem('installerId');
                                window.location.href = '/installer-login';
                              }
                            }}
                          >
                            <User className="h-5 w-5 mr-2" />
                            Logout
                          </Button>
                        </div>
                      ) : isAuthenticated ? (
                        <div className="space-y-3">
                          <div className="text-center text-sm text-gray-600">
                            Welcome, {user?.firstName || user?.email?.split('@')[0]}
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full justify-center"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              window.location.href = '/api/logout';
                            }}
                          >
                            <User className="h-5 w-5 mr-2" />
                            Logout
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full justify-center"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setAuthDialogOpen(true);
                          }}
                        >
                          <LogIn className="h-5 w-5 mr-2" />
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Simplified Authentication Dialog */}
      <SimplifiedAuthDialog 
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onSuccess={(user) => {
          console.log('User authenticated:', user);
          // Refresh the page to update auth state
          window.location.reload();
        }}
      />
    </>
  );
}
