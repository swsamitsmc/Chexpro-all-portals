import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { ENV_CONFIG } from '@/config/envConfig';

// Sanity client configuration - No token needed for public reads
const PROJECT_ID = ENV_CONFIG.SANITY_PROJECT_ID || 'c3k71ef3';
const DATASET = ENV_CONFIG.SANITY_DATASET || 'production';
const USE_CDN = import.meta.env?.PROD === true || ENV_CONFIG.NODE_ENV === 'production';

// Only log configuration in development mode
if (ENV_CONFIG.NODE_ENV === 'development' && ENV_CONFIG.DEBUG_MODE) {
  console.log('[Sanity] Initializing client');
}

export const sanityClient = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  useCdn: USE_CDN,
  // Token is optional for public data - only needed for write operations
});

// Image URL builder with optimization
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source) {
  return builder.image(source);
}

// Supported locales mapping
const LOCALE_MAP = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  hi: 'hi',
};

// Placeholder image URL for posts without images
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x300/e2e8f0/64748b?text=No+Image';

/**
 * Get image URL with fallback to placeholder
 * @param {Object} image - Sanity image object
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {string} - Image URL or placeholder
 */
function getImageUrl(image, width = 600, height = 300) {
  if (!image) return PLACEHOLDER_IMAGE;
  return urlFor(image).width(width).height(height).url();
}

/**
 * Get localized field value from Sanity document
 * @param {Object} field - Object with locale keys { en, es, fr, hi }
 * @param {string} locale - Current locale code
 * @returns {string} - Localized value or fallback to English
 */
export function getLocalizedValue(field, locale = 'en') {
  if (!field) return '';
  const localeCode = LOCALE_MAP[locale] || 'en';
  return field[localeCode] || field.en || '';
}

/**
 * Fetch all posts from Sanity with optional filters
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.pageSize - Number of posts per page
 * @param {string} options.categorySlug - Filter by category slug
 * @param {string} options.locale - Current locale for translations
 * @returns {Object} - { posts, pagination }
 */
export async function fetchPosts({ page = 1, pageSize = 9, categorySlug, locale = 'en' } = {}) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  // Build filter conditions
  const filters = ['_type == "post"'];
  if (categorySlug && categorySlug !== 'all') {
    filters.push(`"${categorySlug}" in categories[]->slug.current`);
  }

  const filterString = filters.join(' && ');

  // GROQ Query
  const query = `{
    "posts": *[${filterString}] | order(publishedAt desc) [${start}...${end}] {
      _id,
      _createdAt,
      publishedAt,
      title,
      slug,
      excerpt,
      mainImage,
      categories[]->{
        _id,
        name,
        slug,
        color
      },
      author->{
        _id,
        name,
        image,
        role
      }
    },
    "total": count(*[${filterString}])
  }`;

  try {
    const data = await sanityClient.fetch(query);
    
    const posts = data.posts.map((post) => ({
      id: post._id,
      slug: post.slug?.current,
      title: getLocalizedValue(post.title, locale),
      date: post.publishedAt,
      excerpt: getLocalizedValue(post.excerpt, locale),
      category: post.categories?.[0]?.name || '',
      categorySlug: post.categories?.[0]?.slug?.current || '',
      imageUrl: getImageUrl(post.mainImage, 600, 300),
      imageAlt: post.mainImage?.alt || post.title?.en || '',
      author: post.author?.name || '',
    }));

    const total = data.total || 0;
    const pageCount = Math.ceil(total / pageSize);

    return { posts, pagination: { page, pageSize, pageCount, total } };
  } catch (error) {
    console.error('Error fetching posts from Sanity:', error);
    throw error;
  }
}

/**
 * Fetch a single post by slug
 * @param {Object} options - Query options
 * @param {string} options.slug - Post slug
 * @param {string} options.locale - Current locale
 * @returns {Object|null} - Post data or null if not found
 */
export async function fetchPostBySlug({ slug, locale = 'en' } = {}) {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    _createdAt,
    publishedAt,
    title,
    slug,
    excerpt,
    body,
    mainImage,
    categories[]->{
      _id,
      name,
      slug,
      color
    },
    author->{
      _id,
      name,
      image,
      role,
      bio
    },
    seoTitle,
    seoDescription
  }`;

  try {
    const post = await sanityClient.fetch(query, { slug });

    if (!post) return null;

    return {
      id: post._id,
      slug: post.slug?.current,
      title: getLocalizedValue(post.title, locale),
      date: post.publishedAt,
      content: post.body,
      excerpt: getLocalizedValue(post.excerpt, locale),
      category: post.categories?.[0]?.name || '',
      categorySlug: post.categories?.[0]?.slug?.current || '',
      imageUrl: getImageUrl(post.mainImage, 800, 400),
      imageAlt: post.mainImage?.alt || post.title?.en || '',
      author: post.author?.name || '',
      authorBio: post.author?.bio,
      authorRole: post.author?.role,
      seoTitle: getLocalizedValue(post.seoTitle, locale),
      seoDescription: getLocalizedValue(post.seoDescription, locale),
    };
  } catch (error) {
    console.error('Error fetching post from Sanity:', error);
    throw error;
  }
}

/**
 * Fetch all categories
 * @param {string} locale - Current locale
 * @returns {Array} - Array of category objects
 */
export async function fetchCategories() {
  const query = `*[_type == "category"] | order(name asc) {
    _id,
    name,
    slug,
    description,
    color
  }`;

  try {
    const categories = await sanityClient.fetch(query);
    return categories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug?.current,
      description: cat.description,
      color: cat.color,
    }));
  } catch (error) {
    console.error('Error fetching categories from Sanity:', error);
    throw error;
  }
}

/**
 * Fetch posts by category
 * @param {string} categorySlug - Category slug
 * @param {number} page - Page number
 * @param {number} pageSize - Posts per page
 * @param {string} locale - Current locale
 */
export async function fetchPostsByCategory({ categorySlug, page = 1, pageSize = 9, locale = 'en' } = {}) {
  return fetchPosts({ page, pageSize, categorySlug, locale });
}

export default {
  client: sanityClient,
  fetchPosts,
  fetchPostBySlug,
  fetchCategories,
  fetchPostsByCategory,
  urlFor,
  getLocalizedValue,
};
