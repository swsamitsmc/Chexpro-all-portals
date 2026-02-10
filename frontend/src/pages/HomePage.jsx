import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import InfoTile from '@/components/tiles/InfoTile';
import PageTransition from '@/components/ui/PageTransition';
import PageSection from '@/components/PageSection';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Users, Award, HeartHandshake as Handshake, ShieldCheck, Building, UserCheck, Briefcase } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const fadeInStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const fadeInItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const HomePage = () => {
  const { t } = useTranslation();
  
  // Memoize with language indicator to prevent unnecessary recreations
  const lang = t['language'] || 'en';
  const services = useMemo(() => [
    { id: 'criminal-records', title: t('pages.home.services.items.criminal.title'), icon: <Award className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.criminal.desc') },
    { id: 'employment-verification', title: t('pages.home.services.items.employment.title'), icon: <Briefcase className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.employment.desc') },
    { id: 'education-verification', title: t('pages.home.services.items.education.title'), icon: <Users className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.education.desc') },
    { id: 'credit-checks', title: t('pages.home.services.items.credit.title'), icon: <TrendingUp className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.credit.desc') },
  ], [lang]);

  const usps = useMemo(() => [
    { title: t('pages.why.items.speed.title'), description: t('pages.why.items.speed.desc'), icon: <TrendingUp className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.accuracy.title'), description: t('pages.why.items.accuracy.desc'), icon: <CheckCircle className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.support.title'), description: t('pages.why.items.support.desc'), icon: <Handshake className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.pricing.title'), description: t('pages.why.items.pricing.desc'), icon: <Award className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.platform.title'), description: t('pages.why.items.platform.desc'), icon: <UserCheck className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.compliance.title'), description: t('pages.why.items.compliance.desc'), icon: <ShieldCheck className="h-6 w-6 text-primary" /> },
  ], [lang]);

  const rawTestimonials = t('pages.home.testimonials.list', { returnObjects: true });
  const testimonials = Array.isArray(rawTestimonials) ? rawTestimonials : [];

  const targetAudiences = useMemo(() => [
    { name: t('pages.solutions.audiences.employers.name'), description: t('pages.solutions.audiences.employers.desc'), icon: <Briefcase className="h-10 w-10 text-primary" /> },
    { name: t('pages.solutions.audiences.landlords.name'), description: t('pages.solutions.audiences.landlords.desc'), icon: <Building className="h-10 w-10 text-primary" /> },
    { name: t('pages.solutions.audiences.staffing.name'), description: t('pages.solutions.audiences.staffing.desc'), icon: <Users className="h-10 w-10 text-primary" /> },
    { name: t('pages.solutions.audiences.individuals.name'), description: t('pages.solutions.audiences.individuals.desc'), icon: <UserCheck className="h-10 w-10 text-primary" /> },
  ], [lang]);

  return (
    <PageTransition>
      <Helmet>
        <title>{t('pages.home.title')}</title>
        <meta name="description" content={t('pages.home.metaDescription')} />
      </Helmet>

      {/* Hero Section */}
      <PageSection className="bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-20 md:pt-32 pb-16 md:pb-24 text-center" fullWidth>
        <div className="container">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {(() => {
              const heroTitle = t('pages.home.heroTitle') || '';
              const trimmed = heroTitle.trim();
              if (!trimmed) return heroTitle;
              const lastSpaceIdx = trimmed.lastIndexOf(' ');
              if (lastSpaceIdx === -1) {
                return <span className="text-[#3c83f6]">{trimmed}</span>;
              }
              const before = trimmed.slice(0, lastSpaceIdx + 1);
              const lastToken = trimmed.slice(lastSpaceIdx + 1);
              const match = lastToken.match(/^(.+?)([.,!?;:]*)$/);
              const word = match ? match[1] : lastToken;
              const punct = match ? match[2] : '';
              return (
                <>
                  {before}
                  <span className="text-[#3c83f6]">{word}{punct}</span>
                </>
              );
            })()}
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {t('pages.home.heroSubtitle')}
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Button size="lg" asChild>
              <Link to="/request-demo">{t('navigation.requestDemo')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">{t('navigation.services')}</Link>
            </Button>
          </motion.div>
        </div>
      </PageSection>

      {/* Services Overview */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{t('pages.home.services.title')}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          {t('pages.home.services.subtitle')}
        </p>
        <motion.ul 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={fadeInStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {services.map((service, index) => (
            <motion.li key={index} variants={fadeInItem}>
              <InfoTile
                to={`/services#${service.id}`}
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            </motion.li>
          ))}
        </motion.ul>
        <div className="text-center mt-12">
          <Button asChild variant="link" className="text-primary text-lg">
            <Link to="/services">{t('pages.home.services.exploreAll')}</Link>
          </Button>
        </div>
      </PageSection>

      {/* Why ChexPro */}
      <PageSection className="bg-secondary">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{t('pages.why.title')}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          {t('pages.why.subtitle')}
        </p>
        <motion.ul 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={fadeInStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {usps.map((usp, index) => (
            <motion.li key={index} variants={fadeInItem} className="flex items-start space-x-4 p-4 rounded-lg">
              <div className="flex-shrink-0 mt-1">{usp.icon}</div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-1">{usp.title}</h3>
                <p className="text-muted-foreground">{usp.description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </PageSection>

      {/* Target Audience Snippets */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{t('pages.solutions.title')}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          {t('pages.solutions.subtitle')}
        </p>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={fadeInStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {targetAudiences.map((audience) => (
            <motion.div key={audience.name} variants={fadeInItem}>
              <InfoTile
                icon={audience.icon}
                title={audience.name}
                description={audience.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </PageSection>

      {/* Trust Signals */}
      <PageSection className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-primary-foreground py-16">
        <div className="container text-center">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t('pages.home.trust.title')}</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            {t('pages.home.trust.desc')}
          </p>
          <ul className="flex flex-wrap justify-center items-center gap-8 opacity-75">
            <li className="text-lg font-semibold">{t('pages.home.trust.badges.fcra')}</li>
            <li className="text-lg font-semibold">{t('pages.home.trust.badges.pbs')}</li>
            <li className="text-lg font-semibold">{t('pages.home.trust.badges.soc2')}</li>
            <li className="text-lg font-semibold">{t('pages.home.trust.badges.encryption')}</li>
          </ul>
          <div className="mt-10">
            <p className="text-sm text-gray-400">{t('pages.home.trust.clients.title')}</p>
            <ul className="flex justify-center items-center gap-8 mt-4 opacity-80">
              <li>
                <img
                  className="h-10 w-auto object-contain"
                  alt={t('pages.home.trust.clients.staffingmindAlt')}
                  src="/logo-staffingmind.png"
                />
              </li>
              <li>
                <img
                  className="h-10 w-auto object-contain"
                  alt={t('pages.home.trust.clients.globalLogisticsAlt')}
                  src="/logo-global-logistics.jpg"
                />
              </li>
              <li>
                <img
                  className="h-10 w-auto object-contain"
                  alt={t('pages.home.trust.clients.secureInvestmentsAlt')}
                  src="/logo-secure-investments.jpg"
                />
              </li>
            </ul>
          </div>
        </div>
      </PageSection>

      {/* Testimonials */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{t('pages.home.testimonials.title')}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          {t('pages.home.testimonials.subtitle')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <motion.div key={idx} variants={fadeInItem}>
              <Card className="h-full glassmorphism hover:shadow-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="pt-6">
                  <p className="italic text-muted-foreground mb-4 group-hover:text-foreground transition-colors duration-300">&quot;{item.quote}&quot;</p>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{item.nameRole}</p>
                  <p className="text-sm text-primary group-hover:text-primary/80 transition-colors duration-300">{item.company}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection className="gradient-bg text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">{t('pages.home.ctaTitle', { defaultValue: 'Ready to Elevate Your Screening Process?' })}</h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 opacity-90">
            {t('pages.home.ctaDesc', { defaultValue: 'Discover how ChexPro can provide you with the insights you need to make confident decisions. Get started today!' })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" asChild>
              <Link to="/request-demo">{t('pages.home.ctaDemoButton', { defaultValue: 'Request a Free Demo' })}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">{t('pages.home.ctaContactSales', { defaultValue: 'Contact Sales' })}</Link>
            </Button>
          </div>
        </div>
      </PageSection>
    </PageTransition>
  );
};

export default HomePage;