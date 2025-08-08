import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  const services = [
    { id: 'criminal-records', title: t('pages.home.services.items.criminal.title'), icon: <Award className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.criminal.desc') },
    { id: 'employment-verification', title: t('pages.home.services.items.employment.title'), icon: <Briefcase className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.employment.desc') },
    { id: 'education-verification', title: t('pages.home.services.items.education.title'), icon: <Users className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.education.desc') },
    { id: 'credit-checks', title: t('pages.home.services.items.credit.title'), icon: <TrendingUp className="h-8 w-8 text-primary" />, description: t('pages.home.services.items.credit.desc') },
  ];

  const usps = [
    { title: t('pages.why.items.speed.title'), description: t('pages.why.items.speed.desc'), icon: <TrendingUp className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.accuracy.title'), description: t('pages.why.items.accuracy.desc'), icon: <CheckCircle className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.support.title'), description: t('pages.why.items.support.desc'), icon: <Handshake className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.pricing.title'), description: t('pages.why.items.pricing.desc'), icon: <Award className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.platform.title'), description: t('pages.why.items.platform.desc'), icon: <UserCheck className="h-6 w-6 text-primary" /> },
    { title: t('pages.why.items.compliance.title'), description: t('pages.why.items.compliance.desc'), icon: <ShieldCheck className="h-6 w-6 text-primary" /> },
  ];

  const targetAudiences = [
    { name: t('pages.solutions.audiences.employers.name'), description: t('pages.solutions.audiences.employers.desc'), icon: <Briefcase className="h-10 w-10 text-primary" /> },
    { name: t('pages.solutions.audiences.landlords.name'), description: t('pages.solutions.audiences.landlords.desc'), icon: <Building className="h-10 w-10 text-primary" /> },
    { name: t('pages.solutions.audiences.staffing.name'), description: t('pages.solutions.audiences.staffing.desc'), icon: <Users className="h-10 w-10 text-primary" /> },
    { name: t('pages.solutions.audiences.individuals.name'), description: t('pages.solutions.audiences.individuals.desc'), icon: <UserCheck className="h-10 w-10 text-primary" /> },
  ];

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
            className="space-x-4"
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
              <Link to={`/services#${service.id}`} className="block group" aria-label={`${service.title} - ${t('pages.home.services.title')}`}>
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 glassmorphism group-hover:shadow-primary/30">
                  <CardHeader className="items-center text-center">
                    {service.icon}
                    <CardTitle className="mt-4 text-xl text-foreground group-hover:text-primary transition-colors">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground text-sm">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
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
              <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 inline-block rounded-full bg-primary/10">{audience.icon}</div>
                  <CardTitle className="text-xl">{audience.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{audience.description}</p>
                </CardContent>
              </Card>
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
            <ul className="flex justify-center space-x-8 mt-4 opacity-50">
              <li><span><img alt={t('pages.home.trust.clients.logo1Alt')} src="https://images.unsplash.com/photo-1495224814653-94f36c0a31ea" /></span></li>
              <li><span><img alt={t('pages.home.trust.clients.logo2Alt')} src="https://images.unsplash.com/photo-1607004010229-6048c57c2ab1" /></span></li>
              <li><span><img alt={t('pages.home.trust.clients.logo3Alt')} src="https://images.unsplash.com/photo-1694208590719-96139a8f2a32" /></span></li>
              <li><span><img alt={t('pages.home.trust.clients.logo4Alt')} src="https://images.unsplash.com/photo-1649000808933-1f4aac7cad9a" /></span></li>
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
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={fadeInItem}>
              <Card className="h-full glassmorphism">
                <CardContent className="pt-6">
                  <p className="italic text-muted-foreground mb-4">&quot;{t('pages.home.testimonials.quote')}&quot;</p>
                  <p className="font-semibold text-foreground">{t('pages.home.testimonials.nameRole')}</p>
                  <p className="text-sm text-primary">{t('pages.home.testimonials.company')}</p>
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
          <div className="space-x-4">
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