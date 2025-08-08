
    import { Link } from 'react-router-dom';
    import { Facebook, X, Linkedin, Youtube, Instagram } from 'lucide-react';
    import { useTranslation } from 'react-i18next';
    import chexProLogo from '@/assets/images/chexpro-logo.svg';

    const Footer = () => {
      const { t } = useTranslation();
      const currentYear = new Date().getFullYear();

      return (
        <footer className="bg-secondary text-secondary-foreground border-t border-border/40">
          <div className="container py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
               <Link to="/" className="flex items-center mb-4" aria-label="ChexPro Home">
  <img
    src={chexProLogo}
    alt="ChexPro Logo"
    className="h-16 w-auto" 
  />
</Link>
                <p className="text-sm text-muted-foreground">
                  {t('footer.description')}
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</p>
                <ul className="space-y-2">
                  <li><Link to="/about" className="text-sm hover:text-primary transition-colors">{t('footer.aboutUs')}</Link></li>
                  <li><Link to="/services" className="text-sm hover:text-primary transition-colors">{t('footer.ourServices')}</Link></li>
                  <li><Link to="/compliance" className="text-sm hover:text-primary transition-colors">{t('footer.compliance')}</Link></li>
                  <li><Link to="/resources" className="text-sm hover:text-primary transition-colors">{t('footer.resources')}</Link></li>
                  <li><Link to="/contact" className="text-sm hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-4">{t('footer.legal')}</p>
                <ul className="space-y-2">
                  <li><Link to="/fcra-compliance" className="text-sm hover:text-primary transition-colors">{t('footer.fcraCompliance')}</Link></li>
                  <li><Link to="/data-security" className="text-sm hover:text-primary transition-colors">{t('footer.dataSecurity')}</Link></li>
                  <li><Link to="/privacy-policy" className="text-sm hover:text-primary transition-colors">{t('footer.privacyPolicy')}</Link></li>
                  <li><Link to="/terms-of-service" className="text-sm hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-4">{t('footer.connectWithUs')}</p>
                <div className="flex space-x-4 mb-4">
                <a href="https://www.facebook.com/profile.php?id=61577057349515" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="ChexPro Facebook Page"><Facebook size={20} /></a>
                <a href="https://x.com/chexprobgc" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="ChexPro X Page"><X size={20} /></a>
                <a href="https://www.linkedin.com/company/chexpro/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="ChexPro LinkedIn Page"><Linkedin size={20} /></a>
                <a href="https://www.youtube.com/@Chexpro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="ChexPro YouTube Channel"><Youtube size={20} /></a>
                <a href="https://www.instagram.com/chexpro.na/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="ChexPro Instagram Page"><Instagram size={20} /></a>
                </div>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:info@chexpro.com" className="hover:underline">info@chexpro.com</a><br />
                  <a href="tel:+1 872 256 1009" className="hover:underline">US: +1 872 256 1009</a><br />
                  <a href="tel:+1 437 922 7779" className="hover:underline">CA: +1 437 922 7779</a>
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border/20 text-center">
              <p className="text-sm text-muted-foreground">
                {t('footer.copyright', { year: currentYear })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('footer.disclaimer')}
              </p>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;
