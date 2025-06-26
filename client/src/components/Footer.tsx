import { Link } from "wouter";
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">tradesbook.ie</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Ireland's premier TV installation platform connecting customers with certified professional installers. 
              Quality mounting services with AI-powered room previews and real-time tracking.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/tradesbook.ie/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://x.com/tradesbook_ie" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/tradesbook.ie" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://ie.linkedin.com/company/tradesbookirl" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  TV Mounting Services
                </Link>
              </li>
              <li>
                <Link href="/tv-recommendation" className="text-gray-300 hover:text-white transition-colors">
                  TV Recommendations
                </Link>
              </li>
              <li>
                <Link href="/solar-enquiry" className="text-gray-300 hover:text-white transition-colors">
                  Solar Installation
                </Link>
              </li>
              <li>
                <Link href="/installation-tracker" className="text-gray-300 hover:text-white transition-colors">
                  Installation Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/our-installers" className="text-gray-300 hover:text-white transition-colors">
                  Our Installers
                </Link>
              </li>
              <li>
                <Link href="/installer-registration" className="text-gray-300 hover:text-white transition-colors">
                  Join as Installer
                </Link>
              </li>
              <li>
                <a href="mailto:support@tradesbook.ie" className="text-gray-300 hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <a href="mailto:support@tradesbook.ie" className="text-white hover:text-blue-400 transition-colors">
                  support@tradesbook.ie
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <a href="tel:+353123456789" className="text-white hover:text-green-400 transition-colors">
                  +353 1 234 5678
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-3 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Coverage</p>
                <p className="text-white">Nationwide Ireland</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} tradesbook.ie. All rights reserved.
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <Link href="/gdpr-compliance" className="text-gray-400 hover:text-white transition-colors">
              GDPR Compliance
            </Link>
          </div>
        </div>

        {/* Business Information */}
        <div className="border-t border-gray-800 mt-6 pt-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <p className="font-medium text-gray-300">Licensed & Insured</p>
              <p>All installers are fully licensed and carry comprehensive insurance coverage</p>
            </div>
            <div>
              <p className="font-medium text-gray-300">Quality Guarantee</p>
              <p>12-month warranty on all installation work with satisfaction guarantee</p>
            </div>
            <div>
              <p className="font-medium text-gray-300">Secure Payments</p>
              <p>SSL encrypted payments processed securely through Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}