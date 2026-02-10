/**
 * Migration Script: Import sampleBlogPosts to Sanity
 * 
 * Run: node scripts/migrate.mjs
 */

import {createClient} from '@sanity/client';
import {sampleCategories, sampleBlogPosts} from '../../../frontend/src/data/sampleBlogPosts.js';

const client = createClient({
  projectId: 'c3k71ef3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'sk7NkEr8jD4qevfpKKrQCqxEhhJWEbptODgMKkfBOkiuz5yoXjLqy7gr4efdlA7P5EePiP8t4ztkSJQ2HqtqLlp2VIUjUCR89lbLY0TebAMwVKfUtYQC4BM7FS9ZoGdYtIZJuTn99i46Vj9ys6t65VzvH4VGyyS95R32iyZWQZMgvkWR0CtY',
  useCdn: false,
});

const categoryColors = {
  'compliance-updates': '#3B82F6',
  'industry-trends': '#8B5CF6',
  'best-practices': '#10B981',
  'fcra-guidelines': '#EF4444',
  'technology-insights': '#F59E0B',
};

const authorMap = {};

async function migrate() {
  console.log('🚀 Starting migration to Sanity...\n');

  // 1. Create Authors
  console.log('📝 Creating authors...');
  const uniqueAuthors = [...new Set(sampleBlogPosts.map(p => p.author))];
  for (const authorName of uniqueAuthors) {
    const authorDoc = {
      _type: 'author',
      name: authorName,
      slug: { _type: 'slug', current: authorName.toLowerCase().replace(/\s+/g, '-') },
      role: authorName.includes('Team') ? 'Content Team' : 'Author',
    };
    const result = await client.create(authorDoc);
    authorMap[authorName] = result._id;
    console.log(`  ✅ Created author: ${authorName}`);
  }

  // 2. Create Categories
  console.log('\n📁 Creating categories...');
  const categoryMap = {};
  for (const cat of sampleCategories) {
    const catDoc = {
      _type: 'category',
      name: cat.name,
      slug: { _type: 'slug', current: cat.slug },
      description: `Blog posts related to ${cat.name.toLowerCase()}`,
      color: categoryColors[cat.slug] || '#6B7280',
    };
    const result = await client.create(catDoc);
    categoryMap[cat.slug] = result._id;
    console.log(`  ✅ Created category: ${cat.name}`);
  }

  // 3. Create Posts
  console.log('\n📰 Creating blog posts...');
  for (const post of sampleBlogPosts) {
    const postDoc = {
      _type: 'post',
      title: {
        en: post.title,
        es: post.title,
        fr: post.title,
        hi: post.title,
      },
      slug: { _type: 'slug', current: post.slug },
      publishedAt: post.date,
      author: { _type: 'reference', _ref: authorMap[post.author] },
      categories: [{ _type: 'reference', _ref: categoryMap[post.categorySlug] }],
      excerpt: {
        en: post.excerpt,
        es: post.excerpt,
        fr: post.excerpt,
        hi: post.excerpt,
      },
      body: convertMarkdownToPortableText(post.content),
    };
    await client.create(postDoc);
    console.log(`  ✅ Created post: ${post.title}`);
  }

  console.log('\n🎉 Migration complete! All blog posts imported to Sanity.');
}

function convertMarkdownToPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  
  lines.forEach((line, index) => {
    const key = `block-${index}`;
    
    if (line.startsWith('# ')) {
      blocks.push({ _type: 'block', style: 'h1', children: [{ _type: 'span', text: line.substring(2) }], _key: key });
    } else if (line.startsWith('## ')) {
      blocks.push({ _type: 'block', style: 'h2', children: [{ _type: 'span', text: line.substring(3) }], _key: key });
    } else if (line.startsWith('### ')) {
      blocks.push({ _type: 'block', style: 'h3', children: [{ _type: 'span', text: line.substring(4) }], _key: key });
    } else if (line.startsWith('- ')) {
      blocks.push({ _type: 'block', style: 'bullet', children: [{ _type: 'span', text: line.substring(2) }], _key: key });
    } else if (line.trim() === '') {
      // Skip empty lines
    } else {
      blocks.push({ _type: 'block', style: 'normal', children: [{ _type: 'span', text: line }], _key: key });
    }
  });
  
  return blocks;
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
