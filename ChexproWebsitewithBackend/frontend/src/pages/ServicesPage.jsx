
    import PageTransition from '@/components/ui/PageTransition';
    import PageSection from '@/components/PageSection';
    import { Card } from '@/components/ui/card';
    import InfoTile from '@/components/tiles/InfoTile';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
    import { motion } from 'framer-motion';
    import { Search, Briefcase, GraduationCap, CreditCard, Users, Syringe, HeartPulse, Globe, Home, Building } from 'lucide-react';
    import { Helmet } from 'react-helmet-async';
    import { useTranslation } from 'react-i18next';

    const fadeInItem = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    const ServicesPage = () => {
      const { t } = useTranslation();
      const services = [
        {
          id: 'criminal-records',
          title: t('pages.servicesPage.services.criminal.title'),
          icon: <Search className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.criminal.shortDesc'),
          details: t('pages.servicesPage.services.criminal.details')
        },
        {
          id: 'employment-verification',
          title: t('pages.servicesPage.services.employment.title'),
          icon: <Briefcase className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.employment.shortDesc'),
          details: t('pages.servicesPage.services.employment.details')
        },
        {
          id: 'education-verification',
          title: t('pages.servicesPage.services.education.title'),
          icon: <GraduationCap className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.education.shortDesc'),
          details: t('pages.servicesPage.services.education.details')
        },
        {
          id: 'credit-checks',
          title: t('pages.servicesPage.services.credit.title'),
          icon: <CreditCard className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.credit.shortDesc'),
          details: t('pages.servicesPage.services.credit.details')
        },
        {
          id: 'reference-checks',
          title: t('pages.servicesPage.services.reference.title'),
          icon: <Users className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.reference.shortDesc'),
          details: t('pages.servicesPage.services.reference.details')
        },
        {
          id: 'drug-screening',
          title: t('pages.servicesPage.services.drug.title'),
          icon: <Syringe className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.drug.shortDesc'),
          details: t('pages.servicesPage.services.drug.details')
        },
        {
          id: 'health-checks',
          title: t('pages.servicesPage.services.health.title'),
          icon: <HeartPulse className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.health.shortDesc'),
          details: t('pages.servicesPage.services.health.details')
        },
        {
          id: 'international-screening',
          title: t('pages.servicesPage.services.international.title'),
          icon: <Globe className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.international.shortDesc'),
          details: t('pages.servicesPage.services.international.details')
        },
        {
          id: 'tenant-screening',
          title: t('pages.servicesPage.services.tenant.title'),
          icon: <Home className="h-8 w-8 text-primary" />,
          shortDesc: t('pages.servicesPage.services.tenant.shortDesc'),
          details: t('pages.servicesPage.services.tenant.details')
        },
      ];
      
      const industrySolutions = [
        { name: t('pages.solutions.audiences.employers.name'), icon: <Briefcase className="h-6 w-6 text-primary" />, description: t('pages.solutions.audiences.employers.desc') },
        { name: t('pages.solutions.audiences.landlords.name'), icon: <Building className="h-6 w-6 text-primary" />, description: t('pages.solutions.audiences.landlords.desc') },
        { name: t('pages.solutions.audiences.staffing.name'), icon: <Users className="h-6 w-6 text-primary" />, description: t('pages.solutions.audiences.staffing.desc') },
        { name: t('pages.solutions.audiences.individuals.name'), icon: <Search className="h-6 w-6 text-primary" />, description: t('pages.solutions.audiences.individuals.desc') },
      ];

      const serviceSchema = services.map(service => ({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.title,
        "description": service.details,
        "serviceType": service.title, // Can be more specific if needed
        "provider": {
          "@type": "Organization",
          "name": "ChexPro",
          "url": "https://chexpro.com/"
        },
        "url": `https://chexpro.com/services#${service.id}`
      }));

      return (
        <PageTransition>
          <Helmet>
        <title>{t('pages.servicesPage.title')}</title>
        <meta name="description" content={t('pages.servicesPage.metaDescription')} />
        <script type="application/ld+json">
          {JSON.stringify(serviceSchema)}
        </script>
      </Helmet>
          <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
            <div className="container text-center">
              <motion.div 
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
                className="inline-block p-4 bg-primary/10 rounded-full mb-6"
              >
                <Briefcase className="h-16 w-16 text-primary" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
              >{t('pages.servicesPage.heading')}</motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                {t('pages.servicesPage.intro')}
              </motion.p>
            </div>
          </PageSection>

          <PageSection>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {services.map((service, index) => (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden glassmorphism hover:shadow-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 group">
                    <AccordionItem value={service.id} className="border-b-0">
                      <AccordionTrigger className="p-6 hover:no-underline">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">{service.icon}</div>
                          <div>
                            <h3 className="text-xl font-semibold text-left text-foreground group-hover:text-primary transition-colors duration-300">{service.title}</h3>
                            <p className="text-sm text-muted-foreground text-left group-hover:text-foreground transition-colors duration-300">{service.shortDesc}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 pt-0">
                        <p className="text-muted-foreground">{service.details}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                </motion.div>
              ))}
            </Accordion>
          </PageSection>
          
          {/* Solutions/Industries Section */}
          <PageSection className="bg-secondary">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{t('pages.servicesPage.industriesHeading')}</h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              {t('pages.servicesPage.industriesIntro')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {industrySolutions.map((solution, index) => (
                <motion.div key={index} variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.3}}>
                  <InfoTile
                    icon={solution.icon}
                    title={solution.name}
                    description={solution.description}
                  />
                </motion.div>
              ))}
            </div>
             <div className="text-center mt-12">
              <p className="text-md text-muted-foreground">{t('pages.servicesPage.industriesNote')}</p>
            </div>
          </PageSection>


          <PageSection className="gradient-bg text-primary-foreground">
            <div className="container text-center">
              <h2 className="text-3xl font-bold mb-6">{t('pages.servicesPage.ctaTitle')}</h2>
              <p className="text-lg max-w-2xl mx-auto mb-10 opacity-90">
                {t('pages.servicesPage.ctaDesc')}
              </p>
              <Button size="lg" asChild>
                <Link to="/request-demo">{t('pages.servicesPage.ctaButton')}</Link>
              </Button>
            </div>
          </PageSection>
        </PageTransition>
      );
    };

    export default ServicesPage;
  