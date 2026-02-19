import { PortableText as PortableTextReact } from '@portabletext/react';
import { urlFor } from '@/lib/sanityClient';

/**
 * Custom components for PortableText rendering
 */
const portableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <figure className="my-8">
          <img
            src={urlFor(value).width(800).auto('format').url()}
            alt={value.alt || ''}
            className="w-full rounded-lg shadow-lg"
            loading="lazy"
          />
          {value.caption && (
            <figcaption className="mt-2 text-sm text-muted-foreground text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mt-8 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mt-6 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-semibold mt-6 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 text-base leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
    ),
  },
  marks: {
    link: ({ value, children }) => {
      const target = value?.href?.startsWith('http') ? '_blank' : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noindex nofollow' : undefined}
          className="text-primary hover:underline"
        >
          {children}
        </a>
      );
    },
  },
};

/**
 * PortableText component for rendering Sanity rich text content
 * @param {Object} props
 * @param {Array} props.value - Portable Text blocks from Sanity
 * @returns {JSX.Element}
 */
export function PortableText({ value }) {
  if (!value || !Array.isArray(value)) {
    return null;
  }

  return <PortableTextReact value={value} components={portableTextComponents} />;
}

export default PortableText;
