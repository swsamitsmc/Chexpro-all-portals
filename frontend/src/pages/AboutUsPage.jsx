
    import React from 'react';
    import PageTransition from '@/hooks/usePageTransition';
    import PageSection from '@/components/PageSection';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { Target, Eye, HeartHandshake as Handshake, ShieldCheck, Users, Zap } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet-async';

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
      const values = [
        { title: 'Integrity', description: 'Upholding the highest ethical standards in all our operations and interactions.', icon: <ShieldCheck className="h-8 w-8 text-primary" /> },
        { title: 'Accuracy', description: 'Committing to providing precise and reliable information through meticulous verification processes.', icon: <Target className="h-8 w-8 text-primary" /> },
        { title: 'Client-Centricity', description: 'Placing our clients\' needs at the forefront, offering tailored solutions and exceptional support.', icon: <Handshake className="h-8 w-8 text-primary" /> },
        { title: 'Innovation', description: 'Continuously advancing our technology and methods to deliver cutting-edge screening services.', icon: <Zap className="h-8 w-8 text-primary" /> },
        { title: 'Compliance', description: 'Adhering strictly to all relevant regulations, including the FCRA, to ensure lawful and fair practices.', icon: <Users className="h-8 w-8 text-primary" /> },
      ];

      return (
        <PageTransition>
          <Helmet>
      <title>About Us - ChexPro | Our Mission & Values</title>
      <meta name="description" content="Learn about ChexPro's mission, values, and our commitment to accurate and compliant background screening solutions." />
      {/* You can add more meta tags here if needed, e.g., Open Graph tags for social sharing */}
      {/* <meta property="og:title" content="About Us - ChexPro" /> */}
      {/* <meta property="og:description" content="Learn about ChexPro's mission and values." /> */}
      {/* <meta property="og:image" content="https://chexpro.com/og-image.jpg" /> */}
    </Helmet>
          <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
            <div className="container text-center">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
              >
                About ChexPro
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                Empowering organizations and individuals with trustworthy background screening solutions.
              </motion.p>
            </div>
          </PageSection>

          <PageSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                <img 
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                  alt="Diverse team collaborating in a modern office"
                 src="https://chexpro.com/team.png" />
              </motion.div>
              <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission & Vision</h2>
                <div className="space-y-6 text-muted-foreground">
                  <div className="flex items-start space-x-3">
                    <Target className="h-7 w-7 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">Mission</h3>
                      <p>To provide comprehensive, accurate, and timely background screening services that empower our clients to make informed decisions with confidence, fostering safer communities and workplaces.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="h-7 w-7 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">Vision</h3>
                      <p>To be the most trusted and technologically advanced partner in background screening, recognized for our commitment to integrity, innovation, and client success.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </PageSection>

          <PageSection className="bg-secondary">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Our Core Values</h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              The principles that guide every aspect of our business and client interactions.
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
                  <Card className="h-full text-center hover:shadow-xl transition-shadow duration-300 glassmorphism">
                    <CardHeader>
                      <div className="mx-auto mb-4 p-3 inline-block rounded-full bg-primary/10">{value.icon}</div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </PageSection>

          <PageSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <motion.div variants={fadeInItem} initial="hidden" whileInView="visible" viewport={{once: true}}>
                <h2 className="text-3xl font-bold text-foreground mb-6">Our Team</h2>
                <p className="text-muted-foreground mb-4">
                  ChexPro is powered by a dedicated team of experienced professionals, researchers, and technology experts passionate about delivering excellence in background screening. Our collective expertise ensures that we stay ahead of industry trends and provide our clients with the highest quality service. (Placeholder for more detailed team info).
                </p>
                <p className="text-muted-foreground">
                  We invest in continuous training and development to maintain our edge in compliance, data analysis, and customer support.
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
              <h2 className="text-3xl font-bold mb-4">Commitment to Compliance</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
                Compliance is not just a requirement; it's a cornerstone of our operations. We are deeply committed to upholding the Fair Credit Reporting Act (FCRA) and all applicable federal, state, and local laws. Our processes are designed to ensure accuracy, data privacy, and fair information practices.
              </p>
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white" asChild>
                <Link to="/compliance">Learn More About Our Compliance Standards</Link>
              </Button>
            </div>
          </PageSection>

          <PageSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Partner with ChexPro</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Ready to experience the ChexPro advantage? Contact us today to discuss your background screening needs.
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </PageSection>
        </PageTransition>
      );
    };

    export default AboutUsPage;
  