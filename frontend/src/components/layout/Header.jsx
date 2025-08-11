import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// --- Import your SVG logo here ---
import chexProLogo from '@/assets/images/chexpro-logo.svg'; // Ensure this path and filename are correct


const navLinks = [
  { to: '/', key: 'navigation.home' },
  { to: '/about', key: 'navigation.about' },
  { to: '/services', key: 'navigation.services' },
  { to: '/compliance', key: 'navigation.compliance' },
  { to: '/resources', key: 'navigation.resources' },
  { to: '/contact', key: 'navigation.contact' },
];

const Header = ({ onLinkHover }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium font-sans transition-colors duration-300 rounded-md px-4 py-2 whitespace-nowrap",
          "hover:bg-primary hover:text-primary-foreground",
          isActive ? "text-primary" : "text-foreground/80"
        )
      }
      onClick={() => setMobileMenuOpen(false)}
      onMouseEnter={() => onLinkHover && onLinkHover(to)}
    >
      {children}
    </NavLink>
  );
  


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex items-center h-16 max-w-screen-2xl">
        {/* Logo - Left side */}
        <Link to="/" className="flex items-center flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <img
            src={chexProLogo}
            alt="ChexPro Logo"
            className="h-16 w-auto"
          />
        </Link>

        {/* Navigation - Center (hidden on mobile) */}
        <nav className="hidden lg:flex space-x-6 mx-auto">
          {navLinks.map((link) => (
            <NavItem key={link.to} to={link.to}>{t(link.key)}</NavItem>
          ))}
        </nav>

        {/* Buttons and Language Switcher - Right side (hidden on mobile) */}
        <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
          <Button variant="outline" asChild>
            <Link to="/login">{t('navigation.login')}</Link>
          </Button>
          <Button asChild>
            <Link to="/request-demo">{t('navigation.requestDemo')}</Link>
          </Button>
          <LanguageSwitcher />
        </div>

        {/* Mobile Menu Button - Right side (hidden on desktop) */}
        <div className="lg:hidden ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-blue-600 hover:text-blue-700 focus-visible:ring-blue-500 hover:bg-blue-50 active:bg-blue-100 focus:bg-blue-50 dark:hover:bg-blue-900/20 dark:active:bg-blue-900/30"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-current" /> : <Menu className="h-6 w-6 text-current" />}
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
            className="lg:hidden absolute top-16 left-0 right-0 bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 shadow-lg border-t border-border/40"
          >
            <nav className="flex flex-col px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                <NavItem key={link.to} to={link.to}>{t(link.key)}</NavItem>
              ))}
              <div className="pt-2 border-t border-border/40">
                <Button variant="outline" className="w-full mb-2" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>{t('navigation.login')}</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/request-demo" onClick={() => setMobileMenuOpen(false)}>{t('navigation.requestDemo')}</Link>
                </Button>
                <div className="mt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
