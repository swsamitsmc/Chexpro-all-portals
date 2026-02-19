
    import PageTransition from '@/components/ui/PageTransition';
    import PageSection from '@/components/PageSection';
    import InfoTile from '@/components/tiles/InfoTile';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { Target, Eye, HeartHandshake as Handshake, ShieldCheck, Users, Zap, EyeOff } from 'lucide-react';
    import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

    const fadeInStagger = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.3,
        },
      },
    };
    
    const fadeInItem = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    const AboutUsPage = () => {
      const { t } = useTranslation();
      const values = [
        { title: t('pages.aboutUs.values.integrity.title', { defaultValue: 'Integrity' }), description: t('pages.aboutUs.values.integrity.desc', { defaultValue: 'Upholding the highest ethical standards in all our operations and interactions.' }), icon: <ShieldCheck className="h-8 w-8 text-primary" /> },
        { title: t('pages.aboutUs.values.accuracy.title', { defaultValue: 'Accuracy' }), description: t('pages.aboutUs.values.accuracy.desc', { defaultValue: 'Committing to providing precise and reliable information through meticulous verification processes.' }), icon: <Target className="h-8 w-8 text-primary" /> },
        { title: t('pages.aboutUs.values.clientCentricity.title', { defaultValue: 'Client-Centricity' }), description: t('pages.aboutUs.values.clientCentricity.desc', { defaultValue: "Placing our clients' needs at the forefront, offering tailored solutions and exceptional support." }), icon: <Handshake className="h-8 w-8 text-primary" /> },
        { title: t('pages.aboutUs.values.innovation.title', { defaultValue: 'Innovation' }), description: t('pages.aboutUs.values.innovation.desc', { defaultValue: 'Continuously advancing our technology and methods to deliver cutting-edge screening services.' }), icon: <Zap className="h-8 w-8 text-primary" /> },
        { title: t('pages.aboutUs.values.compliance.title', { defaultValue: 'Compliance' }), description: t('pages.aboutUs.values.compliance.desc', { defaultValue: 'Adhering strictly to all relevant regulations, including the FCRA, to ensure lawful and fair practices.' }), icon: <Users className="h-8 w-8 text-primary" /> },
        { title: t('pages.aboutUs.values.transparency.title', { defaultValue: 'Transparency' }), description: t('pages.aboutUs.values.transparency.desc', { defaultValue: 'Communicating openly and honestly about methods, timelines, pricing, limitations, and results.' }), icon: <EyeOff className="h-8 w-8 text-primary" /> },
      ];

      return (
        <PageTransition>
          <Helmet>
      <title>About Us - ChexPro | Our Mission &amp; Values</title>
      <meta name="description" content="Learn about ChexPro's mission, values, and our commitment to accurate and compliant background screening solutions." />
      {/* You can add more meta tags here if needed, e.g., Open Graph tags for social sharing */}
      {/* <meta property="og:title" content="About Us - ChexPro" /> */}
      {/* <meta property="og:description" content="Learn about ChexPro's mission and values." /> */}
      {/* <meta property="og:image" content="https://chexpro.com/og-image.jpg" /> */}
    </Helmet>
          <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
            <div className="container text-center">
              <motion.div 
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
                className="inline-block p-4 bg-primary/10 rounded-full mb-6"
              >
                <Handshake className="h-16 w-16 text-primary" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
              >
                {t('navigation.about')}
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                {t('pages.home.metaDescription')}
              </motion.p>
            </div>
          </PageSection>

          <PageSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                <img 
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                  alt="Diverse team collaborating in a modern office"
                 src="/team.png" />
              </motion.div>
              <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                <h2 className="text-3xl font-bold text-foreground mb-6">{t('pages.aboutUs.missionVision.title')}</h2>
                <div className="space-y-6 text-muted-foreground">
                  <div className="flex items-start space-x-3">
                    <Target className="h-7 w-7 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">{t('pages.aboutUs.missionVision.mission.title')}</h3>
                      <p>{t('pages.aboutUs.missionVision.mission.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="h-7 w-7 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">{t('pages.aboutUs.missionVision.vision.title')}</h3>
                      <p>{t('pages.aboutUs.missionVision.vision.desc')}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </PageSection>

          <PageSection className="bg-secondary">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{t('pages.aboutUs.coreValues.title')}</h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              {t('pages.aboutUs.coreValues.subtitle')}
            </p>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={fadeInStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true}}
            >
              {values.map((value) => (
                <motion.div key={value.title} variants={fadeInItem}>
                  <InfoTile
                    icon={value.icon}
                    title={value.title}
                    description={value.description}
                  />
                </motion.div>
              ))}
            </motion.div>
          </PageSection>

          <PageSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                <h2 className="text-3xl font-bold text-foreground mb-6">{t('pages.aboutUs.ourTeamSection.title')}</h2>
                <p className="text-muted-foreground mb-4">
                  {t('pages.aboutUs.ourTeamSection.desc1')}
                </p>
              </motion.div>
              <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                 <img 
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                  alt="Professional team members in a meeting"
                 src="https://images.unsplash.com/photo-1665659964378-cbccc8a6d429" />
              </motion.div>
            </div>
          </PageSection>

          <PageSection className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-primary-foreground">
            <div className="container text-center">
            <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">{t('pages.aboutUs.complianceCommitment.title')}</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
                {t('pages.aboutUs.complianceCommitment.desc')}
              </p>
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white" asChild>
                <Link to="/compliance">{t('pages.aboutUs.complianceCommitment.button')}</Link>
              </Button>
            </div>
          </PageSection>

          <PageSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">{t('pages.aboutUs.partner.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('pages.aboutUs.partner.desc')}
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">{t('pages.aboutUs.partner.button')}</Link>
            </Button>
          </PageSection>
        </PageTransition>
      );
    };

    export default AboutUsPage;
  