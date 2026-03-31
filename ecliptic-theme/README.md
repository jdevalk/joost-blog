# Luxe Blog - Ecliptic Theme

A premium personal blog theme for [Ecliptic](https://ecliptic.press), featuring a luxe burgundy color palette, full dark mode support, and responsive layouts.

## Features

- Burgundy + rose accent color palette with warm gold accents
- Class-based dark mode with system preference detection
- Featured posts section on homepage and blog listing
- Category and tag archives with breadcrumb navigation
- Post detail pages with overlay headers on featured images
- Social share buttons (X, Bluesky, LinkedIn)
- Search page using Ecliptic's LiveSearch
- Mobile-responsive hamburger menu with animated icon
- Mona Sans variable font
- Tailwind CSS 4 with Typography plugin

## Quick Start

```bash
npm create astro@latest -- --template @jdevalk/ecliptic-theme-luxe
cd my-site
npm install
npm run dev
```

Complete the Setup Wizard at `http://localhost:4321/_ecliptic/admin`.

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

Menus are managed through the Ecliptic admin UI. The theme uses the `primary` menu for header and footer navigation.

## Content Model

### Posts
- Title, Content (Portable Text), Excerpt, Featured Image
- `is_featured` boolean for homepage featured section
- Categories and Tags taxonomies

### Pages
- Title, Content (Portable Text), Featured Image
- Template selector (Default / Full Width)

## License

MIT
