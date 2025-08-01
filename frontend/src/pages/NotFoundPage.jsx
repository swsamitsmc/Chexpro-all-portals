
    import React from 'react';
    import PageTransition from '@/hooks/usePageTransition';
    import PageSection from '@/components/PageSection';
    import { Button } from '@/components/ui/button';
    import { Link } from 'react-router-dom';
    import { AlertTriangle, Home } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet-async';

    const NotFoundPage = () => {
      return (
        <PageTransition>
          <Helmet>
        <title>Page Not Found - ChexPro</title>
        <meta name="description" content="The page you are looking for on ChexPro could not be found. Please check the URL or return to the homepage." />
      </Helmet>
          <PageSection className="flex items-center justify-center min-h-[calc(100vh-10rem)] text-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-md"
            >
              <AlertTriangle className="h-24 w-24 text-destructive mx-auto mb-8" />
              <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
              <h2 className="text-3xl font-semibold text-foreground mb-6">Page Not Found</h2>
              <p className="text-muted-foreground mb-10">
                Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
              </p>
              <Button asChild size="lg">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Homepage
                </Link>
              </Button>
            </motion.div>
          </PageSection>
        </PageTransition>
      );
    };

    export default NotFoundPage;
  