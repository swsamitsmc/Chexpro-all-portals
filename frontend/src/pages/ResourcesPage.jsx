import React, { useEffect, useMemo, useState } from 'react';
    import PageTransition from '@/components/ui/PageTransition';
    import PageSection from '@/components/PageSection';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
    import { motion } from 'framer-motion';
    import { BookOpen, HelpCircle, FileText, Lightbulb, ArrowRight } from 'lucide-react';
    import { useTranslation } from 'react-i18next';
    import { fetchStrapiPosts, fetchStrapiCategories } from '@/lib/strapiClient';
    import { Helmet } from 'react-helmet-async';

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

    const ResourcesPage = () => {
      const { t, i18n } = useTranslation();
      const currentLocale = useMemo(() => (i18n.language || 'en').split('-')[0], [i18n.language]);
      const [blogPosts, setBlogPosts] = useState([]);
      const [page, setPage] = useState(1);
      const [pageCount, setPageCount] = useState(1);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState(null);
      const [categories, setCategories] = useState([]);
      const [activeCategory, setActiveCategory] = useState('all');
      useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setError(null);
        const categorySlug = activeCategory !== 'all' ? activeCategory : undefined;
        fetchStrapiPosts({ locale: currentLocale, page, pageSize: 9, categorySlug })
          .then(({ posts, pagination }) => {
            if (!isActive) return;
            setBlogPosts(posts);
            setPageCount(pagination.pageCount || 1);
          })
          .catch((err) => {
            if (!isActive) return;
            // Provide more debug info for 400s
            setError(err.message || 'Failed to load posts');
          })
          .finally(() => isActive && setIsLoading(false));
        return () => {
          isActive = false;
        };
      }, [currentLocale, page, activeCategory]);

      useEffect(() => {
        let active = true;
        fetchStrapiCategories({ locale: currentLocale })
          .then((cats) => {
            if (!active) return;
            setCategories(cats);
          })
          .catch(() => {});
        return () => {
          active = false;
        };
      }, [currentLocale]);

      const faqs = t('pages.resources.faqs', { returnObjects: true, defaultValue: [] });
      
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };

      const [activeTab, setActiveTab] = useState('blog');


      return (
        <PageTransition>
          <Helmet>
        <title>{t('pages.resources.metaTitle')}</title>
        <meta name="description" content={t('pages.resources.metaDescription')} />
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
                <BookOpen className="h-16 w-16 text-primary" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.1}}
              >
                {t('pages.resources.heroTitle', { defaultValue: 'Resources & Insights' })}
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                {t('pages.resources.heroSubtitle', { defaultValue: 'Stay informed with our latest articles, guides, and FAQs about background screening.' })}
              </motion.p>
            </div>
          </PageSection>
          
          <PageSection>
            <div className="flex justify-center mb-12 border-b">
              <Button 
                variant={'ghost'} 
                onClick={() => setActiveTab('blog')}
                className="text-lg px-6 py-3 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary hover:bg-primary/10 hover:text-primary"
                data-state={activeTab === 'blog' ? 'active' : ''}
              >
                <FileText className="mr-2 h-5 w-5"/> {t('pages.resources.tabs.blog', { defaultValue: 'Blog' })}
              </Button>
              <Button 
                variant={activeTab === 'faq' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('faq')}
                className="text-lg px-6 py-3 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary hover:bg-primary/10 hover:text-primary"
                data-state={activeTab === 'faq' ? 'active' : ''}
              >
                <HelpCircle className="mr-2 h-5 w-5"/> {t('pages.resources.tabs.faq', { defaultValue: 'FAQs' })}
              </Button>
            </div>

            {activeTab === 'blog' && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                key="blog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                variants={fadeInStagger}
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                <div className="col-span-full flex flex-wrap items-center gap-3 mb-2">
                  <Button
                    variant={activeCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => { setActiveCategory('all'); setPage(1); }}
                  >
                    {t('pages.resources.filters.all', { defaultValue: 'All' })}
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.slug}
                      variant={activeCategory === cat.slug ? 'default' : 'outline'}
                      onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
                {isLoading && (
                  <div className="col-span-full text-center text-muted-foreground">{t('pages.resources.loading', { defaultValue: 'Loading…' })}</div>
                )}
                {error && (
                  <div className="col-span-full text-center text-destructive">{error}</div>
                )}
                {!isLoading && !error && blogPosts.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground">{t('pages.resources.empty', { defaultValue: 'No posts yet.' })}</div>
                )}
                {blogPosts.map((post) => (
                  <motion.div key={post.id} variants={fadeInItem}>
                    <Card className="h-full overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 ease-in-out">
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        {post.imageUrl ? (
                          <img  
                            alt={post.imageAlt} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            src={post.imageUrl}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" aria-hidden />
                        )}
                         <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 m-2 rounded">
                          {post.category}
                        </div>
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground pt-1">{post.date}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                      </CardContent>
                      <div className="p-6 pt-0">
                        <Button asChild variant="link" className="p-0 text-primary group-hover:underline">
                          <Link to={`/resources/${post.slug}`}>
                            {t('resources.learnMore', { defaultValue: 'Read More' })} <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                <div className="col-span-full flex items-center justify-center gap-4 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    {t('pages.resources.prev', { defaultValue: 'Previous' })}
                  </Button>
                  <span className="text-sm text-muted-foreground">{t('pages.resources.pageXofY', { page, pageCount, defaultValue: 'Page {{page}} of {{pageCount}}' })}</span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                  >
                    {t('pages.resources.next', { defaultValue: 'Next' })}
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div 
                className="max-w-3xl mx-auto"
                key="faq"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq, index) => (
                     <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden glassmorphism hover:shadow-md transition-shadow">
                        <AccordionItem value={`faq-${index}`} className="border-b-0">
                          <AccordionTrigger className="p-6 text-left hover:no-underline">
                            <div className="flex items-center space-x-3">
                              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0"/>
                              <span className="font-medium text-foreground">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 pt-0">
                            <p className="text-muted-foreground">{faq.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Card>
                    </motion.div>
                  ))}
                </Accordion>
              </motion.div>
            )}
          </PageSection>

          <PageSection className="bg-secondary text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">{t('pages.resources.ctaTitle', { defaultValue: "Can't Find What You're Looking For?" })}</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              {t('pages.resources.ctaDesc', { defaultValue: 'Our team is here to help. If you have specific questions or need more information, please reach out to us.' })}
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">{t('pages.resources.ctaButton', { defaultValue: 'Contact Support' })}</Link>
            </Button>
          </PageSection>
        </PageTransition>
      );
    };

    export default ResourcesPage;