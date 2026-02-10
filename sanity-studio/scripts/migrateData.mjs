/**
 * Migration Script: Convert sampleBlogPosts to Sanity Documents
 * 
 * This script migrates the existing blog content from the frontend's
 * sampleBlogPosts.js to a format that can be imported into Sanity.
 * 
 * Usage:
 * 1. First, run this script to generate the migration JSON:
 *    node scripts/migrateData.mjs > migration-output.json
 * 
 * 2. Then, use Sanity CLI to import the data:
 *    sanity dataset import migration-output.json production
 * 
 * Or, configure the script to run with Sanity client directly.
 */

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Sample blog posts data (copied from frontend/src/data/sampleBlogPosts.js)
const sampleCategories = [
  { id: 1, name: "Compliance Updates", slug: "compliance-updates" },
  { id: 2, name: "Industry Trends", slug: "industry-trends" },
  { id: 3, name: "Best Practices", slug: "best-practices" },
  { id: 4, name: "FCRA Guidelines", slug: "fcra-guidelines" },
  { id: 5, name: "Technology Insights", slug: "technology-insights" }
];

const sampleBlogPosts = [
  {
    id: 1,
    slug: "navigating-fcra-compliance-2025",
    title: "Navigating FCRA Compliance in 2025: What You Need to Know",
    date: "2025-01-15T10:00:00.000Z",
    excerpt: "A comprehensive guide to staying compliant with Fair Credit Reporting Act requirements in the evolving regulatory landscape.",
    category: "FCRA Guidelines",
    categorySlug: "fcra-guidelines",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "FCRA Compliance Guide Document",
    author: "Compliance Team",
    content: `# Navigating FCRA Compliance in 2025: What You Need to Know

The Fair Credit Reporting Act (FCRA) continues to evolve with new interpretations and requirements. As a background screening provider, staying ahead of these changes is critical for maintaining compliance and protecting your business.

## Key Updates for 2025

### 1. Enhanced Consent Requirements
Recent court decisions have strengthened the requirements for obtaining proper consent before conducting background checks. Organizations must ensure:

- Clear, written consent from applicants
- Documentation of consent in records
- Verification that consent is freely given

### 2. Adverse Action Notice Improvements
The FCRA requires specific notices when taking adverse action based on a consumer report. This year brings:

- More detailed notice requirements
- Shorter timeframes for providing notice
- Enhanced documentation requirements

### 3. Third-Party Risk Management
With increased vendor dependencies, organizations must now thoroughly vet:

- Data sources and aggregators
- Sub-vendors and partnerships
- International data providers

## Best Practices for 2025

### Automated Compliance Tracking
Implement automated systems to track:
- Consent expiration dates
- Report retention periods
- Audit trail maintenance

### Regular Training Programs
Ensure all staff involved in background screening complete:
- Annual FCRA training
- Updates on regulatory changes
- Legal case reviews

### Quality Assurance Processes
Maintain rigorous quality control:
- Regular audit procedures
- Dispute resolution protocols
- Error tracking and prevention

## Looking Ahead

The regulatory landscape will continue to evolve with emerging technologies like AI and international data sharing. Proactive compliance programs and expert guidance will be essential for success.

Stay informed and compliant with our comprehensive FCRA compliance solutions.`
  },
  {
    id: 2,
    slug: "pre-employment-background-checks-criminal-records",
    title: "The Complete Guide to Criminal Background Checks in Pre-Employment Screening",
    date: "2025-01-08T14:30:00.000Z",
    excerpt: "Everything employers need to know about criminal background checks, from FCRA compliance to reporting best practices.",
    category: "Best Practices",
    categorySlug: "best-practices",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "Criminal Background Check Process",
    author: "Operations Team",
    content: `# The Complete Guide to Criminal Background Checks in Pre-Employment Screening

Criminal background checks remain one of the most valuable tools in the pre-employment screening toolkit. Understanding when and how to use them effectively is crucial for compliance and informed hiring decisions.

## Types of Criminal Records

### Federal Records
- Federal court records and convictions
- FBI repository information (Fingerprint checks)
- National database searches

### State Records
- Statewide criminal history databases
- County-level court records
- Probation and parole information

## Industry-Specific Considerations

### Finance and Banking
Required for roles involving:
- Financial management
- Access to sensitive financial data
- Positions of fiduciary responsibility

### Healthcare
Critical for ensuring patient safety:
- Positions with patient contact
- Access to controlled substances
- Emergency response roles

### Transportation
Required for safety-sensitive positions:
- Commercial driving licenses
- Public transportation roles
- Aviation and maritime positions

## Compliance Requirements

### FCRA Guidelines
- Proper consent requirements
- Adverse action notices
- Dispute resolution procedures

### Ban-the-Box Considerations
Increasing number of jurisdictions have waiting period requirements:
- Do not ask about criminal history on initial application
- Implement standardized procedures
- Focus on job-related qualifications

## Best Practices

### Standardized Processes
Implement consistent procedures:
- Clear criminal history policies
- Standardized assessment criteria
- Documentation requirements

### Job-Related Assessments
Ensure all checks are:
- Necessary for the position
- Proportional to business needs
- Legally permissible`
  },
  {
    id: 3,
    slug: "data-security-privacy-background-screening",
    title: "Data Security and Privacy in Background Screening: Protecting Sensitive Information",
    date: "2024-12-22T09:15:00.000Z",
    excerpt: "Essential strategies for maintaining data security and privacy throughout the background screening process.",
    category: "Technology Insights",
    categorySlug: "technology-insights",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "Data Security Lock Icon",
    author: "Security Team",
    content: `# Data Security and Privacy in Background Screening: Protecting Sensitive Information

Data security and privacy have never been more critical in background screening. With increasing regulatory scrutiny and cyber threats, organizations must implement comprehensive protection strategies.

## Core Security Principles

### Data Minimization
Only collect and retain:
- Essential information required for screening
- Data necessary for business purposes
- Information with legitimate legal basis

### Encryption Standards
Protect data throughout its lifecycle:
- TLS 1.3 for data in transit
- AES-256 encryption for data at rest
- Database-level encryption for sensitive fields

### Access Control
Implement layered protection:
- Role-based access permissions
- Multi-factor authentication
- Least privilege principles

## Regulatory Compliance

### GDPR Considerations (Global)
- Lawful basis for processing
- Data subject rights
- International data transfers

### CCPA/CPRA (California)
- Consumer notification requirements
- Opt-out rights
- Data sharing restrictions

### FCRA Privacy Rules
- Authorized use requirements
- Information sharing limitations
- Consumer access rights

## Technological Safeguards

### Network Security
- Firewalls and intrusion detection
- Regular vulnerability assessments
- DDoS protection measures

### Endpoint Security
- Antivirus and anti-malware protection
- Device encryption requirements
- Remote access policies`
  },
  {
    id: 4,
    slug: "emerging-trends-background-screening-industry",
    title: "Emerging Trends in Background Screening: What to Watch in 2025",
    date: "2024-12-15T11:45:00.000Z",
    excerpt: "Explore the latest developments shaping the future of background screening, from AI-powered insights to global compliance standards.",
    category: "Industry Trends",
    categorySlug: "industry-trends",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "Future Technology Background Screening",
    author: "Research Team",
    content: `# Emerging Trends in Background Screening: What to Watch in 2025

The background screening industry continues to evolve rapidly with technological advancements, regulatory changes, and shifting market demands. Understanding these trends will help organizations prepare for the future.

## Technology Innovations

### Artificial Intelligence and Machine Learning
AI is transforming screening processes through:
- Predictive risk assessment models
- Automated document verification
- Pattern recognition for fraud detection
- Natural language processing for reference checks

### Blockchain Technology
Distributed ledger technology offers:
- Enhanced data integrity and immutability
- Transparent chain of custody
- Improved identity verification
- Secure record sharing capabilities

### Mobile-First Design
Responsive applications provide:
- Field verification capabilities
- Real-time status updates
- Enhanced user experiences
- Streamlined candidate processes

## Regulatory Developments

### International Standards
Global harmonization efforts include:
- EU-US privacy framework implementation
- Cross-border data sharing protocols
- Unified compliance standards
- International background data repositories

### Enhanced Consent Requirements
Regulatory updates focus on:
- Granular consent mechanisms
- Right to be forgotten implementations
- Data portability requirements
- Increased transparency requirements`
  },
  {
    id: 5,
    slug: "employment-verification-process-best-practices",
    title: "Employment Verification Process: Best Practices and Common Pitfalls",
    date: "2024-12-08T08:00:00.000Z",
    excerpt: "Master the art of employment verification with proven strategies, automated tools, and compliance considerations.",
    category: "Best Practices",
    categorySlug: "best-practices",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "Employment Verification Checklist",
    author: "Operations Team",
    content: `# Employment Verification Process: Best Practices and Common Pitfalls

Employment verification remains a cornerstone of effective pre-employment screening. Done correctly, it validates candidate credentials and helps mitigate hiring risks.

## Core Components of Employment Verification

### Basic Information Checks
Verify essential employment details:
- Company name and location
- Employment dates (start and end)
- Job title and responsibilities
- Employment status (full-time/part-time)

### Compensation Verification
Confirm compensation details:
- Salary or hourly rate
- Benefits package components
- Bonus or commission structures
- Reasons for separation

### Performance Information
Gather performance insights:
- Job performance ratings
- Strengths and areas for improvement
- Achievement highlights
- Leadership potential assessments

## Verification Methods

### Primary Methods
- Direct employer contact via phone
- Online verification services
- Reference interviews
- Payroll record audits

### Secondary Methods
- Professional networking platforms
- Public records searches
- Work history documentation
- Social media verification`
  },
  {
    id: 6,
    slug: "global-background-screening-international-compliance",
    title: "Global Background Screening: International Compliance and Best Practices",
    date: "2024-11-30T13:20:00.000Z",
    excerpt: "Navigate international background screening with expert guidance on global compliance, local regulations, and cross-border verification strategies.",
    category: "Compliance Updates",
    categorySlug: "compliance-updates",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "World Map with Global Background Screening Focus",
    author: "Compliance Team",
    content: `# Global Background Screening: International Compliance and Best Practices

Global organizations face unique challenges when conducting background screenings for international hires. Understanding local laws, customs, and available data sources is crucial for compliance and effective screening.

## Regional Requirements Overview

### European Union (EU)
Key compliance considerations:
- GDPR data protection requirements
- Work with authorized EU-based CRAs
- Language localization for consent forms
- Right to be forgotten provisions

### United Kingdom
Post-Brexit considerations:
- Retained EU law implementation
- ICO regulatory oversight
- Criminal records disclosure requirements
- Enhanced DBS check procedures

### Asia Pacific Region
Diverse regulatory frameworks:
- Data privacy regulations vary by country
- Criminal records availability differs
- Identity document verification challenges
- Language and translation requirements

### North America
Harmonized but distinct requirements:
- US FCRA compliance alignment
- Canadian PIPEDA considerations
- Cross-border data sharing protocols
- Provincial regulatory differences`
  },
  {
    id: 7,
    slug: "automated-background-screening-consent-management",
    title: "Automated Background Screening: Consent Management and Digital Workflows",
    date: "2024-11-23T10:30:00.000Z",
    excerpt: "Discover how automation is revolutionizing consent management and streamlining digital background screening workflows for efficiency and compliance.",
    category: "Technology Insights",
    categorySlug: "technology-insights",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "Automated Digital Workflow Illustration",
    author: "Technology Team",
    content: `# Automated Background Screening: Consent Management and Digital Workflows

The digital transformation of background screening has revolutionized how organizations manage consent and process documentation. Automated workflows are driving efficiency while maintaining compliance standards.

## Digital Consent Evolution

### Traditional Methods
Legacy consent collection relied on:
- Paper-based forms
- Manual signature collection
- Physical document storage
- Tedious verification processes

### Digital Transformation
Modern approaches provide:
- Electronic consent mechanisms
- Digital signature capabilities
- Electronic record management
- Automated compliance tracking

## Core Components of Digital Workflows

### E-Consent Platforms
Advanced consent management includes:
- Configurable consent forms
- Multi-language support
- Mobile-responsive designs
- Digital signature integration

### Automated Processing
Workflow automation capabilities:
- Trigger-based process initiation
- Alert and notification systems
- Approval routing workflows
- Exception handling protocols

## Compliance Integration

### FCRA Requirements
Digital systems address:
- Authorization documentation
- Time-sensitive communications
- Audit trail maintenance
- Adverse action notifications`
  },
  {
    id: 8,
    slug: "turnaround-times-background-screening-expectations",
    title: "Background Screening Turnaround Times: Managing Expectations and Optimizing Processes",
    date: "2024-11-16T14:00:00.000Z",
    excerpt: "Understanding typical turnaround times for different types of background checks and strategies to improve processing speed without compromising quality.",
    category: "Best Practices",
    categorySlug: "best-practices",
    imageUrl: "/api/placeholder/600/300",
    imageAlt: "Processing Timeline Clock",
    author: "Operations Team",
    content: `# Background Screening Turnaround Times: Managing Expectations and Optimizing Processes

Turnaround time expectations vary significantly based on screening type and complexity. Understanding realistic timelines and implementing process optimization strategies is key to managing stakeholder expectations.

## Standard Turnaround Time Categories

### Basic Screenings (24-72 hours)
Fast-tracked verification types:
- Employment verification
- Education verification
- Professional license confirmation
- Reference checks

### Intermediate Screenings (3-5 business days)
Moderately complex processes:
- Single-state criminal background checks
- Driving records verification
- Credit report reviews
- Social security number validation

### Advanced Screenings (5-10 business days)
Complex investigative processes:
- Multi-state criminal history searches
- International background checks
- Thorough employment history verification
- Professional certification validation

### Specialized Investigations (2-4 weeks)
In-depth examinations requiring:
- Federal background clearances
- Comprehensive asset searches
- Detailed reference investigations
- International asset verification

## Influencing Factors

### Geographic Complexity
Location-based variables:
- Local jurisdiction processing times
- Cross-border data exchange requirements
- Rural vs. urban data availability
- International timezone differences`
  }
];

