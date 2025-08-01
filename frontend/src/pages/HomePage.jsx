import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTransition from '@/hooks/usePageTransition';
import PageSection from '@/components/PageSection';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Users, Award, HeartHandshake as Handshake, ShieldCheck, Building, UserCheck, Briefcase } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // <--- Re-import Helmet

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
  const services = [
    { title: 'Criminal Records', icon: <Award className="h-8 w-8 text-primary" />, description: 'Comprehensive criminal background checks.' },
    { title: 'Employment Verification', icon: <Briefcase className="h-8 w-8 text-primary" />, description: 'Verify past employment history.' },
    { title: 'Education Verification', icon: <Users className="h-8 w-8 text-primary" />, description: 'Confirm educational qualifications.' },
    { title: 'Credit Checks', icon: <TrendingUp className="h-8 w-8 text-primary" />, description: 'Assess financial responsibility.' },
  ];

  const usps = [
    { title: 'Unmatched Speed', description: 'Get results faster than ever without compromising accuracy.', icon: <TrendingUp className="h-6 w-6 text-primary" /> },
    { title: 'Pinpoint Accuracy', description: 'Leverage advanced data sources for reliable information.', icon: <CheckCircle className="h-6 w-6 text-primary" /> },
    { title: 'Dedicated Support', description: 'Our expert team is here to assist you every step of the way.', icon: <Handshake className="h-6 w-6 text-primary" /> },
    { title: 'Transparent Pricing', description: 'Clear, competitive pricing with no hidden fees.', icon: <Award className="h-6 w-6 text-primary" /> },
    { title: 'User-Friendly Platform', description: 'Intuitive interface for seamless screening management.', icon: <UserCheck className="h-6 w-6 text-primary" /> },
    { title: 'Compliance Expertise', description: 'Stay compliant with FCRA and industry regulations.', icon: <ShieldCheck className="h-6 w-6 text-primary" /> },
  ];

  const targetAudiences = [
    { name: 'Employers', description: 'Hire with confidence. Streamline your recruitment process with comprehensive background checks for businesses of all sizes.', icon: <Briefcase className="h-10 w-10 text-primary" /> },
    { name: 'Landlords', description: 'Secure your investment. Make informed tenant decisions with reliable screening services for property managers.', icon: <Building className="h-10 w-10 text-primary" /> },
    { name: 'Staffing Firms', description: 'Place top talent faster. Enhance your candidate vetting process with efficient and accurate background checks.', icon: <Users className="h-10 w-10 text-primary" /> },
    { name: 'Individuals', description: 'Know your background. Access your personal history report for peace of mind and preparedness.', icon: <UserCheck className="h-10 w-10 text-primary" /> },
  ];

  return (
    <PageTransition>
      {/* Re-add Helmet for page-specific title and meta description */}
      <Helmet>
        <title>Home - ChexPro | Reliable Background Checks, Streamlined</title>
        <meta name="description" content="ChexPro provides fast, accurate, and compliant background screening solutions for businesses, landlords, staffing firms, and individuals. Make confident decisions." />
      </Helmet>

      {/* Hero Section */}
      <PageSection className="bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-20 md:pt-32 pb-16 md:pb-24 text-center" fullWidth>
        <div className="container">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Reliable Background Checks, <span className="text-primary">Streamlined.</span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            ChexPro offers fast, accurate, and compliant background screening solutions to help you make informed decisions with confidence.
          </motion.p>
          <motion.div 
            className="space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Button size="lg" asChild>
              <Link to="/request-demo">Request a Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">View Services</Link>
            </Button>
          </motion.div>
        </div>
      </PageSection>

      {/* Services Overview */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Comprehensive Screening Services</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          We provide a wide range of verification services tailored to meet your specific needs.
        </p>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={fadeInStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={fadeInItem}>
              <Card className="h-full hover:shadow-xl transition-shadow duration-300 glassmorphism">
                <CardHeader className="items-center text-center">
                  {service.icon}
                  <CardTitle className="mt-4 text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center mt-12">
          <Button asChild variant="link" className="text-primary text-lg">
            <Link to="/services">Explore All Services &rarr;</Link>
          </Button>
        </div>
      </PageSection>

      {/* Why ChexPro */}
      <PageSection className="bg-secondary">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Why Choose ChexPro?</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Experience the ChexPro difference with our commitment to excellence and client satisfaction.
        </p>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={fadeInStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {usps.map((usp, index) => (
            <motion.div key={index} variants={fadeInItem} className="flex items-start space-x-4 p-4 rounded-lg">
              <div className="flex-shrink-0 mt-1">{usp.icon}</div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-1">{usp.title}</h3>
                <p className="text-muted-foreground">{usp.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </PageSection>

      {/* Target Audience Snippets */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Solutions For Every Need</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          ChexPro provides tailored background screening for diverse industries and individual requirements.
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
          <h2 className="text-3xl font-bold mb-4">Committed to Compliance and Security</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            We adhere to the strictest industry standards, including FCRA compliance, to ensure data accuracy and protect sensitive information. Your trust is our top priority.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-75">
            <span className="text-lg font-semibold">FCRA Compliant</span>
            <span className="text-lg font-semibold">PBS A Accredited (Placeholder)</span>
            <span className="text-lg font-semibold">SOC 2 Certified (Placeholder)</span>
            <span className="text-lg font-semibold">Data Encryption</span>
          </div>
          <div className="mt-10">
            <p className="text-sm text-gray-400">Trusted by leading companies (Client Logos Placeholder)</p>
            <div className="flex justify-center space-x-8 mt-4 opacity-50">
              <span><img alt="Client Logo 1 Placeholder" src="https://images.unsplash.com/photo-1495224814653-94f36c0a31ea" /></span>
              <span><img alt="Client Logo 2 Placeholder" src="https://images.unsplash.com/photo-1607004010229-6048c57c2ab1" /></span>
              <span><img alt="Client Logo 3 Placeholder" src="https://images.unsplash.com/photo-1694208590719-96139a8f2a32" /></span>
              <span><img alt="Client Logo 4 Placeholder" src="https://images.unsplash.com/photo-1649000808933-1f4aac7cad9a" /></span>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Testimonials Placeholder */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">What Our Clients Say</h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Real stories from satisfied clients who trust ChexPro for their screening needs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={fadeInItem}>
              <Card className="h-full glassmorphism">
                <CardContent className="pt-6">
                  <p className="italic text-muted-foreground mb-4">"ChexPro has transformed our hiring process. Their speed and accuracy are unmatched. Highly recommended!" (Placeholder)</p>
                  <p className="font-semibold text-foreground">John Doe, HR Manager (Placeholder)</p>
                  <p className="text-sm text-primary">Tech Solutions Inc. (Placeholder)</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection className="gradient-bg text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Screening Process?</h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 opacity-90">
            Discover how ChexPro can provide you with the insights you need to make confident decisions. Get started today!
          </p>
          <div className="space-x-4">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/request-demo">Request a Free Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/contact" className="text-primary">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </PageSection>
    </PageTransition>
  );
};

export default HomePage;