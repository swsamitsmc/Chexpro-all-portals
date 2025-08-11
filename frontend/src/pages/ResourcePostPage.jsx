import React, { useEffect, useMemo, useState } from 'react';
import PageTransition from '@/components/ui/PageTransition';
import PageSection from '@/components/PageSection';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { fetchStrapiPostBySlug } from '@/lib/strapiClient';
import { renderMarkdownToHtml } from '@/lib/markdown';
import { useTranslation } from 'react-i18next';

const ResourcePostPage = () => {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const currentLocale = useMemo(() => (i18n.language || 'en').split('-')[0], [i18n.language]);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);
    fetchStrapiPostBySlug({ locale: currentLocale, slug })
      .then((p) => {
        if (!isActive) return;
        setPost(p);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err.message || 'Failed to load');
      })
      .finally(() => isActive && setIsLoading(false));
    return () => {
      isActive = false;
    };
  }, [currentLocale, slug]);

  const title = post?.title || 'Article';
  const description = post?.excerpt || '';

  return (
    <PageTransition>
      <Helmet>
        <title>{title} - ChexPro Resources</title>
        {description ? <meta name="description" content={description} /> : null}
      </Helmet>
      <PageSection className="pt-20 md:pt-28 pb-10">
        <div className="container max-w-3xl">
          <Link to="/resources" className="text-primary">← Back to Resources</Link>
          {isLoading && <p className="text-muted-foreground mt-6">Loading…</p>}
          {error && <p className="text-destructive mt-6">{error}</p>}
          {!isLoading && !error && post && (
            <article className="mt-6">
              <h1 className="text-3xl font-bold text-foreground mb-3">{post.title}</h1>
              <p className="text-sm text-muted-foreground mb-6">{post.date}</p>
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-auto rounded mb-8" />
              ) : null}
              {post.content ? (
                <div className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(post.content) }} />
              ) : (
                <p className="text-muted-foreground">No content.</p>
              )}
            </article>
          )}
        </div>
      </PageSection>
    </PageTransition>
  );
};

export default ResourcePostPage;


