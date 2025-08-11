import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
    import PageTransition from '@/components/ui/PageTransition';
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
      const { t } = useTranslation();
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
          const response = await fetch('/api/form/demo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
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
              title: t('pages.requestDemo.successTitle'),
              description: t('pages.requestDemo.successDescription'),
              variant: "default",
            });
            setFormData({ name: '', company: '', jobTitle: '', email: '', phone: '', estScreenings: '', servicesOfInterest: '', message: '' });
          } else {
            let errorMessage = 'An unexpected error occurred. Please try again.';
            let payload = {};
            try { payload = await response.json(); } catch {}
            if (payload.errors?.length) {
              errorMessage = payload.errors.map(err => err.msg).join(', ');
            } else if (payload.description) {
              errorMessage = payload.description;
            } else if (payload.error) {
              errorMessage = payload.error;
            }
            if (response.status === 403 && (payload.error || '').toLowerCase().includes('csrf')) {
              try {
                const r = await fetch('/api/form/csrf-token');
                const d = await r.json();
                setCsrfToken(d.csrfToken || '');
              } catch {}
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
      
      const benefits = [
        { icon: <CalendarCheck className="h-6 w-6 text-primary" />, text: t('pages.requestDemo.benefits.personalized') },
        { icon: <TrendingUp className="h-6 w-6 text-primary" />, text: t('pages.requestDemo.benefits.streamline') },
        { icon: <CheckCircle className="h-6 w-6 text-primary" />, text: t('pages.requestDemo.benefits.questions') },
      ];

      return (
        <PageTransition>
          <Helmet>
        <title>{t('pages.requestDemo.metaTitle')}</title>
        <meta name="description" content={t('pages.requestDemo.metaDescription')} />
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
              >{t('pages.requestDemo.heroTitle')}</motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                {t('pages.requestDemo.heroSubtitle')}
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
                    <CardTitle className="text-2xl">{t('pages.requestDemo.formTitle')}</CardTitle>
                    <CardDescription>{t('pages.requestDemo.formDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name">{t('pages.requestDemo.fullName')}</Label>
                          <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required placeholder={t('pages.requestDemo.fullNamePlaceholder')}/>
                        </div>
                        <div>
                          <Label htmlFor="jobTitle">{t('pages.requestDemo.jobTitle')}</Label>
                          <Input id="jobTitle" name="jobTitle" type="text" value={formData.jobTitle} onChange={handleChange} required placeholder={t('pages.requestDemo.jobTitlePlaceholder')}/>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="company">{t('pages.requestDemo.companyName')}</Label>
                        <Input id="company" name="company" type="text" value={formData.company} onChange={handleChange} required placeholder={t('pages.requestDemo.companyNamePlaceholder')}/>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="email">{t('pages.requestDemo.workEmail')}</Label>
                          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder={t('pages.requestDemo.workEmailPlaceholder')}/>
                        </div>
                        <div>
                          <Label htmlFor="phone">{t('pages.requestDemo.phoneNumber')}</Label>
                          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder={t('pages.requestDemo.phoneNumberPlaceholder')}/>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="estScreenings">{t('pages.requestDemo.estimatedScreenings')}</Label>
                        <Input id="estScreenings" name="estScreenings" type="text" value={formData.estScreenings} onChange={handleChange} placeholder={t('pages.requestDemo.estimatedScreeningsPlaceholder')}/>
                      </div>
                      <div>
                        <Label htmlFor="servicesOfInterest">{t('pages.requestDemo.servicesOfInterest')}</Label>
                        <Input id="servicesOfInterest" name="servicesOfInterest" type="text" value={formData.servicesOfInterest} onChange={handleChange} placeholder={t('pages.requestDemo.servicesOfInterestPlaceholder')}/>
                      </div>
                      <div>
                        <Label htmlFor="message">{t('pages.requestDemo.additionalInfo')}</Label>
                        <Textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={4} placeholder={t('pages.requestDemo.additionalInfoPlaceholder')}/>
                      </div>
                      <div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? t('pages.requestDemo.submitting') : t('pages.requestDemo.submitRequest')}
                          {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                        </Button>
                         <p className="text-xs text-muted-foreground mt-2">
                          {t('demo.privacyNote')}
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
                <h2 className="text-3xl font-semibold text-foreground mb-2">{t('pages.requestDemo.whatToExpect')}</h2>
                <ul className="space-y-4">
                  {benefits.map(benefit => (
                     <li key={benefit.text} className="flex items-start space-x-3 p-3 rounded-md bg-secondary/50">
                       {benefit.icon}
                       <span className="text-muted-foreground">{benefit.text}</span>
                     </li>
                  ))}
                </ul>
                <div className="mt-8 p-6 rounded-lg bg-primary/10 border border-primary/30">
                  <h3 className="text-xl font-semibold text-primary mb-3">{t('pages.requestDemo.quickQuote.title')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('pages.requestDemo.quickQuote.description')}
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