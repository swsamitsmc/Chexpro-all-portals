# ChexPro Blog - Sanity Studio

## Quick Start

### 1. Deploy to Sanity
```bash
npm run deploy
```

### 2. Create API Token for Frontend
Run this command to create a read-only API token:

```bash
npx sanity token create --dataset=production --name="Frontend Reader" --role=viewer
```

Copy the generated token and add it to `frontend/.env`:
```
VITE_SANITY_API_TOKEN=your-token-here
```

### 3. Switch Frontend to Sanity
Edit `frontend/.env`:
```
VITE_USE_CMS=sanity
```

### 4. Run Frontend
```bash
cd ../frontend
npm run dev
```

## Development

```bash
npm run dev  # Start studio at localhost:3333
npm run build  # Build for production
npm run deploy  # Deploy to Sanity Cloud
```

## Project Structure

- `schemaTypes/` - Content type schemas (author, category, post)
- `sanity.config.ts` - Sanity configuration
- `sanity.cli.ts` - CLI configuration

## Content Types

- **Author** - Blog post authors with bio and image
- **Category** - Blog categories with color coding
- **Post** - Multi-language blog posts with SEO fields
