# Luxe Blog - EmDash Theme

A premium personal blog theme for [EmDash](https://emdashcms.com), featuring a luxe burgundy color palette, full dark mode support, and responsive layouts.

## Features

- Burgundy + rose accent color palette with warm gold accents
- Class-based dark mode with system preference detection
- Featured posts section on homepage and blog listing
- Category and tag archives with breadcrumb navigation
- Post detail pages with overlay headers on featured images
- Social share buttons (X, Bluesky, LinkedIn)
- Search page using EmDash's LiveSearch
- Mobile-responsive hamburger menu with animated icon
- Mona Sans variable font
- Tailwind CSS 4 with Typography plugin
- Comments support
- Sidebar widgets (search, categories, recent posts)

## Quick Start

```bash
npm create emdash@latest -- --template @jdevalk/emdash-theme-luxe
cd my-site
npm install
npm run dev
```

Complete the Setup Wizard at `http://localhost:4321/_emdash/admin`.

## Deployment

This theme is configured for Cloudflare Workers with D1 and R2:

```bash
wrangler d1 create joost-blog-emdash
# Update wrangler.jsonc with the database ID
npm run deploy
```

## Customization

### Colors

Edit `src/styles/global.css` to change the theme colors:

```css
@theme {
    --color-primary: #7a1830;    /* Main burgundy */
    --color-secondary: #5e1224;  /* Darker burgundy */
    --color-accent: #c9506a;     /* Rose accent (used in dark mode) */
    --color-warm: #b8962e;       /* Gold accent */
}
```

### Navigation

Menus are managed through the EmDash admin UI. The theme uses the `primary` menu for header and footer navigation.

## Content Model

### Posts
- Title, Content (Portable Text), Excerpt, Featured Image
- Categories and Tags taxonomies
- Bylines / author credits
- Comments enabled

### Pages
- Title, Content (Portable Text)

## License

MIT