/**
 * Convert markdown content to Portable Text format
 */
function convertMarkdownToPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let currentBlock = null;

  lines.forEach((line, index) => {
    // Heading 1
    if (line.startsWith('# ')) {
      blocks.push({
        _type: 'block',
        _key: `h1-${index}`,
        style: 'h1',
        children: [{ _type: 'span', text: line.substring(2) }]
      });
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        _key: `h2-${index}`,
        style: 'h2',
        children: [{ _type: 'span', text: line.substring(3) }]
      });
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        _key: `h3-${index}`,
        style: 'h3',
        children: [{ _type: 'span', text: line.substring(4) }]
      });
    }
    // Unordered list item
    else if (line.startsWith('- ')) {
      blocks.push({
        _type: 'block',
        _key: `ul-${index}`,
        style: 'bullet',
        children: [{ _type: 'span', text: line.substring(2) }]
      });
    }
    // Ordered list item
    else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        _type: 'block',
        _key: `ol-${index}`,
        style: 'number',
        children: [{ _type: 'span', text: line.replace(/^\d+\.\s/, '') }]
      });
    }
    // Empty line
    else if (line.trim() === '') {
      // Skip empty lines
    }
    // Regular paragraph
    else {
      blocks.push({
        _type: 'block',
        _key: `p-${index}`,
        style: 'normal',
        children: [{ _type: 'span', text: line }]
      });
    }
  });

  return blocks;
}

