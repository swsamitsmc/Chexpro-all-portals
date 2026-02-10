import { useState, useEffect } from 'react';
    import { useTranslation } from 'react-i18next';
    import PageTransition from '@/components/ui/PageTransition';
    import PageSection from '@/components/PageSection';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { Mail, Phone, MapPin, Send } from 'lucide-react';
    import { Helmet } from 'react-helmet-async';

    const ContactUsPage = () => {
      const { t } = useTranslation();
      const { toast } = useToast();
      const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        services: '',
        message: '',
      });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [csrfToken, setCsrfToken] = useState('');

      useEffect(() => {
        const fetchCsrfToken = async () => {
          try {
            const response = await fetch('/api/form/csrf-token');
            const data = await response.json();
            setCsrfToken(data.csrfToken);
          } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
          }
        };
        fetchCsrfToken();
      }, []);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          const response = await fetch('/api/form/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
              firstName: formData.name.split(' ')[0],
              lastName: formData.name.split(' ').slice(1).join(' '),
              email: formData.email,
              phone: formData.phone,
              companyName: formData.company,
              message: formData.message,
            }),
          });

          if (response.ok) {
            toast({
              title: "Message Sent!",
              description: "Thank you for contacting ChexPro. We'll be in touch shortly.",
              variant: "default",
            });
            setFormData({ name: '', company: '', email: '', phone: '', services: '', message: '' });
          } else {
            let errorMessage = 'An unexpected error occurred. Please try again.';
            let payload = {};
            try { payload = await response.json(); } catch {
              // Ignore JSON parse errors; payload will remain an empty object
            }
            if (payload.errors?.length) {
              errorMessage = payload.errors.map(err => err.msg).join(', ');
            } else if (payload.description) {
              errorMessage = payload.description;
            } else if (payload.error) {
              errorMessage = payload.error;
            }
            // If CSRF failed (server likely restarted), refresh token for next attempt
            if (response.status === 403 && (payload.error || '').toLowerCase().includes('csrf')) {
              try {
                const r = await fetch('/api/form/csrf-token');
                const d = await r.json();
                setCsrfToken(d.csrfToken || '');
              } catch {
                // Intentionally left empty: ignore JSON parse errors
              }
            }
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

      const usPhone = t('contact.phoneNumbers.us', { defaultValue: '+1 872 256 1009' });
      const caPhone = t('contact.phoneNumbers.ca', { defaultValue: '+1 437 922 7779' });
      const contactInfo = [
        { icon: <Mail className="h-6 w-6 text-primary" />, text: "info@chexpro.com", label: t('contact.emailUs', { defaultValue: 'Email Us' }) },
        { icon: <Phone className="h-6 w-6 text-primary" />, text: t('contact.phoneText', { usNumber: usPhone, caNumber: caPhone, defaultValue: `US: ${usPhone}   Canada: ${caPhone}` }), label: t('contact.callUs', { defaultValue: 'Call Us' }) },
        { icon: <MapPin className="h-6 w-6 text-primary" />, text: "30 N Gould St Ste R, Sheridan, WY 82801", label: t('contact.ourOffice', { defaultValue: 'Our Office' }) },
      ];

      return (
        <PageTransition>
          <Helmet>
        <title>{`${t('navigation.contact', { defaultValue: 'Contact Us' })} - ChexPro | ${t('pages.contactUs.getInTouch', { defaultValue: 'Get in Touch' })}`}</title>
        <meta name="description" content="Contact ChexPro for sales inquiries, customer support, or general questions about our background screening services. Reach out today." />
      </Helmet>
          <PageSection className="bg-gradient-to-b from-primary/5 via-transparent to-transparent pt-20 md:pt-28 pb-16 md:pb-24">
            <div className="container text-center">
              <motion.div 
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5}}
                className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6"
              >
                <Mail className="h-16 w-16 text-primary" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay:0.1}}
              >{t('pages.contactUs.getInTouch', { defaultValue: 'Get in Touch' })}</motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                {t('pages.contactUs.heroSubtitle', { defaultValue: "We're here to answer your questions and help you find the best screening solutions. Reach out to us today!" })}
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
                    <CardTitle className="text-2xl">{t('contact.contactForm')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name">{t('contact.firstName')}</Label>
                          <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required placeholder="John Doe"/>
                        </div>
                        <div>
                          
                          <Label htmlFor="company">{t('contact.companyName')}</Label>
                          <Input id="company" name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Acme Corp"/>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">{t('contact.emailAddress')}</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com"/>
                      </div>
                      <div>
                        <Label htmlFor="phone">{t('contact.phoneNumber')}</Label>
                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="(555) 555-5555" pattern="^[\d\s-()+.]{10,20}$" title="Please enter a valid phone number (10-20 digits)"/>
                      </div>
                      <div>
                        <Label htmlFor="services">{t('contact.servicesInterested')}</Label>
                        <Input id="services" name="services" type="text" value={formData.services} onChange={handleChange} placeholder="e.g., Criminal Checks, Employment Verification"/>
                      </div>
                      <div>
                        <Label htmlFor="message">{t('contact.message')}</Label>
                        <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} placeholder="How can we help you today?"/>
                      </div>
                      <div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'Sending...' : t('contact.sendMessage')}
                          {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('contact.privacyNote')}
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
                <h2 className="text-3xl font-semibold text-foreground mb-6">{t('contact.contactInformation', { defaultValue: 'Contact Information' })}</h2>
                {contactInfo.map(info => (
                  <div key={info.label} className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/50">
                    <div className="flex-shrink-0 mt-1">{info.icon}</div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">{info.label}</h3>
                      <p className="text-muted-foreground">{info.text}</p>
                    </div>
                  </div>
                ))}
                
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{t('contact.officeHours')}</h3>
                  <p className="text-muted-foreground">{t('contact.officeHoursWeekdays', { defaultValue: 'Monday - Friday: 9:00 AM - 6:00 PM (EST)' })}</p>
                  <p className="text-muted-foreground">{t('contact.officeHoursWeekend', { defaultValue: 'Saturday - Sunday: Closed' })}</p>
                </div>

                 <div className="mt-8">
  <h3 className="text-xl font-semibold text-foreground mb-3">{t('contact.findOnMap')}</h3>
  {/* This container maintains a responsive 16:9 aspect ratio and applies rounded corners */}
  <div className="aspect-video rounded-lg overflow-hidden">
    <iframe
      title="Google Map of our location"
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d176.94795310696014!2d-106.95485254129964!3d44.79778004681027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5335fabc2a6d206b%3A0x1887ab0668b2495c!2s30%20N%20Gould%20St%20Suite%20R%2C%20Sheridan%2C%20WY%2082801%2C%20USA!5e0!3m2!1sen!2sca!4v1754012494120!5m2!1sen!2sca"
      className="w-full h-full"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    >
    </iframe>
  </div>
</div>
              </motion.div>
            </div>
          </PageSection>
        </PageTransition>
      );
    };

    export default ContactUsPage;