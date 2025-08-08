
    import PageTransition from '@/components/ui/PageTransition';
    import PageSection from '@/components/PageSection';
    import { Card } from '@/components/ui/card';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
    import { ShieldCheck, Lock, FileText, AlertTriangle, Database } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet-async';

    const CompliancePage = () => {
      const complianceSections = [
        {
          id: 'fcra',
          title: 'FCRA Compliance',
          icon: <FileText className="h-8 w-8 text-primary" />,
          summary: 'ChexPro is fully committed to complying with the Fair Credit Reporting Act (FCRA).',
          details: [
            'The FCRA is a federal law that regulates how consumer reporting agencies (CRAs) collect, use, and share consumer information.',
            'We ensure that all our background screening processes adhere to FCRA requirements, including obtaining proper consent, providing consumers with copies of their reports, and following dispute resolution procedures.',
            'Our platform is designed to help employers and other users meet their FCRA obligations, such as providing pre-adverse and adverse action notices.',
            'We provide resources and training to our clients to help them understand their responsibilities under the FCRA.'
          ]
        },
        {
          id: 'data-security',
          title: 'Data Security & Privacy',
          icon: <Lock className="h-8 w-8 text-primary" />,
          summary: 'Protecting sensitive information is paramount at ChexPro.',
          details: [
            'We employ robust security measures, including data encryption in transit and at rest, to safeguard personal information.',
            'Our systems utilize multi-factor authentication, access controls, and regular security audits to prevent unauthorized access.',
            'We adhere to industry best practices for data privacy and have implemented policies and procedures to manage data handling and retention responsibly.',
            'Our infrastructure is designed for high availability and disaster recovery to ensure continuous service and data integrity.'
          ]
        },
        {
          id: 'disclaimers',
          title: 'Important Disclaimers',
          icon: <AlertTriangle className="h-8 w-8 text-primary" />,
          summary: 'Key information regarding the use of our services and reports.',
          details: [
            'Background check reports provided by ChexPro are for permissible purposes only as defined by the FCRA and other applicable laws.',
            'Clients are responsible for using the information obtained from background checks in a manner consistent with all legal requirements, including anti-discrimination laws.',
            'While ChexPro strives for maximum accuracy, information is sourced from various public and private databases, and occasional inaccuracies or outdated information may occur. We have processes for disputing and correcting information.',
            'ChexPro does not provide legal advice. Clients should consult with their legal counsel regarding their specific compliance obligations.'
          ]
        },
        {
          id: 'client-responsibilities',
          title: 'Client Responsibilities',
          icon: <ShieldCheck className="h-8 w-8 text-primary" />,
          summary: 'Understanding your obligations when using ChexPro services.',
          details: [
            'Obtain proper authorization and consent from individuals before requesting a background check.',
            'Use background check information only for the permissible purpose stated at the time of request.',
            'Comply with all FCRA requirements, including pre-adverse and adverse action notification processes if making an adverse decision based in whole or in part on a consumer report.',
            'Securely handle and dispose of consumer reports and sensitive information.',
            'Notify ChexPro of any disputes or inaccuracies found in reports.'
          ]
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
            "text": section.details.join(' ') // Join details array into a single string
          }
        }))
      };

      return (
        <PageTransition>
          <Helmet>
        <title>Compliance - ChexPro | FCRA &amp; Data Security Standards</title>
        <meta name="description" content="ChexPro adheres to strict FCRA compliance, data security, and privacy standards to ensure legal, ethical, and responsible background screening practices." />
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
                Compliance &amp; Legal Information
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                At ChexPro, we prioritize adherence to legal standards and industry best practices to ensure the integrity and lawful use of our services.
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
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Commitment to You</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                ChexPro is dedicated to maintaining the highest standards of compliance and data security. We continuously monitor regulatory changes and update our systems and processes accordingly. Our goal is to provide you with reliable screening services while ensuring the rights and privacy of individuals are protected. If you have any questions about our compliance practices, please don&apos;t hesitate to contact us.
              </p>
            </div>
          </PageSection>
        </PageTransition>
      );
    };

    export default CompliancePage;
  