/**
 * Convert a sample post to Sanity document format
 */
function convertPostToSanityDocument(post, category, index) {
  return {
    _id: `post-${post.id}`,
    _type: 'post',
    title: {
      en: post.title,
      es: post.title, // Placeholder - would need translation
      fr: post.title, // Placeholder - would need translation
      hi: post.title   // Placeholder - would need translation
    },
    slug: {
      _type: 'slug',
      current: post.slug
    },
    publishedAt: post.date,
    author: {
      _type: 'author',
      _ref: `author-${post.author.toLowerCase().replace(/\s+/g, '-')}`
    },
    categories: [{
      _type: 'category',
      _ref: `category-${post.categorySlug}`
    }],
    excerpt: {
      en: post.excerpt,
      es: post.excerpt,
      fr: post.excerpt,
      hi: post.excerpt
    },
    body: convertMarkdownToPortableText(post.content),
    mainImage: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-placeholder' // Would need actual image upload
      },
      alt: post.imageAlt
    }
  };
}

/**
 * Convert a category to Sanity document format
 */
function convertCategoryToSanityDocument(category, index) {
  return {
    _id: `category-${category.slug}`,
    _type: 'category',
    name: category.name,
    slug: {
      _type: 'slug',
      current: category.slug
    },
    description: `Blog posts related to ${category.name.toLowerCase()}`,
    color: getCategoryColor(category.slug)
  };
}

