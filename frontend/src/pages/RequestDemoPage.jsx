import React, { useState } from 'react';
    import PageTransition from '@/hooks/usePageTransition';
    import PageSection from '@/components/PageSection';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { CalendarCheck, TrendingUp, CheckCircle, Send } from 'lucide-react';
    import { Helmet } from 'react-helmet-async';

    const RequestDemoPage = () => {
      const { toast } = useToast();
      const [formData, setFormData] = useState({
        name: '',
        company: '',
        jobTitle: '',
        email: '',
        phone: '',
        estScreenings: '',
        servicesOfInterest: '',
        message: '',
      });
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
          const response = await fetch('/api/form/demo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: formData.name.split(' ')[0],
              lastName: formData.name.split(' ').slice(1).join(' '),
              jobTitle: formData.jobTitle,
              companyName: formData.company,
              workEmail: formData.email,
              phone: formData.phone,
              screeningsPerYear: formData.estScreenings,
              servicesOfInterest: formData.servicesOfInterest,
              message: formData.message,
            }),
          });

          if (response.ok) {
            toast({
              title: "Demo Request Submitted!",
              description: "Thank you! Our team will contact you soon to schedule your demo.",
              variant: "default",
            });
            setFormData({ name: '', company: '', jobTitle: '', email: '', phone: '', estScreenings: '', servicesOfInterest: '', message: '' });
          } else {
            const errorData = await response.json();
            const errorMessage = errorData.errors && errorData.errors.length > 0 
              ? errorData.errors.map(err => err.msg).join(', ')
              : 'An unexpected error occurred. Please try again.';
            throw new Error(errorMessage);
          }
        } catch (error) {
          toast({
            title: "Submission Error",
            description: error.message || "Could not submit your request, please try again.",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };
      
      const benefits = [
        { icon: <CalendarCheck className="h-6 w-6 text-primary" />, text: "Personalized walkthrough of our platform." },
        { icon: <TrendingUp className="h-6 w-6 text-primary" />, text: "Discover how ChexPro can streamline your workflow." },
        { icon: <CheckCircle className="h-6 w-6 text-primary" />, text: "Get answers to your specific questions." },
      ];

      return (
        <PageTransition>
          <Helmet>
        <title>Request a Demo - ChexPro | Streamline Your Screening</title>
        <meta name="description" content="Request a free demo of ChexPro's background screening platform to see how our streamlined solutions can benefit your business." />
      </Helmet>
          <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
            <div className="container text-center">
               <motion.div 
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
                className="inline-block p-4 bg-primary/10 rounded-full mb-6"
              >
                <CalendarCheck className="h-16 w-16 text-primary" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay:0.1}}
              >Request a Demo or Quote</motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                See ChexPro in action and learn how our solutions can meet your organization's specific needs. Fill out the form below, and we'll be in touch.
              </motion.p>
            </div>
          </PageSection>

          <PageSection>
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card className="shadow-xl glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-2xl">Demo / Quote Request Form</CardTitle>
                    <CardDescription>Provide your details, and our team will contact you promptly.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required placeholder="John Doe"/>
                        </div>
                        <div>
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input id="jobTitle" name="jobTitle" type="text" value={formData.jobTitle} onChange={handleChange} required placeholder="HR Manager"/>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" name="company" type="text" value={formData.company} onChange={handleChange} required placeholder="Acme Corp"/>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="email">Work Email Address</Label>
                          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@company.com"/>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="(555) 555-5555"/>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="estScreenings">Estimated Screenings per Year</Label>
                        <Input id="estScreenings" name="estScreenings" type="text" value={formData.estScreenings} onChange={handleChange} placeholder="e.g., 50-100, 500+"/>
                      </div>
                      <div>
                        <Label htmlFor="servicesOfInterest">Services of Interest</Label>
                        <Input id="servicesOfInterest" name="servicesOfInterest" type="text" value={formData.servicesOfInterest} onChange={handleChange} placeholder="e.g., Criminal, Employment, Drug Screening"/>
                      </div>
                      <div>
                        <Label htmlFor="message">Additional Information or Questions</Label>
                        <Textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={4} placeholder="Tell us more about your needs..."/>
                      </div>
                      <div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'Submitting...' : 'Submit Request'}
                          {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                        </Button>
                         <p className="text-xs text-muted-foreground mt-2">
                          Note: We respect your privacy. Your information will only be used to contact you regarding this request.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <h2 className="text-3xl font-semibold text-foreground mb-2">What to Expect from Your Demo:</h2>
                <ul className="space-y-4">
                  {benefits.map(benefit => (
                     <li key={benefit.text} className="flex items-start space-x-3 p-3 rounded-md bg-secondary/50">
                       {benefit.icon}
                       <span className="text-muted-foreground">{benefit.text}</span>
                     </li>
                  ))}
                </ul>
                <div className="mt-8 p-6 rounded-lg bg-primary/10 border border-primary/30">
                  <h3 className="text-xl font-semibold text-primary mb-3">Need a Quick Quote?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you already know your requirements and just need pricing, please indicate "Quote Request" in your message. We'll provide a competitive proposal tailored to your volume and service needs.
                  </p>
                </div>
                <div className="mt-8">
                  <img  className="w-full h-auto rounded-lg shadow-lg object-cover" alt="Team discussing project on a computer screen" src="https://images.unsplash.com/photo-1538688554366-621d446302aa" />
                </div>
              </motion.div>
            </div>
          </PageSection>
        </PageTransition>
      );
    };

    export default RequestDemoPage;