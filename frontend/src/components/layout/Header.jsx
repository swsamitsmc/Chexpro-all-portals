import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Import your SVG logo here ---
import chexProLogo from '@/assets/images/chexpro-logo.svg'; // Ensure this path and filename are correct


const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/compliance', label: 'Compliance' },
  { to: '/resources', label: 'Resources' },
  { to: '/contact', label: 'Contact Us' },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium font-sans transition-colors duration-300 rounded-md px-4 py-2",
          "hover:bg-primary hover:text-primary-foreground",
          isActive ? "text-primary" : "text-foreground/80"
        )
      }
      onClick={() => setMobileMenuOpen(false)}
    >
      {children}
    </NavLink>
  );
  


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
        <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
          {/* Using the SVG logo directly */}
          <img
            src={chexProLogo}
            alt="ChexPro Logo"
            className="h-16 w-auto" // Adjust h-8 (32px) as needed for optimal visual size
          />
        </Link>

        <nav className="hidden lg:flex space-x-6">
          {navLinks.map((link) => (
            <NavItem key={link.to} to={link.to}>{link.label}</NavItem>
          ))}
        </nav>

        <div className="hidden lg:flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/login">Client Login</Link>
          </Button>
          <Button asChild>
            <Link to="/request-demo">Request a Demo</Link>
          </Button>
        </div>

        <div className="lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg border-t border-border/40"
          >
            <nav className="flex flex-col px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                <NavItem key={link.to} to={link.to}>{link.label}</NavItem>
              ))}
              <div className="pt-2 border-t border-border/40">
                <Button variant="outline" className="w-full mb-2" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Client Login</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/request-demo" onClick={() => setMobileMenuOpen(false)}>Request a Demo</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
