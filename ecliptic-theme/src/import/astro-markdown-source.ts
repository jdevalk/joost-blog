/**
 * Custom Ecliptic import source for Astro markdown content.
 *
 * Reads blog posts and pages from src/content/blog/ and src/content/pages/,
 * parses frontmatter, converts markdown to Portable Text, and yields
 * normalized items for Ecliptic's import pipeline.
 *
 * Usage: register in astro.config.mjs:
 *   import { astroMarkdownSource } from "./src/import/astro-markdown-source";
 *   ecliptic({ import: { sources: [astroMarkdownSource] } })
 */

import type { ImportSource } from "ecliptic/import";
import { markdownToPortableText } from "./markdown-to-portable-text";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";

interface FrontMatter {
  title: string;
  excerpt?: string;
  publishDate?: string | Date;
  updatedDate?: string | Date;
  featureImage?: string;
  featureImageAlt?: string;
  featureImageCaption?: string;
  categories?: string[];
  isFeatured?: boolean;
  draft?: boolean;
  password?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  // Pages may have different fields
  searchWeight?: number;
}

/**
 * Minimal frontmatter parser (avoids gray-matter dependency in the theme).
 * Handles YAML frontmatter between --- delimiters.
 */
function parseFrontMatter(content: string): { data: FrontMatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: { title: "" }, body: content };
  }

  const yaml = match[1];
  const body = match[2];
  const data: Record<string, any> = {};

  // Simple YAML parser for our known frontmatter structure
  let currentKey = "";
  let currentArrayKey = "";
  let multilineValue = "";
  let inMultiline = false;

  for (const line of yaml.split("\n")) {
    // Multi-line scalar continuation (>- or |)
    if (inMultiline) {
      if (line.match(/^\s+\S/) || line.trim() === "") {
        multilineValue += (multilineValue ? " " : "") + line.trim();
        continue;
      } else {
        data[currentKey] = multilineValue;
        inMultiline = false;
        multilineValue = "";
      }
    }

    // Array item
    const arrayItemMatch = line.match(/^\s+-\s+(.+)/);
    if (arrayItemMatch && currentArrayKey) {
      if (!Array.isArray(data[currentArrayKey])) {
        data[currentArrayKey] = [];
      }
      data[currentArrayKey].push(arrayItemMatch[1].trim());
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value: any = kvMatch[2].trim();

      // Multi-line scalar indicator
      if (value === ">-" || value === ">" || value === "|") {
        currentKey = key;
        inMultiline = true;
        multilineValue = "";
        currentArrayKey = "";
        continue;
      }

      // Empty value signals array or object to follow
      if (value === "") {
        currentArrayKey = key;
        data[key] = [];
        continue;
      }

      currentArrayKey = "";

      // Strip quotes
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }

      // Boolean
      if (value === "true") value = true;
      else if (value === "false") value = false;

      data[key] = value;
    }
  }

  // Flush any remaining multiline value
  if (inMultiline && currentKey) {
    data[currentKey] = multilineValue;
  }

  return { data: data as FrontMatter, body };
}

/**
 * Discover markdown files in a content directory.
 * Handles both directory-based (slug/index.md) and flat (slug.md) structures.
 */
function discoverContentFiles(
  contentDir: string
): Array<{ slug: string; filePath: string; dirPath: string }> {
  const results: Array<{ slug: string; filePath: string; dirPath: string }> = [];

  if (!existsSync(contentDir)) return results;

  for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // Directory-based: slug/index.md or slug/index.mdx
      const mdPath = join(contentDir, entry.name, "index.md");
      const mdxPath = join(contentDir, entry.name, "index.mdx");
      const filePath = existsSync(mdPath) ? mdPath : existsSync(mdxPath) ? mdxPath : null;
      if (filePath) {
        results.push({
          slug: entry.name,
          filePath,
          dirPath: join(contentDir, entry.name),
        });
      }
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      // Flat file: slug.md
      const slug = entry.name.replace(/\.mdx?$/, "");
      results.push({
        slug,
        filePath: join(contentDir, entry.name),
        dirPath: contentDir,
      });
    }
  }

  return results;
}

