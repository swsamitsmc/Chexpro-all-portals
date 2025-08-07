
    import React from 'react';
    import PageTransition from '@/hooks/usePageTransition';
    import PageSection from '@/components/PageSection';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
    import { motion } from 'framer-motion';
    import { Search, Briefcase, GraduationCap, CreditCard, Users, Syringe, HeartPulse, Globe, Home, Building } from 'lucide-react';
    import { Helmet } from 'react-helmet-async';

    const fadeInItem = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    const ServicesPage = () => {
      const services = [
        {
          id: 'criminal-records',
          title: 'Criminal Record Checks',
          icon: <Search className="h-8 w-8 text-primary" />,
          shortDesc: 'Comprehensive search of local, county, state, and federal criminal records.',
          details: 'Our criminal record checks provide in-depth information to help you assess risk. We access a vast network of databases, including national criminal databases, sex offender registries, and county/statewide repositories. This service is crucial for roles requiring high trust and security.'
        },
        {
          id: 'employment-verification',
          title: 'Employment Verification',
          icon: <Briefcase className="h-8 w-8 text-primary" />,
          shortDesc: 'Confirm past employment history, dates, and positions held.',
          details: 'Verify the accuracy of an applicant\'s claimed work experience. Our team contacts previous employers to confirm job titles, dates of employment, and reasons for leaving (where permissible). This ensures you hire candidates with proven track records.'
        },
        {
          id: 'education-verification',
          title: 'Education Verification',
          icon: <GraduationCap className="h-8 w-8 text-primary" />,
          shortDesc: 'Verify academic qualifications, degrees, and attendance.',
          details: 'Confirm educational credentials directly from institutions. We verify degrees, diplomas, certificates, attendance dates, and honors. Essential for roles where specific educational qualifications are mandatory.'
        },
        {
          id: 'credit-checks',
          title: 'Credit Checks (Employment Purpose)',
          icon: <CreditCard className="h-8 w-8 text-primary" />,
          shortDesc: 'Assess financial responsibility for relevant positions.',
          details: 'Provided in compliance with FCRA, employment credit reports offer insights into an applicant\'s financial history. This is particularly relevant for positions involving financial management, access to cash, or fiduciary responsibilities. Requires applicant consent.'
        },
        {
          id: 'reference-checks',
          title: 'Reference Checks',
          icon: <Users className="h-8 w-8 text-primary" />,
          shortDesc: 'Professional and personal reference interviews.',
          details: 'Gain deeper insights into an applicant\'s skills, work ethic, and character through structured interviews with their provided references. Our team conducts professional interviews to gather qualitative data supporting your hiring decision.'
        },
        {
          id: 'drug-screening',
          title: 'Drug Screening Coordination',
          icon: <Syringe className="h-8 w-8 text-primary" />,
          shortDesc: 'Coordinate pre-employment and ongoing drug testing.',
          details: 'We partner with certified labs nationwide to offer a range of drug testing panels (e.g., 5-panel, 10-panel). Our coordination service simplifies scheduling and result management, helping maintain a drug-free workplace.'
        },
        {
          id: 'health-checks',
          title: 'Medical & Occupational Health Checks',
          icon: <HeartPulse className="h-8 w-8 text-primary" />,
          shortDesc: 'Facilitate job-specific health and medical assessments.',
          details: 'Coordinate physical exams, DOT physicals, and other occupational health screenings required for specific roles. We work with a network of healthcare providers to ensure compliance with job-related health standards.'
        },
        {
          id: 'international-screening',
          title: 'International Screening',
          icon: <Globe className="h-8 w-8 text-primary" />,
          shortDesc: 'Global checks for candidates with international backgrounds.',
          details: 'For candidates who have lived, worked, or studied abroad, we offer international criminal record checks, employment verifications, and education verifications. Coverage and availability vary by country.'
        },
        {
          id: 'tenant-screening',
          title: 'Tenant Screening',
          icon: <Home className="h-8 w-8 text-primary" />,
          shortDesc: 'Comprehensive screening for landlords and property managers.',
          details: 'Includes credit reports, eviction history, criminal background checks, and income verification to help landlords make informed decisions and mitigate risks associated with renting properties.'
        },
      ];
      
      const industrySolutions = [
        { name: 'Employers', icon: <Briefcase className="h-6 w-6 text-primary" />, description: "Tailored screening packages for businesses of all sizes to ensure safe and productive workplaces." },
        { name: 'Landlords & Property Managers', icon: <Building className="h-6 w-6 text-primary" />, description: "Reliable tenant screening to protect your investments and maintain secure properties." },
        { name: 'Staffing & Recruitment Firms', icon: <Users className="h-6 w-6 text-primary" />, description: "Fast and accurate candidate vetting to place top talent with confidence." },
        { name: 'Individuals', icon: <Search className="h-6 w-6 text-primary" />, description: "Access your personal background report for review or personal records." },
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
        <title>Services - ChexPro | Our Background Screening Solutions</title>
        <meta name="description" content="Discover ChexPro's comprehensive suite of background screening services, including criminal checks, employment verification, education checks, and more tailored solutions." />
        <script type="application/ld+json">
          {JSON.stringify(serviceSchema)}
        </script>
      </Helmet>
          <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
            <div className="container text-center">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
              >Our Comprehensive Screening Services</motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                ChexPro provides a full suite of reliable and compliant background check services tailored to your specific needs.
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
                  <Card className="overflow-hidden glassmorphism hover:shadow-lg transition-shadow">
                    <AccordionItem value={service.id} className="border-b-0">
                      <AccordionTrigger className="p-6 hover:no-underline">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-md">{service.icon}</div>
                          <div>
                            <h3 className="text-xl font-semibold text-left text-foreground">{service.title}</h3>
                            <p className="text-sm text-muted-foreground text-left">{service.shortDesc}</p>
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
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Tailored Solutions for Your Industry</h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              We understand that different sectors have unique screening requirements. ChexPro offers specialized solutions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {industrySolutions.map((solution, index) => (
                <motion.div key={index} variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.3}}>
                <Card className="h-full text-center hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-3 p-3 inline-block rounded-full bg-accent/10">{solution.icon}</div>
                    <CardTitle className="text-xl">{solution.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{solution.description}</p>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </div>
             <div className="text-center mt-12">
              <p className="text-md text-muted-foreground">Don't see your industry? We can create custom packages.</p>
            </div>
          </PageSection>


          <PageSection className="gradient-bg text-primary-foreground">
            <div className="container text-center">
              <h2 className="text-3xl font-bold mb-6">Ready for a Custom Screening Solution?</h2>
              <p className="text-lg max-w-2xl mx-auto mb-10 opacity-90">
                Let our experts help you design the perfect background check package for your unique requirements.
              </p>
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/request-demo">Request a Custom Quote</Link>
              </Button>
            </div>
          </PageSection>
        </PageTransition>
      );
    };

    export default ServicesPage;
  