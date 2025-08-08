import React, { useState } from 'react';
    import PageTransition from '@/components/ui/PageTransition';
    import PageSection from '@/components/PageSection';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
    import { motion } from 'framer-motion';
    import { BookOpen, HelpCircle, FileText, Lightbulb, ArrowRight } from 'lucide-react';
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
      const blogPosts = [
        {
          id: 1,
          title: 'Understanding the FCRA: A Guide for Employers',
          date: 'May 15, 2025',
          excerpt: 'The Fair Credit Reporting Act (FCRA) plays a crucial role in background screening. Learn its key provisions and how they impact your hiring process...',
          category: 'Compliance',
          imageAlt: 'Legal document with a magnifying glass',
          imagePlaceholder: 'Legal document with a magnifying glass representing FCRA compliance.'
        },
        {
          id: 2,
          title: 'Top 5 Benefits of Comprehensive Background Screening',
          date: 'May 10, 2025',
          excerpt: 'Beyond just due diligence, thorough background checks offer numerous advantages for businesses of all sizes. Discover the key benefits...',
          category: 'Best Practices',
          imageAlt: 'Business people shaking hands',
          imagePlaceholder: 'Business professionals shaking hands, symbolizing successful hiring.'
        },
        {
          id: 3,
          title: 'Navigating Drug Screening in the Modern Workplace',
          date: 'May 5, 2025',
          excerpt: 'Drug screening policies are evolving. Understand the current landscape, types of tests, and legal considerations for your organization...',
          category: 'Screening Services',
          imageAlt: 'Scientific lab equipment',
          imagePlaceholder: 'Scientific lab equipment representing drug screening processes.'
        },
        {
          id: 4,
          title: 'How to Read and Interpret a Background Check Report',
          date: 'April 28, 2025',
          excerpt: 'A background check report contains valuable information, but understanding it is key. This guide breaks down common sections and terms...',
          category: 'How-To Guides',
          imageAlt: 'Person reviewing a report',
          imagePlaceholder: 'Person carefully reviewing a detailed report.'
        },
      ];

      const faqs = [
        {
          question: 'What is the typical turnaround time for a background check?',
          answer: 'Turnaround times can vary depending on the complexity of the search and the types of checks ordered. Most common searches are completed within 24-72 hours. Some searches, like county criminal record searches or international checks, may take longer.'
        },
        {
          question: 'Is ChexPro FCRA compliant?',
          answer: 'Yes, ChexPro is fully compliant with the Fair Credit Reporting Act (FCRA) and all applicable federal, state, and local laws. We are committed to upholding the highest standards of data privacy and accuracy.'
        },
        {
          question: 'What information is needed to run a background check?',
          answer: 'Typically, you will need the applicant\'s full name, date of birth, Social Security number (for US checks), and current address. For employment or education verification, details about previous employers or institutions are also required. Applicant consent is always necessary.'
        },
        {
          question: 'How do I dispute information on my background check report?',
          answer: 'If you believe there is inaccurate or incomplete information on your report, you have the right to dispute it under the FCRA. Please contact our support team or follow the instructions provided with your report to initiate a dispute. We will investigate and correct any verified inaccuracies promptly.'
        },
        {
          question: 'What types of payment do you accept?',
          answer: 'We accept various payment methods, including major credit cards and ACH transfers for business accounts. Please contact our sales team for specific billing and payment options.'
        },
      ];
      
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
        <title>Resources - ChexPro | Guides, FAQs & Downloads</title>
        <meta name="description" content="Access helpful resources, industry guides, frequently asked questions (FAQs), and downloadable content from ChexPro to aid your background screening process." />
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
                Resources & Insights
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.5, delay: 0.2}}
              >
                Stay informed with our latest articles, guides, and answers to frequently asked questions about background screening.
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
                <FileText className="mr-2 h-5 w-5"/> Blog
              </Button>
              <Button 
                variant={activeTab === 'faq' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('faq')}
                className="text-lg px-6 py-3 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary hover:bg-primary/10 hover:text-primary"
                data-state={activeTab === 'faq' ? 'active' : ''}
              >
                <HelpCircle className="mr-2 h-5 w-5"/> FAQs
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
                {blogPosts.map((post) => (
                  <motion.div key={post.id} variants={fadeInItem}>
                    <Card className="h-full overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 ease-in-out">
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        <img  
                          alt={post.imageAlt} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         src="https://images.unsplash.com/photo-1675023112817-52b789fd2ef0" />
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
                        <Button variant="link" className="p-0 text-primary group-hover:underline">
                          Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
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
                              <Lightbulb className="h-5 w-5 text-accent flex-shrink-0"/>
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
            <h2 className="text-3xl font-bold text-foreground mb-4">Can't Find What You're Looking For?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Our team is here to help. If you have specific questions or need more information, please reach out to us.
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </PageSection>
        </PageTransition>
      );
    };

    export default ResourcesPage;