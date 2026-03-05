# joost.blog

Source code for [joost.blog](https://joost.blog), the personal blog of Joost de Valk — internet entrepreneur, founder of Yoast, and investor at Emilia Capital.

Built with [Astro](https://astro.build/) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/).

## Features

- Static site generation with Astro
- Blog with categories, featured posts, and RSS feed
- Video content pages
- Full-text search powered by [Pagefind](https://pagefind.app/) (search modal with Cmd/Ctrl+K)
- Yoast-style Schema.org structured data (JSON-LD graph)
- Auto-generated OG images with [Satori](https://github.com/vercel/satori)
- Dark mode support
- Giscus comments
- Staging environment detection with noindex protection

## Development

| Command             | Action                                       |
| :------------------ | :------------------------------------------- |
| `npm install`       | Install dependencies                         |
| `npm run dev`       | Start local dev server at `localhost:4321`    |
| `npm run build`     | Build production site to `./dist/`           |
| `npm run preview`   | Preview build locally before deploying       |

## Credits

Originally based on the [Ovidius](https://github.com/JustGoodUI/ovidius-astro-theme) Astro theme by [Just Good UI](https://justgoodui.com/).

## License

Licensed under the [GPL-3.0](LICENSE) license.
