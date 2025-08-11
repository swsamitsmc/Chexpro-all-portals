
    import PageTransition from '@/components/ui/PageTransition';
import PageSection from '@/components/PageSection';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldCheck, Lock, FileText, AlertTriangle, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const CompliancePage = () => {
  const { t } = useTranslation();

  const complianceSections = [
    {
      id: 'fcra',
      title: t('pages.compliance.sections.fcra.title'),
      icon: <FileText className="h-8 w-8 text-primary" />,
      summary: t('pages.compliance.sections.fcra.summary'),
      details: t('pages.compliance.sections.fcra.details', { returnObjects: true })
    },
    {
      id: 'data-security',
      title: t('pages.compliance.sections.dataSecurity.title'),
      icon: <Lock className="h-8 w-8 text-primary" />,
      summary: t('pages.compliance.sections.dataSecurity.summary'),
      details: t('pages.compliance.sections.dataSecurity.details', { returnObjects: true })
    },
    {
      id: 'disclaimers',
      title: t('pages.compliance.sections.disclaimers.title'),
      icon: <AlertTriangle className="h-8 w-8 text-primary" />,
      summary: t('pages.compliance.sections.disclaimers.summary'),
      details: t('pages.compliance.sections.disclaimers.details', { returnObjects: true })
    },
    {
      id: 'client-responsibilities',
      title: t('pages.compliance.sections.clientResponsibilities.title'),
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      summary: t('pages.compliance.sections.clientResponsibilities.summary'),
      details: t('pages.compliance.sections.clientResponsibilities.details', { returnObjects: true })
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": complianceSections.map(section => ({
      "@type": "Question",
      "name": section.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": section.details.join(' ')
      }
    }))
  };

  return (
    <PageTransition>
      <Helmet>
        <title>{t('pages.compliance.title')}</title>
        <meta name="description" content={t('pages.compliance.metaDescription')} />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="container text-center">
          <motion.div
            initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
            className="inline-block p-4 bg-primary/10 rounded-full mb-6"
          >
            <ShieldCheck className="h-16 w-16 text-primary" />
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay:0.1}}
          >
            {t('pages.compliance.header')}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
            initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
          >
            {t('pages.compliance.subheader')}
          </motion.p>
        </div>
      </PageSection>

      <PageSection>
        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" collapsible className="w-full space-y-6">
            {complianceSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
              >
                <Card className="overflow-hidden glassmorphism hover:shadow-lg transition-shadow">
                  <AccordionItem value={section.id} className="border-b-0" id={section.id}>
                    <AccordionTrigger className="p-6 hover:no-underline">
                      <div className="flex items-center space-x-4">
                        {section.icon}
                        <span className="text-lg font-semibold">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {section.details.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </PageSection>

      <PageSection className="bg-secondary">
        <div className="container text-center">
          <Database className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-4">{t('pages.compliance.ourCommitment')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('pages.compliance.commitmentText')}
          </p>
        </div>
      </PageSection>
    </PageTransition>
  );
};

export default CompliancePage;
  