/**
 * Resolve a relative image path from frontmatter to an absolute file path.
 * e.g., "./images/featured.webp" relative to the post's directory.
 */
function resolveImagePath(imagePath: string, postDir: string): string | null {
  if (!imagePath) return null;

  // Already an absolute URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Resolve relative to the post directory
  const resolved = resolve(postDir, imagePath);
  if (existsSync(resolved)) {
    return resolved;
  }

  return null;
}

export const astroMarkdownSource: ImportSource = {
  id: "astro-markdown",
  name: "Astro Markdown Content",
  description: "Import blog posts and pages from an Astro site's src/content/ directory",
  icon: "file-text",
  canProbe: false,

  async analyze(input, context) {
    const basePath =
      input.type === "url" ? input.url : process.cwd();

    const blogDir = join(basePath, "src/content/blog");
    const pagesDir = join(basePath, "src/content/pages");

    const blogFiles = discoverContentFiles(blogDir);
    const pageFiles = discoverContentFiles(pagesDir);

    // Count categories across all posts
    const categorySet = new Set<string>();
    for (const file of blogFiles) {
      const content = readFileSync(file.filePath, "utf-8");
      const { data } = parseFrontMatter(content);
      if (data.categories) {
        for (const cat of data.categories) {
          categorySet.add(cat);
        }
      }
    }

    return {
      source: "astro-markdown",
      postTypes: [
        {
          name: "post",
          count: blogFiles.length,
          collection: "posts",
          status: "ready",
        },
        {
          name: "page",
          count: pageFiles.length,
          collection: "pages",
          status: "ready",
        },
      ],
      taxonomies: {
        categories: Array.from(categorySet),
      },
      summary: `Found ${blogFiles.length} blog posts and ${pageFiles.length} pages with ${categorySet.size} categories.`,
    };
  },

  async *fetchContent(input, options) {
    const basePath =
      input.type === "url" ? input.url : process.cwd();

    const blogDir = join(basePath, "src/content/blog");
    const pagesDir = join(basePath, "src/content/pages");

    // Import blog posts
    const blogFiles = discoverContentFiles(blogDir);
    for (const file of blogFiles) {
      const raw = readFileSync(file.filePath, "utf-8");
      const { data, body } = parseFrontMatter(raw);

      // Skip drafts if not requested
      if (data.draft && !options?.includeDrafts) {
        continue;
      }

      const portableText = markdownToPortableText(body);

      // Resolve featured image
      let featuredImage: string | undefined;
      if (data.featureImage) {
        const resolved = resolveImagePath(data.featureImage, file.dirPath);
        featuredImage = resolved ?? undefined;
      }

      yield {
        sourceId: file.slug,
        postType: "post",
        status: data.draft ? "draft" : "publish",
        slug: file.slug,
        title: data.title,
        content: portableText as any,
        excerpt: data.excerpt,
        date: data.publishDate ? new Date(data.publishDate) : new Date(),
        categories: data.categories,
        tags: [],
        featuredImage,
        meta: {
          featureImageAlt: data.featureImageAlt,
          featureImageCaption: data.featureImageCaption,
          isFeatured: data.isFeatured ?? false,
          updatedDate: data.updatedDate
            ? new Date(data.updatedDate).toISOString()
            : undefined,
        },
      };
    }

    // Import pages
    const pageFiles = discoverContentFiles(pagesDir);
    for (const file of pageFiles) {
      const raw = readFileSync(file.filePath, "utf-8");
      const { data, body } = parseFrontMatter(raw);

      const portableText = markdownToPortableText(body);

      let featuredImage: string | undefined;
      if (data.featureImage) {
        const resolved = resolveImagePath(data.featureImage, file.dirPath);
        featuredImage = resolved ?? undefined;
      }

      yield {
        sourceId: file.slug,
        postType: "page",
        status: "publish" as const,
        slug: file.slug,
        title: data.title,
        content: portableText as any,
        date: new Date(),
        featuredImage,
        meta: {
          featureImageAlt: data.featureImageAlt,
          featureImageCaption: data.featureImageCaption,
        },
      };
    }
  },
};