/**
 * Get a color for each category
 */
function getCategoryColor(slug) {
  const colors = {
    'compliance-updates': '#3B82F6',
    'industry-trends': '#8B5CF6',
    'best-practices': '#10B981',
    'fcra-guidelines': '#EF4444',
    'technology-insights': '#F59E0B'
  };
  return colors[slug] || '#6B7280';
}

// Generate Sanity documents
const sanityDocuments = [];

// Add categories
sampleCategories.forEach((cat, index) => {
  sanityDocuments.push(convertCategoryToSanityDocument(cat, index));
});

// Add authors (using unique authors from posts)
const uniqueAuthors = [...new Set(sampleBlogPosts.map(p => p.author))];
uniqueAuthors.forEach((author, index) => {
  sanityDocuments.push({
    _id: `author-${author.toLowerCase().replace(/\s+/g, '-')}`,
    _type: 'author',
    name: author,
    slug: {
      _type: 'slug',
      current: author.toLowerCase().replace(/\s+/g, '-')
    },
    role: author.includes('Team') ? 'Content Team' : 'Author'
  });
});

// Add posts
sampleBlogPosts.forEach((post, index) => {
  const category = sampleCategories.find(c => c.slug === post.categorySlug);
  sanityDocuments.push(convertPostToSanityDocument(post, category, index));
});

// Output the migration data
console.log(JSON.stringify(sanityDocuments, null, 2));
