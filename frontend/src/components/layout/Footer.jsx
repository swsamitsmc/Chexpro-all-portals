
    import React from 'react';
    import { Link } from 'react-router-dom';
    import { Facebook, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';
    import chexProLogo from '@/assets/images/chexpro-logo.svg';

    const Footer = () => {
      const currentYear = new Date().getFullYear();

      return (
        <footer className="bg-secondary text-secondary-foreground border-t border-border/40">
          <div className="container py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
               <Link to="/" className="flex items-center mb-4"> {/* Removed space-x-2 as there's no text next to it now */}
  <img
    src={chexProLogo}
    alt="ChexPro Logo"
    className="h-16 w-auto" 
  />
</Link>
                <p className="text-sm text-muted-foreground">
                  Reliable, accurate, and fast background screening solutions for modern businesses and individuals.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-4">Quick Links</p>
                <ul className="space-y-2">
                  <li><Link to="/about" className="text-sm hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link to="/services" className="text-sm hover:text-primary transition-colors">Our Services</Link></li>
                  <li><Link to="/compliance" className="text-sm hover:text-primary transition-colors">Compliance</Link></li>
                  <li><Link to="/resources" className="text-sm hover:text-primary transition-colors">Resources</Link></li>
                  <li><Link to="/contact" className="text-sm hover:text-primary transition-colors">Contact</Link></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-4">Legal</p>
                <ul className="space-y-2">
                  <li><Link to="/fcra-compliance" className="text-sm hover:text-primary transition-colors">FCRA Compliance</Link></li>
                  <li><Link to="/data-security" className="text-sm hover:text-primary transition-colors">Data Security</Link></li>
                  <li><Link to="/privacy-policy" className="text-sm hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms-of-service" className="text-sm hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-4">Connect With Us</p>
                <div className="flex space-x-4 mb-4">
                <a href="https://www.facebook.com/profile.php?id=61577057349515" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></a>
                <a href="https://x.com/chexprobgc" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={20} /></a>
                <a href="https://www.linkedin.com/company/chexpro/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin size={20} /></a>
                <a href="https://www.youtube.com/@Chexpro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Youtube size={20} /></a>
                <a href="https://www.instagram.com/chexpro.na/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></a>
                </div>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:info@chexpro.com" className="hover:underline">info@chexpro.com</a><br />
                  <a href="tel:+1 872 256 1009" className="hover:underline">🇺🇸 +1 872 256 1009</a><br />
                  <a href="tel:+1 437 922 7779" className="hover:underline">🇨🇦 +1 437 922 7779</a>
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border/20 text-center">
              <p className="text-sm text-muted-foreground">
                &copy; {currentYear} ChexPro. All rights reserved. chexpro.com
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ChexPro is a consumer reporting agency. We strictly adhere to the Fair Credit Reporting Act (FCRA).
              </p>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;
  