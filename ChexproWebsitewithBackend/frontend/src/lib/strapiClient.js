import { ENV_CONFIG } from '@/config/envConfig';
import { sampleBlogPosts, sampleCategories, SAMPLE_PAGINATION } from '@/data/sampleBlogPosts';

const STRAPI_URL = ENV_CONFIG.STRAPI_URL?.replace(/\/$/, '') || 'http://localhost:1337';
const STRAPI_TOKEN = ENV_CONFIG.STRAPI_TOKEN;
const POST_CT = ENV_CONFIG.STRAPI_POST_CT || 'posts';
const CATEGORY_CT = ENV_CONFIG.STRAPI_CATEGORY_CT || 'categories';
const PUBLICATION_STATE = ENV_CONFIG.STRAPI_PUBLICATION_STATE || 'live';

// Check if we should use fallback data (disable live CMS for now)
const USE_FALLBACK_DATA = ENV_CONFIG.VITE_USE_FALLBACK_DATA === 'true';

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (STRAPI_TOKEN) headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
  return headers;
}

function withBase(url) {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function mapImageUrl(maybeRelativeUrl) {
  return withBase(maybeRelativeUrl);
}

export async function fetchStrapiPosts({ locale = 'en', page = 1, pageSize = 9, categorySlug } = {}) {
  // Use fallback data if enabled or CMS not available
  if (USE_FALLBACK_DATA) {
    try {
      // Filter posts by category if specified
      let filteredPosts = sampleBlogPosts;
      if (categorySlug) {
        filteredPosts = sampleBlogPosts.filter(post => post.categorySlug === categorySlug);
      }

      // Sort by date descending
      filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Paginate results
      const totalPosts = filteredPosts.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

      const pagination = {
        page,
        pageSize,
        pageCount: Math.ceil(totalPosts / pageSize),
        total: totalPosts
      };

      return { posts: paginatedPosts, pagination };
    } catch (error) {
      console.warn('Using fallback data due to CMS unavailability:', error.message);
      // Fallback to limited hardcoded data
      const fallbackPosts = sampleBlogPosts.slice(0, pageSize);
      return {
        posts: fallbackPosts,
        pagination: SAMPLE_PAGINATION
      };
    }
  }

  // Original Strapi implementation
  const params = new URLSearchParams();
  params.set('locale', locale);
  params.set('sort', 'publishedAt:desc');
  params.set('populate', '*');
  params.set('pagination[page]', String(page));
  params.set('pagination[pageSize]', String(pageSize));
  params.set('publicationState', PUBLICATION_STATE);
  if (categorySlug) {
    params.set('filters[category][slug][$eq]', categorySlug);
  }

  const baseUrl = `${STRAPI_URL}/api/${POST_CT}`;
  let res = await fetch(`${baseUrl}?${params.toString()}`, { headers: buildHeaders() });
  if (res.status === 400) {
    // Retry without locale (for non-localized CTs)
    const retryParams = new URLSearchParams(params);
    retryParams.delete('locale');
    res = await fetch(`${baseUrl}?${retryParams.toString()}`, { headers: buildHeaders() });
    if (res.status === 400 && categorySlug) {
      // Retry again without category filter if relation name mismatches
      retryParams.delete('filters[category][slug][$eq]');
      res = await fetch(`${baseUrl}?${retryParams.toString()}`, { headers: buildHeaders() });
    }
  }
  if (!res.ok) throw new Error(`Strapi posts request failed: ${res.status}`);
  const json = await res.json();
  const items = Array.isArray(json?.data) ? json.data : [];
  const pagination = json?.meta?.pagination || { page, pageSize, pageCount: 1, total: items.length };

  const posts = items.map((item) => {
    const a = item.attributes || {};
    const cover = a.coverImage?.data?.attributes;
    const imageUrl = mapImageUrl(cover?.url);
    const categoryName = a.category?.data?.attributes?.name || a.category?.name || null;
    const categorySlugValue = a.category?.data?.attributes?.slug || null;
    return {
      id: item.id,
      slug: a.slug,
      title: a.title,
      date: a.publishedAt || a.createdAt,
      excerpt: a.excerpt,
      category: categoryName,
      categorySlug: categorySlugValue,
      imageUrl,
      imageAlt: cover?.alternativeText || a.title,
    };
  });

  return { posts, pagination };
}

export async function fetchStrapiPostBySlug({ locale = 'en', slug }) {
  // Use fallback data if enabled or CMS not available
  if (USE_FALLBACK_DATA) {
    try {
      // Find the post by slug in sample data
      const post = sampleBlogPosts.find(p => p.slug === slug);
      if (!post) return null;

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        date: post.date,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt,
        author: post.author,
      };
    } catch (error) {
      console.warn('Using fallback data for post lookup due to CMS unavailability:', error.message);
      return null;
    }
  }

  // Original Strapi implementation
  const params = new URLSearchParams();
  params.set('locale', locale);
  params.set('filters[slug][$eq]', slug);
  params.set('populate', '*');
  params.set('publicationState', PUBLICATION_STATE);
  const baseUrl = `${STRAPI_URL}/api/${POST_CT}`;
  let res = await fetch(`${baseUrl}?${params.toString()}`, { headers: buildHeaders() });
  if (res.status === 400) {
    const retryParams = new URLSearchParams(params);
    retryParams.delete('locale');
    res = await fetch(`${baseUrl}?${retryParams.toString()}`, { headers: buildHeaders() });
  }
  if (!res.ok) throw new Error(`Strapi post request failed: ${res.status}`);
  const json = await res.json();
  const item = Array.isArray(json?.data) ? json.data[0] : null;
  if (!item) return null;
  const a = item.attributes || {};
  const cover = a.coverImage?.data?.attributes;
  return {
    id: item.id,
    slug: a.slug,
    title: a.title,
    date: a.publishedAt || a.createdAt,
    content: a.content, // markdown or HTML; frontend will render markdown
    excerpt: a.excerpt,
    category: a.category?.data?.attributes?.name || null,
    imageUrl: mapImageUrl(cover?.url),
    imageAlt: cover?.alternativeText || a.title,
    author: a.author?.data?.attributes?.name || null,
  };
}

export async function fetchStrapiCategories({ locale = 'en' } = {}) {
  // Use fallback data if enabled or CMS not available
  if (USE_FALLBACK_DATA) {
    try {
      // Return sample categories sorted by name
      const sortedCategories = [...sampleCategories].sort((a, b) => a.name.localeCompare(b.name));
      return sortedCategories;
    } catch (error) {
      console.warn('Using fallback categories due to CMS unavailability:', error.message);
      return sampleCategories.slice(0, 5); // Return first 5 categories as fallback
    }
  }

  // Original Strapi implementation
  const params = new URLSearchParams();
  params.set('locale', locale);
  params.set('sort', 'name:asc');
  params.set('fields', 'name,slug');
  let res = await fetch(`${STRAPI_URL}/api/${CATEGORY_CT}?${params.toString()}`, {
    headers: buildHeaders(),
  });
  if (res.status === 400) {
    const retryParams = new URLSearchParams(params);
    retryParams.delete('locale');
    res = await fetch(`${STRAPI_URL}/api/${CATEGORY_CT}?${retryParams.toString()}`, { headers: buildHeaders() });
  }
  if (!res.ok) throw new Error(`Strapi categories request failed: ${res.status}`);
  const json = await res.json();
  const items = Array.isArray(json?.data) ? json.data : [];
  return items.map((item) => ({
    id: item.id,
    name: item.attributes?.name,
    slug: item.attributes?.slug,
  }));
}
