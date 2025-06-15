import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tv, Menu, Home, Calendar, Settings, User } from 'lucide-react';

export default function Navigation() {
  const [location] = useLocation();
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
              <span className="text-gray-700 hover:text-primary transition-colors cursor-pointer">
                Our Installers
              </span>
              <Link href="/booking">
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                >
                  Book Installation
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">
                  Login
                </Button>
              </Link>
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
                  <span className="flex items-center py-2 text-gray-700 hover:text-primary cursor-pointer">
                    <User className="h-5 w-5 mr-3" />
                    Our Installers
                  </span>
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
