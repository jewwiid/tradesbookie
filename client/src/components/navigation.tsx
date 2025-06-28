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
  const isAdmin = user?.role === 'admin' || 
                  user?.email === 'admin@tradesbook.ie' || 
                  user?.email === 'jude.okun@gmail.com' || 
                  user?.id === '42442296';

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
            <div className="flex justify-between items-center h-12">
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center justify-center flex-1 space-x-8 font-bold text-center">
                {!isAdmin && (
                  <>
                    <Link href="/how-it-works" className="text-gray-700 hover:text-primary transition-colors text-sm">
                      How it Works
                    </Link>
                    <Link href="/pricing" className="text-gray-700 hover:text-primary transition-colors text-sm">
                      Pricing
                    </Link>
                    <Link href="/our-installers" className="text-gray-700 hover:text-primary transition-colors text-sm">
                      Our Installers
                    </Link>
                    <Link href="/installation-tracker" className="text-gray-700 hover:text-primary transition-colors text-sm">
                      Installation Map
                    </Link>
                  </>
                )}
                {isAuthenticated && isAdmin && (
                  <Link href="/admin-dashboard" className="text-gray-700 hover:text-primary transition-colors flex items-center text-sm">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
              </div>

              {/* Right Side - CTA and Auth */}
              <div className="hidden md:flex items-center space-x-4">
                {!isAdmin && (
                  <Link href="/booking">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Book Installation
                    </Button>
                  </Link>
                )}
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600">
                      Welcome, {user?.firstName || user?.email}
                    </span>
                    {isAdmin && (
                      <Link href="/admin">
                        <Button variant="outline" size="sm">
                          <Shield className="w-4 h-4 mr-1" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/api/logout';
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/api/login';
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Create demo login modal
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
                        modal.innerHTML = `
                          <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                            <h3 class="text-lg font-semibold mb-4">Quick Sign In</h3>
                            <form id="demo-login-form" class="space-y-4">
                              <div>
                                <label class="block text-sm font-medium mb-1">Email</label>
                                <input type="email" id="demo-email" value="jude.okun@gmail.com" 
                                       class="w-full border rounded px-3 py-2" required />
                              </div>
                              <div>
                                <label class="block text-sm font-medium mb-1">Role</label>
                                <select id="demo-role" class="w-full border rounded px-3 py-2">
                                  <option value="customer">Customer</option>
                                  <option value="installer">Installer</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div class="flex space-x-2">
                                <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                  Sign In
                                </button>
                                <button type="button" id="demo-cancel" class="flex-1 border py-2 rounded hover:bg-gray-50">
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        `;
                        
                        document.body.appendChild(modal);
                        
                        const form = modal.querySelector('#demo-login-form');
                        const cancelBtn = modal.querySelector('#demo-cancel');
                        
                        form?.addEventListener('submit', async (e) => {
                          e.preventDefault();
                          const email = (modal.querySelector('#demo-email') as HTMLInputElement).value;
                          const role = (modal.querySelector('#demo-role') as HTMLSelectElement).value;
                          
                          try {
                            const response = await fetch('/api/auth/demo-login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email, role })
                            });
                            
                            if (response.ok) {
                              window.location.reload();
                            } else {
                              alert('Login failed');
                            }
                          } catch (error) {
                            alert('Login failed');
                          }
                        });
                        
                        cancelBtn?.addEventListener('click', () => {
                          document.body.removeChild(modal);
                        });
                        
                        modal.addEventListener('click', (e) => {
                          if (e.target === modal) {
                            document.body.removeChild(modal);
                          }
                        });
                      }}
                    >
                      Demo Login
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile menu trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
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
                        href="/admin" 
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
                          href="/installer-login" 
                          className="flex items-center py-2 text-gray-700 hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5 mr-3" />
                          Installer Login
                        </Link>
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
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          window.location.href = '/api/logout';
                        }}
                      >
                        <User className="h-5 w-5 mr-3" />
                        Logout
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          window.location.href = '/api/login';
                        }}
                      >
                        <User className="h-5 w-5 mr-3" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
