import * as cheerio from 'cheerio';
import type {
  MetaData,
  HeadingData,
  LinkData,
  ImageData,
  SchemaData,
} from '../types/index.js';

export class PageParser {
  private $: cheerio.CheerioAPI;
  private baseUrl: string;

  constructor(html: string, baseUrl: string) {
    this.$ = cheerio.load(html);
    this.baseUrl = baseUrl;
  }

  getMetaData(): MetaData {
    const $ = this.$;
    return {
      title: $('title').text().trim() || undefined,
      description: $('meta[name="description"]').attr('content') || undefined,
      keywords: $('meta[name="keywords"]').attr('content') || undefined,
      canonical: $('link[rel="canonical"]').attr('href') || undefined,
      robots: $('meta[name="robots"]').attr('content') || undefined,
      ogTitle: $('meta[property="og:title"]').attr('content') || undefined,
      ogDescription: $('meta[property="og:description"]').attr('content') || undefined,
      ogImage: $('meta[property="og:image"]').attr('content') || undefined,
      ogType: $('meta[property="og:type"]').attr('content') || undefined,
      twitterCard: $('meta[name="twitter:card"]').attr('content') || undefined,
      twitterTitle: $('meta[name="twitter:title"]').attr('content') || undefined,
      twitterDescription: $('meta[name="twitter:description"]').attr('content') || undefined,
      twitterImage: $('meta[name="twitter:image"]').attr('content') || undefined,
      viewport: $('meta[name="viewport"]').attr('content') || undefined,
      charset: $('meta[charset]').attr('charset') ||
               $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^;]+)/)?.[1] || undefined,
    };
  }

  getHeadings(): HeadingData[] {
    const headings: HeadingData[] = [];
    let order = 0;

    this.$('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tagName = (el as unknown as { tagName: string }).tagName.toLowerCase();
      const level = parseInt(tagName.charAt(1), 10);
      headings.push({
        level,
        text: this.$(el).text().trim(),
        order: order++,
      });
    });

    return headings;
  }

  getLinks(): LinkData[] {
    const links: LinkData[] = [];
    const baseHost = new URL(this.baseUrl).host;

    this.$('a[href]').each((_, el) => {
      const $el = this.$(el);
      const href = $el.attr('href');
      if (!href) return;

      let absoluteUrl: string;
      let isInternal = false;

      try {
        absoluteUrl = new URL(href, this.baseUrl).href;
        const linkHost = new URL(absoluteUrl).host;
        isInternal = linkHost === baseHost;
      } catch {
        absoluteUrl = href;
      }

      const rel = $el.attr('rel') || '';
      links.push({
        href: absoluteUrl,
        text: $el.text().trim(),
        isInternal,
        isNofollow: rel.includes('nofollow'),
      });
    });

    return links;
  }

  getImages(): ImageData[] {
    const images: ImageData[] = [];

    this.$('img').each((_, el) => {
      const $el = this.$(el);
      const src = $el.attr('src') || $el.attr('data-src');
      if (!src) return;

      let absoluteSrc: string;
      try {
        absoluteSrc = new URL(src, this.baseUrl).href;
      } catch {
        absoluteSrc = src;
      }

      const widthAttr = $el.attr('width');
      const heightAttr = $el.attr('height');

      images.push({
        src: absoluteSrc,
        alt: $el.attr('alt'),
        width: widthAttr ? parseInt(widthAttr, 10) : undefined,
        height: heightAttr ? parseInt(heightAttr, 10) : undefined,
        isLazyLoaded: !!$el.attr('loading') || !!$el.attr('data-src'),
      });
    });

    return images;
  }

  getSchemaData(): SchemaData[] {
    const schemas: SchemaData[] = [];

    this.$('script[type="application/ld+json"]').each((_, el) => {
      const content = this.$(el).html();
      if (!content) return;

      try {
        const data = JSON.parse(content);
        const type = data['@type'] || 'Unknown';
        schemas.push({
          type,
          data,
          isValid: true,
        });
      } catch (error) {
        schemas.push({
          type: 'ParseError',
          data: {},
          isValid: false,
          errors: [(error as Error).message],
        });
      }
    });

    return schemas;
  }

  getTextContent(): string {
    const $ = this.$;
    $('script, style, noscript, iframe').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  }

  getWordCount(): number {
    const text = this.getTextContent();
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  hasViewport(): boolean {
    return !!this.$('meta[name="viewport"]').length;
  }

  getLanguage(): string | undefined {
    return this.$('html').attr('lang') || undefined;
  }

  getFavicon(): string | undefined {
    const favicon = this.$('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
    if (favicon) {
      try {
        return new URL(favicon, this.baseUrl).href;
      } catch {
        return favicon;
      }
    }
    return undefined;
  }

  getScripts(): string[] {
    const scripts: string[] = [];
    this.$('script[src]').each((_, el) => {
      const src = this.$(el).attr('src');
      if (src) {
        try {
          scripts.push(new URL(src, this.baseUrl).href);
        } catch {
          scripts.push(src);
        }
      }
    });
    return scripts;
  }

  getStylesheets(): string[] {
    const stylesheets: string[] = [];
    this.$('link[rel="stylesheet"]').each((_, el) => {
      const href = this.$(el).attr('href');
      if (href) {
        try {
          stylesheets.push(new URL(href, this.baseUrl).href);
        } catch {
          stylesheets.push(href);
        }
      }
    });
    return stylesheets;
  }
}
