import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tv, Menu, Home, Calendar, Settings, User, Shield, MapPin, LogIn, UserPlus, X } from 'lucide-react';
import SimplifiedAuthDialog from './SimplifiedAuthDialog';

interface NavigationProps {
  isInstallerContext?: boolean;
  installerProfile?: any;
}

export default function Navigation({ isInstallerContext = false, installerProfile }: NavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const isHome = location === '/';
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
                  user?.email === 'admin@tradesbook.ie' || 
                  user?.email === 'jude.okun@gmail.com' || 
                  user?.id === '42442296';

  // Check if installer is authenticated
  const isInstallerAuthenticated = !!installerProfile;

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
              <div className="hidden lg:flex items-center justify-start flex-1">
                {!isAdmin && !isInstallerContext && (
                  <div className="flex items-center space-x-6">
                    <Link 
                      href="/how-it-works" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      How it Works
                    </Link>
                    <Link 
                      href="/pricing" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      Pricing
                    </Link>
                    <Link 
                      href="/our-installers" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      Our Installers
                    </Link>
                    <Link 
                      href="/installation-tracker" 
                      className="text-gray-700 hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      Installation Map
                    </Link>
                  </div>
                )}
              </div>

              {/* Medium Screen Navigation - Compact */}
              <div className="hidden md:flex lg:hidden items-center justify-center flex-1">
                {!isAdmin && !isInstallerContext && (
                  <div className="flex items-center space-x-3">
                    <Link 
                      href="/how-it-works" 
                      className="text-gray-700 hover:text-primary transition-colors text-xs font-medium px-1 py-1 rounded-md hover:bg-primary/5"
                    >
                      How it Works
                    </Link>
                    <Link 
                      href="/pricing" 
                      className="text-gray-700 hover:text-primary transition-colors text-xs font-medium px-1 py-1 rounded-md hover:bg-primary/5"
                    >
                      Pricing
                    </Link>
                    <Link 
                      href="/our-installers" 
                      className="text-gray-700 hover:text-primary transition-colors text-xs font-medium px-1 py-1 rounded-md hover:bg-primary/5"
                    >
                      Our Installers
                    </Link>
                    <Link 
                      href="/installation-tracker" 
                      className="text-gray-700 hover:text-primary transition-colors text-xs font-medium px-1 py-1 rounded-md hover:bg-primary/5"
                    >
                      Installation Map
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Side - CTA and Auth */}
              <div className="hidden lg:flex items-center space-x-3">
                {!isAdmin && !isInstallerContext && (
                  <>
                    <Link href="/installer-login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:text-primary font-medium"
                      >
                        Installer Login
                      </Button>
                    </Link>
                    <Link href="/installer-registration">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:text-primary font-medium"
                      >
                        Join as Installer
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
              </div>

              {/* Medium Screen Right Side - Compact */}
              <div className="hidden md:flex lg:hidden items-center space-x-1">
                {!isAdmin && !isInstallerContext && (
                  <>
                    <Link href="/installer-login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:text-primary font-medium text-xs px-2"
                      >
                        Installer Login
                      </Button>
                    </Link>
                    <Link href="/installer-registration">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:text-primary font-medium text-xs px-2"
                      >
                        Join as Installer
                      </Button>
                    </Link>
                    <Link href="/booking">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 font-medium text-xs px-2"
                      >
                        <Tv className="w-3 h-3 mr-1" />
                        Book Installation
                      </Button>
                    </Link>
                  </>
                )}
                {isInstallerAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                      {installerProfile?.contactName || installerProfile?.email?.split('@')[0]}
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium"
                      onClick={() => {
                        window.location.href = '/installer-login';
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
                      Quick Sign In
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Complete Medium Screen Authentication */}
              <div className="hidden md:flex lg:hidden items-center">
                {isInstallerAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                      {installerProfile?.contactName || installerProfile?.email?.split('@')[0]}
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium text-xs"
                      onClick={() => {
                        window.location.href = '/installer-login';
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                      {user?.firstName || user?.email?.split('@')[0]}
                    </div>
                    {isAdmin && (
                      <Link href="/admin-dashboard">
                        <Button variant="outline" size="sm" className="font-medium text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium text-xs"
                      onClick={() => {
                        window.location.href = '/api/logout';
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : !isInstallerContext ? (
                  <div className="flex items-center">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="font-medium text-xs"
                      onClick={() => setAuthDialogOpen(true)}
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      Quick Sign In
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Mobile menu trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] p-0">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 py-6">
                      {!isAdmin && !isInstallerContext && (
                        <div className="space-y-1 px-6">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                            Navigation
                          </div>
                          <Link 
                            href="/how-it-works" 
                            className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Home className="h-5 w-5 mr-3" />
                            How it Works
                          </Link>
                          <Link 
                            href="/pricing" 
                            className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Calendar className="h-5 w-5 mr-3" />
                            Pricing
                          </Link>
                          <Link 
                            href="/our-installers" 
                            className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5 mr-3" />
                            Our Installers
                          </Link>
                          <Link 
                            href="/installation-tracker" 
                            className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <MapPin className="h-5 w-5 mr-3" />
                            Installation Map
                          </Link>
                        </div>
                      )}

                      {/* Admin Section */}
                      {isAuthenticated && isAdmin && (
                        <div className="space-y-1 px-6">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                            Admin
                          </div>
                          <Link 
                            href="/admin-dashboard" 
                            className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="h-5 w-5 mr-3" />
                            Admin Dashboard
                          </Link>
                        </div>
                      )}

                      {/* Installer Section */}
                      {!isAdmin && !isInstallerContext && (
                        <>
                          <Separator className="my-6" />
                          <div className="space-y-1 px-6">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                              For Installers
                            </div>
                            <Link 
                              href="/installer-login" 
                              className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <LogIn className="h-5 w-5 mr-3" />
                              Installer Login
                            </Link>
                            <Link 
                              href="/installer-registration" 
                              className="flex items-center py-3 px-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <UserPlus className="h-5 w-5 mr-3" />
                              Join as Installer
                            </Link>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t p-6 space-y-3">
                      {!isAdmin && !isInstallerContext && (
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
                      
                      {isAuthenticated ? (
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
                          Quick Sign In
